import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const item = await db.orderItem.findFirst({
    where: { order: { is: { status: 'delivered' } } },
    include: {
      order: { include: { store: { select: { ownerId: true } } } },
      variant: { select: { sku: true } },
    },
  });
  if (!item || !item.order.store) {
    throw new Error('A delivered seeded order item is required for return verification.');
  }

  const created = await db.return.create({
    data: {
      orderId: item.orderId,
      orderItemId: item.id,
      productId: item.productId,
      variantId: item.variantId,
      sku: item.variant?.sku || null,
      buyerId: item.order.userId,
      sellerId: item.order.store.ownerId,
      quantity: 1,
      unitPrice: Number(item.price),
      refundAmount: Number(item.price),
      reason: 'other',
      resolution: 'offline_refund',
      status: 'pending',
      offlineRefundStatus: 'not_required',
      timeline: JSON.stringify([
        { status: 'Verification request', date: new Date().toISOString() },
      ]),
    },
  });

  const loaded = await db.return.findUnique({
    where: { id: created.id },
    include: { orderItem: { include: { variant: true } } },
  });
  if (!loaded?.orderItemId || loaded.orderItemId !== item.id) {
    throw new Error('Return did not preserve the exact order-item identity.');
  }
  if (Number(loaded.unitPrice) !== Number(item.price)) {
    throw new Error('Return did not preserve the historical order-item price.');
  }

  await db.return.delete({ where: { id: created.id } });
  console.log('SKU-aware return schema verified successfully.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
