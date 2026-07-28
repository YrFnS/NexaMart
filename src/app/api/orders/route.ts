import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuthenticatedUser } from '@/lib/auth';
import { checkApiRateLimit, RATE_LIMITS, validateEnum } from '@/lib/security';

const VALID_ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
] as const;

export async function GET(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.general);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const auth = await requireAuthenticatedUser(request);
  if (auth.response || !auth.user) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId') || auth.user.id;
    const statusRaw = searchParams.get('status');
    const status = statusRaw ? validateEnum(statusRaw, [...VALID_ORDER_STATUSES]) : undefined;

    if (requestedUserId !== auth.user.id && auth.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const where: Record<string, unknown> = { userId: requestedUserId };
    if (status) where.status = status;

    const orders = await db.order.findMany({
      where,
      include: {
        items: { include: { product: true } },
        store: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const response = NextResponse.json(orders);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
