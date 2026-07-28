import { describe, expect, test } from 'bun:test';
import {
  createSessionToken,
  getSessionClaims,
  hashPassword,
  SESSION_COOKIE_NAME,
  verifyPassword,
  verifySessionToken,
} from '../src/lib/auth';
import { validateAdminAuth, validateCsrf } from '../src/lib/security';

process.env.AUTH_SECRET = 'test-auth-secret-that-is-longer-than-thirty-two-characters';
process.env.NEXT_PUBLIC_APP_URL = 'https://nexamart.example';
process.env.NEXTAUTH_URL = 'https://nexamart.example';

describe('password credentials', () => {
  test('stores a salted scrypt hash and verifies only the correct password', () => {
    const password = 'a-long-demo-password';
    const firstHash = hashPassword(password);
    const secondHash = hashPassword(password);

    expect(firstHash).toStartWith('scrypt$');
    expect(secondHash).toStartWith('scrypt$');
    expect(firstHash).not.toBe(secondHash);
    expect(verifyPassword(password, firstHash)).toBe(true);
    expect(verifyPassword('wrong-password', firstHash)).toBe(false);
    expect(verifyPassword(password, 'invalid-hash')).toBe(false);
  });
});

describe('signed sessions', () => {
  test('round-trips valid claims through the HttpOnly cookie format', () => {
    const token = createSessionToken({ id: 'user-123', role: 'buyer' });
    const request = new Request('https://nexamart.example/api/auth/session', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}` },
    });

    expect(verifySessionToken(token)).toMatchObject({ sub: 'user-123', role: 'buyer', ver: 1 });
    expect(getSessionClaims(request)).toMatchObject({ sub: 'user-123', role: 'buyer' });
  });

  test('rejects a modified payload or signature', () => {
    const token = createSessionToken({ id: 'user-123', role: 'buyer' });
    const [payload, signature] = token.split('.');

    expect(verifySessionToken(`${payload}x.${signature}`)).toBeNull();
    expect(verifySessionToken(`${payload}.${signature}x`)).toBeNull();
  });

  test('uses a shorter lifetime for administrator sessions', () => {
    const buyer = verifySessionToken(createSessionToken({ id: 'buyer-1', role: 'buyer' }));
    const admin = verifySessionToken(createSessionToken({ id: 'admin-1', role: 'admin' }));

    expect(buyer).not.toBeNull();
    expect(admin).not.toBeNull();
    expect((buyer?.exp || 0) - (admin?.exp || 0)).toBeGreaterThan(60 * 60 * 24 * 6);
  });
});

describe('admin authorization', () => {
  test('accepts a signed admin session and rejects a signed buyer session', () => {
    const adminToken = createSessionToken({ id: 'admin-1', role: 'admin' });
    const buyerToken = createSessionToken({ id: 'buyer-1', role: 'buyer' });

    const adminRequest = new Request('https://nexamart.example/api/admin/payouts', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${adminToken}` },
    });
    const buyerRequest = new Request('https://nexamart.example/api/admin/payouts', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=${buyerToken}` },
    });

    expect(validateAdminAuth(adminRequest)).toEqual({ authorized: true });
    expect(validateAdminAuth(buyerRequest)).toMatchObject({ authorized: false, status: 403 });
  });
});

describe('same-origin request validation', () => {
  test('accepts the configured application origin', () => {
    const request = new Request('https://nexamart.example/api/checkout', {
      method: 'POST',
      headers: { origin: 'https://nexamart.example' },
    });

    expect(validateCsrf(request)).toEqual({ valid: true });
  });

  test('rejects a cross-origin write request', () => {
    const request = new Request('https://nexamart.example/api/checkout', {
      method: 'POST',
      headers: { origin: 'https://attacker.example' },
    });

    expect(validateCsrf(request)).toMatchObject({ valid: false });
  });
});
