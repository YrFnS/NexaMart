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

    const disputes = await db.dispute.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
          },
        },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true, store: { select: { name: true } } } },
      },
    });

    const result = disputes.map(d => ({
      id: d.id,
      orderNum: d.order.orderNumber,
      buyer: d.buyer.name || 'Unknown',
      seller: d.seller.store?.[0]?.name || d.seller.name || 'Unknown',
      reason: d.reason,
      date: d.createdAt.toISOString().slice(0, 10),
      status: d.status,
      amount: d.order.total,
      aiSummary: d.aiSummary,
      description: d.description,
    }));

    return NextResponse.json({ disputes: result, total: result.length });
  } catch (error) {
    console.error('Admin disputes GET error:', error);
    return NextResponse.json({ disputes: [], total: 0 });
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
    const { disputeId, resolution, resolutionNotes, adminId } = body;

    if (!disputeId || !resolution) {
      return NextResponse.json({ error: 'Missing disputeId or resolution' }, { status: 400 });
    }

    const dispute = await db.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    await db.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'resolved',
        resolution,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, disputeId, resolution });
  } catch (error) {
    console.error('Admin disputes PUT error:', error);
    return NextResponse.json({ error: 'Failed to resolve dispute' }, { status: 500 });
  }
}
