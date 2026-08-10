import { expect, test, type Page } from '@playwright/test';
import {
  gotoAndExpectOk,
  loginWithApi,
  primeBrowser,
} from './helpers';

const SEEDED_PASSWORD =
  process.env.E2E_PASSWORD ||
  process.env.SEED_DEMO_PASSWORD ||
  'ci-demo-password-with-at-least-12-characters';
const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ||
  process.env.AUTH_BOOTSTRAP_TEST_PASSWORD ||
  SEEDED_PASSWORD;

type SessionUser = {
  email?: string;
  role?: string;
  canAccessSellerWorkspace?: boolean;
} | null;

async function getSessionUser(page: Page): Promise<SessionUser> {
  const result = await page.evaluate(async () => {
    const response = await fetch('/api/auth/session', {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    return {
      ok: response.ok,
      payload: (await response.json()) as { user?: SessionUser },
    };
  });

  expect(result.ok).toBe(true);
  return result.payload.user || null;
}

async function browserGet(
  page: Page,
  path: string,
): Promise<{ status: number; ok: boolean; payload: unknown }> {
  return page.evaluate(async (requestPath) => {
    const response = await fetch(requestPath, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    return {
      status: response.status,
      ok: response.ok,
      payload: await response.json().catch(() => null),
    };
  }, path);
}

async function expectSellerGate(page: Page): Promise<void> {
  await gotoAndExpectOk(page, '/seller/dashboard');
  await expect(
    page.getByRole('heading', { name: 'Seller access required' }),
  ).toBeVisible();
  await expect(page.getByText('NexaMart Seller', { exact: true })).not.toBeVisible();
}

async function expectSellerWorkspace(page: Page): Promise<void> {
  await gotoAndExpectOk(page, '/seller/dashboard');
  await expect(page.getByText('NexaMart Seller', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Seller access required' }),
  ).not.toBeVisible();
}

async function expectAdminGate(
  page: Page,
  unauthorizedAccount = false,
): Promise<void> {
  await gotoAndExpectOk(page, '/admin');
  await expect(
    page.getByText('Sign in with an administrator account to continue.'),
  ).toBeVisible();
  if (unauthorizedAccount) {
    await expect(
      page.getByText('The signed-in account does not have administrator access.'),
    ).toBeVisible();
  }
}

test.describe('seeded role and access matrix', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await primeBrowser(page);
  });

  test('guest is gated from seller and administrator workspaces', async ({ page }) => {
    await expectSellerGate(page);
    await expectAdminGate(page);

    const sellerApi = await browserGet(page, '/api/seller/dashboard');
    expect(sellerApi.status).toBe(401);
  });

  test('buyer can shop but cannot enter seller or administrator workspaces', async ({ page }) => {
    await loginWithApi(page, 'demo@nexamart.com');

    const session = await getSessionUser(page);
    expect(session).toMatchObject({
      email: 'demo@nexamart.com',
      role: 'buyer',
      canAccessSellerWorkspace: false,
    });

    await expectSellerGate(page);
    const sellerApi = await browserGet(page, '/api/seller/dashboard');
    expect(sellerApi.status).toBe(403);
    await expectAdminGate(page, true);
  });

  test('seller owner can open the seller workspace but not administrator tools', async ({ page }) => {
    await loginWithApi(page, 'seller@nexamart.com');

    const session = await getSessionUser(page);
    expect(session).toMatchObject({
      email: 'seller@nexamart.com',
      role: 'seller',
      canAccessSellerWorkspace: true,
    });

    await expectSellerWorkspace(page);
    const sellerApi = await browserGet(page, '/api/seller/dashboard');
    expect(sellerApi.ok, JSON.stringify(sellerApi.payload)).toBe(true);
    expect(sellerApi.payload).toMatchObject({
      store: { name: 'TechStore Pro' },
    });
    await expectAdminGate(page, true);
  });

  test('active manager staff inherits seller workspace access', async ({ page }) => {
    await loginWithApi(page, 'ahmed@nexamart.com');

    const session = await getSessionUser(page);
    expect(session).toMatchObject({
      email: 'ahmed@nexamart.com',
      role: 'buyer',
      canAccessSellerWorkspace: true,
    });

    await expectSellerWorkspace(page);
    const sellerApi = await browserGet(page, '/api/seller/dashboard');
    expect(sellerApi.ok, JSON.stringify(sellerApi.payload)).toBe(true);
    expect(sellerApi.payload).toMatchObject({
      store: { name: 'TechStore Pro' },
    });
  });

  test('pending seller staff remains blocked', async ({ page }) => {
    await loginWithApi(page, 'fatima@nexamart.com');

    const session = await getSessionUser(page);
    expect(session).toMatchObject({
      email: 'fatima@nexamart.com',
      role: 'buyer',
      canAccessSellerWorkspace: false,
    });

    await expectSellerGate(page);
    const sellerApi = await browserGet(page, '/api/seller/dashboard');
    expect(sellerApi.status).toBe(403);
  });

  test('administrator can open both administrator and seller workspaces', async ({ page }) => {
    await loginWithApi(page, 'admin@nexamart.com', ADMIN_PASSWORD);

    const session = await getSessionUser(page);
    expect(session).toMatchObject({
      email: 'admin@nexamart.com',
      role: 'admin',
      canAccessSellerWorkspace: true,
    });

    await gotoAndExpectOk(page, '/admin');
    await expect(page.getByText('NexaMart Admin', { exact: true })).toBeVisible();
    const adminApi = await browserGet(page, '/api/admin/users');
    expect(adminApi.ok, JSON.stringify(adminApi.payload)).toBe(true);

    await expectSellerWorkspace(page);
    const sellerApi = await browserGet(page, '/api/seller/dashboard');
    expect(sellerApi.ok, JSON.stringify(sellerApi.payload)).toBe(true);
  });

  test('banned user with revoked staff membership cannot authenticate', async ({ page }) => {
    await gotoAndExpectOk(page, '/auth');
    await page.locator('#login-email').fill('omar@nexamart.com');
    await page.locator('#login-password').fill(SEEDED_PASSWORD);

    const loginResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/auth/login') &&
        response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Login', exact: true }).click();

    expect((await loginResponse).status()).toBe(401);
    await expect(page.getByText('Invalid email or password.')).toBeVisible();
    expect(await getSessionUser(page)).toBeNull();

    const sellerApi = await browserGet(page, '/api/seller/dashboard');
    expect(sellerApi.status).toBe(401);
    const adminApi = await browserGet(page, '/api/admin/users');
    expect(adminApi.status).toBe(401);
  });
});
