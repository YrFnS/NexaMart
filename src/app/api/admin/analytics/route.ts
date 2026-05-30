import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkApiRateLimit, RATE_LIMITS, requireAdminAuth } from '@/lib/security';

export async function GET(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';

    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const orderWhere: Record<string, unknown> = {};
    if (startDate || endDate) orderWhere.createdAt = dateFilter;

    if (type === 'sales_over_time' || type === 'overview') {
      // Sales over time - group orders by date
      const orders = await db.order.findMany({
        where: orderWhere,
        select: { createdAt: true, total: true, status: true },
        orderBy: { createdAt: 'asc' },
      });

      const dailyMap = new Map<string, { date: string; revenue: number; orders: number }>();
      for (const o of orders) {
        const dateKey = o.createdAt.toISOString().slice(0, 10);
        const existing = dailyMap.get(dateKey) || { date: dateKey, revenue: 0, orders: 0 };
        existing.revenue += o.total;
        existing.orders += 1;
        dailyMap.set(dateKey, existing);
      }
      const salesOverTime = Array.from(dailyMap.values());
      return NextResponse.json({ salesOverTime });
    }

    if (type === 'user_growth') {
      // User growth over time
      const users = await db.user.findMany({
        select: { createdAt: true, role: true },
        orderBy: { createdAt: 'asc' },
      });

      const dailyMap = new Map<string, { date: string; total: number; buyers: number; sellers: number }>();
      for (const u of users) {
        const dateKey = u.createdAt.toISOString().slice(0, 10);
        const existing = dailyMap.get(dateKey) || { date: dateKey, total: 0, buyers: 0, sellers: 0 };
        existing.total += 1;
        if (u.role === 'buyer') existing.buyers += 1;
        else if (u.role === 'seller') existing.sellers += 1;
        dailyMap.set(dateKey, existing);
      }
      const userGrowth = Array.from(dailyMap.values());
      return NextResponse.json({ userGrowth });
    }

    if (type === 'category_breakdown') {
      // Category breakdown - products per category, revenue per category
      const categories = await db.category.findMany({
        include: {
          _count: { select: { products: true } },
          products: {
            select: { soldCount: true, price: true },
          },
        },
      });

      const categoryBreakdown = categories.map(c => ({
        id: c.id,
        name: c.name,
        productCount: c._count.products,
        estimatedRevenue: c.products.reduce((sum, p) => sum + (p.soldCount * p.price), 0),
      }));

      return NextResponse.json({ categoryBreakdown });
    }

    if (type === 'revenue_by_store') {
      // Revenue by store
      const storeAgg = await db.order.groupBy({
        by: ['storeId'],
        _sum: { total: true },
        _count: { id: true },
        where: { storeId: { not: null }, ...orderWhere },
        orderBy: { _sum: { total: 'desc' } },
        take: 20,
      });

      const storeIds = storeAgg.map(s => s.storeId).filter(Boolean) as string[];
      const stores = await db.store.findMany({
        where: { id: { in: storeIds } },
        select: { id: true, name: true, tier: true },
      });
      const storeMap = new Map(stores.map(s => [s.id, s]));

      const revenueByStore = storeAgg.map(s => ({
        storeId: s.storeId,
        storeName: storeMap.get(s.storeId!)?.name || 'Unknown',
        tier: storeMap.get(s.storeId!)?.tier || 'free',
        revenue: s._sum.total || 0,
        orders: s._count.id,
      }));

      return NextResponse.json({ revenueByStore });
    }

    if (type === 'order_status_breakdown') {
      const statusCounts = await db.order.groupBy({
        by: ['status'],
        _count: { status: true },
        _sum: { total: true },
      });

      const orderStatusBreakdown = statusCounts.map(s => ({
        status: s.status,
        count: s._count.status,
        revenue: s._sum.total || 0,
      }));

      return NextResponse.json({ orderStatusBreakdown });
    }

    // Default overview
    const [
      totalUsers,
      totalSellers,
      totalOrders,
      totalProducts,
      orderAgg,
      recentOrders,
      totalStores,
      pendingKYC,
      openDisputes,
      pendingPayouts,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: 'seller' } }),
      db.order.count({ where: orderWhere }),
      db.product.count(),
      db.order.aggregate({ where: orderWhere, _sum: { total: true }, _avg: { total: true } }),
      db.order.findMany({ where: orderWhere, take: 10, orderBy: { createdAt: 'desc' }, select: { orderNumber: true, total: true, status: true, createdAt: true } }),
      db.store.count(),
      db.store.count({ where: { isVerified: false } }),
      db.dispute.count({ where: { status: { in: ['open', 'under_review'] } } }),
      db.payout.count({ where: { status: 'pending' } }),
    ]);

    return NextResponse.json({
      overview: {
        totalUsers,
        totalSellers,
        totalStores,
        totalOrders,
        totalProducts,
        totalRevenue: orderAgg._sum.total || 0,
        avgOrderValue: orderAgg._avg.total || 0,
        pendingKYC,
        openDisputes,
        pendingPayouts,
        recentOrders: recentOrders.map(o => ({
          orderNumber: o.orderNumber,
          total: o.total,
          status: o.status,
          date: o.createdAt.toISOString().slice(0, 10),
        })),
      },
    });
  } catch (error) {
    console.error('Admin analytics GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
