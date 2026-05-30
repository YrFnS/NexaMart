# Routing Migration - AI, Seller, Admin, Classifieds, and Remaining Buyer Pages

**Task ID**: routing-migration-phase-2
**Agent**: Routing Migration Agent
**Date**: 2025-03-05

## Summary
Migrated 13 components from Zustand-based SPA routing (`useAppStore`) to Next.js App Router navigation (`useAppNavigation` hook). Verified 2 additional components required no changes.

## Files Updated (13 total)

### AI Components (3)
1. **`src/components/ai/ai-tools-page.tsx`** - Replaced `useAppStore` with `useAppNavigation` for `setView`
2. **`src/components/ai/visual-search.tsx`** - Replaced `useAppStore` with `useAppNavigation` for `setView`
3. **`src/components/ai/rfq-agent.tsx`** - Replaced `useAppStore` with `useAppNavigation` for `setView`

### Seller Components (2)
4. **`src/components/seller/seller-dashboard.tsx`** - Split imports: `setView` from `useAppNavigation`, `user` kept from `useUserStore`
5. **`src/components/seller/seller-onboarding.tsx`** - Replaced `useAppStore` with `useAppNavigation` for `setView`. Also widened `StepSuccess` prop type from `(view: 'seller-dashboard') => void` to `(view: string) => void` to match hook signature.

### Admin Components (1)
6. **`src/components/admin/admin-panel.tsx`** - Split imports: `setView` from `useAppNavigation`, `user` kept from `useUserStore`

### Classifieds Components (1)
7. **`src/components/classifieds/quick-post-page.tsx`** - Replaced `useAppStore` with `useAppNavigation` for `setView`

### Buyer Components (6)
8. **`src/components/buyer/wholesale-page.tsx`** - Replaced `useAppStore` with `useAppNavigation` for `selectProduct`
9. **`src/components/buyer/auctions-page.tsx`** - Split imports: `selectProduct` from `useAppNavigation`, `user` kept from `useUserStore`
10. **`src/components/buyer/installment-page.tsx`** - Replaced `useAppStore` with `useAppNavigation` for `setView` and `selectProduct`. Simplified `handleShopProduct` to just call `selectProduct(id)` (removed redundant `setView('product')` since `selectProduct` navigates directly).
11. **`src/components/buyer/video-reels-page.tsx`** - Same as installment-page: replaced `useAppStore` with `useAppNavigation`, simplified `handleShopProduct`.
12. **`src/components/buyer/safety-tips-page.tsx`** - Replaced `useAppStore` with `useAppNavigation` for `setView`
13. **`src/components/buyer/app-marketplace-page.tsx`** - Removed unused `useAppStore` import (component never used routing functions)

## Files Verified - No Changes Needed (2)
- **`src/components/buyer/cars-page.tsx`** - No `useAppStore` import (local `viewMode`/`setViewMode` is local state, not routing)
- **`src/components/buyer/properties-page.tsx`** - No `useAppStore` import (local `viewMode`/`setViewMode` is local state, not routing)

## Transformation Pattern Applied

### Simple replacement (routing only from useAppStore):
```
- import { useAppStore } from '@/stores/app-store';
+ import { useAppNavigation } from '@/lib/use-app-navigation';

- const { setView } = useAppStore();
+ const { setView } = useAppNavigation();
```

### Split imports (routing + non-routing state):
```
- import { useAppStore } from '@/stores/app-store';
+ import { useAppNavigation } from '@/lib/use-app-navigation';
  // keep useUserStore import as-is

- const { setView } = useAppStore();
+ const { setView } = useAppNavigation();
  const { user } = useUserStore(); // unchanged
```

### handleShopProduct simplification:
```
- const handleShopProduct = (id: string) => {
-     selectProduct(id);
-     setView('product');
- };
+ const handleShopProduct = (id: string) => {
+     selectProduct(id);  // selectProduct now navigates directly to /product/{id}
+ };
```

## Lint Results
- **0 errors, 1 warning** (pre-existing warning in upload directory, not related to our changes)
- All 13 modified files pass lint checks

## Verification
- Grep confirmed zero remaining `useAppStore` references in all 13 modified files
- cars-page.tsx and properties-page.tsx confirmed to have no `useAppStore` usage
