import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

function source(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

test('core marketplace money uses Decimal and currency snapshots', () => {
  const schema = source('prisma/schema.prisma');
  assert.match(schema, /price\s+Decimal\s+@db\.Decimal\(18, 2\)/);
  assert.match(schema, /subtotal\s+Decimal\s+@db\.Decimal\(18, 2\)/);
  assert.match(schema, /currency\s+String\s+@default\("USD"\) @db\.Char\(3\)/);
  assert.doesNotMatch(schema, /model Order \{[\s\S]*?subtotal\s+Float/);
});

test('coupon validation uses cart lines and publishes no catalogue', () => {
  const route = source('src/app/api/coupons/route.ts');
  const checkout = source('src/app/api/checkout/route.ts');
  assert.match(route, /priceCartLines/);
  assert.match(route, /COUPON_CATALOGUE_DISABLED/);
  assert.doesNotMatch(route, /subtotal:\s*z\.number/);
  assert.match(checkout, /quoteCoupon/);
  assert.match(checkout, /centsToDecimal/);
});
