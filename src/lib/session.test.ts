import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSessionToken,
  serializeExpiredSessionCookie,
  serializeSessionCookie,
  verifySessionToken,
} from './session.ts';

process.env.AUTH_SECRET = 'test-session-secret-with-more-than-32-characters';

test('session tokens round-trip with identity and role', () => {
  const token = createSessionToken({ id: 'user_test_1', role: 'buyer' });
  const claims = verifySessionToken(token);

  assert.equal(claims?.sub, 'user_test_1');
  assert.equal(claims?.role, 'buyer');
  assert.ok((claims?.exp || 0) > (claims?.iat || 0));
});

test('tampered session tokens are rejected', () => {
  const token = createSessionToken({ id: 'admin_test_1', role: 'admin' });
  const [payload, signature] = token.split('.');
  const tampered = `${payload.slice(0, -1)}A.${signature}`;

  assert.equal(verifySessionToken(tampered), null);
  assert.equal(verifySessionToken(`${payload}.invalid`), null);
  assert.equal(verifySessionToken('not-a-token'), null);
});

test('session cookies are http-only and can be expired', () => {
  const cookie = serializeSessionCookie('signed-token', 600);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Max-Age=600/);

  const expired = serializeExpiredSessionCookie();
  assert.match(expired, /Max-Age=0/);
});

test('production cookies stay secure unless CI explicitly uses the HTTP browser harness', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalCi = process.env.CI;
  const originalOverride = process.env.AUTH_COOKIE_INSECURE_FOR_TESTS;

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.CI;
    delete process.env.AUTH_COOKIE_INSECURE_FOR_TESTS;
    assert.match(serializeSessionCookie('secure-token'), /; Secure$/);

    process.env.CI = 'true';
    process.env.AUTH_COOKIE_INSECURE_FOR_TESTS = 'true';
    assert.doesNotMatch(serializeSessionCookie('ci-token'), /; Secure/);

    process.env.CI = 'false';
    assert.match(serializeSessionCookie('production-token'), /; Secure$/);
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;

    if (originalCi === undefined) delete process.env.CI;
    else process.env.CI = originalCi;

    if (originalOverride === undefined) {
      delete process.env.AUTH_COOKIE_INSECURE_FOR_TESTS;
    } else {
      process.env.AUTH_COOKIE_INSECURE_FOR_TESTS = originalOverride;
    }
  }
});
