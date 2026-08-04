import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
  validatePagination,
} from '@/lib/security';

const patchSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  markAllRead: z.boolean().optional(),
});

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      100,
    );
    const unreadOnly = searchParams.get('unread') === 'true';
    const where = {
      userId: auth.user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total, unread] = await db.$transaction([
      db.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
      db.notification.count({ where: { userId: auth.user.id, isRead: false } }),
    ]);

    return NextResponse.json({ notifications, total, unread, page, limit });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications.' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Invalid request origin.' },
      { status: 403 },
    );
  }

  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (!parsed.data.id && !parsed.data.markAllRead)) {
    return NextResponse.json(
      { error: 'A notification id or markAllRead is required.' },
      { status: 400 },
    );
  }

  try {
    const updated = await db.notification.updateMany({
      where: parsed.data.markAllRead
        ? { userId: auth.user.id, isRead: false }
        : { id: parsed.data.id, userId: auth.user.id },
      data: { isRead: true },
    });

    if (!parsed.data.markAllRead && updated.count !== 1) {
      return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, updated: updated.count });
  } catch (error) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications.' },
      { status: 500 },
    );
  }
}
