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
    const status = searchParams.get('status') || 'pending';

    // Query products that need moderation (status='pending' or flagged)
    const where: Record<string, unknown> = {};
    if (status === 'pending') {
      where.status = 'pending';
    } else if (status !== 'all') {
      where.status = status;
    }

    const products = await db.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        store: { select: { id: true, name: true } },
      },
      take: 50,
    });

    const items = products.map(p => ({
      id: p.id,
      product: p.name,
      store: p.store.name,
      reporter: 'AI System',
      reason: 'AI Flag',
      date: p.createdAt.toISOString().slice(0, 10),
      status: p.status,
      productId: p.id,
    }));

    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    console.error('Admin content GET error:', error);
    return NextResponse.json({ items: [], total: 0 });
  }
}

export async function PUT(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const body = await request.json();
    const { itemId, action } = body;

    if (!itemId || !action) {
      return NextResponse.json({ error: 'Missing itemId or action' }, { status: 400 });
    }

    if (action === 'remove') {
      // Archive the product
      await db.product.update({
        where: { id: itemId },
        data: { status: 'archived' },
      }).catch(() => {/* product may not exist */});
    } else if (action === 'dismiss') {
      // Reactivate the product
      await db.product.update({
        where: { id: itemId },
        data: { status: 'active' },
      }).catch(() => {/* product may not exist */});
    }

    return NextResponse.json({ success: true, itemId, status: action === 'remove' ? 'removed' : 'dismissed' });
  } catch (error) {
    console.error('Admin content PUT error:', error);
    return NextResponse.json({ error: 'Failed to update flagged content' }, { status: 500 });
  }
}
