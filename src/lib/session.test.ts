import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSessionToken,
  serializeExpiredSessionCookie,
  serializeSessionCookie,
  verifySessionToken,
} from './session.ts';

process.env.AUTH_SECRET = 'test-session-secret-with-more-than-32-characters';

const mutableEnvironment = process.env as Record<string, string | undefined>;

function setEnvironmentVariable(name: string, value: string | undefined) {
  if (value === undefined) {
    delete mutableEnvironment[name];
    return;
  }

  mutableEnvironment[name] = value;
}

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
    setEnvironmentVariable('NODE_ENV', 'production');
    setEnvironmentVariable('CI', undefined);
    setEnvironmentVariable('AUTH_COOKIE_INSECURE_FOR_TESTS', undefined);
    assert.match(serializeSessionCookie('secure-token'), /; Secure$/);

    setEnvironmentVariable('CI', 'true');
    setEnvironmentVariable('AUTH_COOKIE_INSECURE_FOR_TESTS', 'true');
    assert.doesNotMatch(serializeSessionCookie('ci-token'), /; Secure/);

    setEnvironmentVariable('CI', 'false');
    assert.match(serializeSessionCookie('production-token'), /; Secure$/);
  } finally {
    setEnvironmentVariable('NODE_ENV', originalNodeEnv);
    setEnvironmentVariable('CI', originalCi);
    setEnvironmentVariable('AUTH_COOKIE_INSECURE_FOR_TESTS', originalOverride);
  }
});
