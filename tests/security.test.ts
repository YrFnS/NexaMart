// Covers the request-security primitives in src/lib/security.ts. This suite runs
// under `bun test` rather than the node:test suite in src/lib because
// src/lib/security.ts imports next/server, which plain Node cannot resolve.
import { describe, expect, test } from 'bun:test';
import { createSessionToken, SESSION_COOKIE_NAME } from '../src/lib/session';
import { validateAdminAuth, validateCsrf } from '../src/lib/security';

process.env.AUTH_SECRET = 'test-auth-secret-that-is-longer-than-thirty-two-characters';
process.env.NEXT_PUBLIC_APP_URL = 'https://nexamart.example';
process.env.NEXTAUTH_URL = 'https://nexamart.example';

function requestWithSession(url: string, token: string): Request {
  return new Request(url, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}` },
  });
}

describe('admin authorization', () => {
  test('accepts a signed admin session and rejects buyer or anonymous requests', () => {
    const url = 'https://nexamart.example/api/admin/payouts';
    const adminToken = createSessionToken({ id: 'admin-1', role: 'admin' });
    const buyerToken = createSessionToken({ id: 'buyer-1', role: 'buyer' });

    expect(validateAdminAuth(requestWithSession(url, adminToken)).authorized).toBe(true);
    expect(validateAdminAuth(requestWithSession(url, buyerToken)).authorized).toBe(false);
    expect(validateAdminAuth(new Request(url)).authorized).toBe(false);
  });
});

describe('same-origin request validation', () => {
  const url = 'https://nexamart.example/api/checkout';
  const write = (origin: string) => new Request(url, { method: 'POST', headers: { origin } });

  test('accepts the configured application origin', () => {
    expect(validateCsrf(write('https://nexamart.example')).valid).toBe(true);
  });

  test('rejects a cross-origin write request', () => {
    expect(validateCsrf(write('https://attacker.example')).valid).toBe(false);
  });

  test('leaves safe methods unrestricted', () => {
    expect(validateCsrf(new Request(url)).valid).toBe(true);
  });
});
