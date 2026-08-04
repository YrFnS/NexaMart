import { expect, test } from '@playwright/test';
import {
  expectNoHorizontalOverflow,
  expectNoSeriousAccessibilityViolations,
  firstPublicStoreId,
  gotoAndExpectOk,
  primeBrowser,
} from './helpers';

const publicRoutes = [
  { path: '/', label: 'homepage' },
  { path: '/shop', label: 'product catalogue' },
  { path: '/product/WHP-001', label: 'product detail' },
  { path: '/stores', label: 'store directory' },
  { path: '/auth', label: 'authentication' },
] as const;

test.describe('P3 public storefront smoke coverage', () => {
  test.beforeEach(async ({ page }) => {
    await primeBrowser(page);
  });

  for (const route of publicRoutes) {
    test(`${route.label} renders usable server content`, async ({ page }) => {
      await gotoAndExpectOk(page, route.path);
      await expect(page.locator('h1:visible').first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectNoSeriousAccessibilityViolations(page);
    });
  }

  test('a seeded store profile renders from the public directory', async ({
    page,
  }) => {
    const storeId = await firstPublicStoreId(page);
    await gotoAndExpectOk(page, `/store/${encodeURIComponent(storeId)}`);

    await expect(page.locator('h1:visible').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoSeriousAccessibilityViolations(page);
  });

  test('quick view closes with Escape and restores trigger focus', async (
    { page },
    testInfo,
  ) => {
    test.skip(
      testInfo.project.name !== 'chromium-desktop',
      'The quick-view trigger is intentionally hidden on compact viewports.',
    );

    await gotoAndExpectOk(page, '/shop');
    const trigger = page
      .getByRole('button', { name: /^Quick view /i })
      .first();
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});
