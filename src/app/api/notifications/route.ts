import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuthenticatedUser } from '@/lib/auth';
import { checkApiRateLimit, RATE_LIMITS } from '@/lib/security';

export async function GET(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.general);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const auth = await requireAuthenticatedUser(request);
  if (auth.response || !auth.user) return auth.response;

  try {
    const requestedUserId = new URL(request.url).searchParams.get('userId') || auth.user.id;
    if (requestedUserId !== auth.user.id && auth.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const notifications = await db.notification.findMany({
      where: { userId: requestedUserId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const response = NextResponse.json(notifications);
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('Notifications API error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
