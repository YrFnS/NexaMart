import { expect, test, type Page, type TestInfo } from '@playwright/test';
import {
  APP_URL,
  expectNoHorizontalOverflow,
  expectNoSeriousAccessibilityViolations,
  gotoAndExpectOk,
  primeBrowser,
} from './helpers';

const publicRoutes = [
  { path: '/', label: 'homepage' },
  { path: '/shop', label: 'product catalogue' },
  { path: '/stores', label: 'store directory' },
  { path: '/auth', label: 'authentication' },
] as const;

async function firstPublicProductId(page: Page): Promise<string> {
  const response = await page.request.get(
    new URL('/api/products?limit=1', APP_URL).toString(),
  );
  const payload = (await response.json().catch(() => ({}))) as {
    products?: Array<{ id?: string }>;
    error?: string;
  };

  expect(
    response.ok(),
    `Product discovery failed: ${payload.error || response.statusText()}`,
  ).toBe(true);
  const id = payload.products?.[0]?.id;
  expect(
    id,
    'Staging must contain at least one active public product for release verification.',
  ).toBeTruthy();
  return id!;
}

async function firstPublicStoreId(page: Page): Promise<string> {
  const response = await page.request.get(
    new URL('/api/stores?limit=1', APP_URL).toString(),
  );
  const payload = (await response.json().catch(() => ({}))) as {
    stores?: Array<{ id?: string }>;
    error?: string;
  };

  expect(
    response.ok(),
    `Store discovery failed: ${payload.error || response.statusText()}`,
  ).toBe(true);
  const id = payload.stores?.[0]?.id;
  expect(
    id,
    'Staging must contain at least one public store for release verification.',
  ).toBeTruthy();
  return id!;
}

async function attachRuntimeEvidence(
  page: Page,
  testInfo: TestInfo,
  label: string,
) {
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType(
      'navigation',
    )[0] as PerformanceNavigationTiming | undefined;
    const resources = performance.getEntriesByType(
      'resource',
    ) as PerformanceResourceTiming[];

    return {
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      },
      navigation: navigation
        ? {
            responseStartMs: navigation.responseStart,
            domContentLoadedMs: navigation.domContentLoadedEventEnd,
            loadEventMs: navigation.loadEventEnd,
            transferSize: navigation.transferSize,
            encodedBodySize: navigation.encodedBodySize,
          }
        : null,
      resources: {
        count: resources.length,
        transferSize: resources.reduce(
          (total, resource) => total + (resource.transferSize || 0),
          0,
        ),
        encodedBodySize: resources.reduce(
          (total, resource) => total + (resource.encodedBodySize || 0),
          0,
        ),
      },
    };
  });

  await testInfo.attach(`${label}-runtime-metrics`, {
    body: Buffer.from(`${JSON.stringify(metrics, null, 2)}\n`),
    contentType: 'application/json',
  });

  if (testInfo.project.name.includes('chromium')) {
    await testInfo.attach(`${label}-${testInfo.project.name}`, {
      body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
      contentType: 'image/png',
    });
  }
}

async function verifyPublicPage(
  page: Page,
  testInfo: TestInfo,
  path: string,
  label: string,
) {
  await gotoAndExpectOk(page, path);
  await expect(page.locator('h1:visible').first()).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await expectNoSeriousAccessibilityViolations(page);
  await attachRuntimeEvidence(page, testInfo, label);
}

test.describe('deployed staging release preflight', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await primeBrowser(page);
  });

  for (const route of publicRoutes) {
    test(`${route.label} is usable without mutating staging`, async (
      { page },
      testInfo,
    ) => {
      await verifyPublicPage(page, testInfo, route.path, route.label);
    });
  }

  test('discovered product and store records render publicly', async (
    { page },
    testInfo,
  ) => {
    const productId = await firstPublicProductId(page);
    await verifyPublicPage(
      page,
      testInfo,
      `/product/${encodeURIComponent(productId)}`,
      'product-detail',
    );

    const storeId = await firstPublicStoreId(page);
    await verifyPublicPage(
      page,
      testInfo,
      `/store/${encodeURIComponent(storeId)}`,
      'store-profile',
    );
  });

  test('Arabic staging response is RTL and remains inside the viewport', async (
    { context, page },
    testInfo,
  ) => {
    await context.addCookies([
      {
        name: 'nexamart_locale',
        value: 'ar',
        url: APP_URL,
        sameSite: 'Lax',
      },
    ]);

    await gotoAndExpectOk(page, '/shop');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('h1:visible').first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNoSeriousAccessibilityViolations(page);
    await attachRuntimeEvidence(page, testInfo, 'arabic-shop');
  });
});
