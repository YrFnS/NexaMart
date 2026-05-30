# Task 10 - i18n Batch 3 (Seller & Admin)

## Summary
Converted all inline `isRTL ? 'Arabic' : 'English'` ternary patterns to `t('key')` i18n function calls for seller and admin component files.

## Files Modified

### 1. `/home/z/my-project/src/lib/i18n.ts`
- Added ~200 new i18n keys with `s_` prefix (seller-specific)
- Keys added to BOTH `en` and `ar` sections
- Categories: Seller Onboarding, Seller AI Tools, Seller Dashboard, Seller Overview

### 2. `/home/z/my-project/src/components/seller/seller-onboarding.tsx`
- ~77 ternaries converted
- Added `useI18n()` to each sub-component (StepBusinessInfo, StepStoreSetup, StepShippingReturns, StepPaymentSetup, StepVerification, StepSuccess)
- Main component's text ternaries replaced with `t('s_*')` calls
- `isRTL` prop kept for non-text purposes (data lookups, icon direction)

### 3. `/home/z/my-project/src/components/seller/seller-ai-tools.tsx`
- ~86 ternaries converted
- Fixed variable shadowing (`t` from useI18n shadowed by `.find(t => ...)`)
- All text ternaries replaced with `t('s_*')` calls
- `isRTL` kept for arrow icon direction logic

### 4. `/home/z/my-project/src/components/seller/seller-dashboard.tsx`
- ~41 ternaries converted (both `isRTL ?` and `locale === 'ar' ?` patterns)
- Sidebar, Ad Center, and Coupon Management ternaries all converted
- `isRTL` kept for CSS/layout purposes (border direction, side, alignment)

### 5. `/home/z/my-project/src/components/seller/seller-overview.tsx`
- 2 ternaries converted: `Customer` → `t('s_customer')`, `Status` → `t('s_status')`
- `isRTL` kept (derived from `dir()`)

### 6. Admin files (NO CHANGES NEEDED)
- `/home/z/my-project/src/components/admin/admin-panel.tsx` - No text ternaries (only CSS/layout `isRTL` uses)
- `/home/z/my-project/src/components/admin/admin-dashboard.tsx` - Already using `t('key')` throughout

## Key Prefix Strategy
- `s_` prefix for all seller-specific keys to avoid conflicts with Batch 1 (auth/common) and Batch 2 (buyer)
- No `a_` prefix keys needed since admin files had no text ternaries to convert

## Lint Result
- 0 errors, 1 pre-existing warning (unrelated to this task)
