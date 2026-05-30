# Task 3-f: Footer & Config Fix Agent

## Task
Fix hardcoded values in the footer component and config file.

## Work Completed

### config.ts changes
- Added `APP_ADDRESS = 'Dubai, UAE & Riyadh, KSA'`
- Added `APP_SOCIAL_LINKS` object with URLs derived from APP_NAME
- Updated `APP_SUPPORT_PHONE` from placeholder `'+966 50 000 0000'` to `'+966 50 123 4567'`
- Added TODO comments for eventual DB migration

### footer.tsx changes
- Social links: replaced 5 `href="#"` with `APP_SOCIAL_LINKS.*` URLs
- Address: replaced hardcoded "Dubai, UAE & Riyadh, KSA" with `{APP_ADDRESS}`
- Phone: replaced hardcoded "+971 4 123 4567" with `{APP_SUPPORT_PHONE}`
- i18n: converted 8 inline Arabic texts to t() calls
- Cleanup: removed unused `isRTL` variable and `ArrowUp` import

### Locale files
- Added 3 new keys to both en.json and ar.json: footerBrandDesc, footerDownloadOn, footerGetItOn

## Lint
- 0 errors, 1 pre-existing warning
