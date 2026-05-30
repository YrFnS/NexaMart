import { db } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const storeId = searchParams.get('storeId');

    if (!userId && !storeId) {
      return Response.json(
        { error: 'Either userId or storeId query parameter is required' },
        { status: 400 }
      );
    }

    // Resolve the store: use storeId directly, or look up by userId
    let store;
    if (storeId) {
      store = await db.store.findUnique({ where: { id: storeId } });
    } else if (userId) {
      store = await db.store.findUnique({ where: { ownerId: userId } });
    }

    if (!store) {
      return Response.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    const storeFilter = { storeId: store.id };

    const [
      totalProducts,
      totalOrders,
      revenue,
      recentOrders,
      topProducts,
    ] = await Promise.all([
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
        include: { user: { select: { name: true } } },
      }),
      db.product.findMany({
        where: { storeId: store.id },
        take: 5,
        orderBy: { soldCount: 'desc' },
      }),
    ]);

    // Calculate monthly sales from real order data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const orders = await db.order.findMany({
      where: {
        storeId: store.id,
        status: { in: ['delivered', 'shipped', 'processing'] },
        createdAt: { gte: sixMonthsAgo },
      },
      select: {
        total: true,
        createdAt: true,
      },
    });

    // Group by month
    const monthlySalesMap = new Map<string, number>();
    for (const order of orders) {
      const monthKey = order.createdAt.toISOString().slice(0, 7); // "2025-01"
      monthlySalesMap.set(monthKey, (monthlySalesMap.get(monthKey) || 0) + order.total);
    }

    const monthlySales = Array.from(monthlySalesMap.entries())
      .map(([month, revenue]) => ({ month, sales: revenue }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // visitorCount: The Product model does not have a views field,
    // so we cannot compute total views from products.
    // This requires an analytics tracking system to be implemented.
    const visitorCount: number | null = null;

    // conversionRate: Cannot be accurately calculated without a views/visits metric.
    // Would require analytics tracking to compute (totalOrders / totalViews) * 100.
    const conversionRate: number | null = null;

    return Response.json({
      totalProducts,
      totalOrders,
      revenue: revenue._sum.total || 0,
      recentOrders,
      topProducts,
      visitorCount,
      conversionRate,
      monthlySales,
    });
  } catch (error) {
    console.error('Seller dashboard error:', error);
    return Response.json({ error: 'Failed to fetch seller dashboard' }, { status: 500 });
  }
}
