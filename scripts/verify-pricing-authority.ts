import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

try {
  const columns = await db.$queryRaw<
    Array<{ table_name: string; column_name: string; data_type: string }>
  >`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND (
        (table_name = 'Product' AND column_name IN ('price', 'originalPrice', 'currency')) OR
        (table_name = 'ProductVariant' AND column_name IN ('price', 'originalPrice', 'currency')) OR
        (table_name = 'Order' AND column_name IN ('subtotal', 'shippingCost', 'discount', 'tax', 'total', 'currency')) OR
        (table_name = 'OrderItem' AND column_name IN ('price', 'total', 'currency')) OR
        (table_name = 'Coupon' AND column_name IN ('discount', 'minOrder', 'maxDiscount', 'currency')) OR
        (table_name = 'Return' AND column_name IN ('unitPrice', 'refundAmount', 'currency')) OR
        (table_name = 'Invoice' AND column_name IN ('subtotal', 'shipping', 'discount', 'tax', 'total', 'currency'))
      )
  `;
  const numericColumns = columns.filter((column) => column.column_name !== 'currency');
  assert.ok(numericColumns.length >= 20);
  assert.ok(numericColumns.every((column) => column.data_type === 'numeric'));
  const currencies = await db.$queryRaw<Array<{ invalid: bigint }>>`
    SELECT (
      (SELECT COUNT(*) FROM "Product" WHERE "currency" <> 'USD') +
      (SELECT COUNT(*) FROM "ProductVariant" WHERE "currency" <> 'USD') +
      (SELECT COUNT(*) FROM "Order" WHERE "currency" <> 'USD') +
      (SELECT COUNT(*) FROM "OrderItem" WHERE "currency" <> 'USD') +
      (SELECT COUNT(*) FROM "Coupon" WHERE "currency" <> 'USD') +
      (SELECT COUNT(*) FROM "Return" WHERE "currency" <> 'USD') +
      (SELECT COUNT(*) FROM "Invoice" WHERE "currency" <> 'USD')
    ) AS invalid
  `;
  assert.equal(Number(currencies[0]?.invalid || 0), 0);
  console.log('Fixed-precision USD pricing schema verified successfully.');
} finally {
  await db.$disconnect();
}
