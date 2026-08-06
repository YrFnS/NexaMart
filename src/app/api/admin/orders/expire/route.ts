import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  applyOrderTransition,
  lifecycleOrderInclude,
  OrderLifecycleError,
} from '@/lib/order-lifecycle-server';
import {
  getAdminActorId,
  validateAdminRequest,
} from '@/lib/security';

const inputSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function POST(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;
  const actorId = getAdminActorId(request);
  if (!actorId) {
    return NextResponse.json(
      { error: 'An administrator identity is required.' },
      { status: 401 },
    );
  }

  const parsed = inputSchema.safeParse(
    await request.json().catch(() => ({})),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid expiration request.' }, { status: 400 });
  }

  const now = new Date();
  const candidates = await db.order.findMany({
    where: {
      status: 'pending',
      confirmationExpiresAt: { lte: now },
      inventoryRestoredAt: null,
    },
    select: { id: true },
    orderBy: { confirmationExpiresAt: 'asc' },
    take: parsed.data.limit,
  });

  let expired = 0;
  const failures: { orderId: string; error: string }[] = [];
  for (const candidate of candidates) {
    try {
      const didExpire = await db.$transaction(
        async (tx) => {
          const order = await tx.order.findUnique({
            where: { id: candidate.id },
            include: lifecycleOrderInclude,
          });
          if (
            !order ||
            order.status !== 'pending' ||
            !order.confirmationExpiresAt ||
            order.confirmationExpiresAt > now
          ) {
            return false;
          }
          await applyOrderTransition(tx, order, {
            targetStatus: 'cancelled',
            actorId,
            actorRole: 'system',
            note: 'Seller confirmation window expired',
          });
          return true;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5_000,
          timeout: 15_000,
        },
      );
      if (didExpire) expired += 1;
    } catch (error) {
      failures.push({
        orderId: candidate.id,
        error:
          error instanceof OrderLifecycleError || error instanceof Error
            ? error.message
            : 'Unknown expiration error',
      });
    }
  }

  return NextResponse.json({
    success: failures.length === 0,
    inspected: candidates.length,
    expired,
    failures,
  });
}
