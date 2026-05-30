import { db } from '@/lib/db';
import { validateEnum } from '@/lib/security';

const VALID_ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const statusRaw = searchParams.get('status');
    const status = statusRaw ? validateEnum(statusRaw, [...VALID_ORDER_STATUSES]) : undefined;

    if (!userId) {
      return Response.json({ error: 'userId is required' }, { status: 400 });
    }

    const where: Record<string, unknown> = { userId };
    if (status) where.status = status;

    const orders = await db.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        store: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json(orders);
  } catch (error) {
    console.error('Orders API error:', error);
    return Response.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
