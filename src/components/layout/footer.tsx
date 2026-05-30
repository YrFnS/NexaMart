'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Mail,
  Send,
  MapPin,
  Phone,
  ShieldCheck,
  Download,
  Apple,
  Gavel,
  Package,
  Crown,
  Grid3X3,
  ArrowUpRight,
  QrCode,
  Zap,
  TrendingUp,
  Home,
  Linkedin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { getViewUrl } from '@/lib/use-app-navigation';
import { APP_NAME, APP_SUPPORT_EMAIL, APP_SUPPORT_PHONE, APP_ADDRESS, APP_SOCIAL_LINKS, PAYMENT_METHODS } from '@/lib/config';

const socialLinks = [
  { icon: Facebook, href: APP_SOCIAL_LINKS.facebook, label: 'Facebook', hoverColor: 'hover:text-blue-400 hover:bg-blue-500/20' },
  { icon: Twitter, href: APP_SOCIAL_LINKS.twitter, label: 'Twitter', hoverColor: 'hover:text-sky-400 hover:bg-sky-500/20' },
  { icon: Instagram, href: APP_SOCIAL_LINKS.instagram, label: 'Instagram', hoverColor: 'hover:text-pink-400 hover:bg-pink-500/20' },
  { icon: Youtube, href: APP_SOCIAL_LINKS.youtube, label: 'YouTube', hoverColor: 'hover:text-red-400 hover:bg-red-500/20' },
  { icon: Linkedin, href: APP_SOCIAL_LINKS.linkedin, label: 'LinkedIn', hoverColor: 'hover:text-blue-300 hover:bg-blue-400/20' },
];

// Payment methods moved to config.ts — imported as PAYMENT_METHODS

export function Footer() {
  const { t, dir, locale, setLocale } = useI18n();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const currentYear = new Date().getFullYear();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const footerColumns = [
    {
      title: t('footerShop'),
      links: [
        { label: t('allCategories'), href: getViewUrl('shop') },
        { label: t('footerDealsOffers'), href: getViewUrl('deals') },
        { label: t('footerFlashSales'), href: getViewUrl('deals') },
        { label: t('footerWholesale'), href: getViewUrl('wholesale') },
        { label: t('footerAuctions'), href: getViewUrl('auctions') },
        { label: t('footerNewArrivals'), href: getViewUrl('shop') },
        { label: t('footerTrending'), href: getViewUrl('shop') },
        { label: t('footerNearMe'), href: getViewUrl('near-me') },
      ],
    },
    {
      title: t('footerSell'),
      links: [
        { label: t('footerStartSelling'), href: getViewUrl('seller-onboarding') },
        { label: t('footerSellerDashboard'), href: getViewUrl('seller-dashboard') },
        { label: t('footerPromoteListings'), href: getViewUrl('promote-listing') },
        { label: t('footerSellerAnalytics'), href: getViewUrl('seller-dashboard') },
        { label: t('footerStoreSettings'), href: getViewUrl('seller-dashboard') },
        { label: t('footerPricingPlans'), href: getViewUrl('seller-onboarding') },
        { label: t('footerSellerSupport'), href: getViewUrl('help-center') },
      ],
    },
    {
      title: t('footerHelpSupport'),
      links: [
        { label: t('helpCenter'), href: getViewUrl('help-center') },
        { label: t('footerSafetyTips'), href: getViewUrl('safety-tips') },
        { label: t('footerReturnsRefunds'), href: getViewUrl('returns') },
        { label: t('footerShippingInfo'), href: getViewUrl('shipping') },
        { label: t('contactUs'), href: getViewUrl('help-center') },
        { label: t('footerReportListing'), href: getViewUrl('help-center') },
        { label: t('footerFaqs'), href: getViewUrl('help-center') },
      ],
    },
    {
      title: t('footerAboutNexaMart'),
      links: [
        { label: t('aboutUs'), href: '/' },
        { label: t('careers'), href: '/' },
        { label: t('footerPress'), href: '/' },
        { label: t('footerBlog'), href: '/' },
        { label: t('affiliateProgram'), href: getViewUrl('help-center') },
        { label: t('termsOfService'), href: getViewUrl('help-center') },
        { label: t('privacyPolicy'), href: getViewUrl('help-center') },
        { label: t('footerCookiePolicy'), href: getViewUrl('help-center') },
      ],
    },
  ];

  return (
    <footer
      dir={dir()}
      className="bg-gray-900 text-gray-300 mt-auto max-w-full overflow-x-hidden"
    >
      {/* Gradient separator above footer */}
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 start-10 w-24 h-24 rounded-full bg-white" />
          <div className="absolute bottom-2 end-20 w-16 h-16 rounded-full bg-white" />
          <div className="absolute top-1/2 end-1/4 w-10 h-10 rounded-full bg-white" />
        </div>
        <div className="container mx-auto px-4 py-8 relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-white">
              <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                <Mail className="size-7" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{t('stayUpdated')}</h3>
                <p className="text-sm text-emerald-100 max-w-md">{t('stayUpdatedDesc')}</p>
              </div>
            </div>
            <form
              onSubmit={handleSubscribe}
              className="flex w-full md:w-auto gap-2"
            >
              <div className="relative flex-1 md:w-80">
                <Input
                  type="email"
                  placeholder={t('enterEmail')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-white/15 border-white/25 text-white placeholder:text-emerald-200 focus-visible:border-white/50 focus-visible:ring-white/20 backdrop-blur-sm rounded-xl"
                />
              </div>
              <Button
                type="submit"
                className="h-11 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shrink-0 rounded-xl px-6 shadow-lg"
              >
                <Send className="size-4 me-1.5" />
                {subscribed ? '✓' : t('subscribe')}
              </Button>
            </form>
            {/* Social Media Icons */}
            <div className="flex items-center gap-1.5">
              {socialLinks.map((social) => (
                <Button
                  key={social.label}
                  variant="ghost"
                  size="icon"
                  className={`size-9 text-white/70 transition-all duration-200 ${social.hoverColor}`}
                  asChild
                >
                  <a href={social.href} aria-label={social.label}>
                    <social.icon className="size-4" />
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links - 4 columns */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-4 lg:mb-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20">
                <Sparkles className="size-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  Nexa
                </span>
                <span>Mart</span>
              </span>
            </div>
            <p className="text-sm text-gray-400 max-w-xs mb-4 leading-relaxed">
              {t('footerBrandDesc')}
            </p>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-emerald-400" />
                <span>{APP_ADDRESS}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-4 shrink-0 text-emerald-400" />
                <span>{APP_SUPPORT_PHONE}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="size-4 shrink-0 text-emerald-400" />
                <span>{APP_SUPPORT_EMAIL}</span>
              </div>
            </div>
          </div>

          {/* Link Columns */}
          {footerColumns.map((section, idx) => (
            <div key={section.title}>
              <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-0.5 bg-emerald-500 rounded-full" />
                {section.title}
              </h3>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowUpRight className="size-2.5 text-transparent group-hover:text-emerald-400 transition-all -translate-x-1 group-hover:translate-x-0 rtl:translate-x-1 rtl:group-hover:-translate-x-0" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-800" />

      {/* App Download + Payment Methods Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          {/* App Download Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div>
              <h4 className="font-semibold text-sm text-white mb-3">{t('downloadOurApp')}</h4>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-emerald-500/50 transition-colors group">
                  <Apple className="size-5 text-gray-300 group-hover:text-white transition-colors" />
                  <div className="text-start">
                    <p className="text-[8px] text-gray-500 leading-none">{t('footerDownloadOn')}</p>
                    <p className="text-xs font-semibold text-white leading-tight">{t('footerAppStore')}</p>
                  </div>
                </button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:border-emerald-500/50 transition-colors group">
                  <Download className="size-5 text-gray-300 group-hover:text-white transition-colors" />
                  <div className="text-start">
                    <p className="text-[8px] text-gray-500 leading-none">{t('footerGetItOn')}</p>
                    <p className="text-xs font-semibold text-white leading-tight">{t('footerGooglePlay')}</p>
                  </div>
                </button>
              </div>
            </div>
            {/* QR Code Placeholder */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg bg-white p-1.5 flex items-center justify-center">
                <QrCode className="size-full text-gray-900" />
              </div>
              <p className="text-xs text-gray-500 max-w-[80px] leading-tight">{t('scanQR')}</p>
            </div>
          </div>

          {/* Quick Links Row */}
          <div className="hidden lg:flex items-center gap-4">
            {[
              { icon: Gavel, label: t('footerAuctions'), href: getViewUrl('auctions') },
              { icon: Package, label: t('footerWholesale'), href: getViewUrl('wholesale') },
              { icon: Crown, label: t('loyaltyProgram'), href: getViewUrl('subscriptions-loyalty') },
              { icon: Grid3X3, label: t('appMarketplace'), href: getViewUrl('app-marketplace') },
              { icon: Zap, label: t('installments'), href: getViewUrl('installments') },
              { icon: TrendingUp, label: t('deals'), href: getViewUrl('deals') },
              { icon: Home, label: t('properties'), href: getViewUrl('properties') },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-gray-800 transition-colors group"
              >
                <item.icon className="size-5 text-gray-500 group-hover:text-emerald-400 transition-colors" />
                <span className="text-[10px] text-gray-500 group-hover:text-emerald-400 transition-colors">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Payment Methods */}
          <div>
            <p className="text-xs text-gray-500 mb-2">{t('paymentMethods')}</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {PAYMENT_METHODS.map((payment) => (
                <span
                  key={payment.name}
                  className={`inline-flex items-center justify-center px-2 py-1 rounded text-[9px] font-bold tracking-wide ${payment.color}`}
                  title={payment.name}
                >
                  {payment.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800" />

      {/* Bottom Bar */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Copyright */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <ShieldCheck className="size-4 text-emerald-500" />
            <span>© {currentYear} {APP_NAME}. {t('allRightsReserved')}</span>
          </div>

          {/* Language & Currency */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-800 border border-gray-700 text-xs text-gray-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors"
            >
              <span>{locale === 'en' ? '🇺🇸' : '🇸🇦'}</span>
              <span>{locale === 'en' ? 'EN' : 'AR'}</span>
            </button>
          </div>

          {/* Made with love */}
          <p className="text-xs text-gray-500">
            {t('madeWithLove')}
          </p>
        </div>
      </div>
    </footer>
  );
}
