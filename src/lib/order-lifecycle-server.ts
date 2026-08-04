import { Prisma } from '@prisma/client';
import {
  allowedOrderTransitions,
  canTransitionOrder,
  normalizeOrderStatus,
  transitionRequiresTracking,
  transitionRestoresInventory,
  type OrderActorRole,
  type OrderStatus,
} from '@/lib/order-lifecycle';

export const lifecycleOrderInclude = {
  user: {
    select: { id: true, name: true, email: true, phone: true },
  },
  store: {
    select: { id: true, name: true, nameAr: true, ownerId: true },
  },
  items: {
    include: {
      product: {
        select: { id: true, name: true, nameAr: true, images: true },
      },
      variant: {
        select: { id: true, sku: true, attributes: true },
      },
    },
  },
  statusEvents: {
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.OrderInclude;

export type LifecycleOrder = Prisma.OrderGetPayload<{
  include: typeof lifecycleOrderInclude;
}>;

export class OrderLifecycleError extends Error {
  constructor(
    message: string,
    readonly status = 400,
    readonly code = 'ORDER_LIFECYCLE_ERROR',
  ) {
    super(message);
  }
}

function parseJsonObject(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

function parseImage(value: string): string {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) && typeof parsed[0] === 'string'
      ? parsed[0]
      : '/placeholder-product.svg';
  } catch {
    return '/placeholder-product.svg';
  }
}

export function serializeLifecycleOrder(
  order: LifecycleOrder,
  actorRole: OrderActorRole = 'buyer',
) {
  const statusEvents = order.statusEvents.map((event) => ({
    id: event.id,
    fromStatus: event.fromStatus,
    status: event.toStatus,
    toStatus: event.toStatus,
    actorRole: event.actorRole,
    note: event.note,
    date: event.createdAt.toISOString(),
    completed: true,
  }));

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    subtotal: Number(order.subtotal),
    shipping: Number(order.shippingCost),
    shippingCost: Number(order.shippingCost),
    discount: Number(order.discount),
    tax: Number(order.tax),
    total: Number(order.total),
    orderMethod: 'cash_on_delivery',
    shippingAddress: parseJsonObject(order.shippingAddress),
    trackingNumber: order.trackingNumber,
    carrier: order.carrier,
    notes: order.notes,
    confirmationExpiresAt: order.confirmationExpiresAt?.toISOString() || null,
    confirmedAt: order.confirmedAt?.toISOString() || null,
    preparingAt: order.preparingAt?.toISOString() || null,
    shippedAt: order.shippedAt?.toISOString() || null,
    deliveredAt: order.deliveredAt?.toISOString() || null,
    cancelledAt: order.cancelledAt?.toISOString() || null,
    rejectedAt: order.rejectedAt?.toISOString() || null,
    cancellationReason: order.cancellationReason,
    inventoryRestoredAt: order.inventoryRestoredAt?.toISOString() || null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    user: order.user,
    customerName: order.user.name || order.user.email,
    customerEmail: order.user.email,
    store: order.store,
    storeId: order.store?.id || '',
    storeName: order.store?.name || 'Store',
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      sku: item.variant?.sku || null,
      name: item.product.name,
      nameAr: item.product.nameAr,
      productName: item.product.name,
      image: parseImage(item.product.images),
      quantity: item.quantity,
      price: Number(item.price),
      total: Number(item.total),
      variation: item.variation,
      attributes: item.variant
        ? parseJsonObject(item.variant.attributes)
        : parseJsonObject(item.variation),
    })),
    statusEvents,
    timeline:
      statusEvents.length > 0
        ? statusEvents
        : [
            {
              id: `current-${order.id}`,
              fromStatus: null,
              status: order.status,
              toStatus: order.status,
              actorRole: 'system',
              note: null,
              date: order.createdAt.toISOString(),
              completed: true,
            },
          ],
    allowedTransitions: allowedOrderTransitions(order.status, actorRole),
    canCancel: canTransitionOrder(order.status, 'cancelled', 'buyer'),
  };
}

interface TransitionInput {
  targetStatus: OrderStatus;
  actorId: string;
  actorRole: OrderActorRole;
  note?: string;
  carrier?: string;
  trackingNumber?: string;
}

function transitionData(
  targetStatus: OrderStatus,
  now: Date,
  input: TransitionInput,
): Prisma.OrderUpdateManyMutationInput {
  const data: Prisma.OrderUpdateManyMutationInput = {
    status: targetStatus,
  };
  if (targetStatus === 'confirmed') data.confirmedAt = now;
  if (targetStatus === 'preparing') data.preparingAt = now;
  if (targetStatus === 'shipped') {
    data.shippedAt = now;
    data.carrier = input.carrier?.trim() || null;
    data.trackingNumber = input.trackingNumber?.trim() || null;
  }
  if (targetStatus === 'delivered') data.deliveredAt = now;
  if (targetStatus === 'cancelled') {
    data.cancelledAt = now;
    data.cancelledBy = input.actorId;
    data.cancellationReason = input.note?.trim() || null;
  }
  if (targetStatus === 'rejected') {
    data.rejectedAt = now;
    data.cancelledBy = input.actorId;
    data.cancellationReason = input.note?.trim() || null;
  }
  return data;
}

function statusMessage(targetStatus: OrderStatus, orderNumber: string) {
  const messages: Record<OrderStatus, { en: string; ar: string }> = {
    pending: {
      en: `Order ${orderNumber} is waiting for seller confirmation.`,
      ar: `الطلب ${orderNumber} بانتظار تأكيد البائع.`,
    },
    confirmed: {
      en: `Order ${orderNumber} was confirmed by the seller.`,
      ar: `تم تأكيد الطلب ${orderNumber} من قبل البائع.`,
    },
    preparing: {
      en: `Order ${orderNumber} is being prepared.`,
      ar: `جاري تجهيز الطلب ${orderNumber}.`,
    },
    processing: {
      en: `Order ${orderNumber} is being processed.`,
      ar: `جاري معالجة الطلب ${orderNumber}.`,
    },
    shipped: {
      en: `Order ${orderNumber} was shipped.`,
      ar: `تم شحن الطلب ${orderNumber}.`,
    },
    delivered: {
      en: `Order ${orderNumber} was delivered.`,
      ar: `تم تسليم الطلب ${orderNumber}.`,
    },
    rejected: {
      en: `Order ${orderNumber} was rejected and its inventory was restored.`,
      ar: `تم رفض الطلب ${orderNumber} وإعادة مخزونه.`,
    },
    cancelled: {
      en: `Order ${orderNumber} was cancelled and its inventory was restored.`,
      ar: `تم إلغاء الطلب ${orderNumber} وإعادة مخزونه.`,
    },
    disputed: {
      en: `Order ${orderNumber} is under dispute.`,
      ar: `الطلب ${orderNumber} قيد النزاع.`,
    },
    returned: {
      en: `Order ${orderNumber} was returned.`,
      ar: `تم إرجاع الطلب ${orderNumber}.`,
    },
  };
  return messages[targetStatus];
}

export async function applyOrderTransition(
  tx: Prisma.TransactionClient,
  order: LifecycleOrder,
  input: TransitionInput,
): Promise<LifecycleOrder> {
  const currentStatus = normalizeOrderStatus(order.status);
  if (!currentStatus) {
    throw new OrderLifecycleError(
      `Order status ${order.status} is not supported.`,
      409,
      'UNSUPPORTED_ORDER_STATUS',
    );
  }
  if (currentStatus === input.targetStatus) return order;
  if (!canTransitionOrder(currentStatus, input.targetStatus, input.actorRole)) {
    throw new OrderLifecycleError(
      `${input.actorRole} cannot move an order from ${currentStatus} to ${input.targetStatus}.`,
      409,
      'INVALID_ORDER_TRANSITION',
    );
  }

  const carrier = input.carrier?.trim() || order.carrier || '';
  const trackingNumber =
    input.trackingNumber?.trim() || order.trackingNumber || '';
  if (
    transitionRequiresTracking(input.targetStatus) &&
    (!carrier || !trackingNumber)
  ) {
    throw new OrderLifecycleError(
      'Carrier and tracking number are required before shipping.',
      400,
      'TRACKING_REQUIRED',
    );
  }

  const now = new Date();
  const restoresInventory = transitionRestoresInventory(input.targetStatus);
  if (restoresInventory && order.inventoryRestoredAt) {
    throw new OrderLifecycleError(
      'Inventory was already restored for this order.',
      409,
      'INVENTORY_ALREADY_RESTORED',
    );
  }

  const data = transitionData(input.targetStatus, now, {
    ...input,
    carrier,
    trackingNumber,
  });
  if (restoresInventory) data.inventoryRestoredAt = now;

  const claimed = await tx.order.updateMany({
    where: {
      id: order.id,
      status: order.status,
      ...(restoresInventory ? { inventoryRestoredAt: null } : {}),
    },
    data,
  });
  if (claimed.count !== 1) {
    throw new OrderLifecycleError(
      'The order changed while it was being updated.',
      409,
      'ORDER_CHANGED',
    );
  }

  if (restoresInventory) {
    for (const item of order.items) {
      const product = await tx.product.updateMany({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
      if (product.count !== 1) {
        throw new OrderLifecycleError(
          'A product required for inventory restoration no longer exists.',
          409,
          'PRODUCT_RESTORE_FAILED',
        );
      }
      await tx.$executeRaw`
        UPDATE "Product"
        SET "soldCount" = GREATEST("soldCount" - ${item.quantity}, 0)
        WHERE "id" = ${item.productId}
      `;

      if (item.variantId) {
        const variant = await tx.productVariant.updateMany({
          where: {
            id: item.variantId,
            productId: item.productId,
          },
          data: { stock: { increment: item.quantity } },
        });
        if (variant.count !== 1) {
          throw new OrderLifecycleError(
            'The purchased SKU could not be restored.',
            409,
            'SKU_RESTORE_FAILED',
          );
        }
      }
    }
  }

  await tx.orderStatusEvent.create({
    data: {
      orderId: order.id,
      fromStatus: currentStatus,
      toStatus: input.targetStatus,
      actorId: input.actorId,
      actorRole: input.actorRole,
      note: input.note?.trim() || null,
    },
  });

  const message = statusMessage(input.targetStatus, order.orderNumber);
  await tx.notification.create({
    data: {
      userId: order.userId,
      title: 'Order updated',
      titleAr: 'تحديث الطلب',
      message: message.en,
      messageAr: message.ar,
      type: 'order',
    },
  });

  if (
    input.actorRole === 'buyer' &&
    order.store?.ownerId &&
    order.store.ownerId !== order.userId
  ) {
    await tx.notification.create({
      data: {
        userId: order.store.ownerId,
        title: 'Buyer cancelled an order',
        titleAr: 'ألغى المشتري طلباً',
        message: `Order ${order.orderNumber} was cancelled by the buyer.`,
        messageAr: `تم إلغاء الطلب ${order.orderNumber} من قبل المشتري.`,
        type: 'order',
      },
    });
  }

  const refreshed = await tx.order.findUnique({
    where: { id: order.id },
    include: lifecycleOrderInclude,
  });
  if (!refreshed) {
    throw new OrderLifecycleError('Order not found after update.', 404);
  }
  return refreshed;
}
