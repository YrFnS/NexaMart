import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserRole, type AuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  canSetReturnDisposition,
  canTransitionReplacement,
  dispositionRestoresInventory,
  REPLACEMENT_SHIPMENT_STATUSES,
  replacementRequiresTracking,
  replacementTransitionReservesInventory,
  replacementTransitionRestoresInventory,
  RETURN_DISPOSITIONS,
  returnAllowsReplacement,
  type ReplacementShipmentStatus,
  type ReturnDisposition,
} from '@/lib/fulfillment-operations';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
} from '@/lib/security';

const operationSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('save_order_note'),
      orderId: z.string().min(1).max(64),
      note: z.string().trim().max(2_000),
    })
    .strict(),
  z
    .object({
      action: z.literal('mark_packing_slip'),
      orderId: z.string().min(1).max(64),
    })
    .strict(),
  z
    .object({
      action: z.literal('set_return_disposition'),
      returnId: z.string().min(1).max(64),
      disposition: z.enum(RETURN_DISPOSITIONS),
    })
    .strict(),
  z
    .object({
      action: z.literal('upsert_replacement'),
      returnId: z.string().min(1).max(64),
      carrier: z.string().trim().max(120).optional(),
      trackingNumber: z.string().trim().max(160).optional(),
      notes: z.string().trim().max(1_000).optional(),
    })
    .strict(),
  z
    .object({
      action: z.literal('transition_replacement'),
      shipmentId: z.string().min(1).max(64),
      targetStatus: z.enum(REPLACEMENT_SHIPMENT_STATUSES),
      carrier: z.string().trim().max(120).optional(),
      trackingNumber: z.string().trim().max(160).optional(),
      notes: z.string().trim().max(1_000).optional(),
    })
    .strict(),
]);

class FulfillmentError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    message: string,
    status = 400,
    code = 'FULFILLMENT_ERROR',
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const MAX_SERIALIZABLE_ATTEMPTS = 3;

function isSerializableConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  );
}

async function retrySerializableTransaction<T>(
  operation: () => Promise<T>,
): Promise<T> {
  for (
    let attempt = 1;
    attempt <= MAX_SERIALIZABLE_ATTEMPTS;
    attempt += 1
  ) {
    try {
      return await operation();
    } catch (error) {
      if (
        !isSerializableConflict(error) ||
        attempt === MAX_SERIALIZABLE_ATTEMPTS
      ) {
        throw error;
      }
    }
  }

  throw new Error(
    'Serializable transaction retry loop exhausted unexpectedly.',
  );
}

function storeAccessWhere(user: AuthenticatedUser): Prisma.StoreWhereInput {
  if (user.role === 'admin') return {};
  return {
    OR: [
      { ownerId: user.id },
      {
        staff: {
          some: {
            userId: user.id,
            status: 'active',
            role: { in: ['owner', 'manager', 'editor'] },
          },
        },
      },
    ],
  };
}

async function accessibleStoreIds(user: AuthenticatedUser): Promise<string[]> {
  const stores = await db.store.findMany({
    where: storeAccessWhere(user),
    select: { id: true },
  });
  return stores.map((store) => store.id);
}

function parseObject(value: string | null | undefined): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([key, option]) => [key, String(option)]),
    );
  } catch {
    return {};
  }
}

function parseArray(value: string | null | undefined): unknown[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function appendTimeline(
  current: string | null | undefined,
  entry: Record<string, unknown>,
): string {
  return JSON.stringify([...parseArray(current), entry]);
}

const fulfillmentOrderSelect = {
  id: true,
  orderNumber: true,
  status: true,
  total: true,
  currency: true,
  shippingAddress: true,
  sellerFulfillmentNote: true,
  packingSlipGeneratedAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: { id: true, name: true, email: true, phone: true },
  },
  store: {
    select: { id: true, name: true, nameAr: true },
  },
  items: {
    include: {
      product: {
        select: { id: true, name: true, nameAr: true },
      },
      variant: {
        select: { id: true, sku: true, attributes: true },
      },
    },
  },
} satisfies Prisma.OrderSelect;

const fulfillmentReturnInclude = {
  order: {
    include: {
      store: { select: { id: true, name: true, nameAr: true } },
    },
  },
  orderItem: {
    include: {
      product: {
        select: { id: true, name: true, nameAr: true },
      },
      variant: {
        select: { id: true, sku: true, attributes: true },
      },
    },
  },
  product: {
    select: { id: true, name: true, nameAr: true },
  },
  buyer: {
    select: { id: true, name: true, email: true },
  },
  replacementShipment: true,
} satisfies Prisma.ReturnInclude;

type FulfillmentOrder = Prisma.OrderGetPayload<{
  select: typeof fulfillmentOrderSelect;
}>;
type FulfillmentReturn = Prisma.ReturnGetPayload<{
  include: typeof fulfillmentReturnInclude;
}>;

function serializeOrder(order: FulfillmentOrder) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    total: Number(order.total),
    currency: order.currency,
    shippingAddress: parseObject(order.shippingAddress),
    sellerFulfillmentNote: order.sellerFulfillmentNote || '',
    packingSlipGeneratedAt:
      order.packingSlipGeneratedAt?.toISOString() || null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    customer: {
      id: order.user.id,
      name: order.user.name || order.user.email,
      email: order.user.email,
      phone: order.user.phone || '',
    },
    store: order.store,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      name: item.product.name,
      nameAr: item.product.nameAr,
      sku: item.variant?.sku || null,
      attributes: item.variant
        ? parseObject(item.variant.attributes)
        : parseObject(item.variation),
      quantity: item.quantity,
    })),
  };
}

function serializeReplacement(
  shipment: NonNullable<FulfillmentReturn['replacementShipment']>,
) {
  return {
    id: shipment.id,
    status: shipment.status,
    carrier: shipment.carrier || '',
    trackingNumber: shipment.trackingNumber || '',
    notes: shipment.notes || '',
    quantity: shipment.quantity,
    sku: shipment.sku,
    inventoryReservedAt: shipment.inventoryReservedAt.toISOString(),
    inventoryRestoredAt:
      shipment.inventoryRestoredAt?.toISOString() || null,
    shippedAt: shipment.shippedAt?.toISOString() || null,
    deliveredAt: shipment.deliveredAt?.toISOString() || null,
    createdAt: shipment.createdAt.toISOString(),
    updatedAt: shipment.updatedAt.toISOString(),
  };
}

function serializeReturn(record: FulfillmentReturn) {
  const product = record.orderItem?.product || record.product;
  const variant = record.orderItem?.variant;
  return {
    id: record.id,
    orderId: record.orderId,
    orderItemId: record.orderItemId,
    orderNumber: record.order.orderNumber,
    storeId: record.order.storeId,
    storeName: record.order.store?.name || 'Store',
    productId: record.productId,
    productName: product.name,
    productNameAr: product.nameAr,
    variantId: record.variantId || record.orderItem?.variantId || null,
    sku: record.sku || variant?.sku || null,
    attributes: variant
      ? parseObject(variant.attributes)
      : parseObject(record.orderItem?.variation),
    quantity: record.quantity,
    status: record.status,
    resolution: record.resolution,
    buyerName: record.buyer.name || record.buyer.email,
    buyerEmail: record.buyer.email,
    inventoryDisposition: record.inventoryDisposition,
    inventoryDispositionAt:
      record.inventoryDispositionAt?.toISOString() || null,
    inventoryRestoredAt: record.inventoryRestoredAt?.toISOString() || null,
    createdAt: record.createdAt.toISOString(),
    replacementShipment: record.replacementShipment
      ? serializeReplacement(record.replacementShipment)
      : null,
  };
}

async function reserveInventory(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    variantId: string | null;
    quantity: number;
    productName: string;
  },
) {
  const product = await tx.product.updateMany({
    where: {
      id: input.productId,
      status: 'active',
      stock: { gte: input.quantity },
    },
    data: { stock: { decrement: input.quantity } },
  });
  if (product.count !== 1) {
    throw new FulfillmentError(
      `${input.productName} does not have enough stock for the replacement.`,
      409,
      'REPLACEMENT_STOCK_UNAVAILABLE',
    );
  }

  if (input.variantId) {
    const variant = await tx.productVariant.updateMany({
      where: {
        id: input.variantId,
        productId: input.productId,
        isActive: true,
        stock: { gte: input.quantity },
      },
      data: { stock: { decrement: input.quantity } },
    });
    if (variant.count !== 1) {
      throw new FulfillmentError(
        'The exact replacement SKU does not have enough stock.',
        409,
        'REPLACEMENT_SKU_STOCK_UNAVAILABLE',
      );
    }
  }
}

async function restoreReplacementInventory(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    variantId: string | null;
    quantity: number;
  },
) {
  const product = await tx.product.updateMany({
    where: { id: input.productId },
    data: { stock: { increment: input.quantity } },
  });
  if (product.count !== 1) {
    throw new FulfillmentError(
      'The replacement product could not be restored.',
      409,
      'REPLACEMENT_PRODUCT_RESTORE_FAILED',
    );
  }

  if (input.variantId) {
    const variant = await tx.productVariant.updateMany({
      where: { id: input.variantId, productId: input.productId },
      data: { stock: { increment: input.quantity } },
    });
    if (variant.count !== 1) {
      throw new FulfillmentError(
        'The replacement SKU could not be restored.',
        409,
        'REPLACEMENT_SKU_RESTORE_FAILED',
      );
    }
  }
}

async function restoreReturnedInventory(
  tx: Prisma.TransactionClient,
  record: FulfillmentReturn,
) {
  const product = await tx.product.updateMany({
    where: { id: record.productId },
    data: { stock: { increment: record.quantity } },
  });
  if (product.count !== 1) {
    throw new FulfillmentError(
      'The returned product no longer exists.',
      409,
      'RETURN_PRODUCT_RESTORE_FAILED',
    );
  }

  await tx.$executeRaw`
    UPDATE "Product"
    SET "soldCount" = GREATEST("soldCount" - ${record.quantity}, 0)
    WHERE "id" = ${record.productId}
  `;

  const variantId = record.variantId || record.orderItem?.variantId || null;
  if (variantId) {
    const variant = await tx.productVariant.updateMany({
      where: { id: variantId, productId: record.productId },
      data: { stock: { increment: record.quantity } },
    });
    if (variant.count !== 1) {
      throw new FulfillmentError(
        'The exact returned SKU could not be restored.',
        409,
        'RETURN_SKU_RESTORE_FAILED',
      );
    }
  }
}

export async function GET(request: Request) {
  const auth = await requireUserRole(request, ['seller', 'admin']);
  if (auth.response) return auth.response;

  try {
    const storeIds = await accessibleStoreIds(auth.user);
    if (storeIds.length === 0) {
      return NextResponse.json({
        orders: [],
        returns: [],
        dispositions: RETURN_DISPOSITIONS,
        replacementStatuses: REPLACEMENT_SHIPMENT_STATUSES,
      });
    }

    const [orders, returns] = await db.$transaction([
      db.order.findMany({
        where: {
          storeId: { in: storeIds },
          status: {
            in: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'],
          },
        },
        select: fulfillmentOrderSelect,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      db.return.findMany({
        where: {
          order: { storeId: { in: storeIds } },
          status: { in: ['approved', 'processing', 'completed'] },
        },
        include: fulfillmentReturnInclude,
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    return NextResponse.json({
      orders: orders.map(serializeOrder),
      returns: returns.map(serializeReturn),
      dispositions: RETURN_DISPOSITIONS,
      replacementStatuses: REPLACEMENT_SHIPMENT_STATUSES,
    });
  } catch (error) {
    console.error('Fulfillment workspace GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load the fulfillment workspace.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Invalid request origin.' },
      { status: 403 },
    );
  }

  const auth = await requireUserRole(request, ['seller', 'admin']);
  if (auth.response) return auth.response;

  const parsed = operationSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid fulfillment operation.' },
      { status: 400 },
    );
  }

  try {
    const storeIds = await accessibleStoreIds(auth.user);
    const result = await retrySerializableTransaction(() =>
      db.$transaction(
        async (tx) => {
        const input = parsed.data;

        if (input.action === 'save_order_note') {
          const order = await tx.order.findFirst({
            where: { id: input.orderId, storeId: { in: storeIds } },
            select: { id: true },
          });
          if (!order) {
            throw new FulfillmentError('Order not found.', 404, 'ORDER_NOT_FOUND');
          }
          await tx.order.update({
            where: { id: order.id },
            data: { sellerFulfillmentNote: input.note || null },
          });
          return { action: input.action, orderId: order.id };
        }

        if (input.action === 'mark_packing_slip') {
          const marked = await tx.order.updateMany({
            where: { id: input.orderId, storeId: { in: storeIds } },
            data: {
              packingSlipGeneratedAt: new Date(),
              packingSlipGeneratedBy: auth.user.id,
            },
          });
          if (marked.count !== 1) {
            throw new FulfillmentError('Order not found.', 404, 'ORDER_NOT_FOUND');
          }
          return { action: input.action, orderId: input.orderId };
        }

        if (input.action === 'set_return_disposition') {
          const record = await tx.return.findFirst({
            where: {
              id: input.returnId,
              order: { storeId: { in: storeIds } },
            },
            include: fulfillmentReturnInclude,
          });
          if (!record) {
            throw new FulfillmentError(
              'Return request not found.',
              404,
              'RETURN_NOT_FOUND',
            );
          }
          if (record.inventoryDisposition === input.disposition) {
            return { action: input.action, returnId: record.id, idempotent: true };
          }
          if (!canSetReturnDisposition(record.status, record.inventoryDisposition)) {
            throw new FulfillmentError(
              record.inventoryDisposition
                ? 'The returned item already has an inventory disposition.'
                : 'The returned item cannot be processed in its current state.',
              409,
              record.inventoryDisposition
                ? 'RETURN_DISPOSITION_ALREADY_SET'
                : 'RETURN_DISPOSITION_NOT_ALLOWED',
            );
          }

          const disposition = input.disposition as ReturnDisposition;
          const restoresInventory = dispositionRestoresInventory(disposition);
          if (restoresInventory && record.inventoryRestoredAt) {
            throw new FulfillmentError(
              'Returned inventory was already restored.',
              409,
              'RETURN_INVENTORY_ALREADY_RESTORED',
            );
          }

          const now = new Date();
          const claimed = await tx.return.updateMany({
            where: {
              id: record.id,
              inventoryDisposition: null,
              ...(restoresInventory ? { inventoryRestoredAt: null } : {}),
            },
            data: {
              inventoryDisposition: disposition,
              inventoryDispositionAt: now,
              inventoryDispositionBy: auth.user.id,
              ...(restoresInventory ? { inventoryRestoredAt: now } : {}),
              timeline: appendTimeline(record.timeline, {
                status: 'Returned item received',
                date: now.toISOString(),
                note: 'The seller recorded the condition of the returned item.',
              }),
            },
          });
          if (claimed.count !== 1) {
            throw new FulfillmentError(
              'The return changed while it was being processed.',
              409,
              'RETURN_CHANGED',
            );
          }
          if (restoresInventory) {
            await restoreReturnedInventory(tx, record);
          }
          return { action: input.action, returnId: record.id };
        }

        if (input.action === 'upsert_replacement') {
          const record = await tx.return.findFirst({
            where: {
              id: input.returnId,
              order: { storeId: { in: storeIds } },
            },
            include: fulfillmentReturnInclude,
          });
          if (!record) {
            throw new FulfillmentError(
              'Return request not found.',
              404,
              'RETURN_NOT_FOUND',
            );
          }
          if (record.resolution !== 'exchange') {
            throw new FulfillmentError(
              'Only an approved exchange can create a replacement shipment.',
              409,
              'REPLACEMENT_NOT_REQUIRED',
            );
          }

          const existing = record.replacementShipment;
          if (existing) {
            if (existing.status !== 'preparing') {
              throw new FulfillmentError(
                'A shipped, delivered, or cancelled replacement cannot be edited.',
                409,
                'REPLACEMENT_NOT_EDITABLE',
              );
            }
            await tx.replacementShipment.update({
              where: { id: existing.id },
              data: {
                carrier: input.carrier || null,
                trackingNumber: input.trackingNumber || null,
                notes: input.notes || null,
              },
            });
            return { action: input.action, shipmentId: existing.id };
          }

          if (!returnAllowsReplacement(record.status) || !record.orderItem) {
            throw new FulfillmentError(
              'The exchange is not ready for replacement inventory.',
              409,
              'REPLACEMENT_NOT_ALLOWED',
            );
          }
          if (!record.order.storeId) {
            throw new FulfillmentError(
              'The original store no longer exists.',
              409,
              'REPLACEMENT_STORE_MISSING',
            );
          }

          const variantId =
            record.variantId || record.orderItem.variantId || null;
          const productName =
            record.orderItem.product.name || record.product.name;
          await reserveInventory(tx, {
            productId: record.productId,
            variantId,
            quantity: record.quantity,
            productName,
          });

          const now = new Date();
          const shipment = await tx.replacementShipment.create({
            data: {
              returnId: record.id,
              orderId: record.orderId,
              orderItemId: record.orderItemId,
              productId: record.productId,
              variantId,
              buyerId: record.buyerId,
              sellerId: record.sellerId,
              storeId: record.order.storeId,
              sku: record.sku || record.orderItem.variant?.sku || null,
              quantity: record.quantity,
              carrier: input.carrier || null,
              trackingNumber: input.trackingNumber || null,
              status: 'preparing',
              notes: input.notes || null,
              inventoryReservedAt: now,
            },
          });

          const nextStatus =
            record.status === 'approved' ? 'processing' : record.status;
          const updatedReturn = await tx.return.updateMany({
            where: { id: record.id, status: record.status },
            data: {
              status: nextStatus,
              timeline: appendTimeline(record.timeline, {
                status: 'Replacement reserved',
                date: now.toISOString(),
                note: 'The exact replacement item and SKU were reserved.',
              }),
            },
          });
          if (updatedReturn.count !== 1) {
            throw new FulfillmentError(
              'The return changed while replacement stock was reserved.',
              409,
              'RETURN_CHANGED',
            );
          }

          await tx.notification.create({
            data: {
              userId: record.buyerId,
              title: 'Replacement being prepared',
              titleAr: 'جاري تجهيز المنتج البديل',
              message: `A replacement for order ${record.order.orderNumber} is being prepared.`,
              messageAr: `جاري تجهيز بديل للطلب ${record.order.orderNumber}.`,
              type: 'order',
            },
          });
          return { action: input.action, shipmentId: shipment.id };
        }

        const shipment = await tx.replacementShipment.findUnique({
          where: { id: input.shipmentId },
          include: {
            return: { include: fulfillmentReturnInclude },
          },
        });
        if (
          !shipment ||
          !shipment.return.order.storeId ||
          !storeIds.includes(shipment.return.order.storeId)
        ) {
          throw new FulfillmentError(
            'Replacement shipment not found.',
            404,
            'REPLACEMENT_NOT_FOUND',
          );
        }

        const current = shipment.status as ReplacementShipmentStatus;
        const target = input.targetStatus as ReplacementShipmentStatus;
        if (!canTransitionReplacement(current, target)) {
          throw new FulfillmentError(
            `A replacement cannot move from ${current} to ${target}.`,
            409,
            'INVALID_REPLACEMENT_TRANSITION',
          );
        }

        const carrier = input.carrier || shipment.carrier || '';
        const trackingNumber =
          input.trackingNumber || shipment.trackingNumber || '';
        if (
          replacementRequiresTracking(target) &&
          (!carrier.trim() || !trackingNumber.trim())
        ) {
          throw new FulfillmentError(
            'Carrier and tracking number are required before shipping.',
            400,
            'REPLACEMENT_TRACKING_REQUIRED',
          );
        }
        if (target === 'shipped') {
          if (!shipment.return.inventoryDisposition) {
            throw new FulfillmentError(
              'Record the returned item disposition before shipping a replacement.',
              409,
              'RETURN_DISPOSITION_REQUIRED',
            );
          }
          if (shipment.return.status !== 'processing') {
            throw new FulfillmentError(
              'The exchange return must be processing before shipment.',
              409,
              'RETURN_PROCESSING_REQUIRED',
            );
          }
        }

        const restoresInventory = replacementTransitionRestoresInventory(
          current,
          target,
        );
        const reservesInventory = replacementTransitionReservesInventory(
          current,
          target,
        );
        if (restoresInventory && shipment.inventoryRestoredAt) {
          throw new FulfillmentError(
            'Replacement inventory was already restored.',
            409,
            'REPLACEMENT_INVENTORY_ALREADY_RESTORED',
          );
        }
        if (reservesInventory && !shipment.inventoryRestoredAt) {
          throw new FulfillmentError(
            'Replacement inventory is already reserved.',
            409,
            'REPLACEMENT_INVENTORY_ALREADY_RESERVED',
          );
        }

        const now = new Date();
        const update: Prisma.ReplacementShipmentUpdateManyMutationInput = {
          status: target,
          carrier: carrier || null,
          trackingNumber: trackingNumber || null,
          ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
          ...(target === 'shipped' ? { shippedAt: now } : {}),
          ...(target === 'delivered' ? { deliveredAt: now } : {}),
          ...(restoresInventory ? { inventoryRestoredAt: now } : {}),
          ...(reservesInventory
            ? { inventoryReservedAt: now, inventoryRestoredAt: null }
            : {}),
        };
        const claimed = await tx.replacementShipment.updateMany({
          where: {
            id: shipment.id,
            status: current,
            ...(restoresInventory ? { inventoryRestoredAt: null } : {}),
          },
          data: update,
        });
        if (claimed.count !== 1) {
          throw new FulfillmentError(
            'The replacement changed while it was being updated.',
            409,
            'REPLACEMENT_CHANGED',
          );
        }

        if (restoresInventory) {
          await restoreReplacementInventory(tx, shipment);
        }
        if (reservesInventory) {
          await reserveInventory(tx, {
            productId: shipment.productId,
            variantId: shipment.variantId,
            quantity: shipment.quantity,
            productName:
              shipment.return.orderItem?.product.name ||
              shipment.return.product.name,
          });
        }

        const eventLabel: Record<ReplacementShipmentStatus, string> = {
          preparing: 'Replacement reserved again',
          shipped: 'Replacement shipped',
          delivered: 'Replacement delivered',
          cancelled: 'Replacement cancelled',
        };
        const nextTimeline = appendTimeline(shipment.return.timeline, {
          status: eventLabel[target],
          date: now.toISOString(),
          note:
            target === 'shipped'
              ? `${carrier} · ${trackingNumber}`
              : input.notes || undefined,
        });
        const returnUpdate: Prisma.ReturnUpdateManyMutationInput = {
          timeline: nextTimeline,
          ...(target === 'delivered' ? { status: 'completed' } : {}),
        };
        const updatedReturn = await tx.return.updateMany({
          where: {
            id: shipment.return.id,
            status: shipment.return.status,
          },
          data: returnUpdate,
        });
        if (updatedReturn.count !== 1) {
          throw new FulfillmentError(
            'The exchange return changed while the shipment was updated.',
            409,
            'RETURN_CHANGED',
          );
        }

        const messages: Record<
          ReplacementShipmentStatus,
          { en: string; ar: string }
        > = {
          preparing: {
            en: `Replacement inventory for order ${shipment.return.order.orderNumber} was reserved again.`,
            ar: `تم حجز مخزون البديل للطلب ${shipment.return.order.orderNumber} مرة أخرى.`,
          },
          shipped: {
            en: `Your replacement for order ${shipment.return.order.orderNumber} was shipped with ${carrier}. Tracking: ${trackingNumber}.`,
            ar: `تم شحن بديل الطلب ${shipment.return.order.orderNumber} عبر ${carrier}. رقم التتبع: ${trackingNumber}.`,
          },
          delivered: {
            en: `Your replacement for order ${shipment.return.order.orderNumber} was delivered.`,
            ar: `تم تسليم بديل الطلب ${shipment.return.order.orderNumber}.`,
          },
          cancelled: {
            en: `The replacement for order ${shipment.return.order.orderNumber} was cancelled before shipment.`,
            ar: `تم إلغاء بديل الطلب ${shipment.return.order.orderNumber} قبل الشحن.`,
          },
        };
        await tx.notification.create({
          data: {
            userId: shipment.buyerId,
            title: 'Replacement updated',
            titleAr: 'تحديث المنتج البديل',
            message: messages[target].en,
            messageAr: messages[target].ar,
            type: 'order',
          },
        });

        return {
          action: input.action,
          shipmentId: shipment.id,
          status: target,
        };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5_000,
          timeout: 15_000,
        },
      ),
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof FulfillmentError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        {
          error: 'A replacement shipment already exists for this return.',
          code: 'REPLACEMENT_ALREADY_EXISTS',
        },
        { status: 409 },
      );
    }
    if (isSerializableConflict(error)) {
      return NextResponse.json(
        {
          error:
            'The fulfillment record changed while it was being updated. Reload and try again.',
          code: 'FULFILLMENT_CONFLICT',
        },
        { status: 409 },
      );
    }
    console.error('Fulfillment workspace PUT error:', error);
    return NextResponse.json(
      { error: 'The fulfillment operation could not be completed.' },
      { status: 500 },
    );
  }
}
