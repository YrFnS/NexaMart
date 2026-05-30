# Task 8: i18n Ternary Conversion (Auth & Common Batch)

## Summary
Converted inline `isRTL ? 'Arabic' : 'English'` ternary patterns to `t('key')` i18n function calls across 8 target files in auth and common component directories.

## Files Modified (7 files)
1. `src/lib/i18n.ts` — Added 18 new keys (EN+AR), updated 1 AR key
2. `src/components/auth/auth-page.tsx` — 13 text ternaries → t() calls
3. `src/components/common/cookie-consent-banner.tsx` — 1 text ternary → t('acceptAll')
4. `src/components/common/breadcrumb-nav.tsx` — 1 text ternary → t('nearMe')
5. `src/components/common/error-boundary.tsx` — Removed unused isRTL
6. `src/components/common/offline-banner.tsx` — Removed unused isRTL
7. `src/components/common/search-command.tsx` — Converted data-driven patterns to i18nKey approach, removed isRTL

## Files Not Modified (3 files)
- `onboarding-flow.tsx` — Already fully using t(), no ternaries found
- `notification-panel.tsx` — Only has data-driven isRTL patterns (notif.titleAr/title), no string literal ternaries
- (cookie-consent.tsx / search-command-palette.tsx — original names didn't exist, actual files were -banner.tsx and search-command.tsx)

## Lint: ✅ Passed (0 errors)
