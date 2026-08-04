import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

function source(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

test('P3 browser projects exercise desktop, mobile, and Firefox', () => {
  const config = source('playwright.config.ts');

  assert.match(config, /chromium-desktop/);
  assert.match(config, /chromium-mobile/);
  assert.match(config, /firefox-desktop/);
  assert.match(config, /Pixel 7/);
  assert.match(config, /next start/);
  assert.match(config, /retain-on-failure/);
});

test('P3 covers accessibility, RTL, focus, authentication, checkout, and printing', () => {
  const helpers = source('e2e/helpers.ts');
  const publicSmoke = source('e2e/public-smoke.spec.ts');
  const rtlMobile = source('e2e/rtl-mobile.spec.ts');
  const criticalFlows = source('e2e/critical-flows.spec.ts');
  const fulfillmentRace = source('e2e/fulfillment-race.spec.ts');
  const inventoryRace = source('e2e/inventory-race.spec.ts');
  const printDocuments = source('e2e/print-documents.spec.ts');
  const checkoutRoute = source('src/app/api/checkout/route.ts');
  const transitionRoute = source(
    'src/app/api/orders/[id]/transition/route.ts',
  );
  const fulfillmentRoute = source(
    'src/app/api/seller/fulfillment/route.ts',
  );
  const documentRoute = source(
    'src/app/api/orders/[id]/document/route.ts',
  );
  const security = source('src/lib/security.ts');
  const proxy = source('src/proxy.ts');
  const productActions = source(
    'src/components/buyer/product-detail/product-actions.tsx',
  );
  const relatedProducts = source(
    'src/components/buyer/product-detail/related-products.tsx',
  );
  const quickView = source('src/components/buyer/product-quick-view.tsx');
  const hero = source('src/components/buyer/home/hero-section.tsx');

  assert.match(helpers, /AxeBuilder/);
  assert.match(helpers, /credentials: 'same-origin'/);
  assert.match(helpers, /fetch\('\/api\/auth\/login'/);
  assert.match(helpers, /critical[\s\S]*serious|serious[\s\S]*critical/);
  assert.match(publicSmoke, /restores trigger focus/);
  assert.match(publicSmoke, /\/product\/WHP-001/);
  assert.match(rtlMobile, /nexamart_locale/);
  assert.match(rtlMobile, /toHaveAttribute\('dir', 'rtl'\)/);
  assert.match(rtlMobile, /reducedMotion: 'reduce'/);
  assert.match(rtlMobile, /data-product-purchase-actions/);
  assert.match(rtlMobile, /data-product-primary-actions/);
  assert.match(rtlMobile, /stickyPurchaseBar/);
  assert.match(rtlMobile, /isInViewport/);
  assert.match(rtlMobile, /toBeInViewport/);
  assert.match(rtlMobile, /window\.innerHeight/);
  assert.match(rtlMobile, /toHaveCount\(0\)/);
  assert.match(rtlMobile, /elementFromPoint/);
  assert.match(rtlMobile, /purchaseOverlapsComparison/);
  assert.match(rtlMobile, /assistantOverlapsActionContainer/);
  assert.match(criticalFlows, /\/api\/auth\/login/);
  assert.match(criticalFlows, /\/api\/auth\/session/);
  assert.match(criticalFlows, /\/api\/checkout/);
  assert.match(criticalFlows, /toHaveLength\(2\)/);
  assert.match(criticalFlows, /reducedMotion: 'reduce'/);
  assert.match(fulfillmentRace, /UHC-004/);
  assert.match(fulfillmentRace, /return_only/);
  assert.match(fulfillmentRace, /resolution: 'exchange'/);
  assert.match(fulfillmentRace, /set_return_disposition/);
  assert.match(fulfillmentRace, /upsert_replacement/);
  assert.match(fulfillmentRace, /transition_replacement/);
  assert.match(fulfillmentRace, /duplicatePut/);
  assert.match(fulfillmentRace, /inventoryRestoredAt/);
  assert.match(fulfillmentRace, /describe\.configure\(\{ retries: 0 \}\)/);
  assert.match(inventoryRace, /UHC-004/);
  assert.match(inventoryRace, /Promise\.all/);
  assert.match(inventoryRace, /one competing checkout wins/);
  assert.match(inventoryRace, /duplicatePost/);
  assert.match(inventoryRace, /inventoryRestoredAt/);
  assert.match(inventoryRace, /cancellationEventCount/);
  assert.match(inventoryRace, /describe\.configure\(\{ retries: 0 \}\)/);
  assert.match(printDocuments, /buyer order document is private/);
  assert.match(printDocuments, /seller packing slip is Arabic RTL/);
  assert.match(printDocuments, /page\.pdf/);
  assert.match(printDocuments, /format: 'A4'/);
  assert.match(printDocuments, /preferCSSPageSize: true/);
  assert.match(printDocuments, /type=packing-slip&lang=ar/);
  assert.match(printDocuments, /forbiddenPackingSlip\.status\(\)\)\.toBe\(403\)/);
  assert.match(printDocuments, /style-src 'unsafe-inline'/);
  assert.match(printDocuments, /headerDisplay/);
  assert.match(printDocuments, /gridColumnCount/);
  assert.match(printDocuments, /brandColor/);
  assert.match(printDocuments, /headingBackground/);
  assert.match(printDocuments, /address bdi\[dir=\"ltr\"\]/);
  assert.match(printDocuments, /RAW_ORDER_STATUSES/);
  assert.match(printDocuments, /not\.toContainText\('-\$0\.00'\)/);
  assert.match(printDocuments, /not\.toContain\('\$'\)/);
  assert.match(checkoutRoute, /MAX_SERIALIZABLE_ATTEMPTS = 3/);
  assert.match(checkoutRoute, /retrySerializableTransaction/);
  assert.match(checkoutRoute, /P2034/);
  assert.match(checkoutRoute, /CHECKOUT_CONFLICT/);
  assert.match(transitionRoute, /MAX_SERIALIZABLE_ATTEMPTS = 3/);
  assert.match(transitionRoute, /retrySerializableTransaction/);
  assert.match(transitionRoute, /P2034/);
  assert.match(transitionRoute, /ORDER_TRANSITION_CONFLICT/);
  assert.match(fulfillmentRoute, /MAX_SERIALIZABLE_ATTEMPTS = 3/);
  assert.match(fulfillmentRoute, /retrySerializableTransaction/);
  assert.match(fulfillmentRoute, /P2034/);
  assert.match(fulfillmentRoute, /FULFILLMENT_CONFLICT/);
  assert.match(documentRoute, /@page \{ size: A4 portrait; margin: 12mm; \}/);
  assert.match(documentRoute, /@media print/);
  assert.match(documentRoute, /page-break-inside: avoid/);
  assert.match(documentRoute, /ORDER_STATUS_LABELS/);
  assert.match(documentRoute, /function formatDiscount/);
  assert.match(documentRoute, /<caption>/);
  assert.match(documentRoute, /scope=\"col\"/);
  assert.match(documentRoute, /<bdi dir=\"ltr\">/);
  assert.match(
    documentRoute,
    /typeRaw === 'packing-slip' && auth\.user\.role === 'buyer'/,
  );
  assert.match(documentRoute, /lang=\"\$\{isRTL \? 'ar' : 'en'\}\"/);
  assert.match(documentRoute, /dir=\"\$\{isRTL \? 'rtl' : 'ltr'\}\"/);
  assert.match(documentRoute, /NexaMart does not process payment/);
  assert.match(documentRoute, /Cache-Control': 'private, no-store'/);
  assert.match(documentRoute, /style-src 'unsafe-inline'/);
  assert.match(security, /E2E_BROWSER_TEST_HARNESS/);
  assert.match(
    security,
    /process\.env\.E2E_BROWSER_TEST_HARNESS !== 'true'/,
  );
  assert.match(security, /E2E_AUTH_RATE_LIMIT_MAX_REQUESTS/);
  assert.match(security, /E2E_WRITE_RATE_LIMIT_MAX_REQUESTS/);
  assert.match(security, /productionDefault/);
  assert.match(security, /ciDefault/);
  assert.match(proxy, /browserHarnessAuthLimit/);
  assert.match(proxy, /E2E_BROWSER_TEST_HARNESS/);
  assert.match(proxy, /E2E_AUTH_RATE_LIMIT_MAX_REQUESTS/);
  assert.match(proxy, /maxRequests: browserHarnessAuthLimit\(\)/);
  assert.match(proxy, /function isPrintableOrderDocument/);
  assert.match(proxy, /!isPrintableOrderDocument\(pathname\)/);
  assert.match(productActions, /data-product-primary-actions/);
  assert.match(relatedProducts, /IntersectionObserver/);
  assert.match(relatedProducts, /showStickyPurchaseActions/);
  assert.match(relatedProducts, /entry\.boundingClientRect\.bottom < 0/);
  assert.match(relatedProducts, /rootMargin: '160px 0px 0px 0px'/);
  assert.match(quickView, /onOpenAutoFocus/);
  assert.match(quickView, /onCloseAutoFocus/);
  assert.match(hero, /Previous slide/);
  assert.match(hero, /Next slide/);
  assert.match(hero, /size-11/);
  assert.match(hero, /Independent stores/);
  assert.match(hero, /Pay on delivery/);
  assert.match(hero, /Tracked fulfilment/);
  assert.doesNotMatch(hero, /10K\+ Products|500\+ Sellers|securePayments/);
});

test('permanent CI runs browsers and preserves failure diagnostics', () => {
  const workflow = source('.github/workflows/ci.yml');
  const session = source('src/lib/session.ts');
  const packageJson = JSON.parse(source('package.json')) as {
    devDependencies?: Record<string, string>;
  };

  assert.equal(packageJson.devDependencies?.['@playwright/test'], '1.61.1');
  assert.equal(packageJson.devDependencies?.['@axe-core/playwright'], '4.11.3');
  assert.match(workflow, /playwright install --with-deps chromium firefox/);
  assert.match(workflow, /npx playwright test/);
  assert.match(workflow, /RATE_LIMIT_ALLOW_MEMORY_FALLBACK: "true"/);
  assert.match(workflow, /AUTH_COOKIE_INSECURE_FOR_TESTS: "true"/);
  assert.match(workflow, /E2E_BROWSER_TEST_HARNESS: "true"/);
  assert.match(workflow, /E2E_AUTH_RATE_LIMIT_MAX_REQUESTS: "30"/);
  assert.match(workflow, /E2E_WRITE_RATE_LIMIT_MAX_REQUESTS: "100"/);
  assert.match(session, /process\.env\.CI === 'true'/);
  assert.match(session, /AUTH_COOKIE_INSECURE_FOR_TESTS === 'true'/);
  assert.match(workflow, /actions\/checkout@v6/);
  assert.match(workflow, /actions\/setup-node@v6/);
  assert.match(workflow, /actions\/upload-artifact@v7/);
  assert.equal(
    existsSync(
      join(
        process.cwd(),
        '.github/workflows/p3-dependency-bootstrap.yml',
      ),
    ),
    false,
  );
  assert.equal(
    existsSync(
      join(
        process.cwd(),
        '.github/workflows/p3-browser-findings-fix.yml',
      ),
    ),
    false,
  );
  assert.equal(
    existsSync(
      join(
        process.cwd(),
        '.github/workflows/p3-fulfillment-conflict-fix.yml',
      ),
    ),
    false,
  );
  assert.equal(
    existsSync(
      join(
        process.cwd(),
        '.github/workflows/p3-fulfillment-conflict-runner.yml',
      ),
    ),
    false,
  );
});
