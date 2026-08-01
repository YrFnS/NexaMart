import { expect, test, type Locator } from '@playwright/test';
import {
  APP_URL,
  expectNoHorizontalOverflow,
  expectNoSeriousAccessibilityViolations,
  gotoAndExpectOk,
  primeBrowser,
} from './helpers';

async function isInViewport(locator: Locator): Promise<boolean> {
  try {
    if (!(await locator.isVisible())) return false;
    return await locator.evaluate((element) => {
      const rect = (element as HTMLElement).getBoundingClientRect();
      return (
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        rect.right > 0 &&
        rect.left < window.innerWidth
      );
    });
  } catch {
    return false;
  }
}

test.describe('P3 Arabic and mobile verification', () => {
  test.beforeEach(async ({ context, page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
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

  test('mobile purchase, comparison, and assistant actions remain reachable', async (
    { page },
    testInfo,
  ) => {
    test.skip(
      testInfo.project.name !== 'chromium-mobile',
      'This assertion targets the compact mobile project.',
    );

    await gotoAndExpectOk(page, '/product/WHP-001');
    const actionName = /أضف للسلة|أضف إلى السلة|Add to cart/i;
    const stickyPurchaseBar = page.locator(
      '[data-product-purchase-actions]',
    );
    const primaryPurchaseActions = page.locator(
      '[data-product-primary-actions]',
    );
    const assistant = page.locator('[data-ai-chat-layer] > .fixed');

    // The compact bar must not appear before buyers reach the complete product
    // options and primary controls, otherwise it can cover selectable variants.
    await expect(stickyPurchaseBar).toHaveCount(0);
    await primaryPurchaseActions.scrollIntoViewIfNeeded();
    await expect(primaryPurchaseActions).toBeInViewport();

    const addToCart = primaryPurchaseActions.getByRole('button', {
      name: actionName,
    });

    await expect(addToCart).toBeVisible();
    await expect(addToCart).toBeInViewport();
    await expect(assistant).toBeVisible();

    const actionLayout = await addToCart.evaluate((element) => {
      const button = element as HTMLElement;
      const rect = button.getBoundingClientRect();
      const actionContainer = button.closest<HTMLElement>(
        '[data-product-purchase-actions], [data-product-primary-actions]',
      );
      const assistantElement = document.querySelector<HTMLElement>(
        '[data-ai-chat-layer] > .fixed',
      );
      const actionContainerRect =
        actionContainer?.getBoundingClientRect() || null;
      const assistantRect = assistantElement?.getBoundingClientRect() || null;
      const horizontalInset = Math.min(12, rect.width / 4);
      const centerY = rect.top + rect.height / 2;
      const hitPoints = [
        { x: rect.left + horizontalInset, y: centerY },
        { x: rect.left + rect.width / 2, y: centerY },
        { x: rect.right - horizontalInset, y: centerY },
      ];
      const blockers = hitPoints.flatMap((point) => {
        const target = document.elementFromPoint(point.x, point.y);
        if (!target || target === button || button.contains(target)) return [];
        return [
          {
            tag: target.tagName,
            ariaLabel: target.getAttribute('aria-label'),
            className:
              typeof (target as HTMLElement).className === 'string'
                ? (target as HTMLElement).className
                : '',
          },
        ];
      });
      const intersects = (
        first: DOMRect | null,
        second: DOMRect | null,
      ) =>
        Boolean(
          first &&
            second &&
            first.left < second.right &&
            first.right > second.left &&
            first.top < second.bottom &&
            first.bottom > second.top,
        );

      return {
        connected: button.isConnected,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
        height: rect.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        blockers,
        assistantOverlapsActionContainer: intersects(
          actionContainerRect,
          assistantRect,
        ),
      };
    });

    expect(actionLayout.connected).toBe(true);
    expect(actionLayout.left).toBeGreaterThanOrEqual(0);
    expect(actionLayout.right).toBeLessThanOrEqual(
      actionLayout.viewportWidth + 1,
    );
    expect(actionLayout.top).toBeGreaterThanOrEqual(0);
    expect(actionLayout.bottom).toBeLessThanOrEqual(
      actionLayout.viewportHeight + 1,
    );
    expect(actionLayout.height).toBeGreaterThanOrEqual(44);
    expect(actionLayout.blockers).toEqual([]);
    expect(actionLayout.assistantOverlapsActionContainer).toBe(false);

    const fulfillmentSection = page.locator('#fulfillment-details-title');
    await fulfillmentSection.scrollIntoViewIfNeeded();
    await expect
      .poll(async () => isInViewport(stickyPurchaseBar))
      .toBe(true);
    const stickyAddToCart = stickyPurchaseBar.getByRole('button', {
      name: actionName,
    });
    await expect(stickyAddToCart).toBeVisible();
    await expect(stickyAddToCart).toBeInViewport();

    const compareToggle = page
      .getByRole('button', { name: /مقارنة|Compare/i })
      .first();
    await compareToggle.scrollIntoViewIfNeeded();
    await expect(primaryPurchaseActions).toBeInViewport();
    await expect(stickyPurchaseBar).toHaveCount(0);
    await compareToggle.click();

    const compareDrawer = page.getByRole('region', {
      name: /مقارنة المنتجات|Product comparison/i,
    });
    await expect(compareDrawer).toBeVisible();

    const stackedLayout = await page.evaluate(() => {
      const rectangle = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        return {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };
      };
      const intersects = (
        first: ReturnType<typeof rectangle>,
        second: ReturnType<typeof rectangle>,
      ) =>
        Boolean(
          first &&
            second &&
            first.left < second.right &&
            first.right > second.left &&
            first.top < second.bottom &&
            first.bottom > second.top,
        );

      const purchase = rectangle('[data-product-purchase-actions]');
      const primaryPurchase = rectangle('[data-product-primary-actions]');
      const comparison = rectangle('.nexa-compare-drawer');
      const chat = rectangle('[data-ai-chat-layer] > .fixed');

      return {
        purchase,
        primaryPurchase,
        comparison,
        chat,
        purchaseOverlapsComparison: intersects(purchase, comparison),
        purchaseOverlapsChat: intersects(purchase, chat),
        comparisonOverlapsChat: intersects(comparison, chat),
      };
    });

    expect(stackedLayout.purchase).toBeNull();
    expect(stackedLayout.primaryPurchase).not.toBeNull();
    expect(stackedLayout.comparison).not.toBeNull();
    expect(stackedLayout.chat).not.toBeNull();
    expect(stackedLayout.purchaseOverlapsComparison).toBe(false);
    expect(stackedLayout.purchaseOverlapsChat).toBe(false);
    expect(stackedLayout.comparisonOverlapsChat).toBe(false);
    await expectNoHorizontalOverflow(page);
  });
});
