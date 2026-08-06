import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth';
import {
  CartPricingError,
  groupPricedCart,
  priceCartLines,
} from '@/lib/cart-pricing';
import {
  CouponValidationError,
  quoteCoupon,
} from '@/lib/coupon-authority';
import { db } from '@/lib/db';
import { BASE_CURRENCY, fromCents } from '@/lib/money';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
} from '@/lib/security';

const requestSchema = z
  .object({
    code: z.string().trim().min(2).max(50),
    items: z
      .array(
        z.object({
          productId: z.string().min(1).max(64),
          variantId: z.string().min(1).max(64).optional(),
          quantity: z.number().int().min(1).max(100),
          variation: z
            .union([z.string(), z.record(z.string(), z.string())])
            .optional(),
        }),
      )
      .min(1)
      .max(100),
  })
  .strict();

function noStore(response: NextResponse) {
  response.headers.set('Cache-Control', 'no-store, private');
  return response;
}

export async function GET() {
  return noStore(
    NextResponse.json(
      {
        error:
          'Coupon codes are not published. Submit a code with your authenticated cart to validate it.',
        code: 'COUPON_CATALOGUE_DISABLED',
      },
      { status: 405, headers: { Allow: 'POST' } },
    ),
  );
}

export async function POST(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;
  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { valid: false, error: csrf.error || 'Invalid request origin.' },
      { status: 403 },
    );
  }
  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  const parsed = requestSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return noStore(
      NextResponse.json(
        {
          valid: false,
          error: 'A coupon code and valid cart items are required.',
          errorAr: 'رمز الكوبون ومنتجات السلة الصحيحة مطلوبة.',
        },
        { status: 400 },
      ),
    );
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const lines = await priceCartLines(tx, parsed.data.items);
      const groups = groupPricedCart(lines);
      const quote = await quoteCoupon(
        tx,
        parsed.data.code,
        groups.map((group) => ({
          storeId: group.storeId,
          subtotalCents: group.subtotalCents,
        })),
      );
      if (!quote) throw new CouponValidationError('Coupon code is required.');
      return { quote, groups };
    });

    const description =
      result.quote.type === 'percentage'
        ? `${result.quote.discountValue}% off eligible items`
        : `${BASE_CURRENCY} ${result.quote.discountValue.toFixed(2)} off eligible items`;
    const descriptionAr =
      result.quote.type === 'percentage'
        ? `خصم ${result.quote.discountValue}٪ على المنتجات المؤهلة`
        : `خصم ${result.quote.discountValue.toFixed(2)} ${BASE_CURRENCY} على المنتجات المؤهلة`;

    return noStore(
      NextResponse.json({
        valid: true,
        coupon: {
          id: result.quote.couponId,
          code: result.quote.code,
          discountType: result.quote.type,
          discountValue: result.quote.discountValue,
          minOrder: result.quote.minOrder,
          maxDiscount: result.quote.maxDiscount,
          description,
          descriptionAr,
          expiry: result.quote.expiresAt?.toISOString() || null,
          currency: result.quote.currency,
        },
        eligibleSubtotal: fromCents(result.quote.eligibleSubtotalCents),
        discountAmount: fromCents(result.quote.discountCents),
        currency: result.quote.currency,
        storeDiscounts: result.groups.map((group, index) => ({
          storeId: group.storeId,
          discountAmount: fromCents(result.quote.allocations[index] || 0),
        })),
      }),
    );
  } catch (error) {
    if (
      error instanceof CartPricingError ||
      error instanceof CouponValidationError
    ) {
      return noStore(
        NextResponse.json(
          {
            valid: false,
            error: error.message,
            errorAr: 'تعذر تطبيق الكوبون على السلة الحالية.',
            code: error.code,
          },
          { status: error.status },
        ),
      );
    }
    console.error('Coupon quote error:', error);
    return noStore(
      NextResponse.json(
        {
          valid: false,
          error: 'The coupon could not be validated.',
          errorAr: 'تعذر التحقق من الكوبون.',
        },
        { status: 500 },
      ),
    );
  }
}
