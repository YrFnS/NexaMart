import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allocateCents,
  calculateStoreShippingCents,
  calculateStoreTaxCents,
  canonicalizeVariation,
  resolveTaxCountryCode,
  validateVariationSelection,
  VariationValidationError,
} from './checkout-authority.ts';

test('shipping country aliases resolve to supported tax jurisdictions', () => {
  assert.equal(resolveTaxCountryCode('IQ'), 'iq');
  assert.equal(resolveTaxCountryCode('Iraq'), 'iq');
  assert.equal(resolveTaxCountryCode('العراق'), 'iq');
  assert.equal(resolveTaxCountryCode('UAE'), 'ae');
  assert.equal(resolveTaxCountryCode('Kingdom of Saudi Arabia'), 'sa');
  assert.equal(resolveTaxCountryCode('Unknown jurisdiction'), null);
});

test('variation selections are canonical and require every configured option', () => {
  const options = JSON.stringify({
    size: ['M', 'L'],
    color: ['Black', 'White'],
  });
  const validated = validateVariationSelection(options, {
    size: 'L',
    color: 'Black',
  });

  assert.deepEqual(validated.attributes, { color: 'Black', size: 'L' });
  assert.equal(validated.canonical, '{"color":"Black","size":"L"}');
  assert.equal(
    canonicalizeVariation({ size: 'L', color: 'Black' }),
    validated.canonical,
  );

  assert.throws(
    () => validateVariationSelection(options, { color: 'Black' }),
    VariationValidationError,
  );
  assert.throws(
    () =>
      validateVariationSelection(options, {
        color: 'Purple',
        size: 'L',
      }),
    VariationValidationError,
  );
});

test('legacy plain variation strings work only for one-dimensional products', () => {
  assert.equal(
    validateVariationSelection('{"color":["Black","White"]}', 'White')
      .canonical,
    '{"color":"White"}',
  );

  assert.throws(
    () =>
      validateVariationSelection(
        '{"color":["Black"],"size":["M"]}',
        'Black',
      ),
    VariationValidationError,
  );
});

test('standard shipping is calculated independently per seller shipment', () => {
  assert.equal(
    calculateStoreShippingCents('standard', 2_500, [
      { hasFreeShipping: false },
    ]),
    599,
  );
  assert.equal(
    calculateStoreShippingCents('standard', 2_500, [
      { hasFreeShipping: true },
    ]),
    0,
  );
  assert.equal(
    calculateStoreShippingCents('standard', 10_000, [
      { hasFreeShipping: false },
    ]),
    0,
  );
  assert.equal(
    calculateStoreShippingCents('express', 50_000, [
      { hasFreeShipping: true },
    ]),
    999,
  );
});

test('tax applies after the allocated store discount', () => {
  const allocated = allocateCents(101, [100, 100]);
  assert.deepEqual(allocated, [51, 50]);

  const tax = calculateStoreTaxCents(
    'sa',
    [
      { lineTotalCents: 10_000, categorySlug: 'electronics' },
      { lineTotalCents: 5_000, categorySlug: 'fashion' },
    ],
    1_500,
  );
  assert.equal(tax, 2_025);
});
