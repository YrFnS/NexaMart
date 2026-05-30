Task ID: 5-a
Agent: Fullstack Developer Agent

## Summary

Built 4 OpenSooq-inspired classifieds features for NexaMart:

1. **Quick Post / Classified Ad Creation** - 3-step wizard (Category → Details → Review & Publish) with 15 categories, bilingual EN/AR fields, condition selector, city dropdown, photo upload placeholders
2. **Report Listing Dialog** - 7 report reasons, optional description, anonymous checkbox, success confirmation
3. **Contact Seller Buttons** - Call (green, with phone dialog + copy), WhatsApp (#25D366, wa.me link), Chat (emerald)
4. **Listing Comments/Q&A** - 6 mock comments, reply 1-level deep, upvote, expand/collapse answers, ask question input

All features have full EN/AR support with RTL, integrated into product detail page and header navigation.

## Files Created
- `src/components/classifieds/quick-post-page.tsx`
- `src/app/api/classifieds/route.ts`
- `src/components/common/report-listing-dialog.tsx`
- `src/components/common/contact-seller-buttons.tsx`
- `src/components/common/listing-comments.tsx`

## Files Modified
- `src/lib/i18n.ts` - 40+ EN/AR keys
- `src/stores/app-store.ts` - quick-post view + URL mapping
- `src/app/page.tsx` - QuickPostPage import + switch case
- `src/components/buyer/product-detail-page.tsx` - Report, Contact, Questions tab integration
- `src/components/layout/header.tsx` - Post Free Ad button (desktop + mobile)

## Lint
- 0 errors from new code
- 1 pre-existing error (cars-page.tsx)
