'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Shield,
  Lock,
  RotateCcw,
  Headphones,
  Zap,
  ChevronLeft,
  ChevronRight,
  Timer,
  ShoppingBag,
  TrendingUp,
  Flame,
  Star,
  Heart,
  MapPin,
  BadgeCheck,
  Clock,
  Award,
  Package,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation, getViewUrl } from '@/lib/use-app-navigation';
import { ProductCard, type Product } from '@/components/buyer/product-card';
import { CategoryGrid, type Category } from '@/components/buyer/category-grid';
import { TrendingSearches } from '@/components/buyer/trending-searches';
import { ProductQuickView } from '@/components/buyer/product-quick-view';
import { RecentlyViewedSection } from '@/components/buyer/recently-viewed-section';
import { LocationGuide } from '@/components/common/location-guide';
import { AVATAR_GRADIENTS } from '@/lib/theme';
import { UI_CONFIG } from '@/lib/config';

// --- Intersection Observer Hook for Section Animations ---
function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// --- Section with entrance animation ---
function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, isInView } = useInView(0.05);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
    >
      {children}
    </div>
  );
}

// --- Extracted static components (must be outside render) ---

function ScrollableSection({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.7;
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="relative group/scroll">
      {/* Left scroll indicator */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-white/90 dark:bg-card/90 shadow-lg border border-border flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300 hover:bg-white dark:hover:bg-card hover:shadow-xl"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-4 text-foreground" />
        </button>
      )}

      <div ref={scrollRef} className="overflow-x-auto scrollbar-thin pb-2">
        <div className="flex gap-4">
          {children}
        </div>
      </div>

      {/* Right scroll indicator */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-white/90 dark:bg-card/90 shadow-lg border border-border flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300 hover:bg-white dark:hover:bg-card hover:shadow-xl"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-4 text-foreground" />
        </button>
      )}
    </div>
  );
}

function SectionHeader({
  title,
  icon: Icon,
  actionLabel,
  onAction,
  isRTL,
}: {
  title: string;
  icon: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
  isRTL?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {/* Decorative emerald accent line */}
        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500 shrink-0" />
        <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/70">
          <Icon className="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
        </div>
      </div>
      {actionLabel && onAction && (
        <Button
          variant="ghost"
          size="sm"
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-200 group/viewall"
          onClick={onAction}
        >
          {actionLabel}
          {isRTL ? (
            <ArrowLeft className="size-4 ms-1 transition-transform group-hover/viewall:-translate-x-0.5" />
          ) : (
            <ArrowRight className="size-4 ms-1 transition-transform group-hover/viewall:translate-x-0.5" />
          )}
        </Button>
      )}
    </div>
  );
}

// --- Flip Clock Countdown Digit ---
function FlipDigit({ value, label, prevValue }: { value: number; label: string; prevValue: number }) {
  const changed = prevValue !== value;
  return (
    <div className="relative min-w-[50px]">
      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center overflow-hidden" style={{ perspective: '200px' }}>
        <span className={`text-xl font-bold block leading-none ${changed ? 'animate-flip' : ''}`}>
          {String(value).padStart(2, '0')}
        </span>
        <span className="text-[10px] text-white/70">
          {label === 'hours' ? 'H' : label === 'minutes' ? 'M' : 'S'}
        </span>
      </div>
    </div>
  );
}

// --- Animated Counter Hook ---
function useCounter(target: number, duration: number = 2000, start: boolean = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    let animationFrame: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, start]);
  return count;
}

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
  // Calculate real claimed percentage from soldCount and stock
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

// --- Featured Store Type ---
interface FeaturedStore {
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
                          // Show the initial letter by removing img display
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

// --- Main Component ---

export function HomePage() {
  const { t, locale } = useI18n();
  const { setView, selectProduct } = useAppNavigation();
  const isRTL = locale === 'ar';

  // Quick view state
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [saleProducts, setSaleProducts] = useState<Product[]>([]);
  const [featuredStores, setFeaturedStores] = useState<FeaturedStore[]>([]);
  const [allStores, setAllStores] = useState<FeaturedStore[]>([]);

  // Hero banners from admin
  const [heroBanners, setHeroBanners] = useState<{
    id: string;
    title: string;
    titleAr: string | null;
    description: string | null;
    descriptionAr: string | null;
    ctaText: string | null;
    ctaTextAr: string | null;
    ctaLink: string | null;
    gradient: string | null;
    icon: string | null;
  }[]>([]);

  // Stats state
  const [platformStats, setPlatformStats] = useState<{ products: number; sellers: number; users: number; countries: number } | null>(null);

  // Hero carousel state
  const [currentSlide, setCurrentSlide] = useState(0);

  // Stats in view
  const { ref: statsRef, isInView: statsInView } = useInView(0.2);

  // Flash sale countdown
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [prevTime, setPrevTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // AI recommendations = memoized mix of featured + sale + new
  const aiProducts = useMemo(() => {
    const mixed = [
      ...featuredProducts.slice(0, 3),
      ...saleProducts.slice(0, 3),
      ...newProducts.slice(0, 2),
    ];
    const unique = mixed.filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
    return unique.slice(0, 6);
  }, [featuredProducts, saleProducts, newProducts]);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, featRes, newRes, saleRes, storesRes, statsRes, bannerRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/products?featured=true&limit=10'), // limit should match STORE_LIMITS if applicable
          fetch('/api/products?new=true&limit=12'), // limit should match STORE_LIMITS if applicable
          fetch('/api/products?sale=true&limit=8'), // limit should match STORE_LIMITS if applicable
          fetch('/api/stores'),
          fetch('/api/stats'),
          fetch('/api/banners?position=hero'),
        ]);

        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(Array.isArray(catData) ? catData : []);
        }
        if (featRes.ok) {
          const featData = await featRes.json();
          setFeaturedProducts(featData.products || []);
        }
        if (newRes.ok) {
          const newData = await newRes.json();
          setNewProducts(newData.products || []);
        }
        if (saleRes.ok) {
          const saleData = await saleRes.json();
          setSaleProducts(saleData.products || []);
        }
        if (storesRes.ok) {
          const storesData = await storesRes.json();
          const storesArr = Array.isArray(storesData) ? storesData : [];
          // All stores sorted by rating (for Top Brands)
          setAllStores(
            [...storesArr].sort((a: FeaturedStore, b: FeaturedStore) => b.rating - a.rating)
          );
          // Top 4 verified stores (for Featured Stores & Sellers Near You)
          setFeaturedStores(
            storesArr
              .filter((s: FeaturedStore) => s.isVerified)
              .slice(0, 4)
          );
        }
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          if (statsData.products !== undefined) {
            setPlatformStats(statsData);
          }
        }
        if (bannerRes.ok) {
          const bannerData = await bannerRes.json();
          if (bannerData.banners && bannerData.banners.length > 0) {
            setHeroBanners(bannerData.banners);
          }
        }
      } catch {
        // silently fail
      }
    };
    fetchData();
  }, []);

  // Icon name to component mapping
  const iconMap: Record<string, React.ElementType> = {
    Sparkles, Zap, TrendingUp, Flame, ShoppingBag, Star,
    Gift: ShoppingBag, Globe: TrendingUp,
  };

  // Default fallback slides (used when no banners from admin)
  // Gradient strings and ctaLink paths are acceptable as hardcoded fallbacks
  const defaultSlides = [
    {
      title: t('heroTitle'),
      description: t('heroDesc'),
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600', // fallback gradient
      cta: t('shopNow'),
      ctaLink: '/shop', // fallback path
      icon: 'Sparkles' as string,
    },
    {
      title: t('heroSlide2Title'),
      description: t('heroSlide2Desc'),
      gradient: 'from-teal-600 via-emerald-600 to-green-600', // fallback gradient
      cta: t('shopNow'),
      ctaLink: '/deals', // fallback path
      icon: 'Zap' as string,
    },
    {
      title: t('heroSlide3Title'),
      description: t('heroSlide3Desc'),
      gradient: 'from-cyan-600 via-teal-600 to-emerald-600', // fallback gradient
      cta: t('shopNow'),
      ctaLink: '/shop', // fallback path
      icon: 'TrendingUp' as string,
    },
  ];

  // Build hero slides from admin banners (priority) or fallback to defaults
  const heroSlides = heroBanners.length > 0
    ? heroBanners.map(b => ({
        title: (isRTL && b.titleAr) ? b.titleAr : b.title,
        description: (isRTL && b.descriptionAr) ? b.descriptionAr : (b.description || ''),
        gradient: b.gradient || 'from-emerald-600 via-teal-600 to-cyan-600',
        cta: (isRTL && b.ctaTextAr) ? b.ctaTextAr : (b.ctaText || t('shopNow')),
        ctaLink: b.ctaLink || '/shop',
        icon: b.icon || 'Sparkles',
      }))
    : defaultSlides;

  // Auto-advance hero
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, UI_CONFIG.carouselAutoAdvanceMs);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  // Best discount from sale products (used in hero floating badge)
  const bestDiscount = saleProducts.length > 0
    ? Math.max(...saleProducts.filter(p => p.originalPrice).map(p => Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100)))
    : 0;

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

  const goToSlide = (index: number) => setCurrentSlide(index);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  const handleQuickView = useCallback((product: Product) => {
    setQuickViewProduct(product);
    setQuickViewOpen(true);
  }, []);

  const trustBadges = [
    { icon: Shield, title: t('verifiedSellers'), desc: t('verifiedSellersDesc') },
    { icon: Lock, title: t('securePayments'), desc: t('securePaymentsDesc') },
    { icon: RotateCcw, title: t('moneyBackGuarantee'), desc: t('moneyBackGuaranteeDesc') },
    { icon: Headphones, title: t('alwaysSupport'), desc: t('alwaysSupportDesc') },
  ];

  // Most Popular products = all products sorted by soldCount
  const mostPopularProducts = useMemo(() => {
    const allProducts = [...featuredProducts, ...saleProducts, ...newProducts];
    const unique = allProducts.filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);
    return unique.sort((a, b) => b.soldCount - a.soldCount).slice(0, 8);
  }, [featuredProducts, saleProducts, newProducts]);

  // Stats counter data (from API or fallback)
  const statsCounters = [
    { value: platformStats?.products ?? 0, suffix: '+', label: t('b_products'), icon: ShoppingBag },
    { value: platformStats?.sellers ?? 0, suffix: '+', label: t('b_sellersStat'), icon: Shield },
    { value: platformStats?.users ?? 0, suffix: '+', label: t('b_users'), icon: Sparkles },
    { value: platformStats?.countries ?? 0, suffix: '+', label: t('b_countries'), icon: TrendingUp },
  ];

  return (
    <div className="space-y-12 md:space-y-16 overflow-x-hidden">
      {/* Hero Banner Carousel */}
      <section className="relative overflow-hidden container mx-auto px-4">
        {heroSlides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-800 ease-in-out ${
              i === currentSlide ? 'opacity-100 scale-100 hero-slide-enter' : 'opacity-0 scale-105 hero-slide-exit'
            }`}
            aria-hidden={i !== currentSlide}
          >
            <div className={`relative bg-gradient-to-br ${slide.gradient} h-full w-full`}>
              {/* Subtle pattern overlay */}
              <div className="absolute inset-0 opacity-[0.04]" style={{
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              }} />
            </div>
          </div>
        ))}

        {/* Particle/Sparkle overlay */}
        <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className="hero-sparkle"
              style={{
                left: `${5 + (i * 4.7) % 90}%`,
                top: `${10 + (i * 7.3) % 80}%`,
                '--sparkle-duration': `${2 + (i % 4)}s`,
                '--sparkle-delay': `${(i * 0.3) % 3}s`,
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                opacity: 0.4 + (i % 5) * 0.1,
              } as React.CSSProperties}
            />
          ))}
        </div>

        {/* Vignette effect */}
        <div className="hero-vignette" />

        {/* Hero content - sits on top of slides */}
        <div className="relative z-10">
          <div className="px-6 py-14 md:px-12 lg:px-16 md:py-20 lg:py-24 text-white min-h-[340px] md:min-h-[440px] lg:min-h-[480px] flex items-center">
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left: Text content */}
              <div className="space-y-5 md:space-y-6">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium">
                  {React.createElement(iconMap[heroSlides[currentSlide].icon] || Sparkles, { className: 'size-4 text-emerald-200' })}
                  <span className="text-white/95">{t('appName')}</span>
                </div>
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-sm">
                  {heroSlides[currentSlide].title}
                </h1>
                <p className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-lg leading-relaxed font-medium">
                  {heroSlides[currentSlide].description}
                </p>
                <div className="flex flex-wrap gap-4 pt-3">
                  <Button
                    size="lg"
                    className="glassmorphism-btn text-white font-bold rounded-xl px-8 h-12 shadow-lg"
                    onClick={() => {
                      const link = heroSlides[currentSlide]?.ctaLink || '/shop';
                      if (link.startsWith('/')) {
                        setView(link.slice(1) as 'shop' | 'deals');
                      } else {
                        window.open(link, '_blank');
                      }
                    }}
                  >
                    {heroSlides[currentSlide].cta}
                    {isRTL ? (
                      <ArrowLeft className="size-5 ms-2" />
                    ) : (
                      <ArrowRight className="size-5 ms-2" />
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="glassmorphism-btn text-white font-bold rounded-xl px-8 h-12"
                    onClick={() => setView('deals')}
                  >
                    <Flame className="size-5 me-2" />
                    {t('deals')}
                  </Button>
                </div>
              </div>

              {/* Right: Floating product showcase cards */}
              <div className="hidden lg:flex justify-center items-center relative">
                <div className="relative">
                  {/* Main floating card */}
                  <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/25 shadow-2xl w-72 animate-float-slow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <ShoppingBag className="size-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{t('featuredProducts')}</p>
                        <p className="text-white/60 text-xs">{t('aiPowered')}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[0, 1, 2].map((idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-white/10 rounded-lg p-2.5">
                          <div className="w-9 h-9 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                            <Package className="size-4 text-white/70" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="h-2.5 bg-white/25 rounded-full w-3/4" />
                            <div className="h-2 bg-white/15 rounded-full w-1/2 mt-1.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Small floating badge */}
                  <div className="absolute -top-4 -right-4 bg-white/20 backdrop-blur-md rounded-xl px-3 py-2 border border-white/30 shadow-lg animate-float-delayed">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-emerald-300" />
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                  </div>

                  {/* Small floating discount badge */}
                  <div className="absolute -bottom-3 -left-3 bg-white/20 backdrop-blur-md rounded-xl px-3 py-2 border border-white/30 shadow-lg animate-float">
                    <div className="flex items-center gap-1.5">
                      <Flame className="size-3.5 text-orange-300" />
                      <span className="text-white text-xs font-bold">{bestDiscount > 0 ? `-${bestDiscount}%` : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Navigation Dots + Progress Bar */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
          <div className="flex items-center gap-2.5">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === currentSlide
                    ? 'w-10 h-3 bg-white shadow-lg shadow-white/40'
                    : 'w-3 h-3 bg-white/40 hover:bg-white/60 hover:scale-125'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
          {/* Auto-advance progress bar */}
          <div className="w-32 h-0.5 rounded-full bg-white/20 overflow-hidden">
            <div
              key={currentSlide}
              className="hero-progress-bar"
              style={{ '--carousel-duration': `${UI_CONFIG.carouselAutoAdvanceMs}ms` } as React.CSSProperties}
            />
          </div>
        </div>

        {/* Scroll down indicator */}
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 opacity-60">
          <span className="text-white/70 text-[10px] tracking-widest uppercase font-medium">{isRTL ? 'مرر للأسفل' : 'Scroll'}</span>
          <svg className="animate-scroll-bounce size-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 13l5 5 5-5" />
            <path d="M7 6l5 5 5-5" />
          </svg>
        </div>

        {/* Arrows */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1/2 -translate-y-1/2 left-3 md:left-5 size-10 md:size-12 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white border-none z-20 transition-all duration-300 hover:scale-110"
          onClick={prevSlide}
        >
          <PrevIcon className="size-5 md:size-6" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1/2 -translate-y-1/2 right-3 md:right-5 size-10 md:size-12 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white border-none z-20 transition-all duration-300 hover:scale-110"
          onClick={nextSlide}
        >
          <NextIcon className="size-5 md:size-6" />
        </Button>
      </section>

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

      {/* Trending Searches */}
      <section className="container mx-auto px-4 py-2">
        <TrendingSearches />
      </section>

      {/* Trust Badges - with emerald-tinted background */}
      <AnimatedSection>
        <section className="bg-emerald-50/50 dark:bg-emerald-950/20 py-10 md:py-14">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
              {trustBadges.map((badge, idx) => (
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

      {/* Shop by Category */}
      <AnimatedSection>
        {categories.length > 0 && (
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
        )}
      </AnimatedSection>

      {/* Top Brands */}
      <AnimatedSection>
        <section className="bg-muted/30 dark:bg-muted/10 py-8 md:py-12">
          <TopBrandsSection stores={allStores} locale={locale} />
        </section>
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
                    <ProductCard product={product} onQuickView={handleQuickView} />
                  </div>
                ))}
              </ScrollableSection>
            </div>
          </section>
        )}
      </AnimatedSection>

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
                  <ProductCard product={product} onQuickView={handleQuickView} />
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
                  <ProductCard product={product} onQuickView={handleQuickView} />
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

      {/* Featured Stores */}
      <AnimatedSection>
        {featuredStores.length > 0 && (
          <FeaturedStoresSection stores={featuredStores} locale={locale} />
        )}
      </AnimatedSection>

      {/* AI Recommendations - with animated gradient border */}
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
                      <ProductCard product={product} onQuickView={handleQuickView} />
                    </div>
                  ))}
                </ScrollableSection>
              </div>
            </div>
          </section>
        )}
      </AnimatedSection>

      {/* Deals Section */}
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
                  <ProductCard key={product.id} product={product} onQuickView={handleQuickView} />
                ))}
              </div>
            </div>
          </section>
        )}
      </AnimatedSection>

      {/* Top Rated Section */}
      <AnimatedSection>
        {featuredProducts.length > 0 && (
          <TopRatedSection products={featuredProducts} locale={locale} />
        )}
      </AnimatedSection>

      {/* Sellers Near You */}
      <AnimatedSection>
        <section className="bg-muted/20 dark:bg-muted/5 py-8 md:py-12">
          <SellersNearYouSection stores={featuredStores} locale={locale} />
        </section>
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
                  <ProductCard product={product} onQuickView={handleQuickView} />
                </div>
              ))}
            </ScrollableSection>
          </section>
        )}
      </AnimatedSection>

      {/* Recently Viewed Products */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-2">
          <RecentlyViewedSection />
        </section>
      </AnimatedSection>

      {/* Location / Area Guide */}
      <AnimatedSection>
        <section className="container mx-auto px-4 py-2">
          <LocationGuide />
        </section>
      </AnimatedSection>

      {/* Newsletter / Subscribe Section */}
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

      {/* Quick View Dialog */}
      <ProductQuickView
        product={quickViewProduct}
        open={quickViewOpen}
        onClose={() => setQuickViewOpen(false)}
      />
    </div>
  );
}
