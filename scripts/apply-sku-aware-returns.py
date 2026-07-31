from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.rstrip() + "\n", encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    count = content.count(old)
    if count != 1:
        raise RuntimeError(
            f"Expected one match in {path}, found {count}: {old[:140]!r}"
        )
    write(path, content.replace(old, new, 1))


replace_once(
    "prisma/schema.prisma",
    '''  order   Order           @relation(fields: [orderId], references: [id])
  product Product         @relation(fields: [productId], references: [id])
  variant ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)

  @@index([variantId])
}''',
    '''  order   Order           @relation(fields: [orderId], references: [id])
  product Product         @relation(fields: [productId], references: [id])
  variant ProductVariant? @relation(fields: [variantId], references: [id], onDelete: SetNull)
  returns Return[]

  @@index([variantId])
}''',
)

replace_once(
    "prisma/schema.prisma",
    '''model Return {
  id             String   @id @default(cuid())
  orderId        String
  productId      String
  buyerId        String
  sellerId       String
  quantity       Int
  refundAmount   Float
  reason         String   @default("other") // wrong_item, defective, not_as_described, changed_mind, damaged_shipping, other
  details        String?
  resolution     String   @default("refund") // refund, exchange, store_credit
  status         String   @default("pending") // pending, approved, rejected, processing, completed
  sellerNote     String?
  evidencePhotos String   @default("[]") // JSON array
  timeline       String   @default("[]") // JSON array of {status, date, note}
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  order   Order   @relation(fields: [orderId], references: [id])
  product Product @relation(fields: [productId], references: [id])
  buyer   User    @relation("ReturnBuyer", fields: [buyerId], references: [id])
  seller  User    @relation("ReturnSeller", fields: [sellerId], references: [id])

  @@index([buyerId, status])
  @@index([sellerId, status])
}''',
    '''model Return {
  id                       String    @id @default(cuid())
  orderId                  String
  orderItemId              String?
  productId                String
  variantId                String?
  sku                      String?
  buyerId                  String
  sellerId                 String
  quantity                 Int
  unitPrice                Float?
  refundAmount             Float
  reason                   String    @default("other") // wrong_item, defective, not_as_described, changed_mind, damaged_shipping, other
  details                  String?
  resolution               String    @default("return_only") // return_only, exchange, offline_refund
  status                   String    @default("pending") // pending, approved, rejected, processing, completed
  offlineRefundStatus      String    @default("not_required") // not_required, required, confirmed
  offlineRefundConfirmedAt DateTime?
  offlineRefundConfirmedBy String?
  sellerNote               String?
  evidencePhotos           String    @default("[]") // JSON array
  timeline                 String    @default("[]") // JSON array of {status, date, note}
  createdAt                DateTime  @default(now())
  updatedAt                DateTime  @updatedAt

  order     Order      @relation(fields: [orderId], references: [id])
  orderItem OrderItem? @relation(fields: [orderItemId], references: [id], onDelete: SetNull)
  product   Product    @relation(fields: [productId], references: [id])
  buyer     User       @relation("ReturnBuyer", fields: [buyerId], references: [id])
  seller    User       @relation("ReturnSeller", fields: [sellerId], references: [id])

  @@index([buyerId, status])
  @@index([sellerId, status])
  @@index([orderItemId, status])
}''',
)

write(
    "prisma/migrations/zzz_sku_aware_returns_20260801/migration.sql",
    '''ALTER TABLE "Return"
  ADD COLUMN "orderItemId" TEXT,
  ADD COLUMN "variantId" TEXT,
  ADD COLUMN "sku" TEXT,
  ADD COLUMN "unitPrice" DOUBLE PRECISION,
  ADD COLUMN "offlineRefundStatus" TEXT NOT NULL DEFAULT 'not_required',
  ADD COLUMN "offlineRefundConfirmedAt" TIMESTAMP(3),
  ADD COLUMN "offlineRefundConfirmedBy" TEXT;

UPDATE "Return" AS r
SET
  "orderItemId" = (
    SELECT oi."id"
    FROM "OrderItem" AS oi
    WHERE oi."orderId" = r."orderId"
      AND oi."productId" = r."productId"
    ORDER BY oi."id"
    LIMIT 1
  ),
  "variantId" = (
    SELECT oi."variantId"
    FROM "OrderItem" AS oi
    WHERE oi."orderId" = r."orderId"
      AND oi."productId" = r."productId"
    ORDER BY oi."id"
    LIMIT 1
  ),
  "unitPrice" = (
    SELECT oi."price"
    FROM "OrderItem" AS oi
    WHERE oi."orderId" = r."orderId"
      AND oi."productId" = r."productId"
    ORDER BY oi."id"
    LIMIT 1
  ),
  "sku" = (
    SELECT pv."sku"
    FROM "OrderItem" AS oi
    LEFT JOIN "ProductVariant" AS pv ON pv."id" = oi."variantId"
    WHERE oi."orderId" = r."orderId"
      AND oi."productId" = r."productId"
    ORDER BY oi."id"
    LIMIT 1
  );

UPDATE "Return"
SET "resolution" = CASE
  WHEN "resolution" = 'refund' THEN 'offline_refund'
  WHEN "resolution" = 'store_credit' THEN 'return_only'
  ELSE "resolution"
END;

UPDATE "Return"
SET "offlineRefundStatus" = CASE
  WHEN "resolution" = 'offline_refund'
    AND "status" IN ('approved', 'processing', 'completed')
    THEN 'required'
  ELSE 'not_required'
END;

ALTER TABLE "Return"
  ADD CONSTRAINT "Return_orderItemId_fkey"
  FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Return_orderItemId_status_idx"
  ON "Return"("orderItemId", "status");''',
)

write(
    "src/lib/return-lifecycle.ts",
    '''export const RETURN_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'processing',
  'completed',
] as const;

export const RETURN_RESOLUTIONS = [
  'return_only',
  'exchange',
  'offline_refund',
] as const;

export const OFFLINE_REFUND_STATUSES = [
  'not_required',
  'required',
  'confirmed',
] as const;

export type ReturnStatus = (typeof RETURN_STATUSES)[number];
export type ReturnResolution = (typeof RETURN_RESOLUTIONS)[number];
export type OfflineRefundStatus = (typeof OFFLINE_REFUND_STATUSES)[number];
export type ReturnActorRole = 'seller' | 'admin';

const TRANSITIONS: Record<
  ReturnStatus,
  Partial<Record<ReturnActorRole, readonly ReturnStatus[]>>
> = {
  pending: {
    seller: ['approved', 'rejected'],
    admin: ['approved', 'rejected'],
  },
  approved: {
    seller: ['processing'],
    admin: ['processing'],
  },
  rejected: {},
  processing: {
    seller: ['completed'],
    admin: ['completed'],
  },
  completed: {},
};

export function normalizeReturnStatus(value: string): ReturnStatus | null {
  return RETURN_STATUSES.includes(value as ReturnStatus)
    ? (value as ReturnStatus)
    : null;
}

export function canTransitionReturn(
  current: string,
  target: string,
  actorRole: ReturnActorRole,
): boolean {
  const normalized = normalizeReturnStatus(current);
  if (!normalized) return false;
  return (TRANSITIONS[normalized][actorRole] || []).includes(
    target as ReturnStatus,
  );
}

export function resolutionRequiresOfflineRefund(
  resolution: string,
): boolean {
  return resolution === 'offline_refund';
}

export function canCompleteReturn(
  resolution: string,
  offlineRefundStatus: string,
): boolean {
  return (
    !resolutionRequiresOfflineRefund(resolution) ||
    offlineRefundStatus === 'confirmed'
  );
}''',
)

write(
    "src/lib/return-lifecycle.test.ts",
    '''import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canCompleteReturn,
  canTransitionReturn,
  normalizeReturnStatus,
  resolutionRequiresOfflineRefund,
} from './return-lifecycle.ts';

test('return transitions follow the controlled seller workflow', () => {
  assert.equal(canTransitionReturn('pending', 'approved', 'seller'), true);
  assert.equal(canTransitionReturn('pending', 'rejected', 'seller'), true);
  assert.equal(canTransitionReturn('approved', 'processing', 'seller'), true);
  assert.equal(canTransitionReturn('processing', 'completed', 'seller'), true);
  assert.equal(canTransitionReturn('completed', 'processing', 'seller'), false);
  assert.equal(canTransitionReturn('pending', 'completed', 'admin'), false);
});

test('offline refunds must be manually confirmed before completion', () => {
  assert.equal(resolutionRequiresOfflineRefund('offline_refund'), true);
  assert.equal(resolutionRequiresOfflineRefund('exchange'), false);
  assert.equal(canCompleteReturn('offline_refund', 'required'), false);
  assert.equal(canCompleteReturn('offline_refund', 'confirmed'), true);
  assert.equal(canCompleteReturn('return_only', 'not_required'), true);
});

test('unknown return statuses are rejected', () => {
  assert.equal(normalizeReturnStatus('pending'), 'pending');
  assert.equal(normalizeReturnStatus('refunded'), null);
});''',
)

write(
    "src/app/api/returns/route.ts",
    '''import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser, type AuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
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
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
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
    record.unitPrice ?? record.orderItem?.price ?? record.refundAmount / record.quantity,
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

        const unitPrice = Number(item.price);
        const amount = Math.round(unitPrice * parsed.data.quantity * 100) / 100;
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
            unitPrice,
            refundAmount: amount,
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
}''',
)

write(
    "src/components/buyer/returns-page.tsx",
    ''''use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Banknote,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice } from '@/lib/currency';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';

type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
type ReturnResolution = 'return_only' | 'exchange' | 'offline_refund';

type TimelineEntry = { status: string; date: string; note?: string };

interface ReturnRecord {
  id: string;
  orderNumber: string;
  orderItemId: string | null;
  productName: string;
  productNameAr?: string | null;
  sku: string | null;
  attributes: Record<string, string>;
  quantity: number;
  unitPrice: number;
  referenceAmount: number;
  reasonLabel: string;
  details: string;
  status: ReturnStatus;
  resolution: ReturnResolution;
  resolutionLabel: string;
  offlineRefundStatus: 'not_required' | 'required' | 'confirmed';
  sellerName: string;
  sellerNote?: string;
  createdAt: string;
  timeline: TimelineEntry[];
}

interface EligibleItem {
  orderItemId: string;
  productId: string;
  variantId: string | null;
  sku: string | null;
  attributes: Record<string, string>;
  name: string;
  nameAr?: string | null;
  unitPrice: number;
  quantityPurchased: number;
  alreadyRequested: number;
  remainingQuantity: number;
}

interface EligibleOrder {
  id: string;
  orderNumber: string;
  storeName: string;
  deliveredAt: string;
  items: EligibleItem[];
}

const STATUS_STYLE: Record<ReturnStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
};

const REASONS = [
  ['wrong_item', 'Wrong item', 'منتج خاطئ'],
  ['defective', 'Defective', 'معيب'],
  ['not_as_described', 'Not as described', 'غير مطابق للوصف'],
  ['changed_mind', 'Changed mind', 'تغيير الرأي'],
  ['damaged_shipping', 'Damaged in shipping', 'تالف أثناء الشحن'],
  ['other', 'Other', 'أخرى'],
] as const;

const RESOLUTIONS = [
  ['return_only', 'Return only', 'إرجاع فقط'],
  ['exchange', 'Exchange', 'استبدال'],
  ['offline_refund', 'Offline refund', 'استرداد خارج المنصة'],
] as const;

function Attributes({ values }: { values: Record<string, string> }) {
  const entries = Object.entries(values);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([key, value]) => (
        <Badge key={key} variant="outline" className="text-[10px]">
          {key}: {value}
        </Badge>
      ))}
    </div>
  );
}

export function ReturnsPage() {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  const [view, setView] = useState<'history' | 'request'>('history');
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [eligibleOrders, setEligibleOrders] = useState<EligibleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [orderItemId, setOrderItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [resolution, setResolution] = useState<ReturnResolution>('return_only');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReturns = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      const response = await fetch(`/api/returns${query}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to load returns.');
      setReturns(payload.returns || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load returns.');
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadEligible = useCallback(async () => {
    setEligibleLoading(true);
    try {
      const response = await fetch('/api/returns?action=eligible-orders', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to load eligible items.');
      setEligibleOrders(payload.orders || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load eligible items.');
      setEligibleOrders([]);
    } finally {
      setEligibleLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReturns(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReturns]);

  useEffect(() => {
    if (view !== 'request') return;
    const timer = window.setTimeout(() => void loadEligible(), 0);
    return () => window.clearTimeout(timer);
  }, [loadEligible, view]);

  const selectedItem = useMemo(() => {
    for (const order of eligibleOrders) {
      const item = order.items.find((current) => current.orderItemId === orderItemId);
      if (item) return { order, item };
    }
    return null;
  }, [eligibleOrders, orderItemId]);

  const filteredReturns = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return returns;
    return returns.filter((record) =>
      [record.orderNumber, record.productName, record.sellerName, record.sku || '']
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [returns, search]);

  async function submitReturn() {
    if (!selectedItem || !reason) {
      toast.error(isRTL ? 'اختر عنصر الطلب والسبب.' : 'Choose an order item and reason.');
      return;
    }
    if (quantity < 1 || quantity > selectedItem.item.remainingQuantity) {
      toast.error(isRTL ? 'الكمية غير صالحة.' : 'The return quantity is invalid.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderItemId: selectedItem.item.orderItemId,
          quantity,
          reason,
          resolution,
          details: details || undefined,
          evidencePhotos: [],
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to submit return.');
      toast.success(isRTL ? 'تم إرسال طلب الإرجاع.' : 'Return request submitted.');
      setOrderItemId('');
      setQuantity(1);
      setReason('');
      setResolution('return_only');
      setDetails('');
      setView('history');
      await loadReturns();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit return.');
    } finally {
      setSubmitting(false);
    }
  }

  const date = (value: string) =>
    new Date(value).toLocaleDateString(getLocale(isRTL), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="container mx-auto space-y-5 px-4 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <RotateCcw className="size-6 text-amber-600" />
            {isRTL ? 'الإرجاعات والاستبدالات' : 'Returns & exchanges'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRTL
              ? 'كل طلب مرتبط بعنصر وSKU محدد من الطلب الأصلي.'
              : 'Every request is tied to one exact order line and SKU.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'history' ? 'default' : 'outline'}
            className={view === 'history' ? 'bg-amber-600 text-white hover:bg-amber-700' : ''}
            onClick={() => setView('history')}
          >
            <Clock className="me-2 size-4" />
            {isRTL ? 'طلباتي' : 'My requests'}
          </Button>
          <Button
            variant={view === 'request' ? 'default' : 'outline'}
            className={view === 'request' ? 'bg-amber-600 text-white hover:bg-amber-700' : ''}
            onClick={() => setView('request')}
          >
            <RotateCcw className="me-2 size-4" />
            {isRTL ? 'طلب جديد' : 'New request'}
          </Button>
        </div>
      </div>

      {view === 'history' ? (
        <>
          <Card>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={isRTL ? 'بحث بالطلب أو المنتج أو SKU' : 'Search order, product, or SKU'}
                  className="ps-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? 'كل الحالات' : 'All statuses'}</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex h-52 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-amber-600" />
            </div>
          ) : filteredReturns.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">
              <Package className="mx-auto mb-3 size-10 opacity-40" />
              {isRTL ? 'لا توجد طلبات إرجاع.' : 'No return requests found.'}
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredReturns.map((record) => (
                <Card key={record.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">
                          {isRTL && record.productNameAr ? record.productNameAr : record.productName}
                        </CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {record.orderNumber} · {record.sellerName} · {date(record.createdAt)}
                        </p>
                      </div>
                      <Badge className={STATUS_STYLE[record.status]}>{record.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {record.sku && <Badge variant="outline">SKU: {record.sku}</Badge>}
                      <Badge variant="outline">{record.resolutionLabel}</Badge>
                      <span>{isRTL ? 'الكمية' : 'Qty'}: {record.quantity}</span>
                    </div>
                    <Attributes values={record.attributes} />
                    <div className="grid gap-3 rounded-xl bg-muted/40 p-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {isRTL ? 'المبلغ المرجعي' : 'Reference amount'}
                        </p>
                        <p className="font-semibold">{formatPrice(record.referenceAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {isRTL ? 'حالة الاسترداد خارج المنصة' : 'Offline refund status'}
                        </p>
                        <p className="font-medium">{record.offlineRefundStatus.replaceAll('_', ' ')}</p>
                      </div>
                    </div>
                    {record.resolution === 'offline_refund' && (
                      <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                        <Banknote className="mt-0.5 size-4 shrink-0" />
                        {isRTL
                          ? 'لا ينقل NexaMart الأموال. يؤكد البائع هنا فقط أن الاسترداد تم خارج المنصة.'
                          : 'NexaMart does not move money. The seller only records here when the refund was completed outside the platform.'}
                      </div>
                    )}
                    {record.sellerNote && (
                      <p className="rounded-lg border p-3 text-sm">{record.sellerNote}</p>
                    )}
                    {record.timeline.length > 0 && (
                      <div className="space-y-2 border-t pt-3">
                        {record.timeline.map((entry, index) => (
                          <div key={`${entry.date}-${index}`} className="flex gap-2 text-sm">
                            {record.status === 'rejected' && index === record.timeline.length - 1
                              ? <XCircle className="mt-0.5 size-4 text-red-500" />
                              : <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" />}
                            <div>
                              <p className="font-medium">{entry.status}</p>
                              <p className="text-xs text-muted-foreground">{date(entry.date)}</p>
                              {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? 'طلب إرجاع لعنصر محدد' : 'Request an exact order item return'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {eligibleLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="size-7 animate-spin text-amber-600" />
              </div>
            ) : eligibleOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                {isRTL ? 'لا توجد عناصر مسلّمة قابلة للإرجاع.' : 'No delivered items are currently returnable.'}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>{isRTL ? 'عنصر الطلب' : 'Order item'}</Label>
                  <Select
                    value={orderItemId}
                    onValueChange={(value) => {
                      setOrderItemId(value);
                      setQuantity(1);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر عنصراً' : 'Select an item'} /></SelectTrigger>
                    <SelectContent>
                      {eligibleOrders.flatMap((order) =>
                        order.items.map((item) => (
                          <SelectItem key={item.orderItemId} value={item.orderItemId}>
                            {order.orderNumber} · {isRTL && item.nameAr ? item.nameAr : item.name}
                            {item.sku ? ` · ${item.sku}` : ''} · {item.remainingQuantity} left
                          </SelectItem>
                        )),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedItem && (
                  <div className="space-y-3 rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          {isRTL && selectedItem.item.nameAr
                            ? selectedItem.item.nameAr
                            : selectedItem.item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedItem.order.orderNumber} · {selectedItem.order.storeName}
                        </p>
                      </div>
                      {selectedItem.item.sku && (
                        <Badge variant="outline">SKU: {selectedItem.item.sku}</Badge>
                      )}
                    </div>
                    <Attributes values={selectedItem.item.attributes} />
                    <p className="text-sm">
                      {isRTL ? 'المتاح للإرجاع' : 'Remaining returnable'}:{' '}
                      <strong>{selectedItem.item.remainingQuantity}</strong>
                    </p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{isRTL ? 'الكمية' : 'Quantity'}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={selectedItem?.item.remainingQuantity || 1}
                      value={quantity}
                      onChange={(event) => setQuantity(Number(event.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRTL ? 'السبب' : 'Reason'}</Label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر السبب' : 'Select reason'} /></SelectTrigger>
                      <SelectContent>
                        {REASONS.map(([value, en, ar]) => (
                          <SelectItem key={value} value={value}>{isRTL ? ar : en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{isRTL ? 'الحل المطلوب' : 'Requested resolution'}</Label>
                  <Select value={resolution} onValueChange={(value) => setResolution(value as ReturnResolution)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RESOLUTIONS.map(([value, en, ar]) => (
                        <SelectItem key={value} value={value}>{isRTL ? ar : en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{isRTL ? 'تفاصيل إضافية' : 'Additional details'}</Label>
                  <Textarea rows={4} value={details} onChange={(event) => setDetails(event.target.value)} />
                </div>

                {selectedItem && (
                  <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {resolution === 'offline_refund'
                          ? (isRTL ? 'مبلغ الاسترداد المرجعي' : 'Reference offline-refund amount')
                          : (isRTL ? 'قيمة العنصر المرجعية' : 'Reference item value')}
                      </p>
                      <p className="text-lg font-bold">
                        {formatPrice(selectedItem.item.unitPrice * quantity)}
                      </p>
                    </div>
                    <Button
                      onClick={() => void submitReturn()}
                      disabled={submitting || !reason || !orderItemId}
                      className="bg-amber-600 text-white hover:bg-amber-700"
                    >
                      {submitting ? <Loader2 className="me-2 size-4 animate-spin" /> : <ArrowRightLeft className="me-2 size-4" />}
                      {isRTL ? 'إرسال الطلب' : 'Submit request'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}''',
)

write(
    "src/components/seller/seller-returns.tsx",
    ''''use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  RotateCcw,
  Search,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice } from '@/lib/currency';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';

type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';

type TimelineEntry = { status: string; date: string; note?: string };

interface ReturnRecord {
  id: string;
  orderNumber: string;
  productName: string;
  productNameAr?: string | null;
  sku: string | null;
  attributes: Record<string, string>;
  quantity: number;
  referenceAmount: number;
  reasonLabel: string;
  details: string;
  status: ReturnStatus;
  resolution: 'return_only' | 'exchange' | 'offline_refund';
  resolutionLabel: string;
  offlineRefundStatus: 'not_required' | 'required' | 'confirmed';
  buyerName: string;
  sellerNote?: string;
  createdAt: string;
  timeline: TimelineEntry[];
}

const STATUS_STYLE: Record<ReturnStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
};

function Attributes({ values }: { values: Record<string, string> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(values).map(([key, value]) => (
        <Badge key={key} variant="outline" className="text-[10px]">
          {key}: {value}
        </Badge>
      ))}
    </div>
  );
}

export function SellerReturns() {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sellerNote, setSellerNote] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadReturns = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      const response = await fetch(`/api/returns${query}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to load returns.');
      setReturns(payload.returns || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load returns.');
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReturns(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReturns]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return returns;
    return returns.filter((record) =>
      [record.orderNumber, record.productName, record.buyerName, record.sku || '']
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [returns, search]);

  async function updateReturn(
    record: ReturnRecord,
    update: {
      targetStatus?: 'approved' | 'rejected' | 'processing' | 'completed';
      offlineRefundStatus?: 'confirmed';
    },
  ) {
    setSavingId(record.id);
    try {
      const response = await fetch('/api/returns', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnId: record.id,
          ...update,
          sellerNote: sellerNote || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to update return.');
      setReturns((current) =>
        current.map((item) => (item.id === record.id ? payload.return : item)),
      );
      setSellerNote('');
      toast.success(isRTL ? 'تم تحديث طلب الإرجاع.' : 'Return request updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update return.');
    } finally {
      setSavingId(null);
    }
  }

  const date = (value: string) =>
    new Date(value).toLocaleDateString(getLocale(isRTL), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="space-y-5 p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <RotateCcw className="size-5 text-amber-600" />
          {isRTL ? 'إدارة الإرجاعات والاستبدالات' : 'Returns & exchanges'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRTL
            ? 'طلبات حقيقية مرتبطة بعنصر الطلب وSKU المحدد.'
            : 'Real requests tied to the exact purchased order item and SKU.'}
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={isRTL ? 'بحث بالطلب أو المشتري أو SKU' : 'Search order, buyer, or SKU'}
              className="ps-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? 'كل الحالات' : 'All statuses'}</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-amber-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <Package className="mx-auto mb-3 size-10 opacity-40" />
          {isRTL ? 'لا توجد طلبات إرجاع.' : 'No return requests found.'}
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((record) => {
            const expanded = expandedId === record.id;
            const busy = savingId === record.id;
            const needsRefundConfirmation =
              record.resolution === 'offline_refund' &&
              record.offlineRefundStatus !== 'confirmed';
            return (
              <Card key={record.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {isRTL && record.productNameAr ? record.productNameAr : record.productName}
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {record.orderNumber} · {record.buyerName} · {date(record.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_STYLE[record.status]}>{record.status}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setExpandedId(expanded ? null : record.id);
                          setSellerNote(record.sellerNote || '');
                        }}
                      >
                        {expanded ? (isRTL ? 'إغلاق' : 'Close') : (isRTL ? 'مراجعة' : 'Review')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {record.sku && <Badge variant="outline">SKU: {record.sku}</Badge>}
                    <Badge variant="outline">{record.resolutionLabel}</Badge>
                    <span>{isRTL ? 'الكمية' : 'Qty'}: {record.quantity}</span>
                    <span className="font-semibold">{formatPrice(record.referenceAmount)}</span>
                  </div>
                  <Attributes values={record.attributes} />

                  {expanded && (
                    <div className="space-y-4 border-t pt-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground">{isRTL ? 'السبب' : 'Reason'}</p>
                          <p className="font-medium">{record.reasonLabel}</p>
                          {record.details && <p className="mt-1 text-sm text-muted-foreground">{record.details}</p>}
                        </div>
                        <div className="rounded-lg bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground">
                            {isRTL ? 'حالة الاسترداد خارج المنصة' : 'Offline refund status'}
                          </p>
                          <p className="font-medium">{record.offlineRefundStatus.replaceAll('_', ' ')}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>{isRTL ? 'ملاحظة للبائع' : 'Seller note'}</Label>
                        <Textarea
                          rows={3}
                          value={sellerNote}
                          onChange={(event) => setSellerNote(event.target.value)}
                          placeholder={isRTL ? 'أضف تعليمات أو سبب القرار' : 'Add instructions or decision reason'}
                        />
                      </div>

                      {record.resolution === 'offline_refund' && (
                        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                          <Banknote className="mt-0.5 size-4 shrink-0" />
                          {isRTL
                            ? 'أكّد الاسترداد فقط بعد إتمامه فعلياً خارج NexaMart.'
                            : 'Confirm the refund only after it was actually completed outside NexaMart.'}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {record.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => void updateReturn(record, { targetStatus: 'approved' })}
                              disabled={busy}
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              {busy ? <Loader2 className="me-2 size-4 animate-spin" /> : <CheckCircle2 className="me-2 size-4" />}
                              {isRTL ? 'قبول' : 'Approve'}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => void updateReturn(record, { targetStatus: 'rejected' })}
                              disabled={busy}
                            >
                              <XCircle className="me-2 size-4" />
                              {isRTL ? 'رفض' : 'Reject'}
                            </Button>
                          </>
                        )}
                        {record.status === 'approved' && (
                          <Button
                            onClick={() => void updateReturn(record, { targetStatus: 'processing' })}
                            disabled={busy}
                            className="bg-amber-600 text-white hover:bg-amber-700"
                          >
                            {busy ? <Loader2 className="me-2 size-4 animate-spin" /> : <Clock className="me-2 size-4" />}
                            {isRTL ? 'بدء المعالجة' : 'Start processing'}
                          </Button>
                        )}
                        {record.status === 'processing' && record.resolution === 'offline_refund' && needsRefundConfirmation && (
                          <Button
                            variant="outline"
                            onClick={() => void updateReturn(record, { offlineRefundStatus: 'confirmed' })}
                            disabled={busy}
                          >
                            <Banknote className="me-2 size-4" />
                            {isRTL ? 'تأكيد الاسترداد خارج المنصة' : 'Confirm offline refund'}
                          </Button>
                        )}
                        {record.status === 'processing' && (
                          <Button
                            onClick={() => void updateReturn(record, { targetStatus: 'completed' })}
                            disabled={busy || needsRefundConfirmation}
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            {busy ? <Loader2 className="me-2 size-4 animate-spin" /> : <CheckCircle2 className="me-2 size-4" />}
                            {isRTL ? 'إكمال الطلب' : 'Complete request'}
                          </Button>
                        )}
                      </div>

                      {record.timeline.length > 0 && (
                        <div className="space-y-2 border-t pt-3">
                          {record.timeline.map((entry, index) => (
                            <div key={`${entry.date}-${index}`} className="flex gap-2 text-sm">
                              <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" />
                              <div>
                                <p className="font-medium">{entry.status}</p>
                                <p className="text-xs text-muted-foreground">{date(entry.date)}</p>
                                {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}''',
)

write(
    "scripts/verify-return-lifecycle.ts",
    '''import { PrismaClient } from '@prisma/client';

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
  });''',
)

print('SKU-aware return lifecycle changes applied successfully.')
