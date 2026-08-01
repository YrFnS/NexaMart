'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { BreadcrumbNav } from '@/components/common/breadcrumb-nav';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';
import { useI18n } from '@/lib/i18n';

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
  const { dir } = useI18n();

  return (
    <div
      dir={dir()}
      className="min-h-screen flex flex-col bg-background text-foreground w-full max-w-full overflow-x-hidden"
    >
      <ErrorBoundary>
        <OfflineBanner />
        <Header />
        <BreadcrumbNav />

        <main data-app-shell-main className="flex-1 w-full max-w-full">
          {children}
        </main>

        <Footer />
        <MobileNav />
        <AIChatWidget />
        <CompareDrawer />
        <BackToTop />
        <SearchCommand />
        <CookieConsentBanner />
      </ErrorBoundary>
    </div>
  );
}
