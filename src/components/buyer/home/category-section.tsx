'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { CategoryGrid, type Category } from '@/components/buyer/category-grid';
import { SectionHeader, AnimatedSection } from './home-hooks';

interface CategorySectionProps {
  categories: Category[];
}

export function CategorySection({ categories }: CategorySectionProps) {
  const { t, locale } = useI18n();
  const { setView } = useAppNavigation();
  const isRTL = locale === 'ar';

  if (categories.length === 0) return null;

  return (
    <AnimatedSection>
      <section className="container mx-auto px-4 py-2">
        <SectionHeader
          title={t('shopByCategory')}
          icon={ShoppingBag}
          actionLabel={t('viewAll')}
          onAction={() => setView('shop')}
          isRTL={isRTL}
        />
        <CategoryGrid categories={categories.slice(0, 10)} columns={5} />
      </section>
    </AnimatedSection>
  );
}
