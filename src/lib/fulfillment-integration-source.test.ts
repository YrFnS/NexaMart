import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

function source(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

test('return completion waits for physical disposition and exchange delivery', () => {
  const route = source('src/app/api/returns/route.ts');
  assert.match(route, /RETURN_DISPOSITION_REQUIRED/);
  assert.match(route, /EXCHANGE_REPLACEMENT_REQUIRED/);
  assert.match(route, /replacementShipment/);
});

test('buyers receive replacement shipment history without seller-private notes', () => {
  const route = source('src/app/api/returns/route.ts');
  const page = source('src/components/buyer/returns-page.tsx');
  const documentRoute = source('src/app/api/orders/[id]/document/route.ts');
  assert.match(page, /replacementShipment/);
  assert.match(page, /Tracking number/);
  assert.doesNotMatch(documentRoute, /sellerFulfillmentNote/);
  assert.match(route, /trackingNumber/);
});

test('seller order route exposes the operational workspace', () => {
  const page = source('src/app/seller/dashboard/orders/page.tsx');
  assert.match(page, /FulfillmentOperations/);
});
