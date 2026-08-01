import { expect, test } from '@playwright/test';
import {
  APP_URL,
  expectNoHorizontalOverflow,
  expectNoSeriousAccessibilityViolations,
  gotoAndExpectOk,
  primeBrowser,
} from './helpers';

test.describe('P3 Arabic and mobile verification', () => {
  test.beforeEach(async ({ context, page }) => {
    await primeBrowser(page);
    await context.addCookies([
      {
        name: 'nexamart_locale',
        value: 'ar',
        url: APP_URL,
        sameSite: 'Lax',
      },
    ]);
  });

  test('Arabic is present on the first response and persists after refresh', async ({
    page,
  }) => {
    await gotoAndExpectOk(page, '/shop');

    const html = page.locator('html');
    await expect(html).toHaveAttribute('lang', 'ar');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(
      page.getByRole('heading', { level: 1, name: /تصفح المنتجات/ }),
    ).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(html).toHaveAttribute('lang', 'ar');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expectNoHorizontalOverflow(page);
    await expectNoSeriousAccessibilityViolations(page);
  });

  test('Arabic product details remain inside the viewport', async ({ page }) => {
    await gotoAndExpectOk(page, '/product/WHP-001');

    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('h1:visible').first()).toContainText(
      'سماعات بلوتوث لاسلكية برو',
    );
    await expectNoHorizontalOverflow(page);
  });

  test('mobile primary product action is visible and fully reachable', async (
    { page },
    testInfo,
  ) => {
    test.skip(
      testInfo.project.name !== 'chromium-mobile',
      'This assertion targets the compact mobile project.',
    );

    await gotoAndExpectOk(page, '/product/WHP-001');
    const addToCart = page
      .getByRole('button', {
        name: /أضف للسلة|أضف إلى السلة|Add to cart/i,
      })
      .first();
    await addToCart.scrollIntoViewIfNeeded();
    await expect(addToCart).toBeVisible();

    const box = await addToCart.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalOverflow(page);
  });
});
