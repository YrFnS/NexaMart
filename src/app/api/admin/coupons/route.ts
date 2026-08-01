import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { BASE_CURRENCY } from '@/lib/money';
import {
  getAdminActorId,
  validateAdminRequest,
  validatePagination,
} from '@/lib/security';

const couponFields = z.object({
  code: z.string().trim().min(2).max(50).transform((value) => value.toUpperCase()),
  discount: z.number().positive().max(100_000),
  type: z.enum(['percentage', 'fixed']).default('percentage'),
  minOrder: z.number().min(0).max(1_000_000).default(0),
  maxDiscount: z.number().positive().max(1_000_000).optional().nullable(),
  usageLimit: z.number().int().positive().max(10_000_000).optional().nullable(),
  storeId: z.string().min(1).max(64).optional().nullable(),
  currency: z.literal(BASE_CURRENCY).default(BASE_CURRENCY),
  isActive: z.boolean().default(true),
  expiresAt: z.coerce.date().optional().nullable(),
});

const updateSchema = couponFields.partial().omit({ code: true }).extend({
  couponId: z.string().min(1).max(64),
});

class CouponError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

async function audit(
  tx: Prisma.TransactionClient,
  actorId: string,
  action: string,
  couponId: string,
  details: Record<string, unknown>,
) {
  await tx.auditLog.create({
    data: {
      adminId: actorId,
      action,
      targetType: 'coupon',
      targetId: couponId,
      details: JSON.stringify(details),
    },
  });
}

function serializeCoupon<T extends { discount: unknown; minOrder: unknown; maxDiscount: unknown }>(coupon: T) {
  return {
    ...coupon,
    discount: Number(coupon.discount),
    minOrder: Number(coupon.minOrder),
    maxDiscount:
      coupon.maxDiscount === null ? null : Number(coupon.maxDiscount),
    currency: BASE_CURRENCY,
  };
}

function requireActor(request: Request): string | NextResponse {
  const actorId = getAdminActorId(request);
  if (actorId) return actorId;

  return NextResponse.json(
    { error: 'An administrator identity is required for audit logging.' },
    { status: 401 },
  );
}

export async function GET(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit'),
      100,
    );
    const [coupons, total] = await db.$transaction([
      db.coupon.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.coupon.count(),
    ]);
    return NextResponse.json({
      coupons: coupons.map(serializeCoupon),
      total,
      page,
      limit,
      currency: BASE_CURRENCY,
    });
  } catch (error) {
    console.error('Admin coupons GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;

  const actor = requireActor(request);
  if (actor instanceof NextResponse) return actor;

  const parsed = couponFields.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid coupon details.' }, { status: 400 });
  }
  if (parsed.data.type === 'percentage' && parsed.data.discount > 100) {
    return NextResponse.json(
      { error: 'Percentage discount cannot exceed 100.' },
      { status: 400 },
    );
  }

  try {
    const coupon = await db.$transaction(async (tx) => {
      const created = await tx.coupon.create({ data: parsed.data });
      await audit(tx, actor, 'coupon_created', created.id, {
        code: created.code,
        discount: Number(created.discount),
        type: created.type,
        storeId: created.storeId,
      });
      return created;
    });
    return NextResponse.json(
      { success: true, coupon: serializeCoupon(coupon) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Coupon code already exists.' }, { status: 409 });
    }
    console.error('Admin coupons POST error:', error);
    return NextResponse.json({ error: 'Failed to create coupon.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;

  const actor = requireActor(request);
  if (actor instanceof NextResponse) return actor;

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid coupon update.' }, { status: 400 });
  }

  try {
    const { couponId, ...changes } = parsed.data;
    const coupon = await db.$transaction(async (tx) => {
      const existing = await tx.coupon.findUnique({ where: { id: couponId } });
      if (!existing) return null;

      const nextType = changes.type ?? existing.type;
      const nextDiscount = changes.discount ?? Number(existing.discount);
      if (nextType === 'percentage' && nextDiscount > 100) {
        throw new CouponError('Percentage discount cannot exceed 100.');
      }

      const updated = await tx.coupon.update({
        where: { id: couponId },
        data: changes,
      });
      await audit(tx, actor, 'coupon_updated', couponId, {
        code: existing.code,
        previousType: existing.type,
        previousDiscount: Number(existing.discount),
        nextType: updated.type,
        nextDiscount: Number(updated.discount),
        fields: Object.keys(changes),
      });
      return updated;
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, coupon: serializeCoupon(coupon) });
  } catch (error) {
    if (error instanceof CouponError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Admin coupons PUT error:', error);
    return NextResponse.json({ error: 'Failed to update coupon.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;

  const actor = requireActor(request);
  if (actor instanceof NextResponse) return actor;

  const couponId = new URL(request.url).searchParams.get('id');
  if (!couponId) {
    return NextResponse.json({ error: 'Coupon id is required.' }, { status: 400 });
  }

  try {
    const deleted = await db.$transaction(async (tx) => {
      const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
      if (!coupon) return null;
      await tx.coupon.delete({ where: { id: couponId } });
      await audit(tx, actor, 'coupon_deleted', couponId, {
        code: coupon.code,
        type: coupon.type,
        discount: Number(coupon.discount),
      });
      return coupon;
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, couponId });
  } catch (error) {
    console.error('Admin coupons DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete coupon.' }, { status: 500 });
  }
}
