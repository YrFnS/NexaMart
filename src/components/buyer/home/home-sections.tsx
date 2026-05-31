'use client';

import React from 'react';
import { Star, Award, MapPin, Store, Sparkles, Flame, Package, BadgeCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { ProductCard, type Product } from '@/components/buyer/product-card';
import { AVATAR_GRADIENTS } from '@/lib/theme';
import { AnimatedSection, ScrollableSection, SectionHeader } from './home-hooks';
import { TrendingSearches } from '@/components/buyer/trending-searches';
import { LocationGuide } from '@/components/common/location-guide';

// --- Featured Store Type ---
export interface FeaturedStore {
  id: string;
  name: string;
  nameAr?: string | null;
  logo?: string | null;
  rating: number;
  productCount: number;
  isVerified: boolean;
  description?: string | null;
  descriptionAr?: string | null;
}

// --- Top Brands Section ---
function TopBrandsSection({ stores, locale }: { stores: FeaturedStore[]; locale: string }) {
  const { t } = useI18n();
  const isRTL = locale === 'ar';

  if (stores.length === 0) return null;

  return (
    <section className="container mx-auto px-4">
      <SectionHeader
        title={t('topBrands')}
        icon={Star}
        isRTL={isRTL}
      />
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4">
        {stores.slice(0, 8).map((store, idx) => (
          <Link key={store.id} href={`/store/${store.id}`}>
            <button
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card border border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300 group tilt-card w-full"
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {store.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[10px] md:text-xs font-medium text-center text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                {isRTL && store.nameAr ? store.nameAr : store.name}
              </span>
            </button>
          </Link>
        ))}
      </div>
    </section>
  );
}

// --- Top Rated Section ---
function TopRatedSection({ products, locale }: { products: Product[]; locale: string }) {
  const { t } = useI18n();
  const nav = useAppNavigation();
  const isRTL = locale === 'ar';
  const topRated = [...products].sort((a, b) => b.rating - a.rating).slice(0, 5);

  if (topRated.length === 0) return null;

  return (
    <section className="container mx-auto px-4">
      <SectionHeader
        title={t('b_topRated')}
        icon={Award}
        actionLabel={t('viewAll')}
        onAction={() => nav.setView('shop')}
        isRTL={isRTL}
      />
      <div className="space-y-3">
        {topRated.map((product, idx) => (
          <div
            key={product.id}
            className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer card-hover-lift"
            onClick={() => nav.selectProduct(product.id)}
          >
            <div className="flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white font-bold text-sm shadow">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium line-clamp-1 group-hover:text-emerald-600 transition-colors">
                {locale === 'ar' && product.nameAr ? product.nameAr : product.name}
              </h3>
              <div className="flex items-center gap-1 mt-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`size-3 ${i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`}
                  />
                ))}
                <span className="text-[10px] text-muted-foreground ms-1">{(product.rating ?? 0).toFixed(1)}</span>
              </div>
            </div>
            <div className="text-end">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(product.price)}</span>
              <p className="text-[10px] text-muted-foreground">{product.reviewCount} {t('b_reviewsLower')}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// --- Sellers Near You Section ---
function SellersNearYouSection({ stores, locale }: { stores: FeaturedStore[]; locale: string }) {
  const { t } = useI18n();
  const isRTL = locale === 'ar';

  if (stores.length === 0) return null;

  return (
    <section className="container mx-auto px-4">
      <SectionHeader
        title={t('b_sellersNearYou')}
        icon={MapPin}
        isRTL={isRTL}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {stores.slice(0, 4).map((store, idx) => (
          <Link key={store.id} href={`/store/${store.id}`} className="block">
            <div className="p-4 rounded-xl bg-card border border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer group card-hover-lift h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform shrink-0`}>
                  {store.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium truncate">{isRTL && store.nameAr ? store.nameAr : store.name}</span>
                    {store.isVerified && <BadgeCheck className="size-3.5 text-emerald-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Package className="size-2.5" />
                    <span className="text-emerald-600 dark:text-emerald-400">{store.productCount} {t('products')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={`size-3 ${i < Math.floor(store.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
                ))}
                <span className="text-[10px] font-medium ms-1">{(store.rating ?? 0).toFixed(1)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// --- Featured Stores Section ---
function FeaturedStoresSection({ stores, locale }: { stores: FeaturedStore[]; locale: string }) {
  const { t } = useI18n();
  const nav = useAppNavigation();
  const isRTL = locale === 'ar';

  if (stores.length === 0) return null;

  return (
    <section className="container mx-auto px-4">
      <SectionHeader
        title={t('featuredStores')}
        icon={Store}
        actionLabel={t('viewAll')}
        onAction={() => nav.setView('stores')}
        isRTL={isRTL}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {stores.map((store, idx) => (
          <Card key={store.id} className="border border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 group overflow-hidden">
            <CardContent className="p-5">
              {/* Store logo/initial */}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white font-bold text-lg shadow-md group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                  {store.logo ? (
                    <img
                      src={store.logo}
                      alt={store.name}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.dataset.retried) {
                          img.dataset.retried = 'true';
                          img.style.display = 'none';
                          const parent = img.parentElement;
                          if (parent) {
                            parent.textContent = store.name.charAt(0).toUpperCase();
                          }
                        }
                      }}
                    />
                  ) : (
                    store.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold truncate">{isRTL && store.nameAr ? store.nameAr : store.name}</span>
                    {store.isVerified && <BadgeCheck className="size-4 text-emerald-500 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`size-3 ${i < Math.floor(store.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
                    ))}
                    <span className="text-[10px] font-medium ms-0.5">{(store.rating ?? 0).toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Product count */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                <Package className="size-3.5" />
                <span>{store.productCount} {t('products')}</span>
              </div>

              {/* Visit Store button */}
              <Link href={`/store/${store.id}`}>
                <Button variant="outline" size="sm" className="w-full text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs">
                  {t('visitStore')}
                  {isRTL ? <ArrowLeft className="size-3 ms-1" /> : <ArrowRight className="size-3 ms-1" />}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

// --- Section Wrappers ---

export function TopBrandsSectionWrapper({ allStores }: { allStores: FeaturedStore[] }) {
  const { locale } = useI18n();
  return (
    <AnimatedSection>
      <section className="bg-muted/30 dark:bg-muted/10 py-8 md:py-12">
        <TopBrandsSection stores={allStores} locale={locale} />
      </section>
    </AnimatedSection>
  );
}

export function FeaturedStoresSectionWrapper({ stores }: { stores: FeaturedStore[] }) {
  const { locale } = useI18n();
  return (
    <AnimatedSection>
      {stores.length > 0 && (
        <FeaturedStoresSection stores={stores} locale={locale} />
      )}
    </AnimatedSection>
  );
}

export function TopRatedSectionWrapper({ products }: { products: Product[] }) {
  const { locale } = useI18n();
  return (
    <AnimatedSection>
      {products.length > 0 && (
        <TopRatedSection products={products} locale={locale} />
      )}
    </AnimatedSection>
  );
}

export function SellersNearYouSectionWrapper({ stores }: { stores: FeaturedStore[] }) {
  const { locale } = useI18n();
  return (
    <AnimatedSection>
      <section className="bg-muted/20 dark:bg-muted/5 py-8 md:py-12">
        <SellersNearYouSection stores={stores} locale={locale} />
      </section>
    </AnimatedSection>
  );
}

export function AIRecommendationsSection({ aiProducts, onQuickView }: { aiProducts: Product[]; onQuickView: (product: Product) => void }) {
  const { t, locale } = useI18n();
  const { setView } = useAppNavigation();
  const isRTL = locale === 'ar';

  return (
    <AnimatedSection>
      {aiProducts.length > 0 && (
        <section className="container mx-auto px-4 py-2">
          <div className="relative rounded-2xl md:rounded-3xl p-[2px] overflow-hidden">
            {/* Animated gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-400 via-cyan-500 to-emerald-500 animate-[spin_4s_linear_infinite] opacity-60" style={{ filter: 'blur(1px)' }} />
            <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/50 dark:via-teal-950/50 dark:to-cyan-950/50 rounded-2xl p-6 md:p-8 border border-emerald-200 dark:border-emerald-800">
              {/* AI Badge */}
              <div className="absolute -top-3 start-6">
                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1 text-sm font-semibold shadow-md">
                  <Sparkles className="size-3.5 me-1" />
                  AI
                </Badge>
              </div>

              <SectionHeader
                title={t('aiRecommendations')}
                icon={Sparkles}
                actionLabel={t('viewAll')}
                onAction={() => setView('shop')}
                isRTL={isRTL}
              />

              <p className="text-sm text-muted-foreground mb-4 -mt-2">
                {t('aiPoweredShopping')} — {t('recommended').toLowerCase()} just for you
              </p>

              <ScrollableSection>
                {aiProducts.map((product) => (
                  <div key={product.id} className="w-48 md:w-56 flex-shrink-0">
                    <ProductCard product={product} onQuickView={onQuickView} />
                  </div>
                ))}
              </ScrollableSection>
            </div>
          </div>
        </section>
      )}
    </AnimatedSection>
  );
}

export function DealsSection({ saleProducts, onQuickView }: { saleProducts: Product[]; onQuickView: (product: Product) => void }) {
  const { t, locale } = useI18n();
  const { setView } = useAppNavigation();
  const isRTL = locale === 'ar';

  return (
    <AnimatedSection>
      {saleProducts.length > 0 && (
        <section className="bg-rose-50/40 dark:bg-rose-950/10 py-8 md:py-12">
          <div className="container mx-auto px-4">
            <SectionHeader
              title={t('todaysDeals')}
              icon={Flame}
              actionLabel={t('viewAll')}
              onAction={() => setView('deals')}
              isRTL={isRTL}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {saleProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} onQuickView={onQuickView} />
              ))}
            </div>
          </div>
        </section>
      )}
    </AnimatedSection>
  );
}

export function NewsletterSection() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  return (
    <AnimatedSection>
      <section className="container mx-auto px-4">
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden">
          {/* Gradient background */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-8 md:p-12 text-white relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 end-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
            <div className="absolute bottom-0 start-0 w-48 h-48 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/4" />
            <div className="absolute top-1/2 end-1/4 w-32 h-32 rounded-full bg-white/5" />

            <div className="relative flex flex-col md:flex-row items-center gap-6 md:gap-10">
              <div className="flex-1 text-center md:text-start">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-full text-sm mb-3">
                  <Sparkles className="size-4" />
                  {isRTL ? 'اشترك الآن' : 'Subscribe Now'}
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  {t('newsletterTitle') !== 'newsletterTitle' ? t('newsletterTitle') : (isRTL ? 'ابق على اطلاع بأحدث العروض' : 'Stay Updated with Latest Deals')}
                </h2>
                <p className="text-white/80 text-sm md:text-base max-w-md">
                  {t('newsletterDesc') !== 'newsletterDesc' ? t('newsletterDesc') : (isRTL ? 'اشترك في النشرة الإخبارية واحصل على عروض حصرية مباشرة في بريدك الإلكتروني' : 'Subscribe to our newsletter and get exclusive deals delivered straight to your inbox.')}
                </p>
              </div>
              <div className="w-full md:w-auto md:min-w-[320px] max-w-full">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={isRTL ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                    className="bg-white/15 border-white/25 text-white placeholder:text-white/50 backdrop-blur-sm focus:bg-white/20 focus:border-white/40 transition-all duration-200"
                  />
                  <Button
                    className="bg-white text-emerald-700 hover:bg-white/90 font-semibold shadow-lg shrink-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  >
                    {isRTL ? 'اشترك' : 'Subscribe'}
                    {isRTL ? <ArrowLeft className="size-4 ms-1" /> : <ArrowRight className="size-4 ms-1" />}
                  </Button>
                </div>
                <p className="text-white/50 text-[11px] mt-2 text-center md:text-start">
                  {isRTL ? 'لا إزعاج. إلغاء الاشتراك في أي وقت.' : 'No spam. Unsubscribe at any time.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </AnimatedSection>
  );
}

export function TrendingSearchesSection() {
  return (
    <section className="container mx-auto px-4 py-2">
      <TrendingSearches />
    </section>
  );
}

export function LocationGuideSection() {
  return (
    <AnimatedSection>
      <section className="container mx-auto px-4 py-2">
        <LocationGuide />
      </section>
    </AnimatedSection>
  );
}


