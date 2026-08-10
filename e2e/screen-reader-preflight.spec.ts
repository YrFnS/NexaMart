import { expect, test } from '@playwright/test';
import {
  APP_URL,
  expectNoHorizontalOverflow,
  expectNoSeriousAccessibilityViolations,
  gotoAndExpectOk,
  primeBrowser,
} from './helpers';

test.describe('P3 keyboard and screen-reader preflight', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await primeBrowser(page);
  });

  test('skip navigation reaches the named main landmark', async ({ page }) => {
    await gotoAndExpectOk(page, '/shop');

    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('contentinfo')).toHaveCount(1);
    expect(await page.getByRole('navigation').count()).toBeGreaterThan(0);

    const skipLink = page.locator('[data-skip-link]');
    await expect(skipLink).toHaveAccessibleName('Skip to main content');

    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
    await expect(skipLink).toBeVisible();

    await page.keyboard.press('Enter');
    const mainContent = page.locator('#main-content');
    await expect(mainContent).toBeFocused();

    await expectNoHorizontalOverflow(page);
    await expectNoSeriousAccessibilityViolations(page);
  });

  test('English authentication controls are named and errors are announced', async ({
    page,
  }) => {
    await gotoAndExpectOk(page, '/auth');

    const loginForm = page.getByRole('form', {
      name: /log ?in|login|sign in/i,
    });
    await expect(loginForm).toBeVisible();

    const email = loginForm.locator('#login-email');
    const password = loginForm.locator('#login-password');
    await expect(email).toHaveAccessibleName(/email/i);
    await expect(password).toHaveAccessibleName(/password/i);

    await loginForm
      .getByRole('button', { name: 'Show password' })
      .click();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(
      loginForm.getByRole('button', { name: 'Hide password' }),
    ).toBeVisible();

    await email.fill('demo@nexamart.com');
    await password.fill('not-the-seeded-password');
    await loginForm
      .getByRole('button', { name: /log ?in|login|sign in/i })
      .click();
    await expect(page.getByRole('alert')).toBeVisible();

    await expectNoSeriousAccessibilityViolations(page);
  });

  test('Arabic authentication keeps form and password controls localized', async ({
    context,
    page,
  }) => {
    await context.addCookies([
      {
        name: 'nexamart_locale',
        value: 'ar',
        url: APP_URL,
        sameSite: 'Lax',
      },
    ]);

    await gotoAndExpectOk(page, '/auth');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

    const loginForm = page.getByRole('form', {
      name: /تسجيل الدخول|دخول/,
    });
    await expect(loginForm).toBeVisible();
    await expect(loginForm.locator('#login-email')).toHaveAccessibleName(
      /البريد/,
    );
    await expect(loginForm.locator('#login-password')).toHaveAccessibleName(
      /كلمة المرور/,
    );

    await loginForm
      .getByRole('button', { name: 'إظهار كلمة المرور' })
      .click();
    await expect(
      loginForm.getByRole('button', { name: 'إخفاء كلمة المرور' }),
    ).toBeVisible();

    const demoBuyer = loginForm.getByRole('button', {
      name: 'تجربة حساب المشتري',
    });
    const demoSeller = loginForm.getByRole('button', {
      name: 'تجربة حساب البائع',
    });
    if (process.env.ENABLE_DEMO_LOGIN === 'true') {
      await expect(demoBuyer).toBeVisible();
      await expect(demoSeller).toBeVisible();
    } else {
      await expect(demoBuyer).toHaveCount(0);
      await expect(demoSeller).toHaveCount(0);
    }

    await expectNoHorizontalOverflow(page);
    await expectNoSeriousAccessibilityViolations(page);
  });
});
