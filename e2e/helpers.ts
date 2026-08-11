import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

export const APP_URL =
  process.env.PLAYWRIGHT_BASE_URL?.trim() || 'http://127.0.0.1:3000';

const SEEDED_PASSWORD =
  process.env.E2E_PASSWORD ||
  process.env.SEED_DEMO_PASSWORD ||
  'ci-demo-password-with-at-least-12-characters';
const CART_OWNER_KEY = 'nexamart_cart_owner';

type AxeBuilderOptions = ConstructorParameters<typeof AxeBuilder>[0];

export async function primeBrowser(page: Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('nexamart_onboarding_dismissed', 'true');
    window.localStorage.setItem(
      'nexamart_cookie_consent',
      JSON.stringify({
        state: 'accepted',
        preferences: {
          essential: true,
          analytics: true,
          marketing: true,
          functional: true,
        },
      }),
    );
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
  // @axe-core/playwright and @playwright/test may resolve their structurally
  // identical Page type through separate transitive playwright-core paths.
  // Narrow the adapter boundary here so the browser suites remain strictly
  // typed everywhere else.
  const axePage = page as unknown as AxeBuilderOptions['page'];
  const results = await new AxeBuilder({ page: axePage })
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
  password = SEEDED_PASSWORD,
) {
  if (page.url() === 'about:blank') {
    await gotoAndExpectOk(page, '/');
  }

  const result = await page.evaluate(
    async ({ loginEmail, loginPassword }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        user?: { email?: string; role?: string };
        error?: string;
      };
      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        payload,
      };
    },
    { loginEmail: email, loginPassword: password },
  );

  expect(
    result.ok,
    `Seeded login failed (${result.status}): ${
      result.payload.error || result.statusText
    }`,
  ).toBe(true);
  expect(result.payload.user?.email).toBe(email);

  // Reload once after API login so the application session synchronizer, the
  // HttpOnly cookie, and cart ownership all agree before the test interacts
  // with authenticated pages. This also catches real cookie persistence bugs.
  const sessionHydration = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/auth/session') &&
      response.request().method() === 'GET',
  );
  await page.reload({ waitUntil: 'domcontentloaded' });
  const sessionResponse = await sessionHydration;
  expect(
    sessionResponse.ok(),
    `Session hydration failed after login with status ${sessionResponse.status()}.`,
  ).toBe(true);

  const sessionPayload = (await sessionResponse.json()) as {
    user?: { id?: string; email?: string } | null;
  };
  expect(sessionPayload.user?.email).toBe(email);
  const userId = sessionPayload.user?.id;
  expect(userId, 'Authenticated session did not include a user id.').toBeTruthy();

  await expect
    .poll(() =>
      page.evaluate(
        (storageKey) => window.localStorage.getItem(storageKey),
        CART_OWNER_KEY,
      ),
    )
    .toBe(userId);
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
