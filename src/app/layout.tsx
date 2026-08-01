import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Geist, Geist_Mono, Noto_Sans_Arabic } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import './ui-foundation.css';
import { Toaster } from '@/components/ui/toaster';
import { DirectionProvider } from '@/components/common/direction-provider';
import { AuthSessionSync } from '@/components/auth/auth-session-sync';
import {
  LOCALE_COOKIE,
  localeDirection,
  normalizeLocale,
} from '@/lib/locale';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: '--font-noto-arabic',
  subsets: ['arabic'],
});

export const metadata: Metadata = {
  title: 'NexaMart - AI-Powered Multi-Vendor Commerce Platform',
  description:
    'Discover AI-powered shopping with smart search, visual discovery, and products from verified sellers worldwide.',
  keywords: ['NexaMart', 'e-commerce', 'AI shopping', 'multi-vendor', 'marketplace'],
  icons: {
    icon: '/logo.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const direction = localeDirection(locale);

  return (
    <html
      lang={locale}
      dir={direction}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#d97706" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansArabic.variable} antialiased bg-background text-foreground overflow-x-hidden`}
      >
        <DirectionProvider initialLocale={locale}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            disableTransitionOnChange
          >
            <AuthSessionSync />
            {children}
            <Toaster />
          </ThemeProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}
