import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
  validateEnum,
  validatePagination,
} from '@/lib/security';

const RETURN_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'processing',
  'completed',
] as const;

const createSchema = z.object({
  orderId: z.string().min(1).max(64),
  productId: z.string().min(1).max(64),
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
  resolution: z.enum(['refund', 'exchange', 'store_credit']).default('refund'),
  evidencePhotos: z.array(z.string().trim().max(2_000)).max(10).default([]),
});

function parseArray(value: string | null): unknown[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function label(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function firstImage(images: string) {
  const parsed = parseArray(images);
  return typeof parsed[0] === 'string' ? parsed[0] : '/placeholder-product.svg';
}

const returnInclude = {
  order: { select: { orderNumber: true } },
  product: { select: { name: true, images: true } },
  buyer: { select: { name: true, email: true } },
  seller: { select: { name: true, email: true } },
} satisfies Prisma.ReturnInclude;

type ReturnWithRelations = Prisma.ReturnGetPayload<{
  include: typeof returnInclude;
}>;

function mapReturn(record: ReturnWithRelations) {
  return {
    id: record.id,
    orderId: record.orderId,
    orderNumber: record.order.orderNumber,
    productId: record.productId,
    productName: record.product.name,
    productImage: firstImage(record.product.images),
    quantity: record.quantity,
    refundAmount: Number(record.refundAmount),
    reason: record.reason,
    reasonLabel: label(record.reason),
    details: record.details || '',
    status: record.status,
    resolution: record.resolution,
    resolutionLabel: label(record.resolution),
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

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const statusRaw = searchParams.get('status');
    const status =
      statusRaw && statusRaw !== 'all'
        ? validateEnum(statusRaw, RETURN_STATUSES)
        : null;
    if (statusRaw && statusRaw !== 'all' && !status) {
      return NextResponse.json({ error: 'Invalid return status.' }, { status: 400 });
    }

    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      100,
    );
    const ownership: Prisma.ReturnWhereInput =
      auth.user.role === 'admin'
        ? {}
        : auth.user.role === 'seller'
          ? { sellerId: auth.user.id }
          : { buyerId: auth.user.id };
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
      returns: records.map(mapReturn),
      total,
      page,
      limit,
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
        const order = await tx.order.findFirst({
          where: {
            id: parsed.data.orderId,
            userId: auth.user.id,
            status: 'delivered',
          },
          include: {
            store: { select: { ownerId: true } },
            items: {
              where: { productId: parsed.data.productId },
              select: { productId: true, quantity: true, price: true },
            },
          },
        });

        if (!order || !order.store) {
          throw new Error('RETURN_ORDER_NOT_ELIGIBLE');
        }

        const orderedQuantity = order.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );
        if (orderedQuantity === 0) throw new Error('RETURN_PRODUCT_NOT_FOUND');

        const existingReturns = await tx.return.aggregate({
          where: {
            orderId: order.id,
            productId: parsed.data.productId,
            status: { in: ['pending', 'approved', 'processing', 'completed'] },
          },
          _sum: { quantity: true },
        });
        const alreadyRequested = existingReturns._sum.quantity || 0;
        if (alreadyRequested + parsed.data.quantity > orderedQuantity) {
          throw new Error('RETURN_QUANTITY_EXCEEDED');
        }

        const unitPrice = Number(order.items[0].price);
        const timeline = [
          {
            status: 'Return Requested',
            date: new Date().toISOString(),
            note: 'Buyer submitted return request',
          },
        ];

        return tx.return.create({
          data: {
            orderId: order.id,
            productId: parsed.data.productId,
            buyerId: auth.user.id,
            sellerId: order.store.ownerId,
            quantity: parsed.data.quantity,
            refundAmount: Math.round(unitPrice * parsed.data.quantity * 100) / 100,
            reason: parsed.data.reason,
            details: parsed.data.details || null,
            resolution: parsed.data.resolution,
            status: 'pending',
            evidencePhotos: JSON.stringify(parsed.data.evidencePhotos),
            timeline: JSON.stringify(timeline),
          },
          include: returnInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    return NextResponse.json(
      { return: mapReturn(created), message: 'Return request submitted.' },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'RETURN_ORDER_NOT_ELIGIBLE') {
      return NextResponse.json(
        { error: 'Only delivered orders owned by this account can be returned.' },
        { status: 409 },
      );
    }
    if (message === 'RETURN_PRODUCT_NOT_FOUND') {
      return NextResponse.json(
        { error: 'This product is not part of the order.' },
        { status: 404 },
      );
    }
    if (message === 'RETURN_QUANTITY_EXCEEDED') {
      return NextResponse.json(
        { error: 'The requested quantity exceeds the returnable quantity.' },
        { status: 409 },
      );
    }

    console.error('Returns POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create return request.' },
      { status: 500 },
    );
  }
}
