# Task 9-a: Seller Dashboard Stats Fix

## Summary
Fixed hardcoded fake statistics in the seller dashboard API route.

## Changes

### API Route (`src/app/api/seller/dashboard/route.ts`)
- Replaced `userId = 'demo-user'` with query parameters (`userId`, `storeId`)
- Replaced hardcoded `store: { slug: 'techstore-pro' }` with dynamic store lookup
- Returns 400 if neither param provided, 404 if store not found
- Replaced fake `visitorCount: 1234` → `null` (Product model lacks views field)
- Replaced fake `conversionRate: 3.2` → `null` (cannot compute without views)
- Replaced hardcoded `monthlySales` array with real Order table data grouped by month

### Frontend (`src/components/seller/seller-overview.tsx`)
- Added `useUserStore` to get current user and pass `userId` to API
- Updated `DashboardData` interface for nullable `visitorCount`/`conversionRate`
- Shows '—' em dash when metrics are unavailable

## Lint
0 errors, 1 pre-existing warning
