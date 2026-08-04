import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateCouponDiscountCents } from './coupon-authority.ts';

test('percentage coupon calculations stay in integer cents', () => {
  assert.equal(
    calculateCouponDiscountCents({
      type: 'percentage',
      discount: '12.50',
      eligibleSubtotalCents: 10_001,
    }),
    1_250,
  );
});

test('fixed coupons respect eligible subtotal and maximum discount', () => {
  assert.equal(
    calculateCouponDiscountCents({
      type: 'fixed',
      discount: '50.00',
      eligibleSubtotalCents: 2_500,
    }),
    2_500,
  );
  assert.equal(
    calculateCouponDiscountCents({
      type: 'percentage',
      discount: '25.00',
      eligibleSubtotalCents: 20_000,
      maxDiscount: '30.00',
    }),
    3_000,
  );
});
