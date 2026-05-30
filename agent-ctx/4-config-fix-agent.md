# Task 4: Fix Hardcoded Values in Seed Route and Config

**Agent:** Config Fix Agent  
**Date:** 2025-03-05  
**Status:** ✅ Complete

## Summary

Fixed hardcoded values in two files: the seed route (`src/app/api/seed/route.ts`) and the central config (`src/lib/config.ts`). All values that should come from config or environment variables are now properly sourced.

## Changes Made

### File 1: `src/app/api/seed/route.ts`

**Import added:**
- `import { SHIPPING_CONFIG, TAX_CONFIG, COMMISSION_CONFIG, AUTH_CONFIG } from '@/lib/config';`

**PlatformSettings aligned with config.ts values:**
- `freeShippingThreshold`: `'50'` → `String(SHIPPING_CONFIG.freeShippingThreshold)` (now resolves to `'100'`)
- `taxRate`: `'7'` → `String(TAX_CONFIG.defaultRate)` (now resolves to `'15'`)
- `commissionRate`: `'10'` → `String(COMMISSION_CONFIG.defaultRate)` (resolves to `'10'`)
- `proSubscriptionPrice`: `'29.99'` → `String(COMMISSION_CONFIG.proSubscriptionPrice)` (resolves to `'29.99'`)

**Demo user values aligned with AUTH_CONFIG:**
- `email`: `'demo@nexamart.com'` → `AUTH_CONFIG.demoUser.email`
- `loyaltyTier`: `'gold'` → `AUTH_CONFIG.demoUser.loyaltyTier`
- `loyaltyPoints`: `2450` → `AUTH_CONFIG.demoUser.loyaltyPoints`
- `walletBalance`: `150.0` → `AUTH_CONFIG.demoUser.walletBalance`

### File 2: `src/lib/config.ts`

**Environment variable overrides added:**
- `AI_CONFIG.baseURL`: Hardcoded `'https://openrouter.ai/api/v1'` → `process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'`
- `SHIPPING_CONFIG.chatServicePort`: Hardcoded `3003` → `parseInt(process.env.CHAT_SERVICE_PORT || '3003', 10)`
- `APP_SUPPORT_PHONE`: Hardcoded → `process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+966 50 123 4567'`
- `APP_ADDRESS`: Hardcoded → `process.env.NEXT_PUBLIC_APP_ADDRESS || 'Dubai, UAE & Riyadh, KSA'`
- `DEFAULT_SELLER_PHONE`: Hardcoded → `process.env.NEXT_PUBLIC_DEFAULT_SELLER_PHONE || '+971501234567'`
- `DEFAULT_TIMEZONE`: Hardcoded → `process.env.NEXT_PUBLIC_DEFAULT_TIMEZONE || 'Asia/Riyadh'`

**New UI_CONFIG constant added:**
```typescript
export const UI_CONFIG = {
  carouselAutoAdvanceMs: 5000,
  socialProofAutoDismissMs: 5000,
  socialProofInitialDelayMs: 10000,
  productsPerPage: 12,
  maxProductPrice: 2000,
  scrollThresholdForFAB: 600,
  defaultCarYearTo: new Date().getFullYear() + 1,
};
```

## Verification

- `bun run lint --fix` — passes with 0 errors
