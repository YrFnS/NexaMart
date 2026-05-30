import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validatePagination, validateSearchParam, validateEnum, isValidId, checkApiRateLimit, RATE_LIMITS, requireAdminAuth } from '@/lib/security';

const VALID_ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;

export async function GET(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const { searchParams } = new URL(request.url);
    const searchRaw = searchParams.get('search') || '';
    const search = searchRaw ? validateSearchParam(searchRaw) : '';
    const statusRaw = searchParams.get('status') || '';
    const status = statusRaw ? validateEnum(statusRaw, [...VALID_ORDER_STATUSES]) || '' : '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const { page, limit } = validatePagination(searchParams.get('page'), searchParams.get('limit'), 100);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }
    if (startDate || endDate) {
      const createdAt: Record<string, Date> = {};
      if (startDate) createdAt.gte = new Date(startDate);
      if (endDate) createdAt.lte = new Date(endDate);
      where.createdAt = createdAt;
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          store: { select: { id: true, name: true } },
          items: { select: { id: true, productId: true, quantity: true, price: true, total: true } },
        },
      }),
      db.order.count({ where }),
    ]);

    const result = orders.map(o => ({
      id: o.id,
      orderNumber: o.orderNumber,
      userId: o.userId,
      customerName: o.user.name || 'Unknown',
      customerEmail: o.user.email,
      storeId: o.storeId,
      storeName: o.store?.name || 'Unknown',
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod,
      subtotal: o.subtotal,
      shippingCost: o.shippingCost,
      discount: o.discount,
      tax: o.tax,
      total: o.total,
      trackingNumber: o.trackingNumber,
      carrier: o.carrier,
      notes: o.notes,
      itemCount: o.items.length,
      createdAt: o.createdAt.toISOString(),
      updatedAt: o.updatedAt.toISOString(),
    }));

    return NextResponse.json({ orders: result, total, page, limit });
  } catch (error) {
    console.error('Admin orders GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const body = await request.json();
    const { orderId, status, notes, adminId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // Validate orderId format
    if (typeof orderId === 'string' && !isValidId(orderId)) {
      return NextResponse.json({ error: 'Invalid orderId format' }, { status: 400 });
    }

    // Validate status if provided
    if (status && !validateEnum(status, [...VALID_ORDER_STATUSES])) {
      return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
    }

    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    await db.order.update({ where: { id: orderId }, data: updateData });

    // Create audit log
    await db.auditLog.create({
      data: {
        adminId: adminId || 'system',
        action: status ? `order_status_${status}` : 'order_updated',
        targetType: 'order',
        targetId: orderId,
        details: notes || (status ? `Order status updated to ${status}` : 'Order updated by admin'),
      },
    });

    return NextResponse.json({ success: true, orderId, status });
  } catch (error) {
    console.error('Admin orders PUT error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
