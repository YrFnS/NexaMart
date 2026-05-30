# Task: Migrate Layout + Common components from Zustand store routing to Next.js App Router navigation

## Task ID: routing-migration-layout-common
## Agent: Fullstack Developer Agent

## Files Updated (9 files)

### 1. `src/components/layout/header.tsx`
- **Before**: `const { currentView, setView, setSearchQuery, searchQuery } = useAppStore();`
- **After**: Split into `const { setView, getCurrentView } = useAppNavigation(); const currentView = getCurrentView();` and `const { setSearchQuery, searchQuery } = useAppStore();`
- Added import: `import { useAppNavigation } from '@/lib/use-app-navigation';`
- Kept `useAppStore` import for non-routing state (`searchQuery`, `setSearchQuery`)

### 2. `src/components/layout/footer.tsx`
- **Before**: `const { setView } = useAppStore();`
- **After**: `const { setView } = useAppNavigation();`
- Removed `useAppStore` import entirely (only used for routing)
- Added import: `import { useAppNavigation } from '@/lib/use-app-navigation';`

### 3. `src/components/layout/mobile-nav.tsx`
- **Before**: `const { currentView, setView } = useAppStore();` with `import { useAppStore, type AppView } from '@/stores/app-store';`
- **After**: `const { setView, getCurrentView } = useAppNavigation(); const currentView = getCurrentView();` with `import { useAppNavigation, type AppView } from '@/lib/use-app-navigation';`
- Removed `useAppStore` import entirely (only used for routing)

### 4. `src/components/common/breadcrumb-nav.tsx`
- **Before**: `const { currentView, setView, selectedProductId } = useAppStore();`
- **After**: `const { setView, getCurrentView } = useAppNavigation(); const currentView = getCurrentView(); const { id } = useParams(); const selectedProductId = (currentView === 'product' && id) ? id as string : null;`
- Replaced `selectedProductId` from store with URL params via `useParams()` from `next/navigation`
- Added imports: `import { useParams } from 'next/navigation';` and `import { useAppNavigation } from '@/lib/use-app-navigation';`
- Removed `useAppStore` import entirely

### 5. `src/components/common/search-command.tsx`
- **Before**: `const { setView, setSearchQuery } = useAppStore();` with `import { useAppStore, type AppView } from '@/stores/app-store';`
- **After**: `const { setView } = useAppNavigation(); const { setSearchQuery } = useAppStore();` with `import { useAppNavigation, type AppView } from '@/lib/use-app-navigation';`
- Kept `useAppStore` for `setSearchQuery` (non-routing state)
- `AppView` type import moved to `use-app-navigation`

### 6. `src/components/common/contact-seller-buttons.tsx`
- **Before**: `const { setView, selectProduct } = useAppStore();`
- **After**: `const { setView, selectProduct } = useAppNavigation();`
- Removed `useAppStore` import entirely (only used for routing)

### 7. `src/components/common/follow-seller.tsx`
- **Before (FollowedStoresPanel)**: `const { setView, selectStore } = useAppStore();`
- **After**: `const { setView, selectStore } = useAppNavigation();`
- `FollowSeller` component already didn't use the store
- Removed `useAppStore` import entirely (only used for routing)

### 8. `src/components/common/saved-searches.tsx`
- **Before**: `const { setView, setSearchQuery, selectCategory } = useAppStore();`
- **After**: `const { setView } = useAppNavigation(); const { setSearchQuery, selectCategory } = useAppStore();`
- Kept `useAppStore` for `setSearchQuery` and `selectCategory` (non-routing state)

### 9. `src/components/common/location-guide.tsx`
- **Before**: `const { setView } = useAppStore();`
- **After**: `const { setView } = useAppNavigation();`
- Removed `useAppStore` import entirely (only used for routing)

## File Not Updated
### `src/components/common/page-transition.tsx`
- Does not use any store or routing APIs - only takes a `transitionKey` prop
- No changes needed

## Lint Results
- 0 errors
- 1 pre-existing warning in `upload/NexaMart-main/.../store-reviews-section.tsx` (unrelated)
- All updated files pass lint

## Verification
- No remaining `useAppStore.*setView|selectProduct|selectStore|currentView` patterns in updated files
- All files properly import and use `useAppNavigation` from `@/lib/use-app-navigation`
- Files that use both routing and non-routing store state properly split the imports
- Files that only used routing state have `useAppStore` import removed entirely
- Dev server compiles and runs without errors
