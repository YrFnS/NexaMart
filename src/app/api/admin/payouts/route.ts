import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  validateAdminRequest,
  validateEnum,
  validatePagination,
} from '@/lib/security';

const PAYOUT_STATUSES = [
  'pending',
  'processing',
  'completed',
  'rejected',
] as const;

export async function GET(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const statusRaw = searchParams.get('status');
    const status = statusRaw
      ? validateEnum(statusRaw, PAYOUT_STATUSES)
      : null;
    if (statusRaw && !status) {
      return NextResponse.json({ error: 'Invalid payout status.' }, { status: 400 });
    }
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
      enabled: false,
      message: 'Payout processing is disabled because NexaMart does not process payments in this release.',
      payouts: payouts.map((payout) => ({
        id: payout.id,
        store: payout.store.name,
        sellerName: payout.seller.name || payout.seller.email,
        amount: Number(payout.amount),
        method: payout.method,
        status: payout.status,
        requestedDate: payout.requestedAt.toISOString().slice(0, 10),
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin payouts GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch payout history.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;
  return NextResponse.json(
    {
      error: 'Payout processing is disabled in the paymentless release.',
      code: 'PAYMENTS_DISABLED',
    },
    { status: 410 },
  );
}
