import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

function source(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

test('keyboard and screen-reader preflight remains wired into the storefront', () => {
  const appShell = source('src/components/layout/app-shell.tsx');
  const authPage = source('src/components/auth/auth-page.tsx');
  const browserPreflight = source('e2e/screen-reader-preflight.spec.ts');

  assert.match(appShell, /data-skip-link/);
  assert.match(appShell, /href="#main-content"/);
  assert.match(appShell, /id="main-content"/);
  assert.match(appShell, /tabIndex=\{-1\}/);
  assert.match(appShell, /focusMainContent/);
  assert.match(appShell, /onClick=\{focusMainContent\}/);
  assert.doesNotMatch(appShell, /<main/);
  assert.match(appShell, /Skip to main content/);
  assert.match(appShell, /انتقل إلى المحتوى الرئيسي/);

  assert.match(authPage, /aria-label=\{t\('login'\)\}/);
  assert.match(authPage, /aria-label=\{t\('signup'\)\}/);
  assert.match(authPage, /aria-busy=\{isLoading\}/);
  assert.match(authPage, /إظهار كلمة المرور/);
  assert.match(authPage, /إخفاء كلمة المرور/);
  assert.match(authPage, /تجربة حساب المشتري/);
  assert.match(authPage, /تجربة حساب البائع/);
  assert.match(authPage, /role="alert"/);

  assert.match(
    browserPreflight,
    /skip navigation reaches the named main landmark/,
  );
  assert.match(browserPreflight, /toBeFocused\(\)/);
  assert.match(browserPreflight, /toHaveAccessibleName/);
  assert.match(browserPreflight, /getByRole\('main'\)/);
  assert.match(browserPreflight, /toHaveCount\(1\)/);
  assert.match(browserPreflight, /getByRole\('form'/);
  assert.match(browserPreflight, /getByRole\('alert'\)/);
  assert.match(browserPreflight, /nexamart_locale/);
  assert.match(browserPreflight, /إظهار كلمة المرور/);
  assert.match(browserPreflight, /إخفاء كلمة المرور/);
  assert.match(browserPreflight, /expectNoSeriousAccessibilityViolations/);
});
