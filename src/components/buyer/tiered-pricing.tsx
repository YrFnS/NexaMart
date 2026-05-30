'use client';

import React from 'react';
import { Package, TrendingDown, ArrowRight, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';

interface PricingTier {
  minQty: number;
  maxQty?: number;
  price: number;
  discount?: number;
}

interface TieredPricingProps {
  tiers: PricingTier[];
  currentQty?: number;
  unit?: string;
  basePrice?: number;
}

export function TieredPricing({
  tiers,
  currentQty = 1,
  unit = 'units',
  basePrice,
}: TieredPricingProps) {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';

  const sortedTiers = [...tiers].sort((a, b) => a.minQty - b.minQty);
  const effectiveBasePrice = basePrice || (sortedTiers.length > 0 ? sortedTiers[0].price : 0);

  // Find the active tier
  const activeTierIndex = sortedTiers.findIndex((tier) => {
    const nextTier = sortedTiers[tier.minQty > sortedTiers[0]?.minQty ? sortedTiers.indexOf(tier) + 1 : 1];
    if (currentQty >= tier.minQty) {
      if (!tier.maxQty && !nextTier) return true;
      if (tier.maxQty && currentQty <= tier.maxQty) return true;
      if (!tier.maxQty && nextTier && currentQty < nextTier.minQty) return true;
    }
    return false;
  });

  const maxDiscount = Math.max(...sortedTiers.map((t) => t.discount || 0));

  // Calculate progress to next tier
  const progressPercent = (() => {
    if (sortedTiers.length === 0) return 0;
    const lastTier = sortedTiers[sortedTiers.length - 1];
    if (currentQty >= lastTier.minQty) return 100;
    const nextTier = sortedTiers.find((t) => t.minQty > currentQty);
    if (!nextTier) return 100;
    const prevTier = sortedTiers.filter((t) => t.minQty <= currentQty).pop();
    const prevMin = prevTier ? prevTier.minQty : 0;
    return Math.min(100, Math.round(((currentQty - prevMin) / (nextTier.minQty - prevMin)) * 100));
  })();

  return (
    <div
      className="bg-emerald-50 dark:bg-emerald-950/50 rounded-xl p-5 border border-emerald-200 dark:border-emerald-800"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">
          <Package className="size-4 text-emerald-600 dark:text-emerald-400" />
          {isRTL ? 'اشتر أكثر، وفّر أكثر' : 'Buy more, save more'}
        </h4>
        {maxDiscount > 0 && (
          <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 text-xs">
            <TrendingDown className="size-3 me-1" />
            {isRTL ? `وفّر حتى ${maxDiscount}%` : `Save up to ${maxDiscount}%`}
          </Badge>
        )}
      </div>

      {/* Progress indicator */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>
            {isRTL ? `${currentQty} ${unit}` : `${currentQty} ${unit}`}
          </span>
          <span>
            {activeTierIndex >= 0
              ? (isRTL ? 'السعر الحالي' : 'Current tier')
              : (isRTL ? 'أضف أكثر للتوفير' : 'Add more to save')}
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Tier Table */}
      <div className="space-y-2">
        {sortedTiers.map((tier, i) => {
          const isActive = i === activeTierIndex;
          const isPast = currentQty >= tier.minQty && i < activeTierIndex;
          const qtyLabel = tier.maxQty
            ? `${tier.minQty}-${tier.maxQty}`
            : `${tier.minQty}+`;

          return (
            <div
              key={i}
              className={`
                flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all
                ${isActive
                  ? 'bg-emerald-200 dark:bg-emerald-800 border border-emerald-400 dark:border-emerald-600 shadow-sm'
                  : isPast
                  ? 'bg-emerald-100/50 dark:bg-emerald-900/30 border border-transparent'
                  : 'bg-white/50 dark:bg-white/5 border border-transparent hover:bg-white/80 dark:hover:bg-white/10'
                }
              `}
            >
              <div className="flex items-center gap-2">
                {isActive && (
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <span className={isActive ? 'font-semibold text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}>
                  {qtyLabel} {isRTL ? 'وحدة' : unit}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={isActive ? 'font-bold text-emerald-700 dark:text-emerald-300' : 'font-medium'}>
                  {formatPrice(tier.price)}
                </span>
                {tier.discount && tier.discount > 0 && (
                  <Badge className="bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 text-[10px] px-1.5 py-0 border-0">
                    -{tier.discount}%
                  </Badge>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Savings callout */}
      {activeTierIndex >= 0 && sortedTiers[activeTierIndex]?.discount && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          {isRTL ? <ArrowLeft className="size-3.5" /> : <ArrowRight className="size-3.5" />}
          {isRTL
            ? `أنت توفر ${sortedTiers[activeTierIndex].discount}% على هذا المستوى!`
            : `You're saving ${sortedTiers[activeTierIndex].discount}% at this tier!`}
        </div>
      )}

      {/* Next tier hint */}
      {activeTierIndex < sortedTiers.length - 1 && activeTierIndex >= 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          {isRTL
            ? `أضف ${sortedTiers[activeTierIndex + 1].minQty - currentQty} وحدة إضافية للوصول للمستوى التالي`
            : `Add ${sortedTiers[activeTierIndex + 1].minQty - currentQty} more ${unit} to reach the next tier`}
        </div>
      )}
    </div>
  );
}
