import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export const APP_URL =
  process.env.PLAYWRIGHT_BASE_URL?.trim() || 'http://127.0.0.1:3000';

const SEEDED_PASSWORD =
  process.env.E2E_PASSWORD ||
  process.env.SEED_DEMO_PASSWORD ||
  'ci-demo-password-with-at-least-12-characters';

export async function primeBrowser(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('nexamart_onboarding_dismissed', 'true');
    window.localStorage.setItem('nexamart_cookie_consent', 'accepted');
  });
}

export async function gotoAndExpectOk(page: Page, path: string) {
  const response = await page.goto(path, { waitUntil: 'domcontentloaded' });
  expect(response, `No navigation response was returned for ${path}.`).not.toBeNull();
  expect(response?.ok(), `Expected ${path} to return a successful response.`).toBe(
    true,
  );
  await expect(page.locator('body')).not.toContainText('Internal Server Error');
  await page.evaluate(async () => {
    if ('fonts' in document) await document.fonts.ready;
  });
}

export async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: Math.max(
      document.documentElement.scrollWidth,
      document.body.scrollWidth,
    ),
  }));

  expect(
    dimensions.documentWidth,
    `Document width ${dimensions.documentWidth}px exceeds the ${dimensions.viewportWidth}px viewport.`,
  ).toBeLessThanOrEqual(dimensions.viewportWidth + 2);
}

export async function expectNoSeriousAccessibilityViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21a',
      'wcag21aa',
      'wcag22a',
      'wcag22aa',
    ])
    // Colour contrast is reviewed separately because image-backed cards and
    // transient gradients require manual visual confirmation in staging.
    .disableRules(['color-contrast'])
    .analyze();

  const violations = results.violations.filter(
    (violation) =>
      violation.impact === 'critical' || violation.impact === 'serious',
  );
  const summary = violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    targets: violation.nodes.flatMap((node) => node.target),
  }));

  expect(
    violations,
    `Serious accessibility violations:\n${JSON.stringify(summary, null, 2)}`,
  ).toEqual([]);
}

export async function loginWithApi(
  page: Page,
  email = 'demo@nexamart.com',
) {
  const response = await page.request.post(`${APP_URL}/api/auth/login`, {
    headers: {
      origin: APP_URL,
      referer: `${APP_URL}/auth`,
    },
    data: {
      email,
      password: SEEDED_PASSWORD,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as {
    user?: { email?: string; role?: string };
    error?: string;
  };

  expect(
    response.ok(),
    `Seeded login failed: ${payload.error || response.statusText()}`,
  ).toBe(true);
  expect(payload.user?.email).toBe(email);
}

export async function firstPublicStoreId(page: Page): Promise<string> {
  const response = await page.request.get(`${APP_URL}/api/stores?limit=1`);
  const payload = (await response.json()) as {
    stores?: Array<{ id?: string }>;
  };

  expect(response.ok()).toBe(true);
  const id = payload.stores?.[0]?.id;
  expect(id, 'The deterministic seed must expose at least one public store.').toBeTruthy();
  return id!;
}

export async function cartLineCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    try {
      const value = window.localStorage.getItem('nexamart_cart');
      const parsed = value ? (JSON.parse(value) as unknown) : [];
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  });
}
