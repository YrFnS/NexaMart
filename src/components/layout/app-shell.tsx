'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/common/error-boundary';
import { useI18n } from '@/lib/i18n';

// Dynamic imports for all heavy components to reduce initial compilation load
const Header = dynamic(
  () => import('@/components/layout/header').then(mod => ({ default: mod.Header })),
  { 
    ssr: false,
    loading: () => <div className="h-16 bg-background border-b animate-pulse" />
  }
);

const Footer = dynamic(
  () => import('@/components/layout/footer').then(mod => ({ default: mod.Footer })),
  { ssr: false }
);

const MobileNav = dynamic(
  () => import('@/components/layout/mobile-nav').then(mod => ({ default: mod.MobileNav })),
  { ssr: false }
);

const AIChatWidget = dynamic(
  () => import('@/components/common/ai-chat-widget').then(mod => ({ default: mod.AIChatWidget })),
  { ssr: false }
);

const BreadcrumbNav = dynamic(
  () => import('@/components/common/breadcrumb-nav').then(mod => ({ default: mod.BreadcrumbNav })),
  { ssr: false }
);

const SearchCommand = dynamic(
  () => import('@/components/common/search-command').then(mod => ({ default: mod.SearchCommand })),
  { ssr: false }
);

const BackToTop = dynamic(
  () => import('@/components/common/back-to-top').then(mod => ({ default: mod.BackToTop })),
  { ssr: false }
);

const OfflineBanner = dynamic(
  () => import('@/components/common/offline-banner').then(mod => ({ default: mod.OfflineBanner })),
  { ssr: false }
);

const SocialProofToast = dynamic(
  () => import('@/components/common/social-proof-toast').then(mod => ({ default: mod.SocialProofToast })),
  { ssr: false }
);

const CookieConsentBanner = dynamic(
  () => import('@/components/common/cookie-consent-banner').then(mod => ({ default: mod.CookieConsentBanner })),
  { ssr: false }
);

const CompareDrawer = dynamic(
  () => import('@/components/buyer/compare-drawer').then(mod => ({ default: mod.CompareDrawer })),
  { ssr: false }
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

        {/* Breadcrumb Navigation */}
        <BreadcrumbNav />

        <main className="flex-1 w-full max-w-full">
          {children}
        </main>

        <Footer />

        {/* Mobile Bottom Navigation */}
        <MobileNav />

        {/* AI Chat Widget */}
        <AIChatWidget />

        {/* Compare Drawer */}
        <CompareDrawer />

        {/* Social Proof Toast */}
        <SocialProofToast />

        {/* Back to Top Button */}
        <BackToTop />

        {/* Search Command Palette */}
        <SearchCommand />

        {/* Cookie Consent Banner */}
        <CookieConsentBanner />
      </ErrorBoundary>
    </div>
  );
}
