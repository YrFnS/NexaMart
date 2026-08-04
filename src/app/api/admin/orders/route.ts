import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { normalizeOrderStatus } from '@/lib/order-lifecycle';
import {
  applyOrderTransition,
  lifecycleOrderInclude,
  OrderLifecycleError,
  serializeLifecycleOrder,
} from '@/lib/order-lifecycle-server';
import {
  checkApiRateLimit,
  getAdminActorId,
  RATE_LIMITS,
  validateAdminRequest,
  validatePagination,
  validateSearchParam,
} from '@/lib/security';

const transitionTargets = [
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
    targetStatus: z.enum(transitionTargets),
    carrier: z.string().trim().max(120).optional(),
    trackingNumber: z.string().trim().max(160).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .strict();

export async function GET(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  try {
    const { searchParams } = new URL(request.url);
    const search = validateSearchParam(searchParams.get('search') || '', 180);
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const createdAt: Prisma.DateTimeFilter | undefined =
      startDate || endDate
        ? {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
          }
        : undefined;
    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : {}),
      ...(createdAt ? { createdAt } : {}),
      ...(search
        ? {
            OR: [
              { orderNumber: { contains: search, mode: 'insensitive' } },
              { user: { name: { contains: search, mode: 'insensitive' } } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
              { store: { name: { contains: search, mode: 'insensitive' } } },
              { items: { some: { variant: { sku: { contains: search, mode: 'insensitive' } } } } },
            ],
          }
        : {}),
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
      orders: orders.map((order) => serializeLifecycleOrder(order, 'admin')),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin orders GET error:', error);
    return NextResponse.json({ error: 'Failed to load platform orders.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;
  const actorId = getAdminActorId(request);
  if (!actorId) {
    return NextResponse.json(
      { error: 'An administrator identity is required.' },
      { status: 401 },
    );
  }

  const parsed = transitionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid order transition.' }, { status: 400 });
  }

  try {
    const updated = await db.$transaction(
      async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: parsed.data.orderId },
          include: lifecycleOrderInclude,
        });
        if (!order) throw new OrderLifecycleError('Order not found.', 404);
        const result = await applyOrderTransition(tx, order, {
          targetStatus: parsed.data.targetStatus,
          actorId,
          actorRole: 'admin',
          carrier: parsed.data.carrier,
          trackingNumber: parsed.data.trackingNumber,
          note: parsed.data.note,
        });
        await tx.auditLog.create({
          data: {
            adminId: actorId,
            action: `order_status_${parsed.data.targetStatus}`,
            targetType: 'order',
            targetId: order.id,
            details: JSON.stringify({
              orderNumber: order.orderNumber,
              previousStatus: order.status,
              newStatus: parsed.data.targetStatus,
              note: parsed.data.note || null,
            }),
          },
        });
        return result;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 15_000,
      },
    );

    return NextResponse.json({
      success: true,
      order: serializeLifecycleOrder(updated, 'admin'),
    });
  } catch (error) {
    if (error instanceof OrderLifecycleError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.error('Admin orders PUT error:', error);
    return NextResponse.json({ error: 'The order could not be updated.' }, { status: 500 });
  }
}
