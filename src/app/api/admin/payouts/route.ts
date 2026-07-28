import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { validateAdminRequest, validatePagination } from '@/lib/security';
import { getSessionClaims } from '@/lib/session';

const updateSchema = z.object({
  payoutId: z.string().min(1).max(64),
  action: z.enum(['process', 'reject']),
  notes: z.string().trim().max(500).optional(),
});

class PayoutError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

export async function GET(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      100,
    );
    const where = status ? { status } : {};

    const [payouts, total] = await db.$transaction([
      db.payout.findMany({
        where,
        orderBy: { requestedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          store: { select: { id: true, name: true } },
          seller: { select: { id: true, name: true, email: true } },
        },
      }),
      db.payout.count({ where }),
    ]);

    return NextResponse.json({
      payouts: payouts.map((payout) => ({
        id: payout.id,
        store: payout.store.name,
        storeId: payout.storeId,
        sellerId: payout.sellerId,
        sellerName: payout.seller.name || payout.seller.email,
        amount: Number(payout.amount),
        method: payout.method,
        status: payout.status,
        requestedDate: payout.requestedAt.toISOString().slice(0, 10),
        processedAt: payout.processedAt?.toISOString().slice(0, 10) || null,
        notes: payout.notes,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin payouts GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch payouts.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payout action.' }, { status: 400 });
  }

  const adminId = getSessionClaims(request)?.sub;

  try {
    const result = await db.$transaction(
      async (tx) => {
        const payout = await tx.payout.findUnique({
          where: { id: parsed.data.payoutId },
        });
        if (!payout) throw new PayoutError('Payout not found.', 404);

        const targetStatus = parsed.data.action === 'process' ? 'completed' : 'rejected';
        if (payout.status === targetStatus) {
          return { payoutId: payout.id, status: payout.status, idempotentReplay: true };
        }
        if (payout.status === 'completed' || payout.status === 'rejected') {
          throw new PayoutError(
            `A ${payout.status} payout cannot be changed.`,
            409,
          );
        }

        if (targetStatus === 'completed') {
          const wallet = await tx.user.updateMany({
            where: {
              id: payout.sellerId,
              walletBalance: { gte: payout.amount },
            },
            data: { walletBalance: { decrement: payout.amount } },
          });
          if (wallet.count !== 1) {
            throw new PayoutError('Seller wallet balance is insufficient.', 409);
          }
        }

        const updated = await tx.payout.updateMany({
          where: {
            id: payout.id,
            status: { in: ['pending', 'processing'] },
          },
          data: {
            status: targetStatus,
            processedAt: new Date(),
            notes: parsed.data.notes || null,
          },
        });
        if (updated.count !== 1) {
          throw new PayoutError('Payout status changed during processing.', 409);
        }

        if (adminId) {
          await tx.auditLog.create({
            data: {
              adminId,
              action: targetStatus === 'completed' ? 'process' : 'reject',
              targetType: 'payout',
              targetId: payout.id,
              details: JSON.stringify({
                amount: Number(payout.amount),
                sellerId: payout.sellerId,
                notes: parsed.data.notes || null,
              }),
            },
          });
        }

        return {
          payoutId: payout.id,
          status: targetStatus,
          idempotentReplay: false,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 10_000,
      },
    );

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (error instanceof PayoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Admin payouts PUT error:', error);
    return NextResponse.json({ error: 'Failed to update payout.' }, { status: 500 });
  }
}
