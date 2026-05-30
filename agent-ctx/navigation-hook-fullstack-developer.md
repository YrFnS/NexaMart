# Task: Create Navigation Hook & Update App Store

**Task ID**: navigation-hook
**Agent**: Fullstack Developer

## Work Summary

Created the `useAppNavigation` hook and updated `app-store.ts` to separate routing from state management.

## Files Created

### 1. `src/lib/use-app-navigation.ts`
- New React hook that wraps Next.js `useRouter` and `usePathname`
- Provides the same API as the old Zustand-based routing:
  - `setView(view)` - navigates to a view by name (maps to URL paths)
  - `selectProduct(id)` - navigates to `/product/{id}`
  - `selectStore(id)` - navigates to `/store/{id}`
  - `goBack()` - uses `router.back()`
  - `getCurrentView()` - parses `pathname` to determine current `AppView`
  - `pathname` - exposes current pathname
- Contains the `AppView` type union and `viewToUrl` mapping (moved from store)
- All callbacks are memoized with `useCallback`

## Files Modified

### 2. `src/stores/app-store.ts`
**Removed:**
- `currentView` state property
- `setView()` action (including `window.history.pushState` logic)
- `selectProduct()` action (which set `currentView` + `selectedProductId` + pushed history)
- `selectStore()` action (which set `currentView` + `selectedStoreId` + pushed history)
- `initFromUrl()` action (including `popstate` listener and `history.replaceState`)
- `viewToUrl` constant
- `urlToView()` function

**Kept:**
- `AppView` type (for compatibility)
- `selectedProductId` state + `setSelectedProductId` action
- `selectedStoreId` state + `setSelectedStoreId` action
- `selectedCategory` state + `selectCategory` action
- `searchQuery` state + `setSearchQuery` action
- `isSidebarOpen` state + `toggleSidebar` / `setSidebarOpen` actions
- `compareIds` state + `toggleCompare` / `clearCompare` actions

## Lint Results
- 0 errors, 1 pre-existing warning (in upload directory, not our code)

## Known Follow-Up Needed
The following files still reference removed store properties (`currentView`, `setView`, `selectProduct`, `selectStore`, `initFromUrl`) and need to be updated in a follow-up task to use `useAppNavigation` instead:
- `src/app/page.tsx` - uses `currentView`, `initFromUrl`
- `src/components/layout/header.tsx` - uses `currentView`, `setView`
- `src/components/layout/mobile-nav.tsx` - likely uses routing
- `src/components/common/breadcrumb-nav.tsx` - likely uses `currentView`
- `src/components/common/page-transition.tsx` - likely uses `currentView`
- `src/components/buyer/orders-page.tsx` - likely uses routing
- `src/components/buyer/home-page.tsx` - likely uses routing
- `src/components/buyer/cart-page.tsx` - likely uses routing

These files will have TypeScript errors at build time but pass ESLint (which doesn't do type checking by default).
