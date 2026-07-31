import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  applyOrderTransition,
  lifecycleOrderInclude,
  OrderLifecycleError,
  serializeLifecycleOrder,
} from '@/lib/order-lifecycle-server';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
} from '@/lib/security';

const transitionSchema = z
  .object({
    targetStatus: z.literal('cancelled'),
    reason: z.string().trim().min(3).max(500).optional(),
  })
  .strict();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
  if (auth.user.role === 'seller') {
    return NextResponse.json({ error: 'Buyer access is required.' }, { status: 403 });
  }

  const parsed = transitionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid cancellation request.' }, { status: 400 });
  }

  const { id } = await params;
  try {
    const updated = await db.$transaction(
      async (tx) => {
        const order = await tx.order.findFirst({
          where: {
            id,
            ...(auth.user.role === 'admin'
              ? {}
              : { userId: auth.user.id }),
          },
          include: lifecycleOrderInclude,
        });
        if (!order) {
          throw new OrderLifecycleError('Order not found.', 404);
        }
        return applyOrderTransition(tx, order, {
          targetStatus: parsed.data.targetStatus,
          actorId: auth.user.id,
          actorRole: auth.user.role === 'admin' ? 'admin' : 'buyer',
          note:
            parsed.data.reason ||
            (auth.user.role === 'admin'
              ? 'Cancelled by administrator'
              : 'Cancelled by buyer'),
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5_000,
        timeout: 15_000,
      },
    );

    return NextResponse.json({
      success: true,
      order: serializeLifecycleOrder(
        updated,
        auth.user.role === 'admin' ? 'admin' : 'buyer',
      ),
    });
  } catch (error) {
    if (error instanceof OrderLifecycleError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.error('Buyer order transition error:', error);
    return NextResponse.json(
      { error: 'The order could not be updated.' },
      { status: 500 },
    );
  }
}
