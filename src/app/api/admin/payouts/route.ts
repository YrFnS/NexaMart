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
    const status = searchParams.get('status') || '';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const payouts = await db.payout.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      include: {
        store: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
    });

    const result = payouts.map(p => ({
      id: p.id,
      store: p.store.name,
      storeId: p.storeId,
      sellerId: p.sellerId,
      sellerName: p.seller.name || 'Unknown',
      amount: p.amount,
      method: p.method,
      status: p.status,
      requestedDate: p.requestedAt.toISOString().slice(0, 10),
      processedAt: p.processedAt?.toISOString().slice(0, 10),
      notes: p.notes,
    }));

    return NextResponse.json({ payouts: result, total: result.length });
  } catch (error) {
    console.error('Admin payouts GET error:', error);
    return NextResponse.json({ payouts: [], total: 0 });
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
    const { payoutId, action, notes, adminId } = body;

    if (!payoutId || !action) {
      return NextResponse.json({ error: 'Missing payoutId or action' }, { status: 400 });
    }

    const payout = await db.payout.findUnique({ where: { id: payoutId } });
    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 });
    }

    const status = action === 'process' ? 'completed' : action === 'reject' ? 'rejected' : null;
    if (!status) {
      return NextResponse.json({ error: 'Invalid action. Use "process" or "reject"' }, { status: 400 });
    }

    await db.payout.update({
      where: { id: payoutId },
      data: {
        status,
        processedAt: new Date(),
        notes: notes || null,
      },
    });

    // When completed, deduct from seller's walletBalance
    if (status === 'completed') {
      const seller = await db.user.findUnique({ where: { id: payout.sellerId } });
      if (seller && seller.walletBalance >= payout.amount) {
        await db.user.update({
          where: { id: payout.sellerId },
          data: { walletBalance: seller.walletBalance - payout.amount },
        });
      }
    }

    return NextResponse.json({ success: true, payoutId, status });
  } catch (error) {
    console.error('Admin payouts PUT error:', error);
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 });
  }
}
