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
