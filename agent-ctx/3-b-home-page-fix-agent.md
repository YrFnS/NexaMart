# Task 3-b: Home Page Fix Agent

## Summary
Fixed all hardcoded/fake data values in the home page component (`src/components/buyer/home-page.tsx`).

## Changes Made

### 1. TopBrandsSection — Replaced fake brands with real store data
- **Removed**: `topBrands` array with 8 fake brand names (TechPro, StyleHub, HomeMax, etc.) and hardcoded Arabic names
- **Added**: `brandGradients` array (UI styling only) + `TopBrandsSection` now accepts `stores` prop
- **Added**: `allStores` state in HomePage, populated from `/api/stores` sorted by rating
- Each brand card shows store's first letter and real name, links to `/store/{id}`

### 2. Shoppertainment — Replaced with Most Popular products
- **Removed**: `shoppertainmentItems` array with 6 fake video items
- **Removed**: `ShoppertainmentCard` component entirely
- **Removed**: `Play` and `Video` imports (no longer used)
- **Added**: `mostPopularProducts` useMemo — all products sorted by `soldCount`, top 8
- **Replaced**: JSX section now shows "Most Popular" with real ProductCard components

### 3. Sellers Near You — Removed fake distances
- **Removed**: `distances` array (`['2.5 km', '4.1 km', '5.8 km', '7.2 km']`)
- **Replaced**: MapPin + distance → Package icon + `store.productCount` display

### 4. Deal of the Day — Fixed claimed percentage
- **Before**: `Math.min(95, 60 + Math.floor(Math.random() * 30))` — random each render
- **After**: `Math.min(99, Math.round((soldCount / (soldCount + stock)) * 100))` — real data

### 5. NexaMart brand name — Uses i18n
- **Before**: `<span>NexaMart</span>` (hardcoded)
- **After**: `<span>{t('appName')}</span>`
- **Added i18n keys**: `appName: "NexaMart"` (en) / `appName: "نيكسا مارت"` (ar)

### Kept as-is (UI styling, not data)
- `sellerColors`, `storeGradients`, `brandGradients` — gradient arrays for visual styling

## Verification
- `bun run lint` — 0 errors, 1 pre-existing warning
- Dev server running, all API calls returning 200
