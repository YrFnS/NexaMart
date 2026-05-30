# Task 6a - Remove inline mock/hardcoded data from buyer components

## Summary
Reviewed all 4 buyer component files for mock data removal and API fetch migration.

## Findings
All 4 files were **already migrated** by a previous agent:
- No mock arrays (`mockAuctions`, `MOCK_ORDERS`, `MOCK_CARS`, `mockDeals`, `mockLightningDeals`, `mockComingSoonDeals`) exist in any file
- All files use `useState([])` + `useEffect` + `fetch('/api/...')` pattern
- All files have loading skeleton states

## Changes Made
1. **deals-page.tsx**: Added missing top-level empty state (`deals.length === 0 && !loading`) with Tag icon, `t('noResults')`, and bilingual message. Previously only had "no results" for filtered deals.
2. **cars-page.tsx**: Added missing `Card` and `CardContent` imports from `@/components/ui/card` that were used in the loading skeleton but not imported.

## Files Modified
- `src/components/buyer/deals-page.tsx` — added empty state block
- `src/components/buyer/cars-page.tsx` — added Card/CardContent imports

## Files Verified (no changes needed)
- `src/components/buyer/auctions-page.tsx` — already correct
- `src/components/buyer/orders-page.tsx` — already correct

## Lint Status
- 0 new lint errors
- 2 pre-existing errors in profile-page.tsx and seller-overview.tsx (out of scope)
