'use client';

import React from 'react';
import { BadgeCheck, Shield, RotateCcw, Truck } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { AnimatedSection } from './home-hooks';

export function TrustStrip() {
  const { locale } = useI18n();

  const trustBadges = [
    {
      icon: BadgeCheck,
      title: locale === 'ar' ? 'بائع موثق' : 'Verified Sellers',
      desc: locale === 'ar' ? 'جميع البائعين تم التحقق منهم' : 'All sellers verified & authenticated',
    },
    {
      icon: Shield,
      title: locale === 'ar' ? 'دفع آمن' : 'Secure Payments',
      desc: locale === 'ar' ? 'معاملات مشفرة وآمنة' : 'Encrypted & secure transactions',
    },
    {
      icon: RotateCcw,
      title: locale === 'ar' ? 'ضمان استرداد الأموال' : 'Money Back Guarantee',
      desc: locale === 'ar' ? 'استرداد خلال 14 يوم' : 'Full refund within 14 days',
    },
    {
      icon: Truck,
      title: locale === 'ar' ? 'توصيل سريع' : 'Fast Delivery',
      desc: locale === 'ar' ? 'توصيل سريع لكل المنطقة' : 'Quick delivery across the region',
    },
  ];

  return (
    <AnimatedSection>
      <section className="bg-[oklch(0.98_0.01_80)] py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {trustBadges.map((badge) => (
              <div
                key={badge.title}
                className="flex flex-col items-center text-center p-5 md:p-6 rounded-xl bg-white border border-gray-200/60 dark:border-gray-700/40 shadow-sm hover:border-[oklch(0.75_0.12_85)] hover:shadow-md hover:shadow-[oklch(0.75_0.12_85)]/5 transition-all duration-300 hover:-translate-y-1 group cursor-default"
              >
                <div className="w-14 h-14 rounded-xl bg-[oklch(0.98_0.01_80)] flex items-center justify-center mb-3 group-hover:scale-110 transition-all duration-300 border border-[oklch(0.75_0.12_85)]/20">
                  <badge.icon className="size-6 text-[oklch(0.75_0.12_85)]" />
                </div>
                <h3 className="font-semibold text-sm text-[oklch(0.18_0.02_270)] dark:text-gray-100">{badge.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}
