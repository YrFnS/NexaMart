'use client';

import React from 'react';
import { TrendingUp, Search, Flame, Zap, Star, Sparkles } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';

interface TrendingSearchItem {
  query: string;
  queryAr: string;
  gradient: string;
  icon: React.ElementType;
}

const trendingItems: TrendingSearchItem[] = [
  { query: 'Wireless Headphones', queryAr: 'سماعات لاسلكية', gradient: 'from-blue-500 to-cyan-500', icon: Zap },
  { query: 'Smart Watch', queryAr: 'ساعة ذكية', gradient: 'from-emerald-500 to-teal-500', icon: Sparkles },
  { query: 'Organic Skincare', queryAr: 'العناية بالبشرة العضوية', gradient: 'from-pink-500 to-rose-500', icon: Star },
  { query: 'Running Shoes', queryAr: 'أحذية جري', gradient: 'from-amber-500 to-orange-500', icon: Flame },
  { query: 'Gaming Keyboard', queryAr: 'لوحة مفاتيح ألعاب', gradient: 'from-violet-500 to-purple-500', icon: Zap },
  { query: '4K Webcam', queryAr: 'كاميرا ويب 4K', gradient: 'from-teal-500 to-cyan-500', icon: Sparkles },
  { query: 'Leather Bags', queryAr: 'حقائب جلدية', gradient: 'from-rose-500 to-pink-500', icon: Star },
  { query: 'Home Decor', queryAr: 'ديكور منزلي', gradient: 'from-orange-500 to-amber-500', icon: Flame },
];

export function TrendingSearches() {
  const { t, locale } = useI18n();
  const { setSearchQuery } = useAppStore();
  const nav = useAppNavigation();
  const isRTL = locale === 'ar';

  const handleSearchClick = (query: string) => {
    setSearchQuery(query);
    nav.setView('search');
  };

  return (
    <div className="space-y-3 trending-section-bg rounded-xl p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-900">
          <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-sm font-semibold section-line">{t('trendingSearches')}</h3>
        <Flame className="size-4 text-orange-500 animate-flame-wiggle ms-1" />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {trendingItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <button
              key={i}
              onClick={() => handleSearchClick(isRTL ? item.queryAr : item.query)}
              className={`group relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium text-white whitespace-nowrap shrink-0 transition-all duration-300 active:scale-95 trending-tag-tilt bg-gradient-to-r ${item.gradient} hover:brightness-110`}
            >
              {/* Shimmer overlay on hover */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer transition-opacity" />
              {/* Glassmorphism overlay */}
              <span className="absolute inset-0 rounded-full trending-tag-glass opacity-0 group-hover:opacity-100 transition-opacity" />
              <Icon className="size-3 relative z-10" />
              <span className="relative z-10">{isRTL ? item.queryAr : item.query}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
