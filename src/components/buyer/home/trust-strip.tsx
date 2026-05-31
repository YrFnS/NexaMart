'use client';

import React from 'react';
import { Shield, Lock, RotateCcw, Headphones } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { AnimatedSection } from './home-hooks';

export function TrustStrip() {
  const { t } = useI18n();

  const trustBadges = [
    { icon: Shield, title: t('verifiedSellers'), desc: t('verifiedSellersDesc') },
    { icon: Lock, title: t('securePayments'), desc: t('securePaymentsDesc') },
    { icon: RotateCcw, title: t('moneyBackGuarantee'), desc: t('moneyBackGuaranteeDesc') },
    { icon: Headphones, title: t('alwaysSupport'), desc: t('alwaysSupportDesc') },
  ];

  return (
    <AnimatedSection>
      <section className="bg-emerald-50/50 dark:bg-emerald-950/20 py-10 md:py-14">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {trustBadges.map((badge) => (
              <div
                key={badge.title}
                className="flex flex-col items-center text-center p-5 md:p-6 rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 bg-white/80 dark:bg-card/70 backdrop-blur-md hover:border-emerald-400/70 dark:hover:border-emerald-600/50 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/80 dark:to-teal-900/80 backdrop-blur-sm flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
                  <badge.icon className="size-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-semibold text-sm">{badge.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}
