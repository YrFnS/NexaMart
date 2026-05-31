'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Timer, Award, Star, ArrowRight, ArrowLeft, BadgeCheck, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { ProductCard, type Product } from '@/components/buyer/product-card';
import { AVATAR_GRADIENTS } from '@/lib/theme';
import { AnimatedSection, ScrollableSection, FlipDigit, useInView, useCounter } from './home-hooks';

// --- Stats Counter Card with animated counter ---
function StatsCounterCard({ value, suffix, label, icon: Icon, isInView }: {
  value: number; suffix: string; label: string; icon: React.ElementType; isInView: boolean;
}) {
  const count = useCounter(value, 2000, isInView);
  return (
    <div className="flex items-center gap-3 p-4 md:p-5 rounded-xl bg-card border border-border hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 hover:shadow-md hover:shadow-emerald-500/5 hover:-translate-y-0.5">
      <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50">
        <Icon className="size-5 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <div className="text-xl md:text-2xl font-bold gradient-text">{count.toLocaleString()}{suffix}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

// --- Deal of the Day Spotlight ---
function DealOfDaySpotlight({ products, locale }: { products: Product[]; locale: string }) {
  const { t } = useI18n();
  const nav = useAppNavigation();
  const isRTL = locale === 'ar';
  const bestDeal = products.length > 0 ? products.reduce((best, p) => {
    const disc = p.originalPrice ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
    const bestDisc = best.originalPrice ? Math.round(((best.originalPrice - best.price) / best.originalPrice) * 100) : 0;
    return disc > bestDisc ? p : best;
  }, products[0]) : null;

  if (!bestDeal) return null;

  const discount = bestDeal.originalPrice
    ? Math.round(((bestDeal.originalPrice - bestDeal.price) / bestDeal.originalPrice) * 100)
    : 0;
  const claimed = (bestDeal.stock + bestDeal.soldCount) > 0
    ? Math.min(99, Math.round((bestDeal.soldCount / (bestDeal.soldCount + bestDeal.stock)) * 100))
    : 0;

  return (
    <section className="container mx-auto px-4 py-2">
      <div className="relative rounded-2xl md:rounded-3xl overflow-hidden pulse-glow border-2 border-emerald-400/30 dark:border-emerald-500/30">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 md:p-8 text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 end-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 start-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />

          <div className="relative flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs px-3 py-1">
                  <Flame className="size-3 me-1 animate-pulse" />
                  {t('b_dealOfDayBadge')}
                </Badge>
                <Badge className="bg-red-500 text-white border-0 text-xs px-2 py-1 animate-pulse-subtle">
                  -{discount}% {t('off')}
                </Badge>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                {locale === 'ar' && bestDeal.nameAr ? bestDeal.nameAr : bestDeal.name}
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold">{formatPrice(bestDeal.price)}</span>
                {bestDeal.originalPrice && (
                  <span className="text-lg text-white/60 line-through">{formatPrice(bestDeal.originalPrice)}</span>
                )}
              </div>
              {/* Progress bar showing % claimed */}
              <div className="max-w-sm">
                <div className="flex justify-between text-xs text-white/70 mb-1">
                  <span>{t('b_percentClaimed', { claimed })}</span>
                  <span>{t('b_hurry')}</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white/80 transition-all duration-1000"
                    style={{ width: `${claimed}%` }}
                  />
                </div>
              </div>
              <Button
                size="lg"
                className="bg-white text-emerald-700 hover:bg-white/90 font-bold shadow-lg mt-2"
                onClick={() => nav.selectProduct(bestDeal.id)}
              >
                {t('shopNow')}
                {isRTL ? <ArrowLeft className="size-4 ms-2" /> : <ArrowRight className="size-4 ms-2" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface FlashSaleBannerProps {
  saleProducts: Product[];
  platformStats: { products: number; sellers: number; users: number; countries: number } | null;
}

export function FlashSaleBanner({ saleProducts, platformStats }: FlashSaleBannerProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const { ref: statsRef, isInView: statsInView } = useInView(0.2);

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [prevTime, setPrevTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const handleQuickView = (_product: Product) => {
    // This will be handled by the parent
  };

  const statsCounters = [
    { value: platformStats?.products ?? 0, suffix: '+', label: t('b_products'), icon: Package },
    { value: platformStats?.sellers ?? 0, suffix: '+', label: t('b_sellersStat'), icon: Award },
    { value: platformStats?.users ?? 0, suffix: '+', label: t('b_users'), icon: Star },
    { value: platformStats?.countries ?? 0, suffix: '+', label: t('b_countries'), icon: BadgeCheck },
  ];

  // Flash sale countdown (ends at midnight)
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0 };
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    const timer = setInterval(() => {
      setPrevTime(timeLeft);
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Stats Counter Row - with animated counting */}
      <section className="container mx-auto px-4 py-2" ref={statsRef}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {statsCounters.map((stat) => (
            <StatsCounterCard
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              icon={stat.icon}
              isInView={statsInView}
            />
          ))}
        </div>
      </section>

      {/* Deal of the Day Spotlight with pulsing glow */}
      <AnimatedSection>
        {saleProducts.length > 0 && (
          <DealOfDaySpotlight products={saleProducts} locale={locale} />
        )}
      </AnimatedSection>

      {/* Flash Sale Countdown - Enhanced with Flip Clock + Progress bars */}
      <AnimatedSection>
        {saleProducts.length > 0 && (
          <section className="container mx-auto px-4 py-2">
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 rounded-2xl md:rounded-3xl p-6 md:p-8 text-white relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 end-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/4 translate-x-1/4" />
              <div className="absolute bottom-0 start-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/4 -translate-x-1/4" />

              <div className="relative">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-white/10">
                      <Flame className="size-7 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{t('todaysDeals')}</h2>
                      <p className="text-white/80 text-sm">Limited time offers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="size-5" />
                    <span className="text-sm font-medium">{t('endsIn')}:</span>
                    <div className="flex gap-2">
                      <FlipDigit value={timeLeft.hours} label="hours" prevValue={prevTime.hours} />
                      <span className="text-white/50 self-center text-lg font-bold">:</span>
                      <FlipDigit value={timeLeft.minutes} label="minutes" prevValue={prevTime.minutes} />
                      <span className="text-white/50 self-center text-lg font-bold">:</span>
                      <FlipDigit value={timeLeft.seconds} label="seconds" prevValue={prevTime.seconds} />
                    </div>
                  </div>
                </div>
                <ScrollableSection>
                  {saleProducts.slice(0, 6).map((product) => {
                    const claimed = Math.min(90, 50 + Math.floor(Math.random() * 40));
                    return (
                      <div key={product.id} className="w-44 md:w-52 flex-shrink-0">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/15 transition-colors">
                          <ProductCard product={product} onQuickView={handleQuickView} />
                          {/* Flash sale progress bar */}
                          <div className="px-3 pb-2">
                            <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-white/70 transition-all duration-1000"
                                style={{ width: `${claimed}%` }}
                              />
                            </div>
                            <p className="text-[9px] text-white/60 mt-0.5">{claimed}% {t('b_claimed')}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </ScrollableSection>
              </div>
            </div>
          </section>
        )}
      </AnimatedSection>
    </>
  );
}
