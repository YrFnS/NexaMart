import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  requireAdminAuth,
} from '@/lib/security';

const reportableOrderWhere = {
  status: { notIn: ['cancelled', 'rejected'] },
} as const;

function emptyDashboard() {
  return {
    kpi: {
      recordedOrderValue: 0,
      totalUsers: 0,
      activeSellers: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalStores: 0,
      avgOrderValue: 0,
      deliveredOrders: 0,
    },
    orderValueChart: [],
    ordersByStatus: [],
    categoryDist: [],
    topStores: [],
    recentSignups: [],
    recentDisputes: [],
  };
}

export async function GET(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }

  try {
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      totalStores,
      activeSellers,
      deliveredOrders,
      orderAggregate,
      ordersByStatusRaw,
      categoryDistRaw,
      categories,
      topStoresRaw,
      recentUsers,
      recentDisputesRaw,
    ] = await Promise.all([
      db.user.count(),
      db.order.count(),
      db.product.count({ where: { status: 'active' } }),
      db.store.count(),
      db.store.count({ where: { productCount: { gt: 0 } } }),
      db.order.count({ where: { status: 'delivered' } }),
      db.order.aggregate({
        where: reportableOrderWhere,
        _sum: { total: true },
        _avg: { total: true },
      }),
      db.order.groupBy({
        by: ['status'],
        orderBy: { status: 'asc' },
        _count: { status: true },
      }),
      db.product.groupBy({
        by: ['categoryId'],
        where: { status: 'active' },
        orderBy: { categoryId: 'asc' },
        _count: { categoryId: true },
      }),
      db.category.findMany({ select: { id: true, name: true } }),
      db.store.findMany({
        take: 5,
        orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true,
          name: true,
          rating: true,
          orders: {
            where: reportableOrderWhere,
            select: { total: true },
          },
        },
      }),
      db.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { name: true, email: true, role: true, createdAt: true },
      }),
      db.dispute.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { select: { orderNumber: true } },
          buyer: { select: { name: true } },
          seller: {
            select: { name: true, store: { select: { name: true } } },
          },
        },
      }),
    ]);

    const categoryById = new Map(
      categories.map((category) => [category.id, category.name]),
    );
    const categoryDist = categoryDistRaw.map((entry) => ({
      category: categoryById.get(entry.categoryId) || 'Other',
      value: entry._count.categoryId,
    }));

    const ordersByStatus = ordersByStatusRaw.map((entry) => ({
      status: entry.status,
      count: entry._count.status,
    }));

    const topStores = topStoresRaw.map((store) => ({
      id: store.id,
      name: store.name,
      orderValue: store.orders.reduce(
        (sum, order) => sum + Number(order.total),
        0,
      ),
      orders: store.orders.length,
      rating: store.rating,
    }));

    const recentSignups = recentUsers.map((user) => ({
      name: user.name || 'Unknown',
      email: user.email,
      role: user.role,
      date: user.createdAt.toISOString(),
    }));

    const recentDisputes = recentDisputesRaw.map((dispute) => ({
      orderNum: dispute.order.orderNumber,
      buyer: dispute.buyer.name || 'Unknown',
      seller:
        dispute.seller.store?.[0]?.name ||
        dispute.seller.name ||
        'Unknown',
      reason: dispute.reason,
      status: dispute.status,
    }));

    const now = new Date();
    const twelveMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 11,
      1,
    );
    const ordersForChart = await db.order.findMany({
      where: {
        ...reportableOrderWhere,
        createdAt: { gte: twelveMonthsAgo },
      },
      select: { createdAt: true, total: true },
      orderBy: { createdAt: 'asc' },
    });

    const orderValueByMonth = new Map<string, number>();
    for (let offset = 11; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      orderValueByMonth.set(key, 0);
    }
    for (const order of ordersForChart) {
      const key = `${order.createdAt.getFullYear()}-${String(
        order.createdAt.getMonth() + 1,
      ).padStart(2, '0')}`;
      orderValueByMonth.set(
        key,
        (orderValueByMonth.get(key) || 0) + Number(order.total),
      );
    }
    const orderValueChart = [...orderValueByMonth.entries()].map(
      ([month, value]) => ({ month, value: Math.round(value * 100) / 100 }),
    );

    return NextResponse.json({
      kpi: {
        recordedOrderValue: Number(orderAggregate._sum.total || 0),
        totalUsers,
        activeSellers,
        totalOrders,
        totalProducts,
        totalStores,
        avgOrderValue:
          Math.round(Number(orderAggregate._avg.total || 0) * 100) / 100,
        deliveredOrders,
      },
      orderValueChart,
      ordersByStatus,
      categoryDist,
      topStores,
      recentSignups,
      recentDisputes,
    });
  } catch (error) {
    console.error('Admin dashboard API error:', error);
    return NextResponse.json(emptyDashboard(), { status: 500 });
  }
}
