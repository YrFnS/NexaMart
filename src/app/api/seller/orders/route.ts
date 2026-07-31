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
