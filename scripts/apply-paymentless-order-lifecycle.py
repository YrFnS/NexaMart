from __future__ import annotations

import re
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(textwrap.dedent(content).lstrip().rstrip() + "\n", encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one match in {path}, found {count}: {old[:120]!r}")
    write(path, content.replace(old, new, 1))


def replace_all(path: str, old: str, new: str, minimum: int = 1) -> None:
    content = read(path)
    count = content.count(old)
    if count < minimum:
        raise RuntimeError(f"Expected at least {minimum} matches in {path}, found {count}: {old[:120]!r}")
    write(path, content.replace(old, new))


def regex_once(path: str, pattern: str, replacement: str, flags: int = 0) -> None:
    content = read(path)
    updated, count = re.subn(pattern, replacement, content, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(f"Expected one regex match in {path}, found {count}: {pattern[:120]!r}")
    write(path, updated)


# ---------------------------------------------------------------------------
# Database model and migration
# ---------------------------------------------------------------------------
replace_once(
    "prisma/schema.prisma",
    '''  trackingNumber  String?
  carrier         String?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
''',
    '''  trackingNumber       String?
  carrier              String?
  notes                String?
  confirmationExpiresAt DateTime?
  confirmedAt          DateTime?
  preparingAt          DateTime?
  shippedAt            DateTime?
  deliveredAt          DateTime?
  cancelledAt          DateTime?
  rejectedAt           DateTime?
  cancelledBy          String?
  cancellationReason   String?
  inventoryRestoredAt  DateTime?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
''',
)
replace_once(
    "prisma/schema.prisma",
    '''  items    OrderItem[]
  returns  Return[]
  invoices Invoice[]
  disputes Dispute[]

  @@unique([idempotencyKey, storeId])
  @@index([userId, createdAt])
''',
    '''  items        OrderItem[]
  returns      Return[]
  invoices     Invoice[]
  disputes     Dispute[]
  statusEvents OrderStatusEvent[]

  @@unique([idempotencyKey, storeId])
  @@index([userId, createdAt])
  @@index([status, confirmationExpiresAt])
''',
)
regex_once(
    "prisma/schema.prisma",
    r'(model OrderItem \{.*?\n\}\n)\nmodel Review',
    r'''\1
model OrderStatusEvent {
  id         String   @id @default(cuid())
  orderId    String
  fromStatus String?
  toStatus   String
  actorId    String
  actorRole  String
  note       String?
  createdAt  DateTime @default(now())

  order Order @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@index([orderId, createdAt])
}

model Review''',
    re.S,
)

write(
    "prisma/migrations/zz_paymentless_order_lifecycle_20260801/migration.sql",
    r'''
    ALTER TABLE "Order"
      ADD COLUMN "confirmationExpiresAt" TIMESTAMP(3),
      ADD COLUMN "confirmedAt" TIMESTAMP(3),
      ADD COLUMN "preparingAt" TIMESTAMP(3),
      ADD COLUMN "shippedAt" TIMESTAMP(3),
      ADD COLUMN "deliveredAt" TIMESTAMP(3),
      ADD COLUMN "cancelledAt" TIMESTAMP(3),
      ADD COLUMN "rejectedAt" TIMESTAMP(3),
      ADD COLUMN "cancelledBy" TEXT,
      ADD COLUMN "cancellationReason" TEXT,
      ADD COLUMN "inventoryRestoredAt" TIMESTAMP(3);

    CREATE TABLE "OrderStatusEvent" (
      "id" TEXT NOT NULL,
      "orderId" TEXT NOT NULL,
      "fromStatus" TEXT,
      "toStatus" TEXT NOT NULL,
      "actorId" TEXT NOT NULL,
      "actorRole" TEXT NOT NULL,
      "note" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "OrderStatusEvent_pkey" PRIMARY KEY ("id")
    );

    ALTER TABLE "OrderStatusEvent"
      ADD CONSTRAINT "OrderStatusEvent_orderId_fkey"
      FOREIGN KEY ("orderId") REFERENCES "Order"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;

    CREATE INDEX "OrderStatusEvent_orderId_createdAt_idx"
      ON "OrderStatusEvent"("orderId", "createdAt");

    CREATE INDEX "Order_status_confirmationExpiresAt_idx"
      ON "Order"("status", "confirmationExpiresAt");

    UPDATE "Order"
      SET "confirmationExpiresAt" = "createdAt" + INTERVAL '24 hours'
      WHERE "status" = 'pending' AND "confirmationExpiresAt" IS NULL;

    INSERT INTO "OrderStatusEvent" (
      "id", "orderId", "fromStatus", "toStatus", "actorId", "actorRole", "note", "createdAt"
    )
    SELECT
      'legacy_' || md5("id"),
      "id",
      NULL,
      "status",
      "userId",
      'system',
      'Imported existing order state',
      "createdAt"
    FROM "Order";
    ''',
)

# ---------------------------------------------------------------------------
# Pure lifecycle rules and transactional server implementation
# ---------------------------------------------------------------------------
write(
    "src/lib/order-lifecycle.ts",
    r'''
    export const ORDER_STATUSES = [
      'pending',
      'confirmed',
      'preparing',
      'processing',
      'shipped',
      'delivered',
      'rejected',
      'cancelled',
      'disputed',
      'returned',
    ] as const;

    export type OrderStatus = (typeof ORDER_STATUSES)[number];
    export type OrderActorRole = 'buyer' | 'seller' | 'admin' | 'system';

    const TRANSITIONS: Record<
      OrderStatus,
      Partial<Record<OrderActorRole, readonly OrderStatus[]>>
    > = {
      pending: {
        buyer: ['cancelled'],
        seller: ['confirmed', 'rejected'],
        admin: ['confirmed', 'rejected', 'cancelled'],
        system: ['cancelled'],
      },
      confirmed: {
        seller: ['preparing', 'cancelled'],
        admin: ['preparing', 'cancelled'],
      },
      preparing: {
        seller: ['shipped', 'cancelled'],
        admin: ['shipped', 'cancelled'],
      },
      processing: {
        seller: ['shipped', 'cancelled'],
        admin: ['shipped', 'cancelled'],
      },
      shipped: {
        seller: ['delivered'],
        admin: ['delivered'],
      },
      delivered: {},
      rejected: {},
      cancelled: {},
      disputed: {},
      returned: {},
    };

    export function normalizeOrderStatus(value: string): OrderStatus | null {
      return ORDER_STATUSES.includes(value as OrderStatus)
        ? (value as OrderStatus)
        : null;
    }

    export function allowedOrderTransitions(
      status: string,
      actorRole: OrderActorRole,
    ): readonly OrderStatus[] {
      const normalized = normalizeOrderStatus(status);
      if (!normalized) return [];
      return TRANSITIONS[normalized][actorRole] || [];
    }

    export function canTransitionOrder(
      status: string,
      targetStatus: string,
      actorRole: OrderActorRole,
    ): boolean {
      return allowedOrderTransitions(status, actorRole).includes(
        targetStatus as OrderStatus,
      );
    }

    export function transitionRestoresInventory(targetStatus: string): boolean {
      return targetStatus === 'cancelled' || targetStatus === 'rejected';
    }

    export function transitionRequiresTracking(targetStatus: string): boolean {
      return targetStatus === 'shipped';
    }

    export function confirmationTtlHours(
      rawValue = process.env.ORDER_CONFIRMATION_TTL_HOURS,
    ): number {
      const parsed = Number.parseInt(rawValue || '', 10);
      if (!Number.isFinite(parsed)) return 24;
      return Math.min(168, Math.max(1, parsed));
    }

    export function confirmationDeadline(
      now = new Date(),
      hours = confirmationTtlHours(),
    ): Date {
      return new Date(now.getTime() + hours * 60 * 60 * 1000);
    }
    ''',
)

write(
    "src/lib/order-lifecycle.test.ts",
    r'''
    import assert from 'node:assert/strict';
    import test from 'node:test';
    import {
      allowedOrderTransitions,
      canTransitionOrder,
      confirmationDeadline,
      confirmationTtlHours,
      transitionRequiresTracking,
      transitionRestoresInventory,
    } from './order-lifecycle.ts';

    test('buyer cancellation is limited to an unconfirmed order', () => {
      assert.equal(canTransitionOrder('pending', 'cancelled', 'buyer'), true);
      assert.equal(canTransitionOrder('confirmed', 'cancelled', 'buyer'), false);
      assert.deepEqual(allowedOrderTransitions('delivered', 'buyer'), []);
    });

    test('seller follows the controlled fulfilment sequence', () => {
      assert.deepEqual(allowedOrderTransitions('pending', 'seller'), [
        'confirmed',
        'rejected',
      ]);
      assert.equal(canTransitionOrder('confirmed', 'preparing', 'seller'), true);
      assert.equal(canTransitionOrder('preparing', 'shipped', 'seller'), true);
      assert.equal(canTransitionOrder('shipped', 'delivered', 'seller'), true);
      assert.equal(canTransitionOrder('delivered', 'preparing', 'seller'), false);
    });

    test('only rejection and cancellation restore reserved inventory', () => {
      assert.equal(transitionRestoresInventory('cancelled'), true);
      assert.equal(transitionRestoresInventory('rejected'), true);
      assert.equal(transitionRestoresInventory('delivered'), false);
      assert.equal(transitionRequiresTracking('shipped'), true);
    });

    test('confirmation expiry is bounded and deterministic', () => {
      assert.equal(confirmationTtlHours('0'), 1);
      assert.equal(confirmationTtlHours('999'), 168);
      assert.equal(confirmationTtlHours('not-a-number'), 24);
      const now = new Date('2026-08-01T00:00:00.000Z');
      assert.equal(
        confirmationDeadline(now, 24).toISOString(),
        '2026-08-02T00:00:00.000Z',
      );
    });
    ''',
)

write(
    "src/lib/order-lifecycle-server.ts",
    r'''
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
    ''',
)

# ---------------------------------------------------------------------------
# Orders APIs
# ---------------------------------------------------------------------------
write(
    "src/app/api/orders/route.ts",
    r'''
    import { Prisma } from '@prisma/client';
    import { requireAuthenticatedUser } from '@/lib/auth';
    import { db } from '@/lib/db';
    import { normalizeOrderStatus } from '@/lib/order-lifecycle';
    import {
      lifecycleOrderInclude,
      serializeLifecycleOrder,
    } from '@/lib/order-lifecycle-server';
    import { validatePagination } from '@/lib/security';

    export async function GET(request: Request) {
      const auth = await requireAuthenticatedUser(request);
      if (auth.response) return auth.response;

      try {
        const { searchParams } = new URL(request.url);
        const requestedUserId = searchParams.get('userId');
        const statusRaw = searchParams.get('status');
        const status = statusRaw ? normalizeOrderStatus(statusRaw) : null;
        const { page, limit } = validatePagination(
          searchParams.get('page'),
          searchParams.get('limit'),
          50,
        );

        if (statusRaw && !status) {
          return Response.json({ error: 'Invalid order status.' }, { status: 400 });
        }

        const userId =
          auth.user.role === 'admin' && requestedUserId
            ? requestedUserId
            : auth.user.id;
        const where: Prisma.OrderWhereInput = {
          userId,
          ...(status ? { status } : {}),
        };

        const [orders, total] = await db.$transaction([
          db.order.findMany({
            where,
            include: lifecycleOrderInclude,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.order.count({ where }),
        ]);

        return Response.json({
          orders: orders.map((order) =>
            serializeLifecycleOrder(
              order,
              auth.user.role === 'admin' ? 'admin' : 'buyer',
            ),
          ),
          total,
          page,
          limit,
        });
      } catch (error) {
        console.error('Orders API error:', error);
        return Response.json({ error: 'Failed to fetch orders.' }, { status: 500 });
      }
    }
    ''',
)

write(
    "src/app/api/orders/[id]/transition/route.ts",
    r'''
    import { Prisma } from '@prisma/client';
    import { NextResponse } from 'next/server';
    import { z } from 'zod';
    import { requireAuthenticatedUser } from '@/lib/auth';
    import { db } from '@/lib/db';
    import {
      applyOrderTransition,
      lifecycleOrderInclude,
      OrderLifecycleError,
      serializeLifecycleOrder,
    } from '@/lib/order-lifecycle-server';
    import {
      checkApiRateLimit,
      RATE_LIMITS,
      validateCsrf,
    } from '@/lib/security';

    const transitionSchema = z
      .object({
        targetStatus: z.literal('cancelled'),
        reason: z.string().trim().min(3).max(500).optional(),
      })
      .strict();

    export async function POST(
      request: Request,
      { params }: { params: Promise<{ id: string }> },
    ) {
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

      const parsed = transitionSchema.safeParse(
        await request.json().catch(() => null),
      );
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid cancellation request.' }, { status: 400 });
      }

      const { id } = await params;
      try {
        const updated = await db.$transaction(
          async (tx) => {
            const order = await tx.order.findFirst({
              where: {
                id,
                ...(auth.user.role === 'admin'
                  ? {}
                  : { userId: auth.user.id }),
              },
              include: lifecycleOrderInclude,
            });
            if (!order) {
              throw new OrderLifecycleError('Order not found.', 404);
            }
            return applyOrderTransition(tx, order, {
              targetStatus: parsed.data.targetStatus,
              actorId: auth.user.id,
              actorRole: auth.user.role === 'admin' ? 'admin' : 'buyer',
              note:
                parsed.data.reason ||
                (auth.user.role === 'admin'
                  ? 'Cancelled by administrator'
                  : 'Cancelled by buyer'),
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5_000,
            timeout: 15_000,
          },
        );

        return NextResponse.json({
          success: true,
          order: serializeLifecycleOrder(
            updated,
            auth.user.role === 'admin' ? 'admin' : 'buyer',
          ),
        });
      } catch (error) {
        if (error instanceof OrderLifecycleError) {
          return NextResponse.json(
            { error: error.message, code: error.code },
            { status: error.status },
          );
        }
        console.error('Buyer order transition error:', error);
        return NextResponse.json(
          { error: 'The order could not be updated.' },
          { status: 500 },
        );
      }
    }
    ''',
)

write(
    "src/app/api/seller/orders/route.ts",
    r'''
    import { Prisma } from '@prisma/client';
    import { NextResponse } from 'next/server';
    import { z } from 'zod';
    import { requireUserRole, type AuthenticatedUser } from '@/lib/auth';
    import { db } from '@/lib/db';
    import { normalizeOrderStatus, ORDER_STATUSES } from '@/lib/order-lifecycle';
    import {
      applyOrderTransition,
      lifecycleOrderInclude,
      OrderLifecycleError,
      serializeLifecycleOrder,
    } from '@/lib/order-lifecycle-server';
    import {
      checkApiRateLimit,
      RATE_LIMITS,
      validateCsrf,
      validatePagination,
    } from '@/lib/security';

    const sellerTargets = [
      'confirmed',
      'preparing',
      'shipped',
      'delivered',
      'rejected',
      'cancelled',
    ] as const;

    const transitionSchema = z
      .object({
        orderId: z.string().min(1).max(64),
        targetStatus: z.enum(sellerTargets),
        carrier: z.string().trim().max(120).optional(),
        trackingNumber: z.string().trim().max(160).optional(),
        note: z.string().trim().max(500).optional(),
      })
      .strict();

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

    export async function GET(request: Request) {
      const auth = await requireUserRole(request, ['seller', 'admin']);
      if (auth.response) return auth.response;

      try {
        const { searchParams } = new URL(request.url);
        const statusRaw = searchParams.get('status');
        const status = statusRaw ? normalizeOrderStatus(statusRaw) : null;
        if (statusRaw && !status) {
          return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 });
        }
        const { page, limit } = validatePagination(
          searchParams.get('page'),
          searchParams.get('limit'),
          100,
        );
        const storeIds = await accessibleStoreIds(auth.user);
        if (storeIds.length === 0) {
          return NextResponse.json({ orders: [], total: 0, page, limit });
        }

        const where: Prisma.OrderWhereInput = {
          storeId: { in: storeIds },
          ...(status ? { status } : {}),
        };
        const [orders, total] = await db.$transaction([
          db.order.findMany({
            where,
            include: lifecycleOrderInclude,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.order.count({ where }),
        ]);

        return NextResponse.json({
          orders: orders.map((order) =>
            serializeLifecycleOrder(
              order,
              auth.user.role === 'admin' ? 'admin' : 'seller',
            ),
          ),
          total,
          page,
          limit,
          statuses: ORDER_STATUSES,
        });
      } catch (error) {
        console.error('Seller orders GET error:', error);
        return NextResponse.json({ error: 'Failed to load seller orders.' }, { status: 500 });
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
      const parsed = transitionSchema.safeParse(
        await request.json().catch(() => null),
      );
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid order update.' }, { status: 400 });
      }

      try {
        const storeIds = await accessibleStoreIds(auth.user);
        const updated = await db.$transaction(
          async (tx) => {
            const order = await tx.order.findFirst({
              where: {
                id: parsed.data.orderId,
                storeId: { in: storeIds },
              },
              include: lifecycleOrderInclude,
            });
            if (!order) {
              throw new OrderLifecycleError('Order not found.', 404);
            }
            return applyOrderTransition(tx, order, {
              targetStatus: parsed.data.targetStatus,
              actorId: auth.user.id,
              actorRole: auth.user.role === 'admin' ? 'admin' : 'seller',
              carrier: parsed.data.carrier,
              trackingNumber: parsed.data.trackingNumber,
              note: parsed.data.note,
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5_000,
            timeout: 15_000,
          },
        );

        return NextResponse.json({
          success: true,
          order: serializeLifecycleOrder(
            updated,
            auth.user.role === 'admin' ? 'admin' : 'seller',
          ),
        });
      } catch (error) {
        if (error instanceof OrderLifecycleError) {
          return NextResponse.json(
            { error: error.message, code: error.code },
            { status: error.status },
          );
        }
        console.error('Seller orders PUT error:', error);
        return NextResponse.json(
          { error: 'The order could not be updated.' },
          { status: 500 },
        );
      }
    }
    ''',
)

write(
    "src/app/api/admin/orders/expire/route.ts",
    r'''
    import { Prisma } from '@prisma/client';
    import { NextResponse } from 'next/server';
    import { z } from 'zod';
    import { db } from '@/lib/db';
    import {
      applyOrderTransition,
      lifecycleOrderInclude,
      OrderLifecycleError,
    } from '@/lib/order-lifecycle-server';
    import {
      getAdminActorId,
      validateAdminRequest,
    } from '@/lib/security';

    const inputSchema = z.object({
      limit: z.coerce.number().int().min(1).max(100).default(50),
    });

    export async function POST(request: Request) {
      const denied = validateAdminRequest(request);
      if (denied) return denied;
      const actorId = getAdminActorId(request);
      if (!actorId) {
        return NextResponse.json(
          { error: 'An administrator identity is required.' },
          { status: 401 },
        );
      }

      const parsed = inputSchema.safeParse(
        await request.json().catch(() => ({})),
      );
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid expiration request.' }, { status: 400 });
      }

      const now = new Date();
      const candidates = await db.order.findMany({
        where: {
          status: 'pending',
          confirmationExpiresAt: { lte: now },
          inventoryRestoredAt: null,
        },
        select: { id: true },
        orderBy: { confirmationExpiresAt: 'asc' },
        take: parsed.data.limit,
      });

      let expired = 0;
      const failures: { orderId: string; error: string }[] = [];
      for (const candidate of candidates) {
        try {
          const didExpire = await db.$transaction(
            async (tx) => {
              const order = await tx.order.findUnique({
                where: { id: candidate.id },
                include: lifecycleOrderInclude,
              });
              if (
                !order ||
                order.status !== 'pending' ||
                !order.confirmationExpiresAt ||
                order.confirmationExpiresAt > now
              ) {
                return false;
              }
              await applyOrderTransition(tx, order, {
                targetStatus: 'cancelled',
                actorId,
                actorRole: 'system',
                note: 'Seller confirmation window expired',
              });
              return true;
            },
            {
              isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
              maxWait: 5_000,
              timeout: 15_000,
            },
          );
          if (didExpire) expired += 1;
        } catch (error) {
          failures.push({
            orderId: candidate.id,
            error:
              error instanceof OrderLifecycleError || error instanceof Error
                ? error.message
                : 'Unknown expiration error',
          });
        }
      }

      return NextResponse.json({
        success: failures.length === 0,
        inspected: candidates.length,
        expired,
        failures,
      });
    }
    ''',
)

# ---------------------------------------------------------------------------
# Checkout becomes order placement only; wallet is rejected and never mutated.
# ---------------------------------------------------------------------------
replace_once(
    "src/app/api/checkout/route.ts",
    "import { db } from '@/lib/db';\n",
    "import { db } from '@/lib/db';\nimport { confirmationDeadline } from '@/lib/order-lifecycle';\n",
)
replace_once(
    "src/app/api/checkout/route.ts",
    "  paymentMethod: z.enum(['cash_on_delivery', 'wallet']),",
    "  paymentMethod: z.literal('cash_on_delivery').default('cash_on_delivery'),",
)
replace_once(
    "src/app/api/checkout/route.ts",
    "    select: { orderNumber: true, total: true, paymentStatus: true },",
    "    select: { orderNumber: true, total: true },",
)
replace_once(
    "src/app/api/checkout/route.ts",
    "    paymentStatus: orders.every((order) => order.paymentStatus === 'paid')\n      ? 'paid'\n      : 'pending',",
    "    paymentStatus: 'not_applicable' as const,\n    orderMethod: 'cash_on_delivery' as const,",
)
regex_once(
    "src/app/api/checkout/route.ts",
    r"\n        if \(input\.paymentMethod === 'wallet'\) \{.*?\n        \}\n\n        for \(const \[variantId, reservation\]",
    "\n\n        for (const [variantId, reservation]",
    re.S,
)
replace_once(
    "src/app/api/checkout/route.ts",
    "          const paymentStatus = input.paymentMethod === 'wallet' ? 'paid' : 'pending';",
    "          const paymentStatus = 'not_applicable';",
)
replace_once(
    "src/app/api/checkout/route.ts",
    "              status: 'pending',\n              subtotal:",
    "              status: 'pending',\n              confirmationExpiresAt: confirmationDeadline(),\n              subtotal:",
)
replace_all(
    "src/app/api/checkout/route.ts",
    "paymentMethod: input.paymentMethod",
    "paymentMethod: 'cash_on_delivery'",
    minimum=2,
)
replace_once(
    "src/app/api/checkout/route.ts",
    "              status: paymentStatus === 'paid' ? 'paid' : 'unpaid',",
    "              status: 'issued',",
)
replace_once(
    "src/app/api/checkout/route.ts",
    '''              items: {
                create: items.map((item) => ({
                  productId: item.product.id,
                  variantId: item.variant?.id || null,
                  quantity: item.quantity,
                  price: fromCents(item.unitPrice),
                  total: fromCents(item.lineTotal),
                  variation: item.variation,
                })),
              },
''',
    '''              items: {
                create: items.map((item) => ({
                  productId: item.product.id,
                  variantId: item.variant?.id || null,
                  quantity: item.quantity,
                  price: fromCents(item.unitPrice),
                  total: fromCents(item.lineTotal),
                  variation: item.variation,
                })),
              },
              statusEvents: {
                create: {
                  fromStatus: null,
                  toStatus: 'pending',
                  actorId: auth.user.id,
                  actorRole: 'buyer',
                  note: 'Order placed and waiting for seller confirmation',
                },
              },
''',
)
replace_once(
    "src/app/api/checkout/route.ts",
    "            message: `Your order ${orderNumbers.join(', ')} was placed successfully.`,\n            messageAr: `تم إنشاء طلبك ${orderNumbers.join('، ')} بنجاح.`,",
    "            message: `Your order ${orderNumbers.join(', ')} is waiting for seller confirmation.`,\n            messageAr: `طلبك ${orderNumbers.join('، ')} بانتظار تأكيد البائع.`,",
)
replace_once(
    "src/app/api/checkout/route.ts",
    "          paymentStatus: input.paymentMethod === 'wallet' ? 'paid' as const : 'pending' as const,",
    "          paymentStatus: 'not_applicable' as const,\n          orderMethod: 'cash_on_delivery' as const,",
)

# ---------------------------------------------------------------------------
# Paymentless buyer checkout flow
# ---------------------------------------------------------------------------
replace_once(
    "src/components/buyer/checkout-types.ts",
    "export type CheckoutStep = 'shipping' | 'payment' | 'review' | 'confirmation';",
    "export type CheckoutStep = 'shipping' | 'review' | 'confirmation';",
)

write(
    "src/components/buyer/checkout-page.tsx",
    r'''
    'use client';

    import React, { useEffect, useState } from 'react';
    import {
      ArrowLeft,
      ArrowRight,
      Banknote,
      Check,
      ClipboardCheck,
      Loader2,
      PartyPopper,
      Truck,
      Zap,
    } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { useI18n } from '@/lib/i18n';
    import { getLocale } from '@/lib/utils';
    import { LS_KEYS, SHIPPING_CONFIG } from '@/lib/config';
    import { calculateTax } from '@/lib/tax';
    import {
      calculateStoreShippingCents,
      resolveTaxCountryCode,
      toCents,
    } from '@/lib/checkout-authority';
    import { useAppStore } from '@/stores/app-store';
    import { useAppNavigation } from '@/lib/use-app-navigation';
    import { useCartStore } from '@/stores/cart-store';
    import { useUserStore } from '@/stores/user-store';
    import type {
      CheckoutStep,
      Address,
      AppliedCoupon,
      AvailableCoupon,
      PaymentMethod,
      ShippingMethod,
      CheckoutStepInfo,
    } from './checkout-types';
    import {
      CheckoutShipping,
      DEFAULT_NEW_ADDRESS,
    } from './checkout/components/checkout-shipping';
    import { CheckoutReview } from './checkout/components/checkout-review';
    import { CheckoutConfirmation } from './checkout/components/checkout-confirmation';

    const LS_ADDRESS_KEY = LS_KEYS.checkoutAddress;

    const ORDER_METHOD: PaymentMethod = {
      id: 'cash_on_delivery',
      name: 'Cash on delivery',
      nameAr: 'الدفع عند الاستلام',
      icon: Banknote,
    };

    const SHIPPING_METHODS: ShippingMethod[] = [
      {
        id: SHIPPING_CONFIG.methods.standard.id,
        name: 'Standard Shipping',
        nameAr: 'شحن عادي',
        price: SHIPPING_CONFIG.methods.standard.price,
        days: `${SHIPPING_CONFIG.methods.standard.days} days`,
        daysAr: `${SHIPPING_CONFIG.methods.standard.days} أيام`,
        icon: Truck,
      },
      {
        id: SHIPPING_CONFIG.methods.express.id,
        name: 'Express Shipping',
        nameAr: 'شحن سريع',
        price: SHIPPING_CONFIG.methods.express.price,
        days: `${SHIPPING_CONFIG.methods.express.days} days`,
        daysAr: `${SHIPPING_CONFIG.methods.express.days} أيام`,
        icon: Zap,
      },
      {
        id: SHIPPING_CONFIG.methods.nextDay.id,
        name: 'Next Day Delivery',
        nameAr: 'توصيل اليوم التالي',
        price: SHIPPING_CONFIG.methods.nextDay.price,
        days: `${SHIPPING_CONFIG.methods.nextDay.days} day`,
        daysAr: 'يوم واحد',
        icon: Truck,
      },
    ];

    const STEPS: CheckoutStepInfo[] = [
      { key: 'shipping', label: 'Delivery', labelAr: 'التوصيل', icon: Truck },
      { key: 'review', label: 'Review', labelAr: 'مراجعة', icon: ClipboardCheck },
      { key: 'confirmation', label: 'Placed', labelAr: 'تم الطلب', icon: PartyPopper },
    ];

    interface CheckoutResponse {
      orderNumbers?: string[];
      total?: number;
      error?: string;
    }

    export function CheckoutPage() {
      const { t, locale } = useI18n();
      const { currency } = useAppStore();
      const nav = useAppNavigation();
      const { items, getTotal, getItemCount, clearCart } = useCartStore();
      const user = useUserStore((state) => state.user);
      const isHydrated = useUserStore((state) => state.isHydrated);
      const isRTL = locale === 'ar';

      const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
      const [selectedAddressId, setSelectedAddressId] = useState('');
      const [selectedShippingId, setSelectedShippingId] = useState('standard');
      const [isPlacingOrder, setIsPlacingOrder] = useState(false);
      const [isSavingAddress, setIsSavingAddress] = useState(false);
      const [orderNumber, setOrderNumber] = useState('');
      const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);
      const [checkoutError, setCheckoutError] = useState('');
      const [showNewAddress, setShowNewAddress] = useState(false);
      const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
      const [idempotencyKey] = useState(() => crypto.randomUUID());

      const [couponCode, setCouponCode] = useState('');
      const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
      const [couponDiscount, setCouponDiscount] = useState(0);
      const [couponError, setCouponError] = useState('');
      const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
      const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);

      const [newAddress, setNewAddress] = useState(DEFAULT_NEW_ADDRESS);
      const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

      useEffect(() => {
        void fetch('/api/coupons?action=available')
          .then((response) => response.json())
          .then((data) => setAvailableCoupons(data.coupons || []))
          .catch(() => undefined);
      }, []);

      useEffect(() => {
        let cancelled = false;
        const timer = window.setTimeout(() => {
          void (async () => {
            if (user) {
              try {
                const response = await fetch('/api/addresses', {
                  credentials: 'same-origin',
                  cache: 'no-store',
                });
                if (response.ok) {
                  const data = (await response.json()) as { addresses?: Address[] };
                  const addresses = data.addresses || [];
                  if (!cancelled) {
                    setSavedAddresses(addresses);
                    const defaultAddress = addresses.find((address) => address.isDefault);
                    if (defaultAddress) setSelectedAddressId(defaultAddress.id);
                  }
                  if (addresses.length > 0) return;
                }
              } catch {
                // Fall through to local guest addresses.
              }
            }

            try {
              const stored = localStorage.getItem(LS_ADDRESS_KEY);
              if (!stored || cancelled) return;
              const addresses = JSON.parse(stored) as Address[];
              setSavedAddresses(addresses);
              const defaultAddress = addresses.find((address) => address.isDefault);
              if (defaultAddress) setSelectedAddressId(defaultAddress.id);
            } catch {
              // Storage may be unavailable.
            }
          })();
        }, 0);
        return () => {
          cancelled = true;
          window.clearTimeout(timer);
        };
      }, [user]);

      const itemCount = getItemCount();
      const subtotal = getTotal();
      const selectedAddress = savedAddresses.find(
        (address) => address.id === selectedAddressId,
      );
      const selectedShipping =
        SHIPPING_METHODS.find((method) => method.id === selectedShippingId) ||
        SHIPPING_METHODS[0];
      const addressForTotals =
        selectedAddress || (showNewAddress ? newAddress : undefined);
      const taxCountryCode =
        resolveTaxCountryCode(addressForTotals?.country || '') || 'iq';
      const itemsByStore = new Map<string, typeof items>();
      for (const item of items) {
        const storeItems = itemsByStore.get(item.storeId) || [];
        storeItems.push(item);
        itemsByStore.set(item.storeId, storeItems);
      }
      const shippingCost = [...itemsByStore.values()].reduce(
        (sum, storeItems) => {
          const storeSubtotalCents = storeItems.reduce(
            (storeSum, item) =>
              storeSum + toCents(item.price) * item.quantity,
            0,
          );
          return (
            sum +
            calculateStoreShippingCents(
              selectedShippingId as 'standard' | 'express' | 'next_day',
              storeSubtotalCents,
              storeItems.map((item) => ({
                hasFreeShipping: Boolean(item.hasFreeShipping),
              })),
            ) /
              100
          );
        },
        0,
      );
      const taxableSubtotal = Math.max(0, subtotal - couponDiscount);
      const taxResult = calculateTax(taxableSubtotal, taxCountryCode);
      const tax = taxResult.taxAmount;
      const taxRate = taxResult.taxRate;
      const taxLabel = isRTL ? taxResult.taxLabelAr : taxResult.taxLabel;
      const isTaxExempt = taxResult.isTaxExempt;
      const total = taxableSubtotal + shippingCost + tax;
      const selectedPayment = ORDER_METHOD;
      const stepIndex = STEPS.findIndex((step) => step.key === currentStep);

      function saveGuestAddresses(addresses: Address[]) {
        try {
          localStorage.setItem(LS_ADDRESS_KEY, JSON.stringify(addresses));
        } catch {
          // Storage may be unavailable.
        }
      }

      function validateShipping(): boolean {
        const errors: Record<string, boolean> = {};
        if (!selectedAddressId && !showNewAddress) errors.address = true;
        if (showNewAddress) {
          if (!newAddress.name) errors.name = true;
          if (!newAddress.phone) errors.phone = true;
          if (!newAddress.address1) errors.address1 = true;
          if (!newAddress.city) errors.city = true;
          if (!newAddress.state) errors.state = true;
          if (!newAddress.postalCode) errors.postalCode = true;
          if (!newAddress.country) errors.country = true;
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
      }

      async function handleApplyCoupon() {
        if (!couponCode.trim()) return;
        setIsApplyingCoupon(true);
        setCouponError('');
        try {
          const response = await fetch('/api/coupons', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: couponCode, subtotal }),
          });
          const data = await response.json();
          if (data.valid) {
            setAppliedCoupon(data.coupon);
            setCouponDiscount(data.discountAmount);
          } else {
            setCouponError(isRTL ? data.errorAr || data.error : data.error);
            setAppliedCoupon(null);
            setCouponDiscount(0);
          }
        } catch {
          setCouponError(t('b_failedToValidateCoupon'));
        } finally {
          setIsApplyingCoupon(false);
        }
      }

      function handleRemoveCoupon() {
        setAppliedCoupon(null);
        setCouponDiscount(0);
        setCouponCode('');
        setCouponError('');
      }

      async function persistNewAddress(): Promise<Address | null> {
        const address: Address = {
          id: `addr_${Date.now()}`,
          name: newAddress.name,
          phone: newAddress.phone,
          address1: newAddress.address1,
          address2: newAddress.address2 || undefined,
          city: newAddress.city,
          state: newAddress.state,
          postalCode: newAddress.postalCode,
          country: newAddress.country,
          isDefault: savedAddresses.length === 0,
        };

        if (!user) {
          const updated = [...savedAddresses, address];
          setSavedAddresses(updated);
          saveGuestAddresses(updated);
          return address;
        }

        setIsSavingAddress(true);
        try {
          const response = await fetch('/api/addresses', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              label: 'Home',
              fullName: address.name,
              phone: address.phone,
              address1: address.address1,
              address2: address.address2,
              city: address.city,
              state: address.state,
              postalCode: address.postalCode,
              country: address.country,
              isDefault: address.isDefault,
            }),
          });
          const data = (await response.json()) as {
            address?: Address;
            error?: string;
          };
          if (!response.ok || !data.address) {
            throw new Error(data.error || 'Failed to save the shipping address.');
          }
          setSavedAddresses((current) => [...current, data.address!]);
          return data.address;
        } finally {
          setIsSavingAddress(false);
        }
      }

      async function handleNextStep() {
        setCheckoutError('');
        if (currentStep === 'shipping') {
          if (!validateShipping()) return;
          if (showNewAddress) {
            try {
              const address = await persistNewAddress();
              if (!address) return;
              setSelectedAddressId(address.id);
              setShowNewAddress(false);
            } catch (error) {
              setCheckoutError(
                error instanceof Error
                  ? error.message
                  : 'Failed to save the address.',
              );
              return;
            }
          }
          setCurrentStep('review');
        } else if (currentStep === 'review') {
          await handlePlaceOrder();
        }
      }

      function handlePrevStep() {
        if (currentStep === 'review') setCurrentStep('shipping');
      }

      async function handlePlaceOrder() {
        if (!isHydrated) return;
        if (!user) {
          window.location.assign('/auth?redirect=/checkout');
          return;
        }

        const address = selectedAddress || (showNewAddress ? newAddress : undefined);
        if (!address) {
          setCheckoutError('Please select a shipping address.');
          setCurrentStep('shipping');
          return;
        }

        setIsPlacingOrder(true);
        setCheckoutError('');
        try {
          const response = await fetch('/api/checkout', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              idempotencyKey,
              items: items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                variation: item.variation,
              })),
              shippingMethod: selectedShippingId,
              paymentMethod: 'cash_on_delivery',
              couponCode: appliedCoupon?.code,
              addressId: selectedAddress?.id.startsWith('addr_')
                ? undefined
                : selectedAddress?.id,
              address: {
                name: address.name,
                phone: address.phone,
                address1: address.address1,
                address2: address.address2,
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
                country: address.country,
              },
            }),
          });
          const data = (await response.json()) as CheckoutResponse;
          if (!response.ok || !data.orderNumbers?.length) {
            throw new Error(data.error || 'The order could not be completed.');
          }

          setOrderNumber(data.orderNumbers.join(', '));
          setConfirmedTotal(data.total ?? total);
          clearCart();
          setCurrentStep('confirmation');
        } catch (error) {
          setCheckoutError(
            error instanceof Error
              ? error.message
              : 'The order could not be completed.',
          );
        } finally {
          setIsPlacingOrder(false);
        }
      }

      function getEstimatedDelivery() {
        const days =
          selectedShippingId === 'next_day'
            ? 1
            : selectedShippingId === 'express'
              ? 3
              : 7;
        return new Date(Date.now() + days * 86_400_000).toLocaleDateString(
          getLocale(isRTL),
          { year: 'numeric', month: 'long', day: 'numeric' },
        );
      }

      const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((step, index) => {
            const active = index === stepIndex;
            const completed = index < stepIndex;
            const StepIcon = step.icon;
            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      completed
                        ? 'bg-amber-500 text-white'
                        : active
                          ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {completed ? (
                      <Check className="size-5" />
                    ) : (
                      <StepIcon className="size-5" />
                    )}
                  </div>
                  <span
                    className={`text-[10px] md:text-xs font-medium ${
                      active
                        ? 'text-amber-600 dark:text-amber-400'
                        : completed
                          ? 'text-amber-500'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {isRTL ? step.labelAr : step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-12 md:w-24 mx-1 mb-5 ${
                      index < stepIndex ? 'bg-amber-500' : 'bg-muted'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      );

      if (items.length === 0 && currentStep !== 'confirmation') {
        return (
          <div className="container mx-auto px-4 py-12 text-center">
            <h2 className="text-xl font-bold mb-4">{t('emptyCart')}</h2>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => nav.setView('shop')}
            >
              {t('continueShopping')}
            </Button>
          </div>
        );
      }

      return (
        <div className="container mx-auto px-4 py-6">
          {renderStepIndicator()}
          <div className="max-w-3xl mx-auto">
            {currentStep === 'shipping' && (
              <CheckoutShipping
                currency={currency}
                subtotal={subtotal}
                selectedAddressId={selectedAddressId}
                setSelectedAddressId={setSelectedAddressId}
                selectedShippingId={selectedShippingId}
                setSelectedShippingId={setSelectedShippingId}
                showNewAddress={showNewAddress}
                setShowNewAddress={setShowNewAddress}
                savedAddresses={savedAddresses}
                newAddress={newAddress}
                setNewAddress={setNewAddress}
                validationErrors={validationErrors}
                SHIPPING_METHODS={SHIPPING_METHODS}
              />
            )}
            {currentStep === 'review' && (
              <CheckoutReview
                currency={currency}
                itemCount={itemCount}
                subtotal={subtotal}
                shippingCost={shippingCost}
                tax={tax}
                taxRate={taxRate}
                taxLabel={taxLabel}
                isTaxExempt={isTaxExempt}
                total={total}
                appliedCoupon={appliedCoupon}
                couponDiscount={couponDiscount}
                couponError={couponError}
                isApplyingCoupon={isApplyingCoupon}
                couponCode={couponCode}
                availableCoupons={availableCoupons}
                items={items}
                selectedAddress={selectedAddress}
                showNewAddress={showNewAddress}
                newAddress={newAddress}
                selectedShipping={selectedShipping}
                selectedPayment={selectedPayment}
                setCurrentStep={setCurrentStep}
                handleApplyCoupon={handleApplyCoupon}
                handleRemoveCoupon={handleRemoveCoupon}
                setCouponCode={setCouponCode}
                getEstimatedDelivery={getEstimatedDelivery}
              />
            )}
            {currentStep === 'confirmation' && (
              <CheckoutConfirmation
                currency={currency}
                total={confirmedTotal ?? total}
                orderNumber={orderNumber}
                selectedShipping={selectedShipping}
                getEstimatedDelivery={getEstimatedDelivery}
                setCurrentStep={setCurrentStep}
                onViewOrders={() => nav.setView('orders')}
                onContinueShopping={() => nav.setView('shop')}
              />
            )}

            {checkoutError && (
              <p className="mt-4 text-sm text-red-600 text-center" role="alert">
                {checkoutError}
              </p>
            )}

            {currentStep !== 'confirmation' && (
              <div className="flex items-center justify-between mt-8 pt-4 border-t">
                {currentStep === 'review' ? (
                  <Button variant="outline" onClick={handlePrevStep}>
                    {isRTL ? (
                      <ArrowRight className="size-4 me-1" />
                    ) : (
                      <ArrowLeft className="size-4 me-1" />
                    )}
                    {t('back')}
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => nav.setView('cart')}>
                    {isRTL ? (
                      <ArrowRight className="size-4 me-1" />
                    ) : (
                      <ArrowLeft className="size-4 me-1" />
                    )}
                    {t('b_backToCart')}
                  </Button>
                )}
                <Button
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold min-w-[150px]"
                  onClick={() => void handleNextStep()}
                  disabled={isPlacingOrder || isSavingAddress}
                >
                  {isPlacingOrder || isSavingAddress ? (
                    <>
                      <Loader2 className="size-4 me-2 animate-spin" />
                      {t('b_processing')}
                    </>
                  ) : currentStep === 'review' ? (
                    <>
                      {isRTL ? 'إرسال الطلب' : 'Place order'}
                      <ArrowRight className="size-4 ms-2" />
                    </>
                  ) : (
                    <>
                      {t('next')}
                      {isRTL ? (
                        <ArrowLeft className="size-4 ms-1" />
                      ) : (
                        <ArrowRight className="size-4 ms-1" />
                      )}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }
    ''',
)

replace_once(
    "src/components/buyer/checkout/components/checkout-review.tsx",
    "  CreditCard,\n",
    "  Banknote,\n",
)
regex_once(
    "src/components/buyer/checkout/components/checkout-review.tsx",
    r"\n      \{/\* Payment Method Summary \*/\}.*?\n      \{/\* Order Items \*/\}",
    r'''
      {/* Paymentless order method */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Banknote className="size-4 text-amber-600" />
            {isRTL ? 'طريقة الطلب' : 'Order method'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedPayment && (
            <div className="flex items-center gap-2 text-sm">
              <selectedPayment.icon className="size-4 text-amber-600 dark:text-amber-400" />
              <span className="font-medium">
                {isRTL ? selectedPayment.nameAr : selectedPayment.name}
              </span>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {isRTL
              ? 'لا يعالج NexaMart أي دفعة. يتم الدفع للبائع عند الاستلام.'
              : 'NexaMart does not process payments. Pay the seller when the order is delivered.'}
          </p>
        </CardContent>
      </Card>

      {/* Order Items */}''',
    re.S,
)

replace_once(
    "src/components/buyer/checkout/components/checkout-confirmation.tsx",
    "import { Check, PartyPopper, Shield } from 'lucide-react';",
    "import { Banknote, Check, PartyPopper } from 'lucide-react';",
)
replace_once(
    "src/components/buyer/checkout/components/checkout-confirmation.tsx",
    "        <h2 className=\"text-2xl font-bold mb-2\">{t('b_orderConfirmed')}</h2>\n        <p className=\"text-muted-foreground\">\n          {isRTL\n            ? 'شكراً لك! تم استلام طلبك بنجاح.'\n            : 'Thank you! Your order has been placed successfully.'}\n        </p>",
    "        <h2 className=\"text-2xl font-bold mb-2\">\n          {isRTL ? 'تم استلام طلبك' : 'Order received'}\n        </h2>\n        <p className=\"text-muted-foreground\">\n          {isRTL\n            ? 'الطلب الآن بانتظار تأكيد البائع.'\n            : 'The order is now waiting for seller confirmation.'}\n        </p>",
)
replace_once(
    "src/components/buyer/checkout/components/checkout-confirmation.tsx",
    '''      <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg text-start">
        <Shield className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          {t('escrowNote')}
        </p>
      </div>
''',
    '''      <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg text-start">
        <Banknote className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          {isRTL
            ? 'لا توجد دفعة داخل التطبيق. ادفع للبائع عند الاستلام بعد التحقق من الطلب.'
            : 'No payment is taken in the app. Pay the seller on delivery after checking the order.'}
        </p>
      </div>
''',
)

# Disable the old payout mutation while this deployment has no payment system.
write(
    "src/app/api/admin/payouts/route.ts",
    r'''
    import { NextResponse } from 'next/server';
    import { db } from '@/lib/db';
    import {
      validateAdminRequest,
      validateEnum,
      validatePagination,
    } from '@/lib/security';

    const PAYOUT_STATUSES = [
      'pending',
      'processing',
      'completed',
      'rejected',
    ] as const;

    export async function GET(request: Request) {
      const denied = validateAdminRequest(request);
      if (denied) return denied;

      try {
        const { searchParams } = new URL(request.url);
        const statusRaw = searchParams.get('status');
        const status = statusRaw
          ? validateEnum(statusRaw, PAYOUT_STATUSES)
          : null;
        if (statusRaw && !status) {
          return NextResponse.json({ error: 'Invalid payout status.' }, { status: 400 });
        }
        const { page, limit } = validatePagination(
          searchParams.get('page'),
          searchParams.get('limit'),
          100,
        );
        const where = status ? { status } : {};
        const [payouts, total] = await db.$transaction([
          db.payout.findMany({
            where,
            orderBy: { requestedAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
            include: {
              store: { select: { id: true, name: true } },
              seller: { select: { id: true, name: true, email: true } },
            },
          }),
          db.payout.count({ where }),
        ]);
        return NextResponse.json({
          enabled: false,
          message: 'Payout processing is disabled because NexaMart does not process payments in this release.',
          payouts: payouts.map((payout) => ({
            id: payout.id,
            store: payout.store.name,
            sellerName: payout.seller.name || payout.seller.email,
            amount: Number(payout.amount),
            method: payout.method,
            status: payout.status,
            requestedDate: payout.requestedAt.toISOString().slice(0, 10),
          })),
          total,
          page,
          limit,
        });
      } catch (error) {
        console.error('Admin payouts GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch payout history.' }, { status: 500 });
      }
    }

    export async function PUT(request: Request) {
      const denied = validateAdminRequest(request);
      if (denied) return denied;
      return NextResponse.json(
        {
          error: 'Payout processing is disabled in the paymentless release.',
          code: 'PAYMENTS_DISABLED',
        },
        { status: 410 },
      );
    }
    ''',
)

# Remove the payment-adjacent Installments entry from active navigation.
replace_once(
    "src/components/layout/header.tsx",
    "    { key: 'installments', view: 'installments' as const, label: isRTL ? 'أقساط' : 'Installments', icon: '💳' },\n",
    "",
)
header = read("src/components/layout/header.tsx")
if header.count("CreditCard") == 1:
    write("src/components/layout/header.tsx", header.replace("  CreditCard,\n", ""))

# ---------------------------------------------------------------------------
# Seed/demo alignment and durable verification
# ---------------------------------------------------------------------------
seed = read("prisma/seed.ts")
seed = re.sub(
    r'paymentMethod: "(?:credit_card|wallet|zain_cash|apple_pay)"',
    'paymentMethod: "cash_on_delivery"',
    seed,
)
seed = re.sub(
    r'paymentStatus: "(?:paid|pending|refunded)"',
    'paymentStatus: "not_applicable"',
    seed,
)
seed = seed.replace('status: "processing"', 'status: "preparing"')
seed = seed.replace(
    'status: "pending",\n\t\t\t\tsubtotal:',
    'status: "pending",\n\t\t\t\tconfirmationExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),\n\t\t\t\tsubtotal:',
    1,
)
marker = 'const orders = await db.order.findMany({ orderBy: { createdAt: "asc" } });\n'
if marker not in seed:
    raise RuntimeError('Could not find seeded orders marker')
seed = seed.replace(
    marker,
    marker
    + '''\n\tawait db.orderStatusEvent.createMany({\n\t\tdata: orders.map((order) => ({\n\t\t\torderId: order.id,\n\t\t\tfromStatus: null,\n\t\t\ttoStatus: order.status,\n\t\t\tactorId: order.userId,\n\t\t\tactorRole: "buyer",\n\t\t\tnote: "Seeded order state",\n\t\t\tcreatedAt: order.createdAt,\n\t\t})),\n\t});\n''',
    1,
)
write("prisma/seed.ts", seed)

write(
    "scripts/verify-order-lifecycle.ts",
    r'''
    import { PrismaClient } from '@prisma/client';

    const db = new PrismaClient();

    async function main() {
      const unsupportedPayments = await db.order.count({
        where: {
          OR: [
            { paymentMethod: { not: 'cash_on_delivery' } },
            { paymentStatus: { not: 'not_applicable' } },
          ],
        },
      });
      if (unsupportedPayments !== 0) {
        throw new Error(`Seed contains ${unsupportedPayments} payment-enabled orders.`);
      }

      const orders = await db.order.findMany({
        include: { statusEvents: true, items: true },
      });
      if (orders.length === 0) throw new Error('No seeded orders were found.');
      if (orders.some((order) => order.statusEvents.length === 0)) {
        throw new Error('Every seeded order must have a status event.');
      }
      const pending = orders.find((order) => order.status === 'pending');
      if (pending && !pending.confirmationExpiresAt) {
        throw new Error('Pending orders require a seller confirmation deadline.');
      }

      console.log(
        JSON.stringify(
          {
            orders: orders.length,
            statusEvents: orders.reduce(
              (sum, order) => sum + order.statusEvents.length,
              0,
            ),
            pendingConfirmationDeadline:
              pending?.confirmationExpiresAt?.toISOString() || null,
          },
          null,
          2,
        ),
      );
    }

    main()
      .catch((error) => {
        console.error(error);
        process.exit(1);
      })
      .finally(async () => {
        await db.$disconnect();
      });
    ''',
)

replace_once(
    ".github/workflows/ci.yml",
    "      - name: Verify authoritative checkout catalog\n        run: node --experimental-strip-types scripts/verify-authoritative-checkout.ts",
    "      - name: Verify paymentless order lifecycle\n        run: node --experimental-strip-types scripts/verify-order-lifecycle.ts",
)

replace_once(
    ".env.example",
    "# Demo login is disabled in production unless explicitly enabled.\nENABLE_DEMO_LOGIN=\"false\"\n",
    "# Orders waiting for seller confirmation are eligible for automated cancellation\n# after this many hours. Keep between 1 and 168.\nORDER_CONFIRMATION_TTL_HOURS=\"24\"\n\n# Demo login is disabled in production unless explicitly enabled.\nENABLE_DEMO_LOGIN=\"false\"\n",
)

readme = read("README.md")
insert_before = "## Verification commands\n"
if insert_before not in readme:
    raise RuntimeError('README verification heading not found')
readme = readme.replace(
    insert_before,
    '''## Paymentless order model\n\nThis release does not process cards, wallets, transfers, seller payouts, or online refunds. Checkout creates cash-on-delivery orders only. Each seller must explicitly confirm, prepare, ship, and deliver their own marketplace order. Buyer cancellation is allowed only before seller confirmation. Cancellation and rejection restore the exact product and SKU inventory once.\n\nPending orders receive a confirmation deadline controlled by `ORDER_CONFIRMATION_TTL_HOURS`. A trusted administrator or scheduled server job can call `POST /api/admin/orders/expire` using the server-only administrator bearer token to cancel expired unconfirmed orders and restore inventory.\n\n'''
    + insert_before,
    1,
)
write("README.md", readme)

print('Paymentless order lifecycle changes applied successfully.')
