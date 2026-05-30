# Task: Update Core Buyer Pages - Replace Zustand Store Routing with Next.js App Router Navigation

## Task ID: routing-migration-buyer-group-a

## Summary

Updated 9 core buyer page components to replace Zustand-based SPA routing (`useAppStore`) with Next.js App Router navigation (`useAppNavigation` hook). All navigation now uses `router.push()` via the `useAppNavigation` hook instead of Zustand store state changes.

## Files Updated

1. **`src/components/buyer/home-page.tsx`** - Full replacement. Removed `useAppStore` import entirely. Sub-components `DealOfDaySpotlight` and `TopRatedSection` now use `useAppNavigation()` directly instead of `useAppStore.getState()`. Main `HomePage` component uses `useAppNavigation()` for `setView` and `selectProduct`.

2. **`src/components/buyer/shop-page.tsx`** - Split imports. `selectedCategory, selectCategory, searchQuery, setSearchQuery` remain from `useAppStore`; `setView, selectProduct` moved to `useAppNavigation`.

3. **`src/components/buyer/product-detail-page.tsx`** - Special case. Uses `useParams()` from `next/navigation` to get product ID from URL instead of `selectedProductId` from store. `setView, selectStore` from `useAppNavigation`; `toggleCompare, compareIds` from `useAppStore`.

4. **`src/components/buyer/product-card.tsx`** - Split imports. `toggleCompare, compareIds` remain from `useAppStore`; `selectProduct` moved to `useAppNavigation`.

5. **`src/components/buyer/category-grid.tsx`** - Split imports. `selectCategory` remains from `useAppStore`; `setView` moved to `useAppNavigation`.

6. **`src/components/buyer/deals-page.tsx`** - Full replacement. Removed `useAppStore` import entirely. `selectProduct` from `useAppNavigation`.

7. **`src/components/buyer/trending-searches.tsx`** - Split imports. `setSearchQuery` remains from `useAppStore`; `setView` moved to `useAppNavigation`.

8. **`src/components/buyer/recently-viewed-section.tsx`** - Removed `useAppStore` import and unused `selectProduct` entirely (ProductCard handles its own navigation).

9. **`src/components/buyer/product-quick-view.tsx`** - Full replacement. Removed `useAppStore` import entirely. `selectProduct` from `useAppNavigation`.

## Key Patterns Applied

- **Routing functions** (`setView`, `selectProduct`, `selectStore`) → `useAppNavigation()`
- **Non-routing state** (`searchQuery`, `selectedCategory`, `compareIds`, `toggleCompare`, etc.) → kept in `useAppStore()`
- **`useAppStore.getState()`** calls in sub-components → replaced with `useAppNavigation()` hook at component level
- **`selectedProductId`** in product-detail-page → `useParams()` from Next.js router
- **Unused store imports** → removed entirely when component only used store for routing

## Lint Results

- 0 errors, 1 pre-existing warning (unrelated file in upload directory)
- All 9 updated files pass lint checks
