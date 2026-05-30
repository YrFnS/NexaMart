'use client';

import React, { useState, useCallback } from 'react';
import {
  Smartphone,
  Shirt,
  Home,
  Sparkles,
  Dumbbell,
  Gamepad2,
  Car,
  BookOpen,
  ShoppingBasket,
  Watch,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { CATEGORY_GRADIENTS, CATEGORY_ICONS } from '@/lib/reference-data';

export interface Category {
  id: string;
  name: string;
  nameAr?: string;
  slug: string;
  icon?: string;
  image?: string;
  productCount: number;
}

interface CategoryGridProps {
  categories: Category[];
  columns?: number;
}

// Map icon name strings from CATEGORY_ICONS to actual Lucide components
const iconMap: Record<string, LucideIcon> = {
  Smartphone,
  Shirt,
  Home,
  Sparkles,
  Dumbbell,
  Gamepad2,
  Car,
  BookOpen,
  ShoppingBasket,
  Watch,
};

// Local gradient detail map (lightBg variants) — bg gradients come from CATEGORY_GRADIENTS
const gradientDetailMap: Record<string, { bg: string; lightBg: string }> = {
  electronics: { bg: CATEGORY_GRADIENTS.electronics, lightBg: 'bg-blue-50 dark:bg-blue-950/40' },
  fashion: { bg: CATEGORY_GRADIENTS.fashion, lightBg: 'bg-pink-50 dark:bg-pink-950/40' },
  'home-garden': { bg: CATEGORY_GRADIENTS['home-garden'], lightBg: 'bg-amber-50 dark:bg-amber-950/40' },
  beauty: { bg: CATEGORY_GRADIENTS.beauty, lightBg: 'bg-purple-50 dark:bg-purple-950/40' },
  sports: { bg: CATEGORY_GRADIENTS.sports, lightBg: 'bg-green-50 dark:bg-green-950/40' },
  toys: { bg: CATEGORY_GRADIENTS.toys, lightBg: 'bg-yellow-50 dark:bg-yellow-950/40' },
  automotive: { bg: CATEGORY_GRADIENTS.automotive, lightBg: 'bg-red-50 dark:bg-red-950/40' },
  books: { bg: CATEGORY_GRADIENTS.books, lightBg: 'bg-teal-50 dark:bg-teal-950/40' },
  food: { bg: CATEGORY_GRADIENTS.food, lightBg: 'bg-lime-50 dark:bg-lime-950/40' },
  jewelry: { bg: CATEGORY_GRADIENTS.jewelry, lightBg: 'bg-rose-50 dark:bg-rose-950/40' },
  smartphone: { bg: 'from-blue-500 to-cyan-500', lightBg: 'bg-blue-50 dark:bg-blue-950/40' },
  shirt: { bg: 'from-pink-500 to-rose-500', lightBg: 'bg-pink-50 dark:bg-pink-950/40' },
  home: { bg: 'from-amber-500 to-orange-500', lightBg: 'bg-amber-50 dark:bg-amber-950/40' },
  sparkles: { bg: 'from-purple-500 to-fuchsia-500', lightBg: 'bg-purple-50 dark:bg-purple-950/40' },
  dumbbell: { bg: 'from-green-500 to-emerald-500', lightBg: 'bg-green-50 dark:bg-green-950/40' },
  'gamepad-2': { bg: 'from-violet-500 to-purple-500', lightBg: 'bg-violet-50 dark:bg-violet-950/40' },
  car: { bg: 'from-red-500 to-orange-500', lightBg: 'bg-red-50 dark:bg-red-950/40' },
  'book-open': { bg: 'from-teal-500 to-cyan-500', lightBg: 'bg-teal-50 dark:bg-teal-950/40' },
  'shopping-basket': { bg: 'from-lime-500 to-green-500', lightBg: 'bg-lime-50 dark:bg-lime-950/40' },
  watch: { bg: 'from-yellow-500 to-amber-500', lightBg: 'bg-yellow-50 dark:bg-yellow-950/40' },
};

const defaultGradients = [
  { bg: 'from-emerald-500 to-teal-500', lightBg: 'bg-emerald-50 dark:bg-emerald-950/40' },
  { bg: 'from-teal-500 to-cyan-500', lightBg: 'bg-teal-50 dark:bg-teal-950/40' },
  { bg: 'from-cyan-500 to-sky-500', lightBg: 'bg-cyan-50 dark:bg-cyan-950/40' },
  { bg: 'from-green-500 to-emerald-500', lightBg: 'bg-green-50 dark:bg-green-950/40' },
];

export function CategoryGrid({ categories, columns = 5 }: CategoryGridProps) {
  const { t, locale } = useI18n();
  const { selectCategory } = useAppStore();
  const nav = useAppNavigation();
  const isRTL = locale === 'ar';

  // Ripple state
  const [rippleId, setRippleId] = useState<string | null>(null);

  const handleCategoryClick = useCallback((categoryId: string) => {
    setRippleId(categoryId);
    setTimeout(() => setRippleId(null), 600);
    selectCategory(categoryId);
    nav.setView('shop');
  }, [selectCategory, nav]);

  const gridCols =
    columns === 5
      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
      : columns === 4
      ? 'grid-cols-2 sm:grid-cols-4'
      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-' + columns;

  return (
    <div className={`grid ${gridCols} gap-3 md:gap-5`}>
      {categories.map((category, index) => {
        const iconName = CATEGORY_ICONS[category.slug] || category.icon || '';
        const Icon = iconMap[iconName] || iconMap[category.slug] || Smartphone;
        const colorSet = gradientDetailMap[category.slug] || gradientDetailMap[category.icon || ''] || defaultGradients[index % defaultGradients.length];
        const displayName = isRTL && category.nameAr ? category.nameAr : category.name;

        return (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            className={`group flex flex-col items-center gap-3 p-4 md:p-5 rounded-xl border border-border ${colorSet.lightBg} category-border-pulse category-tilt relative overflow-hidden ripple`}
          >
            {/* Subtle gradient background overlay on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${colorSet.bg} opacity-0 group-hover:opacity-[0.06] dark:group-hover:opacity-[0.1] transition-opacity duration-300`} />

            {/* Border glow effect on hover */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: 'inset 0 0 0 1px oklch(0.55 0.15 160 / 15%), 0 0 16px oklch(0.55 0.15 160 / 8%)' }} />

            {/* Ripple effect on click */}
            {rippleId === category.id && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="w-20 h-20 rounded-full bg-emerald-400/20 animate-ping" />
              </div>
            )}

            <div
              className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${colorSet.bg} flex items-center justify-center shadow-md group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-emerald-500/20 transition-all duration-300`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Icon className="size-7 text-white" style={{ transform: 'translateZ(8px)' }} />
            </div>
            <h3 className="relative text-xs md:text-sm font-semibold text-center leading-tight line-clamp-1 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-200">
              {displayName}
            </h3>
            <Badge
              variant="secondary"
              className="relative text-[9px] px-2 py-0.5 count-badge-gradient text-white font-medium"
            >
              {category.productCount} {t('items')}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}
