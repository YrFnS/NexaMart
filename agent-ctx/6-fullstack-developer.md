# Task 6: Fix Hardcoded Currency Symbols in i18n Translation Strings

## Summary
Parameterized all hardcoded `$100` currency amounts in i18n translation strings and component files to support multi-currency. All amounts now reference `SHIPPING_CONFIG.freeShippingThreshold` and use the `t()` function's `{amount}` parameter substitution.

## Files Modified
1. `src/lib/i18n.ts` — 4 i18n strings parameterized + 2 new keys added (EN/AR)
2. `src/components/buyer/cart-page.tsx` — Uses `t('freeShippingOverThreshold', { amount })` + SHIPPING_CONFIG
3. `src/components/buyer/checkout-page.tsx` — Uses `t('freeShippingAvailable')`, `t('addMoreForFreeShipping', { amount })` + SHIPPING_CONFIG for all threshold comparisons
4. `src/components/buyer/product-detail-page.tsx` — Uses `formatPrice(SHIPPING_CONFIG.freeShippingThreshold)`
5. `src/components/buyer/shipping-page.tsx` — Uses `t('freeShippingOverThreshold', { amount })` + SHIPPING_CONFIG
6. `src/components/buyer/subscriptions-loyalty-page.tsx` — Template literal with SHIPPING_CONFIG for Bronze tier benefits
7. `src/app/api/help/route.ts` — Template literal with SHIPPING_CONFIG for FAQ answer

## Lint Result
0 errors, 1 pre-existing warning (unrelated)
