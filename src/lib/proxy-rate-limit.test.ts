import assert from 'node:assert/strict';
import test from 'node:test';
import {
  proxyRateLimitIdentifier,
  SESSION_READ_RATE_LIMIT,
} from './proxy-rate-limit.ts';

test('authenticated session probes use a verified per-user bucket', () => {
  const first = proxyRateLimitIdentifier(
    '/api/auth/session',
    '203.0.113.10',
    'buyer-1',
  );
  const second = proxyRateLimitIdentifier(
    '/api/auth/session',
    '203.0.113.10',
    'admin-1',
  );

  assert.equal(first, 'user:buyer-1');
  assert.equal(second, 'user:admin-1');
  assert.notEqual(first, second);
  assert.equal(SESSION_READ_RATE_LIMIT.maxRequests, 120);
  assert.equal(SESSION_READ_RATE_LIMIT.windowSeconds, 60);
});

test('anonymous session probes and all other API routes remain IP-scoped', () => {
  assert.equal(
    proxyRateLimitIdentifier('/api/auth/session', '203.0.113.10'),
    '203.0.113.10',
  );
  assert.equal(
    proxyRateLimitIdentifier('/api/admin/users', '203.0.113.10', 'admin-1'),
    '203.0.113.10',
  );
  assert.equal(
    proxyRateLimitIdentifier('/api/auth/session', '', undefined),
    'unknown',
  );
});
