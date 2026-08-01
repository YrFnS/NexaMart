import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { APP_URL, loginWithApi, primeBrowser } from './helpers';

interface OrderListPayload {
  orders?: Array<{ id?: string; orderNumber?: string }>;
  error?: string;
}

async function firstAuthenticatedOrderId(
  page: Page,
  endpoint: '/api/orders?limit=1' | '/api/seller/orders?limit=1',
): Promise<string> {
  const result = await page.evaluate(async (path) => {
    const response = await fetch(path, {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const payload = (await response.json().catch(() => ({}))) as OrderListPayload;
    return { ok: response.ok, status: response.status, payload };
  }, endpoint);

  expect(
    result.ok,
    `Could not load a printable order (${result.status}): ${
      result.payload.error || 'unknown error'
    }`,
  ).toBe(true);
  const id = result.payload.orders?.[0]?.id;
  expect(id, 'The deterministic seed must expose a printable order.').toBeTruthy();
  return id!;
}

async function expectA4PrintLayout(
  page: Page,
  testInfo: TestInfo,
  attachmentName: string,
) {
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });

  const layout = await page.evaluate(() => {
    const main = document.querySelector<HTMLElement>('main');
    const mainRect = main?.getBoundingClientRect() || null;
    return {
      lang: document.documentElement.lang,
      direction: document.documentElement.dir,
      documentWidth: Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
      ),
      viewportWidth: window.innerWidth,
      mainLeft: mainRect?.left ?? -1,
      mainRight: mainRect?.right ?? -1,
    };
  });

  expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth + 2);
  expect(layout.mainLeft).toBeGreaterThanOrEqual(0);
  expect(layout.mainRight).toBeLessThanOrEqual(layout.viewportWidth + 2);

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    preferCSSPageSize: true,
  });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(5_000);
  await testInfo.attach(attachmentName, {
    body: pdf,
    contentType: 'application/pdf',
  });

  return layout;
}

test.describe('P3 authenticated print documents', () => {
  test.beforeEach(async ({ page }) => {
    await primeBrowser(page);
  });

  test('buyer order document is private, paymentless, and A4 printable', async (
    { page },
    testInfo,
  ) => {
    test.skip(
      testInfo.project.name !== 'chromium-desktop',
      'PDF generation is verified once in desktop Chromium.',
    );

    await loginWithApi(page, 'demo@nexamart.com');
    const orderId = await firstAuthenticatedOrderId(page, '/api/orders?limit=1');

    const forbiddenPackingSlip = await page.request.get(
      `${APP_URL}/api/orders/${orderId}/document?type=packing-slip&lang=en`,
    );
    expect(forbiddenPackingSlip.status()).toBe(403);

    const response = await page.goto(
      `/api/orders/${orderId}/document?type=order&lang=en`,
      { waitUntil: 'domcontentloaded' },
    );
    expect(response?.status()).toBe(200);
    expect(response?.headers()['cache-control']).toContain('private');
    expect(response?.headers()['cache-control']).toContain('no-store');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    await expect(page.getByRole('heading', { name: 'Order document' })).toBeVisible();
    await expect(page.locator('body')).toContainText('Pay the seller on delivery');
    await expect(page.locator('body')).toContainText(
      'NexaMart does not process payment for this order.',
    );

    const layout = await expectA4PrintLayout(
      page,
      testInfo,
      'buyer-order-document-en.pdf',
    );
    expect(layout.lang).toBe('en');
    expect(layout.direction).toBe('ltr');
  });

  test('seller packing slip is Arabic RTL, price-free, and A4 printable', async (
    { page },
    testInfo,
  ) => {
    test.skip(
      testInfo.project.name !== 'chromium-desktop',
      'PDF generation is verified once in desktop Chromium.',
    );

    await loginWithApi(page, 'seller@nexamart.com');
    const orderId = await firstAuthenticatedOrderId(
      page,
      '/api/seller/orders?limit=1',
    );

    const response = await page.goto(
      `/api/orders/${orderId}/document?type=packing-slip&lang=ar`,
      { waitUntil: 'domcontentloaded' },
    );
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-disposition']).toContain('packing-slip');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.getByRole('heading', { name: 'قائمة تجهيز الطلب' })).toBeVisible();
    await expect(page.locator('body')).toContainText('الدفع للبائع عند الاستلام');

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('$');
    expect(bodyText).not.toContain('الإجمالي');
    expect(bodyText).not.toContain('السعر');

    const layout = await expectA4PrintLayout(
      page,
      testInfo,
      'seller-packing-slip-ar.pdf',
    );
    expect(layout.lang).toBe('ar');
    expect(layout.direction).toBe('rtl');
  });
});
