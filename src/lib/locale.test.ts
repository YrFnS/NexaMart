import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_LOCALE,
  localeDirection,
  normalizeLocale,
} from './locale.ts';

test('locale normalization accepts Arabic and safely defaults to English', () => {
  assert.equal(normalizeLocale('ar'), 'ar');
  assert.equal(normalizeLocale(' AR '), 'ar');
  assert.equal(normalizeLocale('en'), 'en');
  assert.equal(normalizeLocale('fr'), DEFAULT_LOCALE);
  assert.equal(normalizeLocale(undefined), DEFAULT_LOCALE);
});

test('locale direction is deterministic', () => {
  assert.equal(localeDirection('ar'), 'rtl');
  assert.equal(localeDirection('en'), 'ltr');
});
