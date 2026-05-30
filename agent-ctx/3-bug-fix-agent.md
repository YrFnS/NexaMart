# Task 3 - Hardcoded Value Fixes

## Agent: Bug Fix Agent

## Summary

Fixed hardcoded values in 3 files as specified, plus fixed a pre-existing compilation error.

## Changes Made

### File 1: `/home/z/my-project/src/components/buyer/deals-page.tsx`
- **Fix 1**: Replaced `Math.random() * 12 + 2` for `endsAt` (lines 211, 281) → `(d.endsAt as number) || 6` (6 hours default, uses API value if available)
- **Fix 2**: Replaced `Math.random() * 16 + 15` for `minutesLeft` (line 286) → `(d.minutesLeft as number) || 20` (20 minutes default)
- **Fix 3**: Replaced `Math.random() * 7 * 24 * 60 * 60 * 1000` for `startsAt` (line 301) → `(d.startsAt as string) || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()` (3 days default, uses API value if available)
- **Fix 4**: Removed duplicate imports of Monitor, Shirt, HomeIcon, Flower2, Dumbbell, Sparkles (second import block at lines 69-71). Also removed Shirt, HomeIcon, Flower2, Dumbbell from the first import block since they were only needed in the second.

### File 2: `/home/z/my-project/src/components/buyer/stores-page.tsx`
- **Fix 1**: Replaced hardcoded `storeCategories` array with dynamic state fetched from `/api/categories` endpoint
- **Fix 2**: Replaced hardcoded `storeLocations` array with `MENA_CITIES` from `@/lib/reference-data`
- **Fix 3**: Replaced ALL 20+ inline i18n strings (`isRTL ? 'Arabic' : 'English'` patterns) with `t()` calls:
  - storeDirectory, verifiedStoresCount, searchStores, filters, topRated, mostProducts, newest, verified, clearAll, noStoresFound, tryAdjustingFilters, clearFilters, products, following, follow, filterStores, category, minimumRating, all, verifiedStoresOnly, applyFilters

### File 3: `/home/z/my-project/src/components/common/social-proof-toast.tsx`
- **Fix 1**: Replaced hardcoded `socialProofs` array (8 fake entries) with dynamic fetch from `/api/social-proof` endpoint. Component shows no toast when no data available.
- **Fix 2**: Replaced inline i18n `'from'`/`'من'` → `t('from')`, `'purchased'`/`'اشترى'` → `t('purchased')`

### New API Route: `/home/z/my-project/src/app/api/social-proof/route.ts`
- Created new API endpoint that fetches recent delivered orders from DB
- Generates social proof from real order data (user name, product name, time ago)
- Returns `{ proofs: [...] }` format, empty array if no data

### i18n Keys Added (both en.json and ar.json)
- verifiedStoresCount, filters, topRated, mostProducts, tryAdjustingFilters, filterStores, minimumRating, verifiedStoresOnly, applyFilters, from, purchased, clearAll

### Pre-existing Fix: `/home/z/my-project/src/lib/theme.ts`
- Added missing `COLOR_MAP` export that was causing 500 errors on all pages (product-card.tsx imported it but it didn't exist)

## Verification
- `bun run lint` — passes with 0 errors
- `/api/categories` — returns 10 categories from DB (200 OK)
- `/api/social-proof` — returns `{ proofs: [] }` when no delivered orders (200 OK)
- Dev server compiling successfully, all pages load
