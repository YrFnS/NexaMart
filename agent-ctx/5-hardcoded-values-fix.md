# Task 5: Fix Hardcoded Values in Home Page, Category Grid, and Footer

**Date:** 2025-03-05
**Status:** ✅ Complete

## Summary

Replaced all hardcoded values across 3 component files and 4 config/data files with centralized, dynamic, or config-driven alternatives.

## Changes Made

### 1. Created `/src/lib/theme.ts`
- New file with `AVATAR_GRADIENTS` array (8 gradient strings)
- Replaces 3 duplicate gradient arrays in home-page.tsx (`brandGradients`, `sellerColors`, `storeGradients`)

### 2. Updated `/src/lib/reference-data.ts`
- Added `CATEGORY_GRADIENTS` record (10 category-to-gradient mappings)
- Added `CATEGORY_ICONS` record (10 category-to-icon-name mappings)
- Used by category-grid.tsx instead of local maps

### 3. Updated `/src/lib/config.ts`
- Added `PAYMENT_METHODS` array (6 payment methods with name/color) — previously hardcoded in footer.tsx
- Added `carouselAutoAdvanceMs: 5000` to existing `UI_CONFIG` — previously hardcoded in home-page.tsx carousel timer

### 4. Updated `/src/components/buyer/home-page.tsx`
- **Fix 1**: Replaced hardcoded `-70%` discount badge with dynamic `bestDiscount` computed from `saleProducts`
- **Fix 2**: Replaced 3 local gradient arrays with `AVATAR_GRADIENTS` import from `@/lib/theme`
- **Fix 3**: Replaced hardcoded `5000` carousel timer with `UI_CONFIG.carouselAutoAdvanceMs`
- **Fix 4**: Added comments on API limit params (limit=10, limit=12, limit=8) noting they should match `STORE_LIMITS`
- **Fix 5**: Added comments documenting fallback gradient strings and ctaLink paths in `defaultSlides`

### 5. Updated `/src/components/buyer/category-grid.tsx`
- Imported `CATEGORY_GRADIENTS` and `CATEGORY_ICONS` from `@/lib/reference-data`
- Replaced local `iconMap` (lowercase slug keys) with component-name-keyed map using `CATEGORY_ICONS` for lookup
- Replaced local `gradientMap` with `gradientDetailMap` that references `CATEGORY_GRADIENTS` for bg values
- Replaced hardcoded inline i18n `{isRTL ? 'منتج' : 'items'}` with `t('items')`

### 6. Updated `/src/components/layout/footer.tsx`
- Imported `PAYMENT_METHODS` from `@/lib/config`
- Removed local `paymentMethods` array
- Updated template to use `PAYMENT_METHODS.map()`

### 7. Added i18n keys
- Added `"items": "items"` to `en.json`
- Added `"items": "منتج"` to `ar.json`

## Verification
- `bun run lint` — passes (0 errors)
- Dev server running, homepage returns 200 with real data
