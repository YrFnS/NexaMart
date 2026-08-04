import assert from 'node:assert/strict';
import test from 'node:test';
import { createSessionToken, SESSION_COOKIE_NAME } from './session.ts';
import { validateAdminAuth, validateCsrf } from './security.ts';

process.env.AUTH_SECRET = 'test-security-secret-with-more-than-32-characters';
process.env.NEXT_PUBLIC_APP_URL = 'https://nexamart.example';
process.env.NEXTAUTH_URL = 'https://nexamart.example';

function requestWithSession(url: string, token: string): Request {
  return new Request(url, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}` },
  });
}

test('admin authorization accepts admin sessions and rejects buyer sessions', () => {
  const adminToken = createSessionToken({ id: 'admin-1', role: 'admin' });
  const buyerToken = createSessionToken({ id: 'buyer-1', role: 'buyer' });
  const url = 'https://nexamart.example/api/admin/payouts';

  assert.equal(validateAdminAuth(requestWithSession(url, adminToken)).authorized, true);
  assert.equal(validateAdminAuth(requestWithSession(url, buyerToken)).authorized, false);
  assert.equal(validateAdminAuth(new Request(url)).authorized, false);
});

test('same-origin validation accepts the configured origin and rejects cross-origin writes', () => {
  const url = 'https://nexamart.example/api/checkout';
  const write = (origin: string) =>
    new Request(url, { method: 'POST', headers: { origin } });

  assert.equal(validateCsrf(write('https://nexamart.example')).valid, true);
  assert.equal(validateCsrf(write('https://attacker.example')).valid, false);
  assert.equal(validateCsrf(new Request(url)).valid, true);
});
