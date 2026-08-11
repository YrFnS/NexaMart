import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDistributedRateLimitKey,
  isMemoryRateLimitFallbackAllowed,
  normalizeRateLimitNamespace,
  parsePostgresRateLimitResult,
  parseRedisRateLimitResult,
} from './distributed-rate-limit.ts';

test('rate-limit namespaces are normalized and bounded', () => {
  assert.equal(
    normalizeRateLimitNamespace('POST:/API/Auth/Login?foo=bar'),
    'post:-api-auth-login-foo-bar',
  );
  assert.equal(normalizeRateLimitNamespace('   '), 'api');
  assert.ok(normalizeRateLimitNamespace('x'.repeat(500)).length <= 160);
});

test('rate-limit keys hash identifiers instead of exposing them', async () => {
  const first = await buildDistributedRateLimitKey(
    'POST:/api/auth/login',
    '203.0.113.10',
  );
  const second = await buildDistributedRateLimitKey(
    'POST:/api/auth/login',
    '203.0.113.10',
  );
  const other = await buildDistributedRateLimitKey(
    'POST:/api/auth/login',
    '203.0.113.11',
  );

  assert.equal(first, second);
  assert.notEqual(first, other);
  assert.equal(first.includes('203.0.113.10'), false);
});

test('Redis counter responses produce bounded remaining and reset values', () => {
  const now = 1_000_000;
  const allowed = parseRedisRateLimitResult(['3', '4500'], 5, now);
  const denied = parseRedisRateLimitResult([6, 2000], 5, now);

  assert.deepEqual(allowed, {
    allowed: true,
    remaining: 2,
    resetAt: now + 4500,
    source: 'redis',
    unavailable: false,
  });
  assert.deepEqual(denied, {
    allowed: false,
    remaining: 0,
    resetAt: now + 2000,
    source: 'redis',
    unavailable: false,
  });
  assert.equal(parseRedisRateLimitResult({ result: 1 }, 5, now), null);
});

test('Postgres counter responses produce bounded remaining and reset values', () => {
  const now = 1_000_000;
  const resetAt = new Date(now + 4500);
  const allowed = parsePostgresRateLimitResult(
    [{ count: 3, resetAt }],
    5,
    now,
  );
  const denied = parsePostgresRateLimitResult(
    [{ count: '6', resetAt: resetAt.toISOString() }],
    5,
    now,
  );

  assert.deepEqual(allowed, {
    allowed: true,
    remaining: 2,
    resetAt: now + 4500,
    source: 'postgres',
    unavailable: false,
  });
  assert.deepEqual(denied, {
    allowed: false,
    remaining: 0,
    resetAt: now + 4500,
    source: 'postgres',
    unavailable: false,
  });
  assert.equal(parsePostgresRateLimitResult([], 5, now), null);
});

test('memory fallback is automatic outside production but explicit in production', () => {
  assert.equal(
    isMemoryRateLimitFallbackAllowed({
      VERCEL_ENV: 'preview',
      NODE_ENV: 'production',
    }),
    true,
  );
  assert.equal(
    isMemoryRateLimitFallbackAllowed({
      DEPLOYMENT_ENV: 'staging',
      NODE_ENV: 'production',
    }),
    true,
  );
  assert.equal(
    isMemoryRateLimitFallbackAllowed({ NODE_ENV: 'production' }),
    false,
  );
  assert.equal(
    isMemoryRateLimitFallbackAllowed({
      NODE_ENV: 'production',
      RATE_LIMIT_ALLOW_MEMORY_FALLBACK: 'true',
    }),
    true,
  );
});
