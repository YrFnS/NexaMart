# Task 8 - Group B: Replace Zustand routing with Next.js App Router navigation

## Task ID
8

## Agent
Group B Navigation Update Agent

## Summary
Updated 11 buyer page components to replace Zustand-based SPA routing (`useAppStore`) with Next.js App Router navigation (`useAppNavigation` hook).

## Files Updated

1. **`src/components/buyer/cart-page.tsx`**
   - Replaced `useAppStore` import with `useAppNavigation`
   - `const { setView } = useAppStore()` → `const { setView, selectProduct } = useAppNavigation()`
   - Replaced 2x `useAppStore.getState().selectProduct(item.productId)` → `selectProduct(item.productId)` (in event handlers)

2. **`src/components/buyer/checkout-page.tsx`**
   - Replaced `useAppStore` import with `useAppNavigation`
   - `const { setView } = useAppStore()` → `const { setView } = useAppNavigation()`

3. **`src/components/auth/auth-page.tsx`**
   - Replaced `useAppStore` import with `useAppNavigation`
   - `const { setView } = useAppStore()` → `const { setView } = useAppNavigation()`

4. **`src/components/buyer/profile-page.tsx`**
   - Replaced `useAppStore` import with `useAppNavigation`
   - `const { setView } = useAppStore()` → `const { setView } = useAppNavigation()`

5. **`src/components/buyer/orders-page.tsx`**
   - Replaced `useAppStore` import with `useAppNavigation`
   - `const { setView, selectProduct } = useAppStore()` → `const { setView, selectProduct } = useAppNavigation()`
   - Replaced `useAppStore.getState().setView('order-tracking')` → `setView('order-tracking')` (from nav hook)

6. **`src/components/buyer/wishlist-page.tsx`**
   - Replaced `useAppStore` import with `useAppNavigation`
   - `const { setView, selectProduct } = useAppStore()` → `const { setView, selectProduct } = useAppNavigation()`

7. **`src/components/buyer/order-tracking-page.tsx`**
   - Replaced `useAppStore` import with `useAppNavigation`
   - `const { setView } = useAppStore()` → `const { setView } = useAppNavigation()`

8. **`src/components/buyer/chat-page.tsx`**
   - Replaced `useAppStore` import with `useAppNavigation`
   - `const { setView } = useAppStore()` → `const { setView } = useAppNavigation()`

9. **`src/components/buyer/store-profile-page.tsx`** (special case)
   - Replaced `useAppStore` import with `useAppNavigation` + `useParams` from `next/navigation`
   - `const { selectedStoreId, setView } = useAppStore()` → `const { id } = useParams(); const selectedStoreId = (id as string) || null; const { setView } = useAppNavigation();`
   - Added `import { useParams } from 'next/navigation'`

10. **`src/components/buyer/compare-page.tsx`**
    - Kept `useAppStore` import for non-routing state (`compareIds`, `toggleCompare`, `clearCompare`)
    - Added `useAppNavigation` import alongside store
    - Added `const { setView } = useAppNavigation()` for routing

11. **`src/components/buyer/search-page.tsx`**
    - Kept `useAppStore` import for non-routing state (`searchQuery`, `setSearchQuery`, `selectCategory`)
    - Added `useAppNavigation` import alongside store
    - Split: `const { searchQuery: appSearchQuery, setSearchQuery, selectCategory, setView } = useAppStore()` → `const { searchQuery: appSearchQuery, setSearchQuery, selectCategory } = useAppStore(); const { setView } = useAppNavigation();`

## Verification
- Grep for `useAppStore.getState().(setView|selectProduct|selectStore)` → 0 results (all removed)
- Grep for `useAppStore().(setView|selectProduct|selectStore)` → 0 results (all removed from Group B files)
- Lint: 0 errors, 1 pre-existing warning (unrelated to changes)
