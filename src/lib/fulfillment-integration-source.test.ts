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

test('seller and buyer order screens expose secure printable documents', () => {
  const sellerRoute = source('src/app/seller/dashboard/orders/page.tsx');
  const sellerWorkspace = source(
    'src/components/seller/fulfillment-operations.tsx',
  );
  const buyerOrders = source('src/components/buyer/orders-page.tsx');
  assert.match(sellerRoute, /FulfillmentOperations/);
  assert.match(sellerWorkspace, /Open packing slip/);
  assert.match(sellerWorkspace, /opened\.opener = null/);
  assert.match(buyerOrders, /Open order document/);
  assert.match(buyerOrders, /opened\.opener = null/);
});
