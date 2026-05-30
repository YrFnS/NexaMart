# Task 3-e-2: i18n Properties Page Agent

## Task
Convert ALL inline Arabic text patterns to proper i18n `t()` function calls in `/home/z/my-project/src/components/buyer/properties-page.tsx`.

## Analysis

### `isRTL` Usage Audit

Thoroughly audited all `isRTL` usages in the file (11 occurrences total):

1. **Line 57**: `const isRTL = locale === 'ar'` — Definition, keep
2. **Line 114**: `isRTL ? c.labelAr : c.label` — Dynamic reference data (MENA_CITIES) selection, NOT convertible to `t()` (data is dynamic)
3. **Lines 171, 192, 203**: `dir={isRTL ? 'rtl' : 'ltr'}` — Layout direction, keep per task instructions
4. **Lines 223, 228**: CSS positioning (`right-3`/`left-3`, `pr-9`/`pl-9`) — Layout direction, keep per task instructions
5. **Lines 420, 527, 620**: `alt={isRTL ? (property.titleAr || property.title) : property.title}` — Dynamic API data selection, NOT convertible to `t()` (data comes from API, not static translations)
6. **Lines 454, 558, 648**: `{isRTL ? (property.titleAr || property.title) : property.title}` — Dynamic API data selection, NOT convertible to `t()` (same reason)

### Key Finding
**NO inline Arabic text patterns** (like `isRTL ? 'نص عربي' : 'English text'`) exist in this file. All `isRTL` usages for text are either:
- Layout direction (keep as-is per task instructions)
- Dynamic data field selection from API/reference data (cannot be converted to `t()` because `t()` is for static translations, not dynamic data)

The previous i18n conversion pass already properly handled all static text with `t()` calls.

## Changes Made

### 1. Added `prop_sqm` i18n key to BOTH locale files
- **en.json**: `"prop_sqm": "m²"`
- **ar.json**: `"prop_sqm": "م²"`

### 2. Replaced hardcoded `m²` with `t('prop_sqm')` (3 occurrences)
- **Line 459** (featured property card): `{property.area} m²` → `{property.area} {t('prop_sqm')}`
- **Line 563** (grid view property card): `{property.area} m²` → `{property.area} {t('prop_sqm')}`
- **Line 658** (list view property card): `{property.area} m²` → `{property.area} {t('prop_sqm')}`

### 3. Removed inline English fallback string
- **Line 195**: `{t('noProperties') || 'No properties found'}` → `{t('noProperties')}`
  - The `noProperties` key already exists in both locale files with proper translations
  - The inline fallback `'No properties found'` was redundant hardcoded English text

## Verification
- `bun run lint` — passes (0 errors, 1 pre-existing warning in unrelated file)
- Dev server running without compilation errors
