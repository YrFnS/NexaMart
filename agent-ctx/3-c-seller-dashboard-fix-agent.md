# Task 3-c: Seller Dashboard Fix Agent

## Task
Fix hardcoded values in seller-dashboard.tsx

## Work Done
1. Added `ownerId` query param to `/api/stores/route.ts` — was missing, now supports filtering stores by owner
2. Fixed hardcoded "TechStore Pro" — replaced with dynamic store name fetched from API using `useUserStore().user.id`
3. Removed hardcoded badge counts (5 for orders, 3 for returns) from navItems — badges now only show when real data exists
4. Replaced inline Arabic strings in `adTypeConfig` with i18n keys (`s_adBumpUp`, `s_adFeatured`, `s_adPremium`, `s_adUrgent`, `s_adSpotlight`)
5. Updated adTypeConfig type and usage from `locale === 'ar' ? config.labelAr : config.label` to `t(config.labelKey)`
6. Added 5 new i18n keys to both `en.json` and `ar.json`

## Files Changed
- `src/app/api/stores/route.ts` — Added ownerId filter support
- `src/components/seller/seller-dashboard.tsx` — Fixed 3 hardcoded value issues
- `src/lib/locales/en.json` — Added 5 new i18n keys
- `src/lib/locales/ar.json` — Added 5 new i18n keys

## Verification
- `bun run lint` — 0 errors, 1 pre-existing warning
