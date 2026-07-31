import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAdminActorId,
  requireAdminAuth,
  validateAdminAuth,
} from './security.ts';
import {
  createSessionToken,
  serializeSessionCookie,
} from './session.ts';

process.env.AUTH_SECRET = 'test-session-secret-with-more-than-32-characters';
process.env.ADMIN_SECRET_KEY = 'test-server-automation-secret';
process.env.ADMIN_AUTOMATION_USER_ID = 'admin_automation_actor';
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

function cookieFor(role: 'buyer' | 'seller' | 'admin', id: string): string {
  const token = createSessionToken({ id, role });
  return serializeSessionCookie(token).split(';', 1)[0];
}

test('admin sessions authorize requests and provide the signed actor id', () => {
  const request = new Request('http://localhost:3000/api/admin/products', {
    headers: {
      cookie: cookieFor('admin', 'admin_test_1'),
      origin: 'http://localhost:3000',
    },
  });

  assert.equal(validateAdminAuth(request).authorized, true);
  assert.equal(getAdminActorId(request), 'admin_test_1');
  assert.equal(requireAdminAuth(request), null);
});

test('non-admin sessions cannot authorize administrator requests', () => {
  const request = new Request('http://localhost:3000/api/admin/products', {
    headers: {
      cookie: cookieFor('buyer', 'buyer_test_1'),
      origin: 'http://localhost:3000',
    },
  });

  assert.equal(validateAdminAuth(request).authorized, false);
  assert.equal(getAdminActorId(request), null);
  assert.equal(requireAdminAuth(request)?.status, 401);
});

test('cookie-backed administrator mutations require an allowed origin', () => {
  const request = new Request('http://localhost:3000/api/admin/products', {
    method: 'PUT',
    headers: {
      cookie: cookieFor('admin', 'admin_test_2'),
      origin: 'https://attacker.example',
    },
  });

  assert.equal(requireAdminAuth(request)?.status, 403);
});

test('trusted bearer automation resolves to the configured audit actor', () => {
  const request = new Request('http://localhost:3000/api/admin/products', {
    method: 'PUT',
    headers: {
      authorization: `Bearer ${process.env.ADMIN_SECRET_KEY}`,
    },
  });

  assert.equal(validateAdminAuth(request).authorized, true);
  assert.equal(getAdminActorId(request), 'admin_automation_actor');
  assert.equal(requireAdminAuth(request), null);
});
