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
