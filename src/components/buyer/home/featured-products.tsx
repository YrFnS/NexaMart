'use client';

import React from 'react';
import { Star, Shield, TrendingUp, Sparkles, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { useAppNavigation, getViewUrl } from '@/lib/use-app-navigation';
import { ProductCard, type Product } from '@/components/buyer/product-card';
import { SectionHeader, AnimatedSection, ScrollableSection } from './home-hooks';

interface FeaturedProductsProps {
  featuredProducts: Product[];
  newProducts: Product[];
  mostPopularProducts: Product[];
  onQuickView: (product: Product) => void;
}

export function FeaturedProductsSection({ featuredProducts, newProducts, mostPopularProducts, onQuickView }: FeaturedProductsProps) {
  const { t, locale } = useI18n();
  const { setView } = useAppNavigation();
  const isRTL = locale === 'ar';

  return (
    <>
      {/* Featured Products */}
      <AnimatedSection>
        {featuredProducts.length > 0 && (
          <section className="container mx-auto px-4 py-2">
            <SectionHeader
              title={t('featuredProducts')}
              icon={Star}
              actionLabel={t('viewAll')}
              onAction={() => setView('shop')}
              isRTL={isRTL}
            />
            <ScrollableSection>
              {featuredProducts.map((product) => (
                <div key={product.id} className="w-48 md:w-56 flex-shrink-0 relative">
                  {product.store?.isVerified && (
                    <div className="absolute top-2 end-2 z-30 flex items-center gap-0.5 bg-emerald-500/90 backdrop-blur-sm text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full shadow-md">
                      <Shield className="size-2.5" />
                      {isRTL ? 'بائع موثق' : 'Verified'}
                    </div>
                  )}
                  <ProductCard product={product} onQuickView={onQuickView} />
                </div>
              ))}
            </ScrollableSection>
          </section>
        )}
      </AnimatedSection>

      {/* New Arrivals - Horizontal Scrollable Carousel */}
      <AnimatedSection>
        {newProducts.length > 0 && (
          <section className="container mx-auto px-4">
            <SectionHeader
              title={t('newArrivals')}
              icon={Sparkles}
              actionLabel={t('viewAllNewArrivals')}
              onAction={() => setView('shop')}
              isRTL={isRTL}
            />
            <ScrollableSection>
              {newProducts.map((product) => (
                <div key={product.id} className="w-48 md:w-56 flex-shrink-0 relative">
                  {/* NEW badge overlay */}
                  <div className="absolute top-2 start-2 z-20">
                    <Badge className="bg-emerald-500 text-white border-0 text-[10px] font-bold px-2 py-0.5 shadow-md animate-pulse-subtle">
                      {t('new').toUpperCase()}
                    </Badge>
                  </div>
                  <ProductCard product={product} onQuickView={onQuickView} />
                </div>
              ))}
            </ScrollableSection>
            {/* View All link */}
            <div className="mt-4 text-center">
              <Link href={getViewUrl('shop')} className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors group/link">
                {t('viewAllNewArrivals')}
                {isRTL ? (
                  <ArrowLeft className="size-4 transition-transform group-hover/link:-translate-x-0.5" />
                ) : (
                  <ArrowRight className="size-4 transition-transform group-hover/link:translate-x-0.5" />
                )}
              </Link>
            </div>
          </section>
        )}
      </AnimatedSection>

      {/* Most Popular Products */}
      <AnimatedSection>
        {mostPopularProducts.length > 0 && (
          <section className="bg-muted/20 dark:bg-muted/5 py-8 md:py-12">
            <div className="container mx-auto px-4">
              <SectionHeader
                title={t('mostPopular')}
                icon={TrendingUp}
                actionLabel={t('viewAll')}
                onAction={() => setView('shop')}
                isRTL={isRTL}
              />
              <ScrollableSection>
                {mostPopularProducts.map((product) => (
                  <div key={product.id} className="w-48 md:w-56 flex-shrink-0">
                    <ProductCard product={product} onQuickView={onQuickView} />
                  </div>
                ))}
              </ScrollableSection>
            </div>
          </section>
        )}
      </AnimatedSection>

      {/* Recently Added Section with "New" tags */}
      <AnimatedSection>
        {newProducts.length > 0 && (
          <section className="container mx-auto px-4 py-2">
            <SectionHeader
              title={t('b_recentlyAdded')}
              icon={Clock}
              actionLabel={t('viewAll')}
              onAction={() => setView('shop')}
              isRTL={isRTL}
            />
            <ScrollableSection>
              {newProducts.map((product) => (
                <div key={product.id} className="w-48 md:w-56 flex-shrink-0 relative">
                  <div className="absolute top-2 end-2 z-30">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] px-1.5 py-0 border-0 shadow-sm">
                      {t('new')}
                    </Badge>
                  </div>
                  <ProductCard product={product} onQuickView={onQuickView} />
                </div>
              ))}
            </ScrollableSection>
          </section>
        )}
      </AnimatedSection>
    </>
  );
}
