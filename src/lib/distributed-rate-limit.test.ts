import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildDistributedRateLimitKey,
  normalizeRateLimitNamespace,
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
