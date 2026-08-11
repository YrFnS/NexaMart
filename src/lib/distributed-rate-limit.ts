import { getDeploymentEnvironment } from './deployment.ts';

export interface DistributedRateLimitInput {
  namespace: string;
  identifier: string;
  maxRequests: number;
  windowSeconds: number;
}

export interface DistributedRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  source: 'redis' | 'postgres' | 'memory' | 'unavailable';
  unavailable: boolean;
}

interface LocalEntry {
  count: number;
  resetAt: number;
}

interface UpstashResponse {
  result?: unknown;
  error?: string;
}

type Environment = Readonly<Record<string, string | undefined>>;

const localStore = new Map<string, LocalEntry>();

const FIXED_WINDOW_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('PTTL', KEYS[1])
return { current, ttl }
`.trim();

function positiveInteger(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

export function normalizeRateLimitNamespace(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 160) || 'api';
}

async function hashIdentifier(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value || 'unknown');
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

export async function buildDistributedRateLimitKey(
  namespace: string,
  identifier: string,
): Promise<string> {
  const normalizedNamespace = normalizeRateLimitNamespace(namespace);
  const identifierHash = await hashIdentifier(identifier);
  return `nexamart:rate-limit:${normalizedNamespace}:${identifierHash}`;
}

export function parseRedisRateLimitResult(
  value: unknown,
  maxRequests: number,
  now = Date.now(),
  defaultWindowMs = 60_000,
): DistributedRateLimitResult | null {
  if (!Array.isArray(value) || value.length < 2) return null;

  const count = Number(value[0]);
  const ttl = Number(value[1]);
  if (!Number.isFinite(count) || count < 1) return null;

  const safeMax = positiveInteger(maxRequests, 1);
  const safeTtl = Number.isFinite(ttl) && ttl > 0 ? ttl : defaultWindowMs;

  return {
    allowed: count <= safeMax,
    remaining: Math.max(0, safeMax - count),
    resetAt: now + safeTtl,
    source: 'redis',
    unavailable: false,
  };
}

export function parsePostgresRateLimitResult(
  value: unknown,
  maxRequests: number,
  now = Date.now(),
  defaultWindowMs = 60_000,
): DistributedRateLimitResult | null {
  if (!Array.isArray(value) || value.length < 1) return null;

  const row = value[0];
  if (!row || typeof row !== 'object') return null;

  const count = Number((row as { count?: unknown }).count);
  const rawResetAt = (row as { resetAt?: unknown }).resetAt;
  const parsedResetAt =
    rawResetAt instanceof Date
      ? rawResetAt.getTime()
      : Date.parse(String(rawResetAt || ''));

  if (!Number.isFinite(count) || count < 1) return null;

  const safeMax = positiveInteger(maxRequests, 1);
  const resetAt =
    Number.isFinite(parsedResetAt) && parsedResetAt > now
      ? parsedResetAt
      : now + defaultWindowMs;

  return {
    allowed: count <= safeMax,
    remaining: Math.max(0, safeMax - count),
    resetAt,
    source: 'postgres',
    unavailable: false,
  };
}

export function isMemoryRateLimitFallbackAllowed(
  environment: Environment = process.env,
): boolean {
  return (
    getDeploymentEnvironment(environment) !== 'production' ||
    environment.RATE_LIMIT_ALLOW_MEMORY_FALLBACK === 'true'
  );
}

function checkLocalRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  now: number,
): DistributedRateLimitResult {
  const entry = localStore.get(key);

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowMs;
    localStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - 1),
      resetAt,
      source: 'memory',
      unavailable: false,
    };
  }

  entry.count += 1;
  return {
    allowed: entry.count <= maxRequests,
    remaining: Math.max(0, maxRequests - entry.count),
    resetAt: entry.resetAt,
    source: 'memory',
    unavailable: false,
  };
}

function upstashConfiguration(): { url: string; token: string } | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/+$/, '');
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

function postgresConfigurationAvailable(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function unavailableResult(now: number, windowMs: number): DistributedRateLimitResult {
  return {
    allowed: false,
    remaining: 0,
    resetAt: now + windowMs,
    source: 'unavailable',
    unavailable: true,
  };
}

async function checkRedisRateLimit(
  configuration: { url: string; token: string },
  key: string,
  maxRequests: number,
  windowMs: number,
  now: number,
): Promise<DistributedRateLimitResult> {
  const timeoutMs = positiveInteger(
    Number(process.env.RATE_LIMIT_REDIS_TIMEOUT_MS),
    2_000,
  );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(configuration.url, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${configuration.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        'EVAL',
        FIXED_WINDOW_SCRIPT,
        '1',
        key,
        String(windowMs),
      ]),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Redis rate limiter returned HTTP ${response.status}.`);
    }

    const payload = (await response.json()) as UpstashResponse;
    if (payload.error) throw new Error(payload.error);

    const parsed = parseRedisRateLimitResult(
      payload.result,
      maxRequests,
      now,
      windowMs,
    );
    if (!parsed) throw new Error('Redis rate limiter returned an invalid result.');

    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}

async function checkPostgresRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  now: number,
): Promise<DistributedRateLimitResult> {
  const { db } = await import('./db.ts');
  const currentAt = new Date(now);
  const resetAt = new Date(now + windowMs);

  const rows = await db.$queryRaw<Array<{ count: number; resetAt: Date }>>`
    INSERT INTO "nexamart_internal"."RateLimitBucket" AS bucket
      ("key", "count", "resetAt", "updatedAt")
    VALUES (${key}, 1, ${resetAt}, ${currentAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN bucket."resetAt" <= ${currentAt} THEN 1
        ELSE bucket."count" + 1
      END,
      "resetAt" = CASE
        WHEN bucket."resetAt" <= ${currentAt} THEN ${resetAt}
        ELSE bucket."resetAt"
      END,
      "updatedAt" = ${currentAt}
    RETURNING "count", "resetAt"
  `;

  const parsed = parsePostgresRateLimitResult(
    rows,
    maxRequests,
    now,
    windowMs,
  );
  if (!parsed) throw new Error('Postgres rate limiter returned an invalid result.');

  if (Math.random() < 0.01) {
    const staleBefore = new Date(now - 86_400_000);
    await db.$executeRaw`
      DELETE FROM "nexamart_internal"."RateLimitBucket"
      WHERE "key" IN (
        SELECT "key"
        FROM "nexamart_internal"."RateLimitBucket"
        WHERE "resetAt" < ${staleBefore}
        ORDER BY "resetAt" ASC
        LIMIT 100
      )
    `;
  }

  return parsed;
}

export async function checkDistributedRateLimit(
  input: DistributedRateLimitInput,
): Promise<DistributedRateLimitResult> {
  const maxRequests = positiveInteger(input.maxRequests, 1);
  const windowSeconds = positiveInteger(input.windowSeconds, 60);
  const windowMs = windowSeconds * 1_000;
  const now = Date.now();
  const key = await buildDistributedRateLimitKey(
    input.namespace,
    input.identifier,
  );
  const redis = upstashConfiguration();

  if (redis) {
    try {
      return await checkRedisRateLimit(redis, key, maxRequests, windowMs, now);
    } catch (error) {
      console.error('Redis rate limiter unavailable:', error);
    }
  }

  if (postgresConfigurationAvailable()) {
    try {
      return await checkPostgresRateLimit(key, maxRequests, windowMs, now);
    } catch (error) {
      console.error('Postgres rate limiter unavailable:', error);
    }
  }

  return isMemoryRateLimitFallbackAllowed()
    ? checkLocalRateLimit(key, maxRequests, windowMs, now)
    : unavailableResult(now, windowMs);
}
