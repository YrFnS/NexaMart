# Task 2-c: Fix Header, Footer, and Layout Components

**Agent:** Layout Fix Agent
**Date:** 2025-03-05
**Status:** Complete

## Summary

Fixed UI issues across Header, Footer, AppShell, and Root Layout components to ensure proper sticky footer behavior, prevent horizontal overflow, fix conflicting CSS, and improve mobile menu scrolling.

## Files Changed

### 1. `src/components/layout/header.tsx`

- **Fixed conflicting CSS on "Sell on NexaMart" button** (line ~384): Removed `text-white border-0` which overrode the intended `text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-700`. Also removed unused `btn-gradient-shift` class. Button now properly displays as an outlined emerald CTA.
- **Replaced ChevronRight with ChevronDown for "More" dropdown** (line ~285): Both RTL and LTR were using `ChevronRight` with `rotate-90`, which was a hacky way to show a down chevron. Replaced with proper `ChevronDown` icon for semantic clarity.
- **Added `ChevronDown` to lucide-react imports** (line ~25).
- **Fixed mobile menu ScrollArea height** (line ~712): Changed from `className="flex-1"` (which doesn't work inside a Sheet/Dialog) to `className="h-[calc(100vh-10rem)]"` so the scroll area has a defined height and content actually scrolls.

### 2. `src/components/layout/footer.tsx`

- **Added `max-w-full overflow-x-hidden` to footer element** (line ~127): Prevents horizontal overflow from footer content, especially important for the newsletter section with decorative absolute-positioned circles.
- **Added `overflow-hidden` to newsletter section** (line ~133): The newsletter section has absolute-positioned decorative circles that could cause horizontal overflow. Added `overflow-hidden` to clip them properly.

### 3. `src/components/layout/app-shell.tsx`

- **Added `w-full max-w-full overflow-x-hidden` to wrapper div** (line ~77): Prevents horizontal overflow at the shell level, which is the outermost layout container.
- **Simplified `<main>` element** (line ~86): Changed from `className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] md:pb-0"` to `className="flex-1 w-full max-w-full"`. The bottom padding for mobile nav is better handled by the MobileNav component itself (which is position:fixed). Added `w-full max-w-full` to prevent main content from overflowing horizontally.

### 4. `src/app/layout.tsx` — Verified, no changes needed

- `<html>` tag has `dir="ltr"` as default — DirectionProvider dynamically updates to `rtl` when Arabic locale is selected
- Body has `overflow-x-hidden` — Good
- ThemeProvider properly configured with `attribute="class"`, `defaultTheme="system"`, `enableSystem`
- DirectionProvider wraps children and updates `dir` and `lang` on `<html>` element

### 5. `src/app/(buyer)/layout.tsx` — Verified, no changes needed

- Properly wraps children in dynamically-imported AppShell
- Loading state with spinner shown during dynamic import

## Verification

- `bun run lint` — 0 errors (1 pre-existing warning in unrelated file)
- Dev server compiles successfully on port 3000
- All GET / requests return 200
