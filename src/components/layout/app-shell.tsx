'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';

const AIChatWidget = dynamic(
  () =>
    import('@/components/common/ai-chat-widget').then((mod) => ({
      default: mod.AIChatWidget,
    })),
  { ssr: false },
);

const SearchCommand = dynamic(
  () =>
    import('@/components/common/search-command').then((mod) => ({
      default: mod.SearchCommand,
    })),
  { ssr: false },
);

const BackToTop = dynamic(
  () =>
    import('@/components/common/back-to-top').then((mod) => ({
      default: mod.BackToTop,
    })),
  { ssr: false },
);

const OfflineBanner = dynamic(
  () =>
    import('@/components/common/offline-banner').then((mod) => ({
      default: mod.OfflineBanner,
    })),
  { ssr: false },
);

const CookieConsentBanner = dynamic(
  () =>
    import('@/components/common/cookie-consent-banner').then((mod) => ({
      default: mod.CookieConsentBanner,
    })),
  { ssr: false },
);

const CompareDrawer = dynamic(
  () =>
    import('@/components/buyer/compare-drawer').then((mod) => ({
      default: mod.CompareDrawer,
    })),
  { ssr: false },
);

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { dir, locale } = useI18n();
  const compareActive = useAppStore((state) => state.compareIds.length > 0);
  const skipLabel =
    locale === 'ar' ? 'انتقل إلى المحتوى الرئيسي' : 'Skip to main content';

  function focusMainContent(event: React.MouseEvent<HTMLAnchorElement>) {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    event.preventDefault();
    mainContent.focus();
    mainContent.scrollIntoView({ block: 'start' });
  }

  return (
    <div
      dir={dir()}
      className="min-h-screen flex flex-col bg-background text-foreground w-full max-w-full overflow-x-hidden"
    >
      <a
        href="#main-content"
        data-skip-link
        onClick={focusMainContent}
        className="sr-only z-[100] rounded-lg bg-background px-4 py-3 font-semibold text-foreground shadow-lg ring-2 ring-amber-500 ring-offset-2 focus:fixed focus:left-4 focus:top-4 focus:not-sr-only"
      >
        {skipLabel}
      </a>

      <ErrorBoundary>
        <OfflineBanner />
        <Header />
        <BreadcrumbNav />

        <div
          id="main-content"
          tabIndex={-1}
          data-app-shell-main
          className="flex-1 w-full max-w-full outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500"
        >
          {children}
        </div>

        <Footer />
        <MobileNav />
        <div
          data-ai-chat-layer
          data-compare-active={compareActive ? 'true' : 'false'}
        >
          <AIChatWidget />
        </div>
        <CompareDrawer />
        <BackToTop />
        <SearchCommand />
        <CookieConsentBanner />
      </ErrorBoundary>
    </div>
  );
}
