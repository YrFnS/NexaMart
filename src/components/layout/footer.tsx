'use client';

import React from 'react';
import Link from 'next/link';
import {
  CircleHelp,
  Heart,
  Mail,
  Package,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
} from 'lucide-react';
import { APP_NAME, APP_SUPPORT_EMAIL } from '@/lib/config';
import { useI18n } from '@/lib/i18n';
import { useUserStore } from '@/stores/user-store';

const marketplaceLinks = [
  { href: '/shop', en: 'Browse products', ar: 'تصفح المنتجات' },
  { href: '/deals', en: 'Current deals', ar: 'العروض الحالية' },
  { href: '/stores', en: 'Verified stores', ar: 'المتاجر الموثّقة' },
  { href: '/compare', en: 'Compare products', ar: 'مقارنة المنتجات' },
] as const;

const supportLinks = [
  { href: '/help', en: 'Help center', ar: 'مركز المساعدة', icon: CircleHelp },
  { href: '/orders', en: 'My orders', ar: 'طلباتي', icon: Package },
  { href: '/wishlist', en: 'Wishlist', ar: 'المفضلة', icon: Heart },
  { href: '/returns', en: 'Returns', ar: 'الإرجاعات', icon: RotateCcw },
] as const;

export function Footer() {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  const user = useUserStore((state) => state.user);
  const currentYear = new Date().getFullYear();

  function label(en: string, ar: string) {
    return isRTL ? ar : en;
  }

  const sellerHref =
    user?.role === 'seller'
      ? '/seller/dashboard'
      : user?.role === 'admin'
        ? '/admin'
        : '/seller/onboarding';
  const sellerLabel =
    user?.role === 'seller'
      ? label('Seller workspace', 'لوحة البائع')
      : user?.role === 'admin'
        ? label('Admin workspace', 'لوحة الإدارة')
        : label('Start selling', 'ابدأ البيع');
  const SellerIcon = user?.role === 'admin' ? ShieldCheck : Store;

  return (
    <footer className="mt-12 border-t border-border bg-card/70" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto grid gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1fr]">
        <section aria-labelledby="footer-about" className="space-y-4">
          <Link href="/" className="inline-flex items-center gap-2 rounded-md">
            <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <span className="text-xl font-bold">
              <span className="text-amber-700 dark:text-amber-300">Nexa</span>
              Mart
            </span>
          </Link>
          <h2 id="footer-about" className="sr-only">
            {label('About NexaMart', 'حول نكسا مارت')}
          </h2>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            {label(
              'A multi-vendor marketplace for discovering products, placing orders, and following seller fulfilment in one place.',
              'سوق متعدد البائعين لاكتشاف المنتجات وإنشاء الطلبات ومتابعة تنفيذها في مكان واحد.',
            )}
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {label(
              'NexaMart does not process payments in this release. Customers pay sellers directly on delivery.',
              'لا يعالج NexaMart المدفوعات في هذا الإصدار. يدفع العملاء للبائع مباشرة عند التسليم.',
            )}
          </div>
          <a
            href={`mailto:${APP_SUPPORT_EMAIL}`}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm text-muted-foreground hover:text-amber-700 dark:hover:text-amber-300"
          >
            <Mail className="size-4" aria-hidden="true" />
            {APP_SUPPORT_EMAIL}
          </a>
        </section>

        <nav aria-labelledby="footer-marketplace">
          <h2 id="footer-marketplace" className="mb-3 font-semibold">
            {label('Marketplace', 'السوق')}
          </h2>
          <ul className="space-y-1">
            {marketplaceLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex min-h-10 items-center rounded-md text-sm text-muted-foreground hover:text-amber-700 dark:hover:text-amber-300"
                >
                  {label(link.en, link.ar)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-account">
          <h2 id="footer-account" className="mb-3 font-semibold">
            {label('Account and support', 'الحساب والدعم')}
          </h2>
          <ul className="space-y-1">
            {supportLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex min-h-10 items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-amber-700 dark:hover:text-amber-300"
                >
                  <link.icon className="size-4" aria-hidden="true" />
                  {label(link.en, link.ar)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-labelledby="footer-sellers">
          <h2 id="footer-sellers" className="mb-3 font-semibold">
            {label('For sellers', 'للبائعين')}
          </h2>
          <div className="space-y-2">
            <Link
              href={sellerHref}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-amber-200 px-3 text-sm font-medium text-amber-800 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-200 dark:hover:bg-amber-950"
            >
              <SellerIcon className="size-4" aria-hidden="true" />
              {sellerLabel}
            </Link>
            <Link
              href="/safety"
              className="flex min-h-10 items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-amber-700 dark:hover:text-amber-300"
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              {label('Marketplace safety', 'أمان السوق')}
            </Link>
            <Link
              href="/shipping"
              className="flex min-h-10 items-center gap-2 rounded-md text-sm text-muted-foreground hover:text-amber-700 dark:hover:text-amber-300"
            >
              <ShoppingBag className="size-4" aria-hidden="true" />
              {label('Delivery information', 'معلومات التوصيل')}
            </Link>
          </div>
        </section>
      </div>

      <div className="border-t border-border">
        <div className="container mx-auto flex flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} {APP_NAME}. {label('All rights reserved.', 'جميع الحقوق محفوظة.')}
          </p>
          <p>
            {label(
              'Orders and fulfilment are recorded by NexaMart; payment remains between buyer and seller.',
              'يسجل NexaMart الطلبات والتنفيذ، بينما يبقى الدفع بين المشتري والبائع.',
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}
