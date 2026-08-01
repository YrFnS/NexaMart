import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

test('root layout renders locale and direction from the persisted cookie', () => {
  const layout = source('src/app/layout.tsx');
  assert.match(layout, /cookies\(\)/);
  assert.match(layout, /lang=\{locale\}/);
  assert.match(layout, /dir=\{direction\}/);
  assert.match(layout, /initialLocale=\{locale\}/);
});

test('mobile overlays use the shared safe-area layout', () => {
  const css = source('src/app/ui-foundation.css');
  const shell = source('src/components/layout/app-shell.tsx');
  const compare = source('src/components/buyer/compare-drawer.tsx');
  assert.match(css, /--nexa-mobile-nav-total/);
  assert.match(css, /nexa-floating-bottom-with-compare/);
  assert.match(shell, /data-app-shell-main/);
  assert.match(compare, /nexa-compare-drawer/);
});

test('global social-proof interruptions are not mounted in the app shell', () => {
  const shell = source('src/components/layout/app-shell.tsx');
  assert.doesNotMatch(shell, /SocialProofToast/);
});
