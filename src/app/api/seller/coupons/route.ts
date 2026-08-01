import { Prisma, type Coupon } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUserRole, type AuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { BASE_CURRENCY } from '@/lib/money';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
} from '@/lib/security';

const couponSchema = z
  .object({
    code: z.string().trim().min(2).max(50).transform((value) => value.toUpperCase()),
    discount: z.coerce.number().finite().positive().max(100_000),
    type: z.enum(['percentage', 'fixed']),
    minOrder: z.coerce.number().finite().min(0).max(1_000_000).default(0),
    maxDiscount: z.coerce.number().finite().positive().max(1_000_000).optional().nullable(),
    usageLimit: z.coerce.number().int().positive().max(10_000_000).optional().nullable(),
    storeId: z.string().min(1).max(64),
    expiresAt: z.coerce.date().optional().nullable(),
  })
  .strict();

const toggleSchema = z
  .object({
    couponId: z.string().min(1).max(64),
    isActive: z.boolean(),
  })
  .strict();

function storeAccessWhere(user: AuthenticatedUser): Prisma.StoreWhereInput {
  if (user.role === 'admin') return {};
  return {
    OR: [
      { ownerId: user.id },
      {
        staff: {
          some: {
            userId: user.id,
            status: 'active',
            role: { in: ['owner', 'manager', 'editor'] },
          },
        },
      },
    ],
  };
}

async function accessibleStoreIds(user: AuthenticatedUser): Promise<string[]> {
  const stores = await db.store.findMany({
    where: storeAccessWhere(user),
    select: { id: true },
  });
  return stores.map((store) => store.id);
}

function serializeCoupon(coupon: Coupon) {
  const discount = Number(coupon.discount);
  const minOrder = Number(coupon.minOrder);
  const maxDiscount =
    coupon.maxDiscount === null ? null : Number(coupon.maxDiscount);
  const suffix = coupon.type === 'percentage' ? '%' : ` ${coupon.currency}`;

  return {
    id: coupon.id,
    code: coupon.code,
    discount,
    type: coupon.type,
    currency: coupon.currency,
    minOrder,
    maxDiscount,
    usageLimit: coupon.usageLimit,
    usedCount: coupon.usedCount,
    storeId: coupon.storeId,
    isActive: coupon.isActive,
    expiresAt: coupon.expiresAt?.toISOString() || null,
    createdAt: coupon.createdAt.toISOString(),
    description: `${discount}${suffix} off coupon`,
    descriptionAr:
      coupon.type === 'percentage'
        ? `كوبون خصم ${discount}٪`
        : `كوبون خصم ${discount} ${coupon.currency}`,
    totalRevenue: 0,
    totalDiscount: 0,
  };
}

async function ensureStoreAccess(user: AuthenticatedUser, storeId: string) {
  return db.store.findFirst({
    where: { id: storeId, ...storeAccessWhere(user) },
    select: { id: true },
  });
}

export async function GET(request: Request) {
  const auth = await requireUserRole(request, ['seller', 'admin']);
  if (auth.response) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const requestedStoreId = searchParams.get('storeId');
    const action = searchParams.get('action');
    const storeIds = await accessibleStoreIds(auth.user);
    const allowedStoreIds = requestedStoreId
      ? storeIds.filter((id) => id === requestedStoreId)
      : storeIds;

    if (requestedStoreId && allowedStoreIds.length === 0) {
      return NextResponse.json({ error: 'Store access is required.' }, { status: 403 });
    }

    const coupons = allowedStoreIds.length
      ? await db.coupon.findMany({
          where: { storeId: { in: allowedStoreIds } },
          orderBy: { createdAt: 'desc' },
        })
      : [];
    const mapped = coupons.map(serializeCoupon);

    if (action === 'stats') {
      const percentageCoupons = mapped.filter(
        (coupon) => coupon.type === 'percentage',
      );
      return NextResponse.json({
        stats: {
          totalCoupons: mapped.length,
          activeCoupons: mapped.filter((coupon) => coupon.isActive).length,
          totalUsed: mapped.reduce((sum, coupon) => sum + coupon.usedCount, 0),
          totalRevenue: 0,
          totalDiscount: 0,
          avgDiscountRate:
            percentageCoupons.length > 0
              ? Math.round(
                  percentageCoupons.reduce(
                    (sum, coupon) => sum + coupon.discount,
                    0,
                  ) / percentageCoupons.length,
                )
              : 0,
        },
      });
    }

    return NextResponse.json({ coupons: mapped, total: mapped.length });
  } catch (error) {
    console.error('Seller coupons GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch coupons.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;
  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Invalid request origin.' },
      { status: 403 },
    );
  }

  const auth = await requireUserRole(request, ['seller', 'admin']);
  if (auth.response) return auth.response;
  const parsed = couponSchema.safeParse(await request.json().catch(() => null));
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
    const store = await ensureStoreAccess(auth.user, parsed.data.storeId);
    if (!store) {
      return NextResponse.json({ error: 'Store access is required.' }, { status: 403 });
    }

    const coupon = await db.coupon.create({
      data: {
        ...parsed.data,
        currency: BASE_CURRENCY,
        isActive: true,
      },
    });
    return NextResponse.json(
      {
        coupon: serializeCoupon(coupon),
        message: 'Coupon created successfully.',
        messageAr: 'تم إنشاء الكوبون بنجاح.',
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'Coupon code already exists.' }, { status: 409 });
    }
    console.error('Seller coupons POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create coupon.' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;
  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Invalid request origin.' },
      { status: 403 },
    );
  }

  const auth = await requireUserRole(request, ['seller', 'admin']);
  if (auth.response) return auth.response;
  const parsed = toggleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid coupon update.' }, { status: 400 });
  }

  try {
    const storeIds = await accessibleStoreIds(auth.user);
    const existing = await db.coupon.findFirst({
      where: {
        id: parsed.data.couponId,
        storeId: { in: storeIds },
      },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    const coupon = await db.coupon.update({
      where: { id: existing.id },
      data: { isActive: parsed.data.isActive },
    });
    return NextResponse.json({
      coupon: serializeCoupon(coupon),
      message: parsed.data.isActive
        ? 'Coupon activated successfully.'
        : 'Coupon deactivated successfully.',
      messageAr: parsed.data.isActive
        ? 'تم تفعيل الكوبون بنجاح.'
        : 'تم تعطيل الكوبون بنجاح.',
    });
  } catch (error) {
    console.error('Seller coupons PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update coupon.' },
      { status: 500 },
    );
  }
}
