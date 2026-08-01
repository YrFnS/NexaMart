import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

try {
  const columns = await db.$queryRaw<
    Array<{ table_name: string; column_name: string }>
  >`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        (table_name = 'Order' AND column_name IN (
          'sellerFulfillmentNote',
          'packingSlipGeneratedAt',
          'packingSlipGeneratedBy'
        )) OR
        (table_name = 'Return' AND column_name IN (
          'inventoryDisposition',
          'inventoryDispositionAt',
          'inventoryDispositionBy',
          'inventoryRestoredAt'
        )) OR
        table_name = 'ReplacementShipment'
      )
  `;

  const names = new Set(
    columns.map((column) => `${column.table_name}.${column.column_name}`),
  );
  for (const name of [
    'Order.sellerFulfillmentNote',
    'Order.packingSlipGeneratedAt',
    'Order.packingSlipGeneratedBy',
    'Return.inventoryDisposition',
    'Return.inventoryDispositionAt',
    'Return.inventoryDispositionBy',
    'Return.inventoryRestoredAt',
    'ReplacementShipment.returnId',
    'ReplacementShipment.productId',
    'ReplacementShipment.variantId',
    'ReplacementShipment.quantity',
    'ReplacementShipment.status',
    'ReplacementShipment.inventoryReservedAt',
    'ReplacementShipment.inventoryRestoredAt',
  ]) {
    assert.ok(names.has(name), `Missing fulfillment column ${name}`);
  }

  const indexes = await db.$queryRaw<Array<{ indexname: string }>>`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'ReplacementShipment'
  `;
  assert.ok(
    indexes.some(
      (index) => index.indexname === 'ReplacementShipment_returnId_key',
    ),
  );

  const constraints = await db.$queryRaw<Array<{ conname: string }>>`
    SELECT conname
    FROM pg_constraint
    WHERE conname IN (
      'Return_inventoryDisposition_check',
      'ReplacementShipment_quantity_check',
      'ReplacementShipment_status_check',
      'ReplacementShipment_tracking_check'
    )
  `;
  assert.equal(constraints.length, 4);

  const apiSource = readFileSync(
    join(process.cwd(), 'src/app/api/seller/fulfillment/route.ts'),
    'utf8',
  );
  const documentSource = readFileSync(
    join(process.cwd(), 'src/app/api/orders/[id]/document/route.ts'),
    'utf8',
  );
  assert.match(apiSource, /RETURN_DISPOSITION_REQUIRED/);
  assert.match(apiSource, /REPLACEMENT_TRACKING_REQUIRED/);
  assert.match(apiSource, /stock: \{ decrement: input\.quantity \}/);
  assert.match(documentSource, /Seller access is required for packing slips/);
  assert.doesNotMatch(documentSource, /sellerFulfillmentNote/);

  console.log('Fulfillment operations schema and authority verified successfully.');
} finally {
  await db.$disconnect();
}
