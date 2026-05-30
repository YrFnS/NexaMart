import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sanitizeString, checkApiRateLimit, RATE_LIMITS, requireAdminAuth } from '@/lib/security';

export async function GET(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    // Query notifications sent by admin (broadcast notifications)
    const notifications = await db.notification.findMany({
      where: { type: { in: ['system', 'promotion'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      distinct: ['title'],
    });

    const result = notifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      target: 'All Users',
      type: n.type === 'promotion' ? 'Promotion' : n.type === 'system' ? 'System' : 'Order',
      sentAt: n.createdAt.toISOString().replace('T', ' ').slice(0, 16),
      sentBy: 'Admin',
    }));

    return NextResponse.json({ notifications: result, total: result.length });
  } catch (error) {
    console.error('Admin push GET error:', error);
    return NextResponse.json({ notifications: [], total: 0 });
  }
}

export async function POST(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const body = await request.json();
    const { titleEn, titleAr, messageEn, messageAr, target, type } = body;

    if (!titleEn || !messageEn) {
      return NextResponse.json({ error: 'Missing title or message' }, { status: 400 });
    }

    // Validate and sanitize inputs
    if (typeof titleEn !== 'string' || titleEn.length > 200) {
      return NextResponse.json({ error: 'Title must be a string under 200 chars' }, { status: 400 });
    }
    if (typeof messageEn !== 'string' || messageEn.length > 1000) {
      return NextResponse.json({ error: 'Message must be a string under 1000 chars' }, { status: 400 });
    }

    // Validate target
    const validTargets = ['all', 'buyers', 'sellers'];
    if (target && !validTargets.includes(target)) {
      return NextResponse.json({ error: 'Invalid target' }, { status: 400 });
    }

    // Validate type
    const validTypes = ['system', 'promotion', 'order'];
    if (type && !validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const safeTitleEn = sanitizeString(titleEn);
    const safeMessageEn = sanitizeString(messageEn);

    // Create individual notification records for target users
    const userWhere: Record<string, unknown> = {};
    if (target === 'buyers') userWhere.role = 'buyer';
    else if (target === 'sellers') userWhere.role = 'seller';

    const targetUsers = await db.user.findMany({
      where: userWhere,
      select: { id: true },
    });

    if (targetUsers.length > 0) {
      await db.notification.createMany({
        data: targetUsers.map(u => ({
          userId: u.id,
          title: safeTitleEn,
          titleAr: titleAr ? sanitizeString(titleAr) : null,
          message: safeMessageEn,
          messageAr: messageAr ? sanitizeString(messageAr) : null,
          type: type || 'system',
        })),
      });
    }

    return NextResponse.json({ success: true, recipientCount: targetUsers.length });
  } catch (error) {
    console.error('Admin push POST error:', error);
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 });
  }
}
