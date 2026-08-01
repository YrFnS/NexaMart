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
  source: 'redis' | 'memory' | 'unavailable';
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

function allowMemoryFallback(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.RATE_LIMIT_ALLOW_MEMORY_FALLBACK === 'true'
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

function unavailableResult(now: number, windowMs: number): DistributedRateLimitResult {
  return {
    allowed: false,
    remaining: 0,
    resetAt: now + windowMs,
    source: 'unavailable',
    unavailable: true,
  };
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
  const configuration = upstashConfiguration();

  if (!configuration) {
    return allowMemoryFallback()
      ? checkLocalRateLimit(key, maxRequests, windowMs, now)
      : unavailableResult(now, windowMs);
  }

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
  } catch (error) {
    console.error('Distributed rate limiter unavailable:', error);
    return allowMemoryFallback()
      ? checkLocalRateLimit(key, maxRequests, windowMs, now)
      : unavailableResult(now, windowMs);
  } finally {
    clearTimeout(timeout);
  }
}
