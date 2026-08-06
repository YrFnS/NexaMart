import { expect, test } from '@playwright/test';
import {
  cartLineCount,
  gotoAndExpectOk,
  loginWithApi,
  primeBrowser,
} from './helpers';

const SEEDED_PASSWORD =
  process.env.E2E_PASSWORD ||
  process.env.SEED_DEMO_PASSWORD ||
  'ci-demo-password-with-at-least-12-characters';

test.describe('P3 critical authenticated flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await primeBrowser(page);
  });

  test('buyer can authenticate through the visible login form', async ({ page }) => {
    await gotoAndExpectOk(page, '/auth');
    await page.locator('#login-email').fill('demo@nexamart.com');
    await page.locator('#login-password').fill(SEEDED_PASSWORD);

    const loginResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/auth/login') &&
        response.request().method() === 'POST',
    );
    await page
      .getByRole('button', { name: 'Login', exact: true })
      .click();

    expect((await loginResponse).ok()).toBe(true);
    await expect(page).not.toHaveURL(/\/auth(?:\?|$)/);

    const sessionResult = await page.evaluate(async () => {
      const response = await fetch('/api/auth/session', {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      return {
        ok: response.ok,
        payload: (await response.json()) as {
          user?: { email?: string; role?: string } | null;
        },
      };
    });
    expect(sessionResult.ok).toBe(true);
    expect(sessionResult.payload.user?.email).toBe('demo@nexamart.com');
    expect(sessionResult.payload.user?.role).toBe('buyer');
  });

  test('buyer places one pay-on-delivery order per seller', async ({ page }) => {
    await loginWithApi(page);

    const productIds = ['WHP-001', 'PLJ-003'];
    for (const [index, productId] of productIds.entries()) {
      await gotoAndExpectOk(page, `/product/${productId}`);
      await expect(page.locator('h1:visible').first()).toBeVisible();
      const addToCart = page
        .getByRole('button', { name: /^Add to cart$/i })
        .first();
      await expect(addToCart).toBeVisible();
      await expect(addToCart).toBeEnabled();
      // Accessibility and pointer stability are covered by the public browser
      // suites. Force the transaction trigger here so a late client hydration
      // replacement cannot hide a checkout-authority failure.
      await addToCart.click({ force: true });
      await expect.poll(() => cartLineCount(page)).toBe(index + 1);
    }

    await gotoAndExpectOk(page, '/checkout');
    await page.getByRole('button', { name: /Add New Address/i }).click();
    await page.locator('#name').fill('P3 Browser Buyer');
    await page.locator('#phone').fill('+9647700000000');
    await page.locator('#address1').fill('Test Street 100');
    await page.locator('#city').fill('Baghdad');
    await page.locator('#state').fill('Baghdad');
    await page.locator('#postalCode').fill('10001');
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Iraq' }).click();

    await page.getByRole('button', { name: /^Next$/i }).click();
    const placeOrder = page.getByRole('button', { name: /Place order/i });
    await expect(placeOrder).toBeVisible();

    const checkoutResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/checkout') &&
        response.request().method() === 'POST',
    );
    await placeOrder.click();

    const response = await checkoutResponse;
    const payload = (await response.json()) as {
      orderNumbers?: string[];
      error?: string;
    };
    expect(response.ok(), payload.error || 'Checkout failed.').toBe(true);
    expect(payload.orderNumbers).toHaveLength(2);

    await expect(
      page.getByRole('heading', { level: 2, name: 'Order received' }),
    ).toBeVisible();
    for (const orderNumber of payload.orderNumbers || []) {
      await expect(page.getByText(orderNumber, { exact: false })).toBeVisible();
    }

    await page.getByRole('button', { name: /View orders/i }).click();
    await expect(page).toHaveURL(/\/orders/);
    for (const orderNumber of payload.orderNumbers || []) {
      await expect(page.getByText(orderNumber, { exact: false }).first()).toBeVisible();
    }
  });
});
