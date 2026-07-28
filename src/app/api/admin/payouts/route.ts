import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  requireAdminAuth,
  validateCsrf,
} from '@/lib/security';

class PayoutError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'PayoutError';
  }
}

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

export async function GET(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  try {
    const status = cleanText(new URL(request.url).searchParams.get('status'), 30);
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const payouts = await db.payout.findMany({
      where,
      orderBy: { requestedAt: 'desc' },
      take: 100,
      include: {
        store: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
    });

    const result = payouts.map(payout => ({
      id: payout.id,
      store: payout.store.name,
      storeId: payout.storeId,
      sellerId: payout.sellerId,
      sellerName: payout.seller.name || 'Unknown',
      amount: Number(payout.amount),
      method: payout.method,
      status: payout.status,
      requestedDate: payout.requestedAt.toISOString().slice(0, 10),
      processedAt: payout.processedAt?.toISOString().slice(0, 10),
      notes: payout.notes,
    }));

    const response = NextResponse.json({ payouts: result, total: result.length });
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    console.error('Admin payouts GET error:', error);
    return NextResponse.json({ error: 'Failed to load payouts' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;

  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.error || 'Invalid request origin' }, { status: 403 });
  }

  const admin = await getCurrentUser(request);
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const payoutId = cleanText(body.payoutId, 80);
    const action = cleanText(body.action, 20);
    const notes = cleanText(body.notes, 1000);

    if (!payoutId || !['process', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Provide a payoutId and use action "process" or "reject".' },
        { status: 400 },
      );
    }

    const result = await db.$transaction(
      async tx => {
        const payout = await tx.payout.findUnique({ where: { id: payoutId } });
        if (!payout) throw new PayoutError('Payout not found.', 404);
        if (payout.status !== 'pending') {
          throw new PayoutError(
            `Payout has already been ${payout.status}; it cannot be processed again.`,
            409,
          );
        }

        const nextStatus = action === 'process' ? 'completed' : 'rejected';
        if (nextStatus === 'completed') {
          const walletUpdate = await tx.user.updateMany({
            where: {
              id: payout.sellerId,
              walletBalance: { gte: payout.amount },
            },
            data: { walletBalance: { decrement: payout.amount } },
          });
          if (walletUpdate.count !== 1) {
            throw new PayoutError('Seller wallet balance is insufficient.', 409);
          }
        }

        const payoutUpdate = await tx.payout.updateMany({
          where: { id: payoutId, status: 'pending' },
          data: {
            status: nextStatus,
            processedAt: new Date(),
            notes: notes || null,
          },
        });
        if (payoutUpdate.count !== 1) {
          throw new PayoutError('Payout was changed by another request.', 409);
        }

        await tx.auditLog.create({
          data: {
            adminId: admin.id,
            action: nextStatus === 'completed' ? 'process_payout' : 'reject_payout',
            targetType: 'payout',
            targetId: payoutId,
            details: JSON.stringify({
              previousStatus: payout.status,
              nextStatus,
              sellerId: payout.sellerId,
              storeId: payout.storeId,
              amount: Number(payout.amount),
              notes: notes || null,
            }),
          },
        });

        return { payoutId, status: nextStatus };
      },
      { isolationLevel: 'Serializable' },
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof PayoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Admin payouts PUT error:', error);
    return NextResponse.json({ error: 'Failed to update payout' }, { status: 500 });
  }
}
