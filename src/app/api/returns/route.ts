import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser, type AuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { BASE_CURRENCY, centsToDecimal, fromCents, toCents } from '@/lib/money';
import {
  canCompleteReturn,
  canTransitionReturn,
  normalizeReturnStatus,
  OFFLINE_REFUND_STATUSES,
  RETURN_RESOLUTIONS,
  RETURN_STATUSES,
  resolutionRequiresOfflineRefund,
  type ReturnActorRole,
  type ReturnStatus,
} from '@/lib/return-lifecycle';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
  validatePagination,
} from '@/lib/security';

const ACTIVE_RETURN_STATUSES: ReturnStatus[] = [
  'pending',
  'approved',
  'processing',
  'completed',
];

const createSchema = z
  .object({
    orderItemId: z.string().min(1).max(64),
    quantity: z.number().int().min(1).max(100),
    reason: z.enum([
      'wrong_item',
      'defective',
      'not_as_described',
      'changed_mind',
      'damaged_shipping',
      'other',
    ]),
    details: z.string().trim().max(2_000).optional(),
    resolution: z.enum(RETURN_RESOLUTIONS).default('return_only'),
    evidencePhotos: z.array(z.string().trim().max(2_000)).max(10).default([]),
  })
  .strict();

const updateSchema = z
  .object({
    returnId: z.string().min(1).max(64),
    targetStatus: z.enum(['approved', 'rejected', 'processing', 'completed']).optional(),
    offlineRefundStatus: z.literal('confirmed').optional(),
    sellerNote: z.string().trim().max(1_000).optional(),
  })
  .strict()
  .refine(
    (value) => Boolean(value.targetStatus || value.offlineRefundStatus || value.sellerNote),
    { message: 'At least one return update is required.' },
  );

function parseArray(value: string | null): unknown[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
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

function label(value: string) {
  return value.replaceAll('_', ' ').replace(/\w/g, (letter) => letter.toUpperCase());
}

function firstImage(images: string) {
  const parsed = parseArray(images);
  return typeof parsed[0] === 'string' ? parsed[0] : '/placeholder-product.svg';
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

const returnInclude = {
  order: { select: { id: true, orderNumber: true, storeId: true } },
  orderItem: {
    include: {
      product: {
        select: { id: true, name: true, nameAr: true, images: true },
      },
      variant: {
        select: { id: true, sku: true, attributes: true },
      },
    },
  },
  product: { select: { id: true, name: true, nameAr: true, images: true } },
  buyer: { select: { id: true, name: true, email: true } },
  seller: { select: { id: true, name: true, email: true } },
} satisfies Prisma.ReturnInclude;

type ReturnWithRelations = Prisma.ReturnGetPayload<{
  include: typeof returnInclude;
}>;

function serializeReturn(record: ReturnWithRelations) {
  const product = record.orderItem?.product || record.product;
  const variant = record.orderItem?.variant;
  const unitPrice = Number(
    record.unitPrice ??
      record.orderItem?.price ??
      Number(record.refundAmount) / record.quantity,
  );
  const attributes = variant
    ? parseObject(variant.attributes)
    : parseObject(record.orderItem?.variation);

  return {
    id: record.id,
    orderId: record.orderId,
    orderItemId: record.orderItemId,
    orderNumber: record.order.orderNumber,
    productId: record.productId,
    variantId: record.variantId || record.orderItem?.variantId || null,
    sku: record.sku || variant?.sku || null,
    attributes,
    productName: product.name,
    productNameAr: product.nameAr,
    productImage: firstImage(product.images),
    quantity: record.quantity,
    unitPrice,
    referenceAmount: Number(record.refundAmount),
    refundAmount: Number(record.refundAmount),
    currency: record.currency,
    reason: record.reason,
    reasonLabel: label(record.reason),
    details: record.details || '',
    status: record.status,
    resolution: record.resolution,
    resolutionLabel: label(record.resolution),
    offlineRefundStatus: record.offlineRefundStatus,
    offlineRefundConfirmedAt:
      record.offlineRefundConfirmedAt?.toISOString() || null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    sellerName: record.seller.name || record.seller.email,
    sellerId: record.sellerId,
    buyerName: record.buyer.name || record.buyer.email,
    buyerId: record.buyerId,
    sellerNote: record.sellerNote || undefined,
    timeline: parseArray(record.timeline),
    evidencePhotos: parseArray(record.evidencePhotos),
  };
}

async function eligibleOrders(userId: string) {
  const orders = await db.order.findMany({
    where: { userId, status: 'delivered' },
    include: {
      store: { select: { id: true, name: true, nameAr: true } },
      items: {
        include: {
          product: {
            select: { id: true, name: true, nameAr: true, images: true },
          },
          variant: { select: { id: true, sku: true, attributes: true } },
          returns: {
            where: { status: { in: ACTIVE_RETURN_STATUSES } },
            select: { quantity: true },
          },
        },
      },
    },
    orderBy: { deliveredAt: 'desc' },
    take: 50,
  });

  return orders
    .map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      storeId: order.store?.id || '',
      storeName: order.store?.name || 'Store',
      deliveredAt: order.deliveredAt?.toISOString() || order.updatedAt.toISOString(),
      items: order.items
        .map((item) => {
          const alreadyRequested = item.returns.reduce(
            (sum, current) => sum + current.quantity,
            0,
          );
          const remainingQuantity = Math.max(0, item.quantity - alreadyRequested);
          return {
            orderItemId: item.id,
            productId: item.productId,
            variantId: item.variantId,
            sku: item.variant?.sku || null,
            attributes: item.variant
              ? parseObject(item.variant.attributes)
              : parseObject(item.variation),
            name: item.product.name,
            nameAr: item.product.nameAr,
            image: firstImage(item.product.images),
            unitPrice: Number(item.price),
            currency: item.currency,
            quantityPurchased: item.quantity,
            alreadyRequested,
            remainingQuantity,
          };
        })
        .filter((item) => item.remainingQuantity > 0),
    }))
    .filter((order) => order.items.length > 0);
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    if (searchParams.get('action') === 'eligible-orders') {
      if (auth.user.role === 'seller') {
        return NextResponse.json({ error: 'Buyer access is required.' }, { status: 403 });
      }
      return NextResponse.json({ orders: await eligibleOrders(auth.user.id) });
    }

    const statusRaw = searchParams.get('status');
    const status = statusRaw && statusRaw !== 'all'
      ? normalizeReturnStatus(statusRaw)
      : null;
    if (statusRaw && statusRaw !== 'all' && !status) {
      return NextResponse.json({ error: 'Invalid return status.' }, { status: 400 });
    }
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      100,
    );

    let ownership: Prisma.ReturnWhereInput = {};
    if (auth.user.role === 'buyer') {
      ownership = { buyerId: auth.user.id };
    } else if (auth.user.role === 'seller') {
      const storeIds = await accessibleStoreIds(auth.user);
      if (storeIds.length === 0) {
        return NextResponse.json({ returns: [], total: 0, page, limit });
      }
      ownership = { order: { storeId: { in: storeIds } } };
    }

    const where: Prisma.ReturnWhereInput = {
      AND: [ownership, ...(status ? [{ status }] : [])],
    };
    const [records, total] = await db.$transaction([
      db.return.findMany({
        where,
        include: returnInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.return.count({ where }),
    ]);

    return NextResponse.json({
      returns: records.map(serializeReturn),
      total,
      page,
      limit,
      statuses: RETURN_STATUSES,
      resolutions: RETURN_RESOLUTIONS,
      offlineRefundStatuses: OFFLINE_REFUND_STATUSES,
    });
  } catch (error) {
    console.error('Returns GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch returns.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;
  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Invalid request origin.' },
      { status: 403 },
    );
  }

  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;
  if (auth.user.role === 'seller') {
    return NextResponse.json({ error: 'Buyer access is required.' }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid return request.' }, { status: 400 });
  }

  try {
    const created = await db.$transaction(
      async (tx) => {
        const item = await tx.orderItem.findFirst({
          where: {
            id: parsed.data.orderItemId,
            order: { is: { userId: auth.user.id, status: 'delivered' } },
          },
          include: {
            order: { include: { store: { select: { ownerId: true } } } },
            product: { select: { id: true } },
            variant: { select: { id: true, sku: true } },
          },
        });
        if (!item || !item.order.store) {
          throw new Error('RETURN_ITEM_NOT_ELIGIBLE');
        }

        const existing = await tx.return.aggregate({
          where: {
            orderItemId: item.id,
            status: { in: ACTIVE_RETURN_STATUSES },
          },
          _sum: { quantity: true },
        });
        const alreadyRequested = existing._sum.quantity || 0;
        if (alreadyRequested + parsed.data.quantity > item.quantity) {
          throw new Error('RETURN_QUANTITY_EXCEEDED');
        }

        const unitPriceCents = toCents(item.price);
        const amountCents = unitPriceCents * parsed.data.quantity;
        const now = new Date().toISOString();
        return tx.return.create({
          data: {
            orderId: item.orderId,
            orderItemId: item.id,
            productId: item.productId,
            variantId: item.variantId,
            sku: item.variant?.sku || null,
            buyerId: auth.user.id,
            sellerId: item.order.store.ownerId,
            quantity: parsed.data.quantity,
            unitPrice: centsToDecimal(unitPriceCents),
            refundAmount: centsToDecimal(amountCents),
            currency: item.currency || BASE_CURRENCY,
            reason: parsed.data.reason,
            details: parsed.data.details || null,
            resolution: parsed.data.resolution,
            status: 'pending',
            offlineRefundStatus: 'not_required',
            evidencePhotos: JSON.stringify(parsed.data.evidencePhotos),
            timeline: JSON.stringify([
              {
                status: 'Return requested',
                date: now,
                note: 'Buyer submitted an exact order-line return request',
              },
            ]),
          },
          include: returnInclude,
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 15_000,
      },
    );

    return NextResponse.json(
      { return: serializeReturn(created), message: 'Return request submitted.' },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'RETURN_ITEM_NOT_ELIGIBLE') {
      return NextResponse.json(
        { error: 'Only an exact item from your delivered order can be returned.' },
        { status: 409 },
      );
    }
    if (message === 'RETURN_QUANTITY_EXCEEDED') {
      return NextResponse.json(
        { error: 'The requested quantity exceeds the remaining returnable quantity.' },
        { status: 409 },
      );
    }
    console.error('Returns POST error:', error);
    return NextResponse.json({ error: 'Failed to create return request.' }, { status: 500 });
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

  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;
  if (auth.user.role === 'buyer') {
    return NextResponse.json({ error: 'Seller access is required.' }, { status: 403 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid return update.' }, { status: 400 });
  }

  try {
    const storeIds = auth.user.role === 'admin' ? [] : await accessibleStoreIds(auth.user);
    const updated = await db.$transaction(
      async (tx) => {
        const record = await tx.return.findUnique({
          where: { id: parsed.data.returnId },
          include: returnInclude,
        });
        if (!record) throw new Error('RETURN_NOT_FOUND');
        if (
          auth.user.role !== 'admin' &&
          (!record.order.storeId || !storeIds.includes(record.order.storeId))
        ) {
          throw new Error('RETURN_FORBIDDEN');
        }

        const currentStatus = normalizeReturnStatus(record.status);
        if (!currentStatus) throw new Error('RETURN_STATUS_UNSUPPORTED');
        const actorRole: ReturnActorRole =
          auth.user.role === 'admin' ? 'admin' : 'seller';
        const targetStatus = parsed.data.targetStatus;
        if (
          targetStatus &&
          !canTransitionReturn(currentStatus, targetStatus, actorRole)
        ) {
          throw new Error('RETURN_TRANSITION_INVALID');
        }

        const effectiveStatus = targetStatus || currentStatus;
        let effectiveOfflineStatus = record.offlineRefundStatus;
        if (
          targetStatus === 'approved' &&
          resolutionRequiresOfflineRefund(record.resolution)
        ) {
          effectiveOfflineStatus = 'required';
        }
        if (targetStatus === 'rejected') {
          effectiveOfflineStatus = 'not_required';
        }
        if (parsed.data.offlineRefundStatus === 'confirmed') {
          if (!resolutionRequiresOfflineRefund(record.resolution)) {
            throw new Error('OFFLINE_REFUND_NOT_REQUIRED');
          }
          if (!['approved', 'processing'].includes(effectiveStatus)) {
            throw new Error('OFFLINE_REFUND_CONFIRMATION_INVALID');
          }
          effectiveOfflineStatus = 'confirmed';
        }
        if (
          targetStatus === 'completed' &&
          !canCompleteReturn(record.resolution, effectiveOfflineStatus)
        ) {
          throw new Error('OFFLINE_REFUND_CONFIRMATION_REQUIRED');
        }

        const timeline = parseArray(record.timeline);
        const now = new Date();
        if (targetStatus) {
          timeline.push({
            status: label(targetStatus),
            date: now.toISOString(),
            note:
              parsed.data.sellerNote ||
              `${actorRole} moved the return to ${targetStatus}`,
          });
        }
        if (parsed.data.offlineRefundStatus === 'confirmed') {
          timeline.push({
            status: 'Offline refund confirmed',
            date: now.toISOString(),
            note: parsed.data.sellerNote || 'Seller recorded the offline refund',
          });
        }

        const data: Prisma.ReturnUpdateManyMutationInput = {
          ...(targetStatus ? { status: targetStatus } : {}),
          ...(parsed.data.sellerNote !== undefined
            ? { sellerNote: parsed.data.sellerNote || null }
            : {}),
          offlineRefundStatus: effectiveOfflineStatus,
          timeline: JSON.stringify(timeline),
          ...(parsed.data.offlineRefundStatus === 'confirmed'
            ? {
                offlineRefundConfirmedAt: now,
                offlineRefundConfirmedBy: auth.user.id,
              }
            : {}),
        };

        const claimed = await tx.return.updateMany({
          where: {
            id: record.id,
            status: record.status,
            offlineRefundStatus: record.offlineRefundStatus,
          },
          data,
        });
        if (claimed.count !== 1) throw new Error('RETURN_CHANGED');

        await tx.notification.create({
          data: {
            userId: record.buyerId,
            title: 'Return updated',
            titleAr: 'تحديث طلب الإرجاع',
            message: targetStatus
              ? `Your return for order ${record.order.orderNumber} is now ${targetStatus}.`
              : `The offline refund for order ${record.order.orderNumber} was confirmed.`,
            messageAr: targetStatus
              ? `أصبح طلب الإرجاع للطلب ${record.order.orderNumber} بحالة ${targetStatus}.`
              : `تم تأكيد الاسترداد خارج المنصة للطلب ${record.order.orderNumber}.`,
            type: 'order',
          },
        });

        const refreshed = await tx.return.findUnique({
          where: { id: record.id },
          include: returnInclude,
        });
        if (!refreshed) throw new Error('RETURN_NOT_FOUND');
        return refreshed;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 15_000,
      },
    );

    return NextResponse.json({ success: true, return: serializeReturn(updated) });
  } catch (error) {
    const code = error instanceof Error ? error.message : '';
    const known: Record<string, { status: number; error: string }> = {
      RETURN_NOT_FOUND: { status: 404, error: 'Return request not found.' },
      RETURN_FORBIDDEN: { status: 403, error: 'This return belongs to another store.' },
      RETURN_STATUS_UNSUPPORTED: { status: 409, error: 'This return has an unsupported status.' },
      RETURN_TRANSITION_INVALID: { status: 409, error: 'That return status transition is not allowed.' },
      RETURN_CHANGED: { status: 409, error: 'The return changed while it was being updated.' },
      OFFLINE_REFUND_NOT_REQUIRED: { status: 409, error: 'This return does not require an offline refund.' },
      OFFLINE_REFUND_CONFIRMATION_INVALID: { status: 409, error: 'The offline refund cannot be confirmed in this state.' },
      OFFLINE_REFUND_CONFIRMATION_REQUIRED: { status: 409, error: 'Confirm the offline refund before completing this return.' },
    };
    if (known[code]) {
      return NextResponse.json(
        { error: known[code].error, code },
        { status: known[code].status },
      );
    }
    console.error('Returns PUT error:', error);
    return NextResponse.json({ error: 'Failed to update return request.' }, { status: 500 });
  }
}
