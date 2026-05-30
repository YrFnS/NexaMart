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
    // Run all aggregation queries in parallel
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      totalStores,
      orderAgg,
    ] = await Promise.all([
      db.user.count(),
      db.order.count(),
      db.product.count(),
      db.store.count(),
      db.order.aggregate({
        _sum: { total: true },
        _avg: { total: true },
      }),
    ]);

    const platformRevenue = (orderAgg._sum.total || 0) * 0.1; // 10% commission estimate
    const avgOrderValue = orderAgg._avg.total || 0;

    // Get orders by status
    const ordersByStatusRaw = await db.order.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const ordersByStatus = ordersByStatusRaw.map((item) => ({
      status: item.status.charAt(0).toUpperCase() + item.status.slice(1),
      count: item._count.status,
    }));

    // Get category distribution
    const categoryDistRaw = await db.product.groupBy({
      by: ['categoryId'],
      _count: { categoryId: true },
      where: { status: 'active' },
    });

    // Get category names
    const categories = await db.category.findMany({
      select: { id: true, name: true },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    const categoryDist = categoryDistRaw.map((item) => ({
      category: categoryMap.get(item.categoryId) || 'Other',
      value: item._count.categoryId,
    }));

    // Get top sellers by revenue
    const topStores = await db.store.findMany({
      take: 5,
      orderBy: { rating: 'desc' },
      select: {
        name: true,
        rating: true,
        productCount: true,
        orders: {
          select: { total: true },
        },
      },
    });

    const topSellers = topStores.map((store) => ({
      name: store.name,
      revenue: store.orders.reduce((sum, o) => sum + o.total, 0),
      orders: store.orders.length,
      rating: store.rating,
    }));

    // Get recent signups
    const recentUsers = await db.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { name: true, email: true, role: true, createdAt: true },
    });

    const recentSignups = recentUsers.map((u) => ({
      name: u.name || 'Unknown',
      email: u.email,
      role: u.role,
      date: u.createdAt.toISOString().split('T')[0],
    }));

    // Get recent disputes
    const recentDisputesRaw = await db.dispute.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        order: { select: { orderNumber: true } },
        buyer: { select: { name: true } },
        seller: { select: { name: true, store: { select: { name: true } } } },
      },
    });

    const recentDisputes = recentDisputesRaw.map((d) => ({
      orderNum: d.order.orderNumber,
      buyer: d.buyer.name || 'Unknown',
      seller: d.seller.store?.[0]?.name || d.seller.name || 'Unknown',
      reason: d.reason,
      status: d.status,
    }));

    // Revenue chart - aggregate by month (last 12 months)
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const ordersForChart = await db.order.findMany({
      where: { createdAt: { gte: twelveMonthsAgo }, status: { not: 'cancelled' } },
      select: { createdAt: true, total: true },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueByMonth: Record<string, number> = {};

    for (const order of ordersForChart) {
      const monthKey = `${monthNames[order.createdAt.getMonth()]} ${order.createdAt.getFullYear()}`;
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + order.total;
    }

    const revenueChart = Object.entries(revenueByMonth).map(([month, revenue]) => ({
      month: month.split(' ')[0],
      revenue: Math.round(revenue),
    }));

    const activeSellers = await db.store.count({
      where: { productCount: { gt: 0 } },
    });

    const dashboardData = {
      kpi: {
        gmv: orderAgg._sum.total || 0,
        gmvChange: 0,
        totalUsers,
        totalUsersChange: 0,
        activeSellers,
        activeSellersChange: 0,
        totalOrders,
        totalOrdersChange: 0,
        platformRevenue: Math.round(platformRevenue),
        platformRevenueChange: 0,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        avgOrderValueChange: 0,
      },
      revenueChart,
      ordersByStatus,
      categoryDist,
      topSellers,
      recentSignups,
      recentDisputes,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Admin Dashboard API error:', error);
    // Return zeros if DB query fails
    return NextResponse.json({
      kpi: {
        gmv: 0, gmvChange: 0,
        totalUsers: 0, totalUsersChange: 0,
        activeSellers: 0, activeSellersChange: 0,
        totalOrders: 0, totalOrdersChange: 0,
        platformRevenue: 0, platformRevenueChange: 0,
        avgOrderValue: 0, avgOrderValueChange: 0,
      },
      revenueChart: [],
      ordersByStatus: [],
      categoryDist: [],
      topSellers: [],
      recentSignups: [],
      recentDisputes: [],
    });
  }
}
