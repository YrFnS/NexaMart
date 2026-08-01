import type { Prisma } from '@prisma/client';
import { allocateCents } from './checkout-authority.ts';
import {
  assertBaseCurrency,
  BASE_CURRENCY,
  fromCents,
  percentageToBasisPoints,
  toCents,
} from './money.ts';

export interface CouponStoreSubtotal {
  storeId: string;
  subtotalCents: number;
}

export interface CouponQuote {
  couponId: string;
  code: string;
  type: 'percentage' | 'fixed';
  discountValue: number;
  minOrder: number;
  maxDiscount: number | null;
  storeId: string | null;
  expiresAt: Date | null;
  usageLimit: number | null;
  eligibleSubtotalCents: number;
  discountCents: number;
  allocations: number[];
  currency: typeof BASE_CURRENCY;
}

export class CouponValidationError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    message: string,
    status = 400,
    code = 'INVALID_COUPON',
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function calculateCouponDiscountCents(input: {
  type: 'percentage' | 'fixed';
  discount: unknown;
  eligibleSubtotalCents: number;
  maxDiscount?: unknown;
}): number {
  const eligibleSubtotal = Math.max(0, Math.trunc(input.eligibleSubtotalCents));
  let discount =
    input.type === 'fixed'
      ? toCents(input.discount as never)
      : Math.round(
          (eligibleSubtotal *
            percentageToBasisPoints(input.discount as never)) /
            10_000,
        );
  if (input.maxDiscount !== null && input.maxDiscount !== undefined) {
    discount = Math.min(discount, toCents(input.maxDiscount as never));
  }
  return Math.max(0, Math.min(discount, eligibleSubtotal));
}

export async function quoteCoupon(
  tx: Prisma.TransactionClient,
  code: string | null | undefined,
  stores: CouponStoreSubtotal[],
): Promise<CouponQuote | null> {
  const normalizedCode = code?.trim().toUpperCase();
  if (!normalizedCode) return null;

  const coupon = await tx.coupon.findUnique({ where: { code: normalizedCode } });
  const now = new Date();
  if (
    !coupon ||
    !coupon.isActive ||
    (coupon.expiresAt && coupon.expiresAt <= now) ||
    (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
  ) {
    throw new CouponValidationError('This coupon is invalid or has expired.');
  }
  if (coupon.type !== 'percentage' && coupon.type !== 'fixed') {
    throw new CouponValidationError('This coupon type is not supported.');
  }
  assertBaseCurrency(coupon.currency);

  const eligibleSubtotalCents = stores.reduce(
    (sum, store) =>
      !coupon.storeId || store.storeId === coupon.storeId
        ? sum + store.subtotalCents
        : sum,
    0,
  );
  if (eligibleSubtotalCents <= 0) {
    throw new CouponValidationError(
      'This coupon does not apply to the products in your cart.',
    );
  }
  if (eligibleSubtotalCents < toCents(coupon.minOrder)) {
    throw new CouponValidationError(
      `The eligible cart amount must be at least ${BASE_CURRENCY} ${fromCents(
        toCents(coupon.minOrder),
      ).toFixed(2)}.`,
    );
  }

  const discountCents = calculateCouponDiscountCents({
    type: coupon.type,
    discount: coupon.discount,
    eligibleSubtotalCents,
    maxDiscount: coupon.maxDiscount,
  });
  const weights = stores.map((store) =>
    !coupon.storeId || store.storeId === coupon.storeId
      ? store.subtotalCents
      : 0,
  );

  return {
    couponId: coupon.id,
    code: coupon.code,
    type: coupon.type,
    discountValue: Number(coupon.discount),
    minOrder: Number(coupon.minOrder),
    maxDiscount:
      coupon.maxDiscount === null ? null : Number(coupon.maxDiscount),
    storeId: coupon.storeId,
    expiresAt: coupon.expiresAt,
    usageLimit: coupon.usageLimit,
    eligibleSubtotalCents,
    discountCents,
    allocations: allocateCents(discountCents, weights),
    currency: BASE_CURRENCY,
  };
}
