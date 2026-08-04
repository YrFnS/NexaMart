import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Geist, Geist_Mono, Noto_Sans_Arabic } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import './ui-foundation.css';
import { Toaster } from '@/components/ui/toaster';
import { DirectionProvider } from '@/components/common/direction-provider';
import { AuthSessionSync } from '@/components/auth/auth-session-sync';
import {
  APP_DESCRIPTION,
  APP_NAME,
  APP_TAGLINE,
  APP_URL,
} from '@/lib/config';
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
  metadataBase: new URL(APP_URL),
  title: {
    default: `${APP_NAME} | ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  category: 'shopping',
  keywords: [
    APP_NAME,
    'multi-vendor marketplace',
    'pay on delivery',
    'online shopping',
    'order tracking',
    'Iraq marketplace',
  ],
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.svg',
    apple: '/icon-192.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['ar_IQ'],
    url: '/',
    siteName: APP_NAME,
    title: `${APP_NAME} | ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} | ${APP_TAGLINE}`,
    description: APP_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: APP_NAME,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#d97706' },
    { media: '(prefers-color-scheme: dark)', color: '#0f0f0f' },
  ],
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
