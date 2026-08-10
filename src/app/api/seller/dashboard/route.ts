import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { checkApiRateLimit, RATE_LIMITS } from '@/lib/security';

export async function GET(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.general);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const auth = await requireUserRole(request, ['seller', 'admin']);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const requestedStoreId = searchParams.get('storeId');
    const requestedUserId = searchParams.get('userId');

    const store =
      auth.user.role === 'admin'
        ? await db.store.findFirst({
            where: requestedStoreId
              ? { id: requestedStoreId }
              : requestedUserId
                ? { ownerId: requestedUserId }
                : undefined,
          })
        : await db.store.findFirst({
            where: {
              ...(requestedStoreId ? { id: requestedStoreId } : {}),
              OR: [
                { ownerId: auth.user.id },
                {
                  staff: {
                    some: {
                      userId: auth.user.id,
                      status: 'active',
                      role: { in: ['owner', 'manager', 'editor'] },
                    },
                  },
                },
              ],
            },
          });

    if (!store) {
      return NextResponse.json(
        { error: 'An accessible seller store was not found.' },
        { status: auth.user.role === 'admin' ? 404 : 403 },
      );
    }

    const storeFilter = { storeId: store.id };
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      totalProducts,
      totalOrders,
      revenue,
      recentOrders,
      topProducts,
      recentSales,
    ] = await db.$transaction([
      db.product.count({ where: { storeId: store.id } }),
      db.order.count({ where: storeFilter }),
      db.order.aggregate({
        where: { ...storeFilter, paymentStatus: 'paid' },
        _sum: { total: true },
      }),
      db.order.findMany({
        where: storeFilter,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      }),
      db.product.findMany({
        where: { storeId: store.id },
        take: 5,
        orderBy: { soldCount: 'desc' },
      }),
      db.order.findMany({
        where: {
          storeId: store.id,
          status: { in: ['delivered', 'shipped', 'processing'] },
          createdAt: { gte: sixMonthsAgo },
        },
        select: { total: true, createdAt: true },
      }),
    ]);

    const monthlySalesMap = new Map<string, number>();
    for (const order of recentSales) {
      const monthKey = order.createdAt.toISOString().slice(0, 7);
      monthlySalesMap.set(
        monthKey,
        (monthlySalesMap.get(monthKey) || 0) + Number(order.total),
      );
    }

    const monthlySales = [...monthlySalesMap.entries()]
      .map(([month, monthlyRevenue]) => ({
        month,
        sales: monthlyRevenue,
      }))
      .sort((first, second) => first.month.localeCompare(second.month));

    return NextResponse.json({
      store: {
        id: store.id,
        name: store.name,
        nameAr: store.nameAr,
      },
      totalProducts,
      totalOrders,
      revenue: Number(revenue._sum.total || 0),
      recentOrders,
      topProducts,
      visitorCount: null,
      conversionRate: null,
      monthlySales,
    });
  } catch (error) {
    console.error('Seller dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seller dashboard.' },
      { status: 500 },
    );
  }
}
