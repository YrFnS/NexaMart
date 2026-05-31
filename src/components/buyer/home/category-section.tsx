'use client';

import React from 'react';
import { ShoppingBag } from 'lucide-react';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { type Category } from '@/components/buyer/category-grid';
import { SectionHeader, AnimatedSection } from './home-hooks';

interface CategorySectionProps {
  categories: Category[];
}

const categoryImageMap: Record<string, string> = {
  electronics: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&q=80',
  fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&q=80',
  'home-garden': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
  beauty: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80',
  sports: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80',
  food: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80',
};

const defaultImage = 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=80';

function getCategoryImage(category: Category): string {
  if (category.image) return category.image;
  const slug = category.slug.toLowerCase();
  if (categoryImageMap[slug]) return categoryImageMap[slug];
  const icon = (category.icon || '').toLowerCase();
  if (categoryImageMap[icon]) return categoryImageMap[icon];
  for (const key of Object.keys(categoryImageMap)) {
    if (slug.includes(key) || key.includes(slug)) return categoryImageMap[key];
  }
  return defaultImage;
}

export function CategorySection({ categories }: CategorySectionProps) {
  const { t, locale } = useI18n();
  const { setView } = useAppNavigation();
  const isRTL = locale === 'ar';

  if (categories.length === 0) return null;

  const displayCategories = categories.slice(0, 10);

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" dir={isRTL ? 'rtl' : 'ltr'}>
          {displayCategories.map((category, index) => {
            const displayName = isRTL && category.nameAr ? category.nameAr : category.name;
            const imageUrl = getCategoryImage(category);

            // First card: large (2 cols x 2 rows)
            if (index === 0) {
              return (
                <div
                  key={category.id}
                  className="col-span-2 row-span-2 group relative rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-[oklch(0.75_0.12_85)] transition-all duration-300"
                  onClick={() => setView('shop')}
                >
                  <div className="relative w-full h-full min-h-[280px] md:min-h-[420px]">
                    <Image
                      src={imageUrl}
                      alt={displayName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 start-0 p-4 md:p-6">
                      <h3
                        className="text-white text-lg md:text-2xl font-bold"
                        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
                      >
                        {displayName}
                      </h3>
                      <span className="text-white/70 text-xs md:text-sm mt-1 block">
                        {category.productCount} {t('items')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            // Cards 2-3: medium (1 col x 2 rows)
            if (index === 1 || index === 2) {
              return (
                <div
                  key={category.id}
                  className="col-span-1 row-span-2 group relative rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-[oklch(0.75_0.12_85)] transition-all duration-300"
                  onClick={() => setView('shop')}
                >
                  <div className="relative w-full h-full min-h-[280px] md:min-h-[200px]">
                    <Image
                      src={imageUrl}
                      alt={displayName}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 start-0 p-3 md:p-4">
                      <h3
                        className="text-white text-sm md:text-base font-semibold"
                        style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
                      >
                        {displayName}
                      </h3>
                      <span className="text-white/70 text-[10px] md:text-xs mt-0.5 block">
                        {category.productCount} {t('items')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }

            // Remaining cards: standard square
            return (
              <div
                key={category.id}
                className="col-span-1 row-span-1 group relative rounded-2xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-[oklch(0.75_0.12_85)] transition-all duration-300"
                onClick={() => setView('shop')}
              >
                <div className="relative w-full aspect-square">
                  <Image
                    src={imageUrl}
                    alt={displayName}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 start-0 p-3">
                    <h3
                      className="text-white text-xs md:text-sm font-semibold"
                      style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
                    >
                      {displayName}
                    </h3>
                    <span className="text-white/70 text-[10px] mt-0.5 block">
                      {category.productCount} {t('items')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AnimatedSection>
  );
}
