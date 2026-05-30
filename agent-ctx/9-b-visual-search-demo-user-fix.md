# Task 9-b: Visual Search & Demo-User Fix Agent

**Date:** 2025-03-05
**Status:** ✅ Complete

## Task
Fix hardcoded fake data in the visual search API and the demo-user fallback pattern across components.

## Part 1: Visual Search API
**File:** `src/app/api/ai/visual-search/route.ts`

- Removed the full hardcoded array of 5 fake products (lines 48-124) that were returned when DB query failed or returned no results
- These fake products had realistic-looking names, prices, stores, ratings, and fake similarity scores (94.2, 87.5…) making them look legitimate
- Now when DB query fails, returns a proper error response: `{ error: 'Failed to query products. Please try again.' }` with status 500
- When DB query succeeds but returns empty, returns real (empty) results array
- Removed simulated AI processing delay (`await new Promise(resolve => setTimeout(resolve, 1500))`)
- Removed `processingTime: '1.5s'` from response

## Part 2: Demo-User Fallback Pattern

### 1. `src/components/common/product-reviews-section.tsx`
- Replaced `userId: 'demo-user'` with `const userId = user?.id; if (!userId) return;`
- Added `import { useUserStore } from '@/stores/user-store'`
- Added `const { user } = useUserStore()` to the component

### 2. `src/components/common/notification-panel.tsx`
- Replaced `fetch('/api/notifications?userId=demo-user')` with `fetch(`/api/notifications?userId=${userId}`)`
- Added early return if no user: `if (!userId) { setLoading(false); return; }`
- Added `import { useUserStore } from '@/stores/user-store'`
- Added `const { user } = useUserStore()` to the component
- Changed useEffect dependency from `[]` to `[user?.id]`

### 3. `src/components/buyer/reviews-section.tsx`
- Replaced `userId: 'demo-user'` with `const userId = user?.id; if (!userId) return;`
- Added `import { useUserStore } from '@/stores/user-store'`
- Added `const { user } = useUserStore()` to the component

### 4. `src/components/buyer/returns-page.tsx` (3 locations)
- Line ~152: `user?.id || 'demo-user'` → `user?.id` with early return guard (`if (!userId) { setOrdersForReturn([]); setOrdersLoading(false); return; }`)
- Line ~175: `user?.id || 'demo-user'` → `user?.id` with early return guard (`if (!userId) { setReturns([]); setLoading(false); return; }`)
- Line ~273: `user?.id || 'demo-user'` → `user?.id || ''` (for buyerId in POST body, empty string won't match real users)

### 5. `src/components/buyer/orders-page.tsx`
- Line ~133: `user?.id || 'demo-user'` → `user?.id` with early return guard (`if (!userId) { setOrders([]); setLoading(false); return; }`)

## Part 3: Wishlist API
**File:** `src/app/api/wishlist/route.ts`

- Removed hardcoded `db.user.findUnique({ where: { email: 'demo@nexamart.com' } })` from both GET and POST
- GET now accepts `userId` as required query parameter, returns 400 if missing
- POST now accepts `userId` in request body, returns 400 if missing
- POST also handles `action: 'remove'` with `itemId` (used by wishlist-page)
- POST verifies user exists by ID lookup instead of email
- Updated consumers:
  - `src/components/buyer/wishlist-page.tsx` — Added `useUserStore`, passes `userId` in GET and POST requests
  - `src/components/buyer/profile-page.tsx` — Passes `userId` in GET request

## Part 4: Help Ticket Fallback
**File:** `src/app/api/help/route.ts`

- When DB ticket creation fails (catch block on line ~352-354), now returns proper error response: `{ error: 'Failed to create ticket. Please try again.' }` with status 500
- When no userId is provided, returns: `{ error: 'User ID is required to create a ticket.' }` with status 400
- Removed the synthetic `ticket-${Date.now()}` fake ticket object that was returned as if saved

## Verification
- `bun run lint` — passes (0 errors, 1 pre-existing warning in unrelated file)
- No remaining `demo-user` runtime fallbacks in component code (only in config.ts for demo login feature)
