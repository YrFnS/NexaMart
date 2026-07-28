import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { validateAdminRequest, validatePagination } from '@/lib/security';
import { getSessionClaims } from '@/lib/session';

const couponFields = z.object({
  code: z.string().trim().min(2).max(50).transform((value) => value.toUpperCase()),
  discount: z.number().positive().max(100_000),
  type: z.enum(['percentage', 'fixed']).default('percentage'),
  minOrder: z.number().min(0).max(1_000_000).default(0),
  maxDiscount: z.number().positive().max(1_000_000).optional().nullable(),
  usageLimit: z.number().int().positive().max(10_000_000).optional().nullable(),
  storeId: z.string().min(1).max(64).optional().nullable(),
  isActive: z.boolean().default(true),
  expiresAt: z.coerce.date().optional().nullable(),
});

const updateSchema = couponFields.partial().omit({ code: true }).extend({
  couponId: z.string().min(1).max(64),
});

function adminId(request: Request) {
  return getSessionClaims(request)?.sub || null;
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
    return NextResponse.json({ coupons, total, page, limit });
  } catch (error) {
    console.error('Admin coupons GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;
  const actorId = adminId(request);
  if (!actorId) {
    return NextResponse.json({ error: 'Administrator session required.' }, { status: 401 });
  }

  const parsed = couponFields.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid coupon details.' }, { status: 400 });
  }
  if (parsed.data.type === 'percentage' && parsed.data.discount > 100) {
    return NextResponse.json({ error: 'Percentage discount cannot exceed 100.' }, { status: 400 });
  }

  try {
    const coupon = await db.$transaction(async (tx) => {
      const created = await tx.coupon.create({ data: parsed.data });
      await audit(tx, actorId, 'coupon_created', created.id, {
        code: created.code,
        discount: Number(created.discount),
        type: created.type,
      });
      return created;
    });
    return NextResponse.json({ success: true, coupon }, { status: 201 });
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
  const actorId = adminId(request);
  if (!actorId) {
    return NextResponse.json({ error: 'Administrator session required.' }, { status: 401 });
  }

  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid coupon update.' }, { status: 400 });
  }
  if (parsed.data.type === 'percentage' && (parsed.data.discount || 0) > 100) {
    return NextResponse.json({ error: 'Percentage discount cannot exceed 100.' }, { status: 400 });
  }

  try {
    const { couponId, ...changes } = parsed.data;
    const coupon = await db.$transaction(async (tx) => {
      const existing = await tx.coupon.findUnique({ where: { id: couponId } });
      if (!existing) return null;
      const updated = await tx.coupon.update({ where: { id: couponId }, data: changes });
      await audit(tx, actorId, 'coupon_updated', couponId, {
        code: existing.code,
        fields: Object.keys(changes),
      });
      return updated;
    });
    if (!coupon) return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    return NextResponse.json({ success: true, coupon });
  } catch (error) {
    console.error('Admin coupons PUT error:', error);
    return NextResponse.json({ error: 'Failed to update coupon.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = validateAdminRequest(request);
  if (denied) return denied;
  const actorId = adminId(request);
  if (!actorId) {
    return NextResponse.json({ error: 'Administrator session required.' }, { status: 401 });
  }

  const couponId = new URL(request.url).searchParams.get('id');
  if (!couponId) {
    return NextResponse.json({ error: 'Coupon id is required.' }, { status: 400 });
  }

  try {
    const deleted = await db.$transaction(async (tx) => {
      const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
      if (!coupon) return null;
      await tx.coupon.delete({ where: { id: couponId } });
      await audit(tx, actorId, 'coupon_deleted', couponId, { code: coupon.code });
      return coupon;
    });
    if (!deleted) return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    return NextResponse.json({ success: true, couponId });
  } catch (error) {
    console.error('Admin coupons DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete coupon.' }, { status: 500 });
  }
}
