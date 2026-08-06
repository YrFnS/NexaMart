'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  CategorySection,
  DealsSection,
  FeaturedProductsSection,
  FeaturedStoresSectionWrapper,
  HeroSection,
  RecentlyViewed,
  TrustStrip,
} from '@/components/buyer/home';
import { type Product } from '@/components/buyer/product-card';
import { ProductQuickView } from '@/components/buyer/product-quick-view';
import { useI18n } from '@/lib/i18n';
import type { HomePageData } from '@/lib/storefront-types';

export function HomePage({ initialData }: { initialData: HomePageData }) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const { categories, products, stores, heroBanners } = initialData;
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(
    null,
  );
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const featuredProducts = useMemo(
    () => products.filter((product) => product.isFeatured).slice(0, 10),
    [products],
  );
  const newProducts = useMemo(
    () => products.filter((product) => product.isNew).slice(0, 10),
    [products],
  );
  const saleProducts = useMemo(
    () => products.filter((product) => product.isSale).slice(0, 10),
    [products],
  );
  const popularProducts = useMemo(
    () =>
      [...products]
        .sort((left, right) => right.soldCount - left.soldCount)
        .slice(0, 8),
    [products],
  );
  const featuredStores = useMemo(
    () =>
      stores
        .filter((store) => store.isVerified)
        .sort((left, right) => right.rating - left.rating)
        .slice(0, 4),
    [stores],
  );

  const defaultSlides = [
    {
      title: t('heroTitle'),
      description: t('heroDesc'),
      gradient: 'from-amber-700 via-amber-600 to-orange-600',
      cta: t('shopNow'),
      ctaLink: '/shop',
      icon: 'Sparkles',
    },
    {
      title: isRTL
        ? 'منتجات من متاجر متعددة'
        : 'Products from multiple stores',
      description: isRTL
        ? 'قارن الخيارات والأسعار ثم تابع تنفيذ طلبك من كل بائع.'
        : 'Compare options and prices, then follow fulfilment from every seller.',
      gradient: 'from-orange-700 via-amber-600 to-yellow-600',
      cta: isRTL ? 'استكشف المتاجر' : 'Explore stores',
      ctaLink: '/stores',
      icon: 'Store',
    },
  ];

  const heroSlides =
    heroBanners.length > 0
      ? heroBanners.map((banner) => ({
          title: isRTL && banner.titleAr ? banner.titleAr : banner.title,
          description:
            isRTL && banner.descriptionAr
              ? banner.descriptionAr
              : banner.description || '',
          gradient:
            banner.gradient ||
            'from-amber-700 via-amber-600 to-orange-600',
          cta:
            isRTL && banner.ctaTextAr
              ? banner.ctaTextAr
              : banner.ctaText || t('shopNow'),
          ctaLink: banner.ctaLink || '/shop',
          icon: banner.icon || 'Sparkles',
        }))
      : defaultSlides;

  const bestDiscount = saleProducts.reduce((best, product) => {
    if (!product.originalPrice || product.originalPrice <= product.price) {
      return best;
    }
    return Math.max(
      best,
      Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      ),
    );
  }, 0);

  const handleQuickView = useCallback((product: Product) => {
    setQuickViewProduct(product);
    setQuickViewOpen(true);
  }, []);

  return (
    <div className="space-y-12 overflow-x-hidden md:space-y-16">
      <HeroSection heroSlides={heroSlides} bestDiscount={bestDiscount} />
      <TrustStrip />
      <CategorySection categories={categories} />
      <FeaturedProductsSection
        featuredProducts={featuredProducts}
        newProducts={newProducts}
        mostPopularProducts={popularProducts}
        onQuickView={handleQuickView}
      />
      {featuredStores.length > 0 && (
        <FeaturedStoresSectionWrapper stores={featuredStores} />
      )}
      {saleProducts.length > 0 && (
        <DealsSection
          saleProducts={saleProducts}
          onQuickView={handleQuickView}
        />
      )}
      <RecentlyViewed />
      <ProductQuickView
        product={quickViewProduct}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </div>
  );
}
