# Task 5: Deduplicate Prices

## Summary
Deduplicated price data across the codebase so that AI credit packages, commission data, and ad product prices all import from the single source of truth in `lib/config.ts`.

## Changes Made

### 1. `src/components/ai/ai-tools-page.tsx`
- Imported `AI_CREDIT_PACKAGES` from `@/lib/config`
- Replaced hardcoded `creditPackages` array with `const creditPackages = AI_CREDIT_PACKAGES`

### 2. `src/components/admin/commission-settings.tsx`
- Imported `COMMISSION_CONFIG` and `AI_CREDIT_PACKAGES` from `@/lib/config`
- Replaced hardcoded `defaultConfig` with values derived from config imports
- `aiTokenPrices` dynamically derived from `AI_CREDIT_PACKAGES.filter(p => !p.unlimited).map(...)`

### 3. `src/app/api/ad-products/route.ts`
- Imported `AD_PRODUCTS` from `@/lib/config`
- Replaced hardcoded `adProducts` array with config-driven construction
- Created enrichment map for presentation-only data (names, icons, descriptions, features, colors)
- Core pricing data (price, durationDays, viewsIncrease) now comes from config

## Lint Result
- 0 errors, 1 pre-existing warning (in upload directory)
