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

test('P3 covers accessibility, RTL, focus, authentication, and checkout', () => {
  const helpers = source('e2e/helpers.ts');
  const publicSmoke = source('e2e/public-smoke.spec.ts');
  const rtlMobile = source('e2e/rtl-mobile.spec.ts');
  const criticalFlows = source('e2e/critical-flows.spec.ts');
  const quickView = source('src/components/buyer/product-quick-view.tsx');
  const hero = source('src/components/buyer/home/hero-section.tsx');

  assert.match(helpers, /AxeBuilder/);
  assert.match(helpers, /critical[\s\S]*serious|serious[\s\S]*critical/);
  assert.match(publicSmoke, /restores trigger focus/);
  assert.match(publicSmoke, /\/product\/WHP-001/);
  assert.match(rtlMobile, /nexamart_locale/);
  assert.match(rtlMobile, /toHaveAttribute\('dir', 'rtl'\)/);
  assert.match(criticalFlows, /\/api\/auth\/login/);
  assert.match(criticalFlows, /\/api\/checkout/);
  assert.match(criticalFlows, /toHaveLength\(2\)/);
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
  const packageJson = JSON.parse(source('package.json')) as {
    devDependencies?: Record<string, string>;
  };

  assert.equal(packageJson.devDependencies?.['@playwright/test'], '1.61.1');
  assert.equal(packageJson.devDependencies?.['@axe-core/playwright'], '4.11.3');
  assert.match(workflow, /playwright install --with-deps chromium firefox/);
  assert.match(workflow, /npx playwright test/);
  assert.match(workflow, /RATE_LIMIT_ALLOW_MEMORY_FALLBACK: "true"/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
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
});
