import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const LOOKBACK_DAYS = 30;
const MINIMUM_AGGREGATE_ORDERS = 3;
const MAX_PROOFS = 6;

export async function GET() {
  try {
    const cutoff = new Date(
      Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1_000,
    );
    const recentOrders = await db.order.findMany({
      where: {
        status: 'delivered',
        createdAt: { gte: cutoff },
      },
      orderBy: { createdAt: 'desc' },
      take: 250,
      select: {
        items: {
          select: {
            product: {
              select: { id: true, name: true, nameAr: true },
            },
          },
        },
      },
    });

    const aggregates = new Map<
      string,
      { name: string; nameAr: string | null; orderCount: number }
    >();

    for (const order of recentOrders) {
      const productsInOrder = new Set<string>();
      for (const item of order.items) {
        if (productsInOrder.has(item.product.id)) continue;
        productsInOrder.add(item.product.id);

        const current = aggregates.get(item.product.id);
        aggregates.set(item.product.id, {
          name: item.product.name,
          nameAr: item.product.nameAr,
          orderCount: (current?.orderCount || 0) + 1,
        });
      }
    }

    const proofs = [...aggregates.values()]
      .filter((item) => item.orderCount >= MINIMUM_AGGREGATE_ORDERS)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, MAX_PROOFS)
      .map((item) => ({
        name: `${item.orderCount} customers`,
        nameAr: `${item.orderCount} عملاء`,
        city: 'NexaMart community',
        cityAr: 'مجتمع نكسا مارت',
        product: item.name,
        productAr: item.nameAr || item.name,
        timeAgo: 'Recently',
        timeAgoAr: 'مؤخراً',
        purchaseCount: item.orderCount,
        aggregate: true,
      }));

    const response = NextResponse.json({ proofs });
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600',
    );
    return response;
  } catch (error) {
    console.error('Social proof API error:', error);
    return NextResponse.json({ proofs: [] });
  }
}
