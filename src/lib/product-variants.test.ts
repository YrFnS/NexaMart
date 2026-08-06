import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildVariationDefinition,
  normalizeVariantAttributes,
  parseVariantAttributes,
  ProductVariantError,
  variantOptionKey,
} from './product-variants.ts';

test('variant attributes are normalized into a stable unique key', () => {
  const normalized = normalizeVariantAttributes({ size: ' M ', color: 'Black' });
  assert.deepEqual(normalized, { color: 'Black', size: 'M' });
  assert.equal(variantOptionKey(normalized), '{"color":"Black","size":"M"}');
});

test('empty variant attributes are rejected', () => {
  assert.throws(
    () => normalizeVariantAttributes({ color: '  ' }),
    ProductVariantError,
  );
});

test('variation definitions include only active SKU options', () => {
  const definition = buildVariationDefinition([
    { attributes: { color: 'Black', size: 'M' }, isActive: true },
    { attributes: { color: 'White', size: 'L' }, isActive: true },
    { attributes: { color: 'Purple', size: 'XL' }, isActive: false },
  ]);
  assert.equal(
    definition,
    '{"color":["Black","White"],"size":["L","M"]}',
  );
  assert.deepEqual(parseVariantAttributes('{"size":"M","color":"Black"}'), {
    color: 'Black',
    size: 'M',
  });
});
