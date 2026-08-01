from __future__ import annotations

from pathlib import Path
import re
import textwrap


def read(path: str) -> str:
    return Path(path).read_text()


def write(path: str, content: str) -> None:
    Path(path).write_text(content)


def replace(path: str, old: str, new: str) -> None:
    content = read(path)
    if old not in content:
        raise SystemExit(f"Expected pricing consumer fragment not found in {path}: {old[:90]!r}")
    write(path, content.replace(old, new))


# API/reporting boundaries should emit ordinary numbers even though persisted
# marketplace money now uses Prisma.Decimal.
replace(
    "src/app/api/admin/analytics/route.ts",
    "existing.revenue += o.total;",
    "existing.revenue += Number(o.total);",
)
replace(
    "src/app/api/admin/analytics/route.ts",
    "estimatedRevenue: c.products.reduce((sum, p) => sum + (p.soldCount * p.price), 0),",
    "estimatedRevenue: c.products.reduce(\n          (sum, p) => sum + p.soldCount * Number(p.price),\n          0,\n        ),",
)
analytics_path = "src/app/api/admin/analytics/route.ts"
analytics = read(analytics_path)
analytics = analytics.replace("revenue: s._sum.total || 0,", "revenue: Number(s._sum.total || 0),")
analytics = analytics.replace("totalRevenue: orderAgg._sum.total || 0,", "totalRevenue: Number(orderAgg._sum.total || 0),")
analytics = analytics.replace("avgOrderValue: orderAgg._avg.total || 0,", "avgOrderValue: Number(orderAgg._avg.total || 0),")
analytics = analytics.replace("total: o.total,", "total: Number(o.total),")
write(analytics_path, analytics)

replace(
    "src/app/api/admin/dashboard/route.ts",
    "const platformRevenue = (orderAgg._sum.total || 0) * 0.1; // 10% commission estimate",
    "const platformRevenue = Number(orderAgg._sum.total || 0) * 0.1; // 10% commission estimate",
)
replace(
    "src/app/api/admin/dashboard/route.ts",
    "const avgOrderValue = orderAgg._avg.total || 0;",
    "const avgOrderValue = Number(orderAgg._avg.total || 0);",
)
replace(
    "src/app/api/admin/dashboard/route.ts",
    "revenue: store.orders.reduce((sum, o) => sum + o.total, 0),",
    "revenue: store.orders.reduce((sum, o) => sum + Number(o.total), 0),",
)
replace(
    "src/app/api/admin/dashboard/route.ts",
    "revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + order.total;",
    "revenueByMonth[monthKey] =\n        (revenueByMonth[monthKey] || 0) + Number(order.total);",
)
replace(
    "src/app/api/admin/dashboard/route.ts",
    "gmv: orderAgg._sum.total || 0,",
    "gmv: Number(orderAgg._sum.total || 0),",
)

replace(
    "src/app/api/admin/users/route.ts",
    "const revenue = u.orders.reduce((sum, o) => sum + o.total, 0);",
    "const revenue = u.orders.reduce((sum, o) => sum + Number(o.total), 0);",
)

for path in ("src/app/api/deals/route.ts", "src/app/api/flash-sales/route.ts"):
    replace(
        path,
        "const originalPrice = product.originalPrice || product.price;",
        "const price = Number(product.price);\n      const originalPrice = Number(product.originalPrice ?? product.price);",
    )
    replace(
        path,
        "Math.round(((originalPrice - product.price) / originalPrice) * 100)",
        "Math.round(((originalPrice - price) / originalPrice) * 100)",
    )
    replace(path, "price: product.price,", "price,")

replace(
    "src/app/api/price-alerts/route.ts",
    "currentPrice: product.price,",
    "currentPrice: Number(product.price),",
)

returns_path = "src/app/api/returns/route.ts"
returns_source = read(returns_path)
returns_source = returns_source.replace(
    "record.unitPrice ?? record.orderItem?.price ?? record.refundAmount / record.quantity,",
    "record.unitPrice ??\n      record.orderItem?.price ??\n      Number(record.refundAmount) / record.quantity,",
)
write(returns_path, returns_source)

review_path = "src/components/buyer/checkout/components/checkout-review.tsx"
review = read(review_path)
review, substitutions = re.subn(
    r"currency:\s*isRTL\s*\?\s*\(CURRENCIES\[currency\]\?\.nameAr\s*\|\|\s*currency\)\s*:\s*\(CURRENCIES\[currency\]\?\.name\s*\|\|\s*currency\)",
    "currency",
    review,
)
if substitutions != 1:
    raise SystemExit("Expected checkout currency-label expression was not replaced")
write(review_path, review)

# The legacy seller coupon route trusted caller-provided store IDs and exposed
# Decimal values directly. Replace it with role- and store-scoped management.
seller_coupon_route = textwrap.dedent(
    r'''import { Prisma, type Coupon } from '@prisma/client';
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
'''
)
write("src/app/api/seller/coupons/route.ts", seller_coupon_route)

print("Decimal API consumers and seller coupon authority normalized.")
