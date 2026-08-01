import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface HealthPayload {
  service?: string;
  status?: string;
  environment?: string;
  release?: { sha?: string | null };
  indexing?: string;
  checks?: {
    database?: string;
    rateLimit?: string;
  };
  checkedAt?: string;
  latencyMs?: number;
}

interface VerificationReport {
  baseUrl: string;
  expectedReleaseSha: string | null;
  health: HealthPayload;
  securityHeaders: Record<string, string | null>;
  robotsChecked: boolean;
  verifiedAt: string;
}

const requestTimeoutMs = 20_000;

function environmentFlag(name: string, fallback: boolean): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`${name} must be true or false.`);
}

function stagingBaseUrl(): URL {
  const raw =
    process.env.STAGING_BASE_URL?.trim() ||
    process.env.PLAYWRIGHT_BASE_URL?.trim();
  if (!raw) {
    throw new Error('STAGING_BASE_URL is required.');
  }

  const url = new URL(raw);
  if (url.username || url.password) {
    throw new Error('Staging URLs must not contain embedded credentials.');
  }
  if (
    url.protocol !== 'https:' &&
    !environmentFlag('STAGING_ALLOW_HTTP', false)
  ) {
    throw new Error('Staging verification requires HTTPS.');
  }

  url.pathname = '/';
  url.search = '';
  url.hash = '';
  return url;
}

function stagingAuthHeaders(): Record<string, string> {
  const name = process.env.STAGING_AUTH_HEADER_NAME?.trim();
  const value = process.env.STAGING_AUTH_HEADER_VALUE?.trim();
  if (Boolean(name) !== Boolean(value)) {
    throw new Error(
      'STAGING_AUTH_HEADER_NAME and STAGING_AUTH_HEADER_VALUE must be configured together.',
    );
  }
  if (!name || !value) return {};
  if (/\r|\n/.test(name) || /\r|\n/.test(value)) {
    throw new Error('Staging authentication headers cannot contain newlines.');
  }
  return { [name]: value };
}

const authHeaders = stagingAuthHeaders();

async function fetchWithTimeout(url: URL, accept: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    return await fetch(url, {
      redirect: 'follow',
      cache: 'no-store',
      headers: { Accept: accept, ...authHeaders },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function releaseMatches(expected: string, actual: string): boolean {
  return (
    actual === expected ||
    actual.startsWith(expected) ||
    expected.startsWith(actual)
  );
}

async function main() {
  const baseUrl = stagingBaseUrl();
  const expectedReleaseSha =
    process.env.EXPECTED_RELEASE_SHA?.trim() || null;
  const requireRedis = environmentFlag('STAGING_REQUIRE_REDIS', true);
  const expectNoIndex = environmentFlag('STAGING_EXPECT_NOINDEX', true);

  const healthResponse = await fetchWithTimeout(
    new URL('/api/health', baseUrl),
    'application/json',
  );
  const health = (await healthResponse.json().catch(() => ({}))) as HealthPayload;

  assert.equal(
    healthResponse.status,
    200,
    `Health check returned HTTP ${healthResponse.status}: ${JSON.stringify(health)}`,
  );
  assert.match(
    healthResponse.headers.get('cache-control') || '',
    /no-store/i,
    'The health endpoint must not be cached.',
  );
  assert.equal(health.service, 'nexamart');
  assert.equal(health.status, 'ok');
  assert.equal(health.checks?.database, 'ok');

  if (requireRedis) {
    assert.equal(
      health.checks?.rateLimit,
      'redis',
      'Staging must use the distributed Redis rate limiter.',
    );
  }

  if (expectedReleaseSha) {
    const actualReleaseSha = health.release?.sha;
    assert.ok(
      actualReleaseSha,
      'The deployment did not publish a release SHA.',
    );
    assert.ok(
      releaseMatches(expectedReleaseSha, actualReleaseSha),
      `Expected release ${expectedReleaseSha}, received ${actualReleaseSha}.`,
    );
  }

  let robotsChecked = false;
  if (expectNoIndex) {
    assert.equal(
      health.indexing,
      'blocked',
      'Staging must report search indexing as blocked.',
    );
    const robotsResponse = await fetchWithTimeout(
      new URL('/robots.txt', baseUrl),
      'text/plain',
    );
    const robots = await robotsResponse.text();
    assert.equal(robotsResponse.status, 200);
    assert.match(
      robots,
      /Disallow:\s*\//i,
      'Staging robots.txt must disallow crawling.',
    );
    robotsChecked = true;
  }

  const shopResponse = await fetchWithTimeout(
    new URL('/shop', baseUrl),
    'text/html',
  );
  const shopHtml = await shopResponse.text();
  assert.equal(shopResponse.status, 200, '/shop must return HTTP 200.');
  assert.match(
    shopResponse.headers.get('content-type') || '',
    /text\/html/i,
  );
  assert.doesNotMatch(shopHtml, /Internal Server Error/i);
  assert.match(shopHtml, /<main\b/i, '/shop must expose a main landmark.');

  const requiredSecurityHeaders = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'strict-origin-when-cross-origin',
  } as const;
  const securityHeaders: Record<string, string | null> = {};
  for (const [name, expected] of Object.entries(requiredSecurityHeaders)) {
    const actual = shopResponse.headers.get(name);
    securityHeaders[name] = actual;
    assert.equal(actual, expected, `${name} must be ${expected}.`);
  }

  const report: VerificationReport = {
    baseUrl: baseUrl.origin,
    expectedReleaseSha,
    health,
    securityHeaders,
    robotsChecked,
    verifiedAt: new Date().toISOString(),
  };
  const outputDirectory = join(process.cwd(), 'staging-test-results');
  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(
    join(outputDirectory, 'readiness.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );

  console.log(JSON.stringify(report, null, 2));
}

main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.stack || error.message : String(error),
  );
  process.exitCode = 1;
});
