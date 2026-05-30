'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart, ShoppingCart, GitCompare, Eye, Star, Truck, BadgeCheck, Trophy,
  Headphones, Shirt, Home, Sparkles, Dumbbell, Monitor, Palette,
  Watch, Gamepad2, Camera, Smartphone, Laptop, Gem, Flower2,
  Lamp, Sofa, CookingPot, Footprints, AlertTriangle, TrendingDown,
  Package, MapPin, ArrowUp, Crown, Zap, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useI18n } from '@/lib/i18n';
import { COLOR_MAP } from '@/lib/theme';
import { LS_KEYS } from '@/lib/config';
import { formatPrice } from '@/lib/currency';
import { getTaxRate } from '@/lib/tax';
import { MENA_CITY_NAMES } from '@/lib/reference-data';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useCartStore } from '@/stores/cart-store';
import { useUserStore } from '@/stores/user-store';
import { useRecentlyViewedStore } from '@/stores/recently-viewed-store';
import { ListingExpirationBadge } from '@/components/common/listing-expiration-badge';

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  price: number;
  originalPrice?: number;
  images: string;
  categoryId: string;
  storeId: string;
  stock: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  isFeatured: boolean;
  isNew: boolean;
  isSale: boolean;
  isB2b: boolean;
  hasFreeShipping: boolean;
  variations: string;
  tieredPricing: string;
  tags: string;
  category?: { id: string; name: string; nameAr?: string };
  store?: { id: string; name: string; rating: number; isVerified: boolean };
  createdAt: string;
  promotionType?: 'bump-up' | 'featured-ad' | 'premium-ad' | 'urgent-badge' | 'spotlight' | null;
}

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  onView?: (productId: string) => void;
}

// Category-specific placeholder configuration
const categoryConfig: Record<string, {
  gradient: string;
  darkGradient: string;
  icon: React.ElementType;
  textColor: string;
  darkTextColor: string;
}> = {
  'electronics': {
    gradient: 'from-blue-100 via-cyan-100 to-teal-100',
    darkGradient: 'dark:from-blue-950 dark:via-cyan-950 dark:to-teal-950',
    icon: Monitor,
    textColor: 'text-blue-400',
    darkTextColor: 'dark:text-blue-600',
  },
  'fashion': {
    gradient: 'from-pink-100 via-rose-100 to-fuchsia-100',
    darkGradient: 'dark:from-pink-950 dark:via-rose-950 dark:to-fuchsia-950',
    icon: Shirt,
    textColor: 'text-pink-400',
    darkTextColor: 'dark:text-pink-600',
  },
  'home': {
    gradient: 'from-amber-100 via-orange-100 to-yellow-100',
    darkGradient: 'dark:from-amber-950 dark:via-orange-950 dark:to-yellow-950',
    icon: Home,
    textColor: 'text-amber-400',
    darkTextColor: 'dark:text-amber-600',
  },
  'beauty': {
    gradient: 'from-purple-100 via-fuchsia-100 to-pink-100',
    darkGradient: 'dark:from-purple-950 dark:via-fuchsia-950 dark:to-pink-950',
    icon: Flower2,
    textColor: 'text-purple-400',
    darkTextColor: 'dark:text-purple-600',
  },
  'sports': {
    gradient: 'from-green-100 via-lime-100 to-emerald-100',
    darkGradient: 'dark:from-green-950 dark:via-lime-950 dark:to-emerald-950',
    icon: Dumbbell,
    textColor: 'text-green-400',
    darkTextColor: 'dark:text-green-600',
  },
  'audio': {
    gradient: 'from-slate-100 via-gray-100 to-zinc-100',
    darkGradient: 'dark:from-slate-950 dark:via-gray-950 dark:to-zinc-950',
    icon: Headphones,
    textColor: 'text-slate-400',
    darkTextColor: 'dark:text-slate-600',
  },
  'watches': {
    gradient: 'from-indigo-100 via-blue-100 to-sky-100',
    darkGradient: 'dark:from-indigo-950 dark:via-blue-950 dark:to-sky-950',
    icon: Watch,
    textColor: 'text-indigo-400',
    darkTextColor: 'dark:text-indigo-600',
  },
  'gaming': {
    gradient: 'from-violet-100 via-purple-100 to-indigo-100',
    darkGradient: 'dark:from-violet-950 dark:via-purple-950 dark:to-indigo-950',
    icon: Gamepad2,
    textColor: 'text-violet-400',
    darkTextColor: 'dark:text-violet-600',
  },
  'cameras': {
    gradient: 'from-gray-100 via-slate-100 to-neutral-100',
    darkGradient: 'dark:from-gray-950 dark:via-slate-950 dark:to-neutral-950',
    icon: Camera,
    textColor: 'text-gray-400',
    darkTextColor: 'dark:text-gray-600',
  },
  'phones': {
    gradient: 'from-sky-100 via-blue-100 to-cyan-100',
    darkGradient: 'dark:from-sky-950 dark:via-blue-950 dark:to-cyan-950',
    icon: Smartphone,
    textColor: 'text-sky-400',
    darkTextColor: 'dark:text-sky-600',
  },
  'laptops': {
    gradient: 'from-zinc-100 via-slate-100 to-gray-100',
    darkGradient: 'dark:from-zinc-950 dark:via-slate-950 dark:to-gray-950',
    icon: Laptop,
    textColor: 'text-zinc-400',
    darkTextColor: 'dark:text-zinc-600',
  },
  'jewelry': {
    gradient: 'from-yellow-100 via-amber-100 to-orange-100',
    darkGradient: 'dark:from-yellow-950 dark:via-amber-950 dark:to-orange-950',
    icon: Gem,
    textColor: 'text-yellow-400',
    darkTextColor: 'dark:text-yellow-600',
  },
  'decor': {
    gradient: 'from-rose-100 via-pink-100 to-red-100',
    darkGradient: 'dark:from-rose-950 dark:via-pink-950 dark:to-red-950',
    icon: Lamp,
    textColor: 'text-rose-400',
    darkTextColor: 'dark:text-rose-600',
  },
  'furniture': {
    gradient: 'from-orange-100 via-amber-100 to-yellow-100',
    darkGradient: 'dark:from-orange-950 dark:via-amber-950 dark:to-yellow-950',
    icon: Sofa,
    textColor: 'text-orange-400',
    darkTextColor: 'dark:text-orange-600',
  },
  'kitchen': {
    gradient: 'from-teal-100 via-cyan-100 to-sky-100',
    darkGradient: 'dark:from-teal-950 dark:via-cyan-950 dark:to-sky-950',
    icon: CookingPot,
    textColor: 'text-teal-400',
    darkTextColor: 'dark:text-teal-600',
  },
  'shoes': {
    gradient: 'from-emerald-100 via-teal-100 to-cyan-100',
    darkGradient: 'dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950',
    icon: Footprints,
    textColor: 'text-emerald-400',
    darkTextColor: 'dark:text-emerald-600',
  },
  'art': {
    gradient: 'from-fuchsia-100 via-purple-100 to-violet-100',
    darkGradient: 'dark:from-fuchsia-950 dark:via-purple-950 dark:to-violet-950',
    icon: Palette,
    textColor: 'text-fuchsia-400',
    darkTextColor: 'dark:text-fuchsia-600',
  },
};

// Default config for unknown categories
const defaultConfig = {
  gradient: 'from-emerald-100 via-teal-100 to-cyan-100',
  darkGradient: 'dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950',
  icon: Sparkles,
  textColor: 'text-emerald-300',
  darkTextColor: 'dark:text-emerald-700',
};

// MENA cities for location badge — imported from reference-data
const MENA_CITIES = MENA_CITY_NAMES;

// Simple hash function for deterministic city assignment
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

function getCategoryConfig(categoryId: string, categoryName?: string) {
  const id = categoryId.toLowerCase();
  const name = (categoryName || '').toLowerCase();

  if (categoryConfig[id]) return categoryConfig[id];

  for (const [key, config] of Object.entries(categoryConfig)) {
    if (name.includes(key) || key.includes(id)) return config;
  }

  return defaultConfig;
}

export function ProductCard({ product, onQuickView, onView }: ProductCardProps) {
  const { t, locale } = useI18n();
  const { toggleCompare, compareIds, currency } = useAppStore();
  const { addProduct: addToRecentlyViewed } = useRecentlyViewedStore();
  const nav = useAppNavigation(); // kept for promote-listing programmatic navigation
  const addItem = useCartStore((s) => s.addItem);
  const { user } = useUserStore();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [heartBounce, setHeartBounce] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const [showJustSold, setShowJustSold] = useState(false);

  const images: string[] = (() => {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) {
        return parsed.filter((img: string) => typeof img === 'string' && img.startsWith('/'));
      }
      return [];
    } catch {
      return [];
    }
  })();

  const hasValidImage = images.length > 0 && images[0].startsWith('/');

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const displayName = locale === 'ar' && product.nameAr ? product.nameAr : product.name;
  const isRTL = locale === 'ar';

  const config = getCategoryConfig(product.categoryId, product.category?.name);
  const CategoryIcon = config.icon;

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isBestSeller = product.soldCount > 100;

  // Get country code for tax info - derive directly from localStorage
  const [countryCode, setCountryCode] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.country);
      if (saved) return saved;
    } catch {
      // localStorage not available
    }
    return 'sa';
  });
  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem(LS_KEYS.country);
        if (saved && saved !== countryCode) setCountryCode(saved);
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [countryCode]);
  const taxRate = getTaxRate(countryCode);
  const showTaxBadge = taxRate > 0;

  // Parse variations for color swatches
  const colorSwatches: string[] = (() => {
    try {
      const vars = JSON.parse(product.variations || '{}');
      const colorKey = Object.keys(vars).find(k => k.toLowerCase().includes('color'));
      if (colorKey && Array.isArray(vars[colorKey])) return vars[colorKey];
      return [];
    } catch { return []; }
  })();

  // Color swatches now use shared COLOR_MAP from @/lib/theme

  // Stock progress calculation (max 100 units)
  const stockPercent = Math.min(100, Math.round((product.stock / 100) * 100));
  const stockColor = stockPercent > 50 ? 'bg-emerald-500' : stockPercent > 20 ? 'bg-amber-500' : 'bg-red-500';

  // "Just Sold" simulation - show briefly on some products
  useEffect(() => {
    if (product.soldCount > 50 && Math.random() > 0.6) {
      const timer = setTimeout(() => setShowJustSold(true), Math.random() * 8000 + 2000);
      const hideTimer = setTimeout(() => setShowJustSold(false), Math.random() * 8000 + 5000);
      return () => { clearTimeout(timer); clearTimeout(hideTimer); };
    }
  }, [product.soldCount]);

  // Card navigation is now handled by wrapping <Link> component

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 400);
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice ?? undefined,
      image: images[0] || '/placeholder-product.svg',
      quantity: 1,
      storeId: product.storeId,
      storeName: product.store?.name || '',
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    setHeartBounce(true);
    setTimeout(() => setHeartBounce(false), 400);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCompare(product.id);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  const isComparing = compareIds.includes(product.id);

  // Determine if user is the seller of this product
  const isSeller = user?.role === 'seller';

  // Promotion badge config
  const promotionConfig: Record<string, { icon: React.ElementType; label: string; labelAr: string; className: string }> = {
    'bump-up': { icon: ArrowUp, label: 'Bumped', labelAr: '\u0645\u0631\u0641\u0648\u0639', className: 'bg-blue-500 text-white' },
    'featured-ad': { icon: Star, label: 'Featured', labelAr: '\u0645\u0645\u064a\u0632', className: 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white' },
    'premium-ad': { icon: Crown, label: 'Premium', labelAr: '\u0628\u0631\u064a\u0645\u064a\u0648\u0645', className: 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white' },
    'urgent-badge': { icon: AlertTriangle, label: 'Urgent', labelAr: '\u0639\u0627\u062c\u0644', className: 'bg-red-500 text-white' },
    'spotlight': { icon: Zap, label: 'Spotlight', labelAr: '\u0633\u0628\u0648\u062a\u0644\u0627\u064a\u062a', className: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' },
  };
  const activePromo = product.promotionType ? promotionConfig[product.promotionType] : null;

  // Half-star rendering with proper 4.5 star support
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => {
      const filled = i < Math.floor(rating);
      const halfFilled = !filled && i < rating;
      return (
        <Star
          key={i}
          className={`size-3 ${
            filled
              ? 'fill-amber-400 text-amber-400'
              : halfFilled
              ? 'fill-amber-400/50 text-amber-400'
              : 'text-muted-foreground/20'
          }`}
        />
      );
    });
  };

  const handleLinkClick = () => {
    addToRecentlyViewed(product.id);
    onView?.(product.id);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Link
        href={`/product/${product.id}`}
        onClick={handleLinkClick}
        className={`group relative bg-card rounded-xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col flex-shrink-0 card-hover-shadow ${
          product.promotionType === 'premium-ad'
            ? 'border-2 border-purple-400 dark:border-purple-500 shadow-md shadow-purple-200 dark:shadow-purple-900/30'
            : product.promotionType === 'spotlight'
            ? 'border-2 border-emerald-400 dark:border-emerald-500 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30'
            : product.promotionType === 'featured-ad'
            ? 'border-2 border-amber-400 dark:border-amber-500 shadow-md shadow-amber-200 dark:shadow-amber-900/30'
            : 'border border-border hover:border-emerald-200 dark:hover:border-emerald-800'
        }`}
      >
        {/* Category accent bar at top */}
        <div className={`h-1 w-full shrink-0 bg-gradient-to-r ${config.gradient.replace('from-', 'from-').replace('via-', 'via-')}`} style={{ background: `linear-gradient(90deg, oklch(0.55 0.15 ${(() => { const colors: Record<string,number> = {electronics:250,fashion:340,home:75,beauty:300,sports:140,audio:220,watches:250,gaming:280,cameras:0,phones:210,laptops:240,jewelry:85,decor:10,furniture:55,kitchen:185,shoes:160,art:290}; return colors[product.categoryId.toLowerCase()] || 160; })()}), oklch(0.5 0.12 180))` }} />

        {/* Grid line pattern on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-0 product-grid-pattern" />

        {/* Gradient border effect on hover */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(20,184,166,0.15))', padding: '1px', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />

        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden bg-muted shrink-0">
          {/* Shimmer loading overlay */}
          {hasValidImage && !imgError && !imageLoaded && (
            <div className="absolute inset-0 shimmer-loading z-10" />
          )}
          {hasValidImage && !imgError ? (
            <Image
              src={images[0]}
              alt={displayName}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-115"
              loading="eager"
              onError={() => setImgError(true)}
              onLoad={() => setImageLoaded(true)}
            />
          ) : (
            <div className={`flex flex-col items-center justify-center h-full bg-gradient-to-br ${config.gradient} ${config.darkGradient} relative overflow-hidden shrink-0`}>
              {/* Gradient overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

              {/* Decorative background circles */}
              <div className="absolute top-4 end-4 w-16 h-16 rounded-full bg-white/10" />
              <div className="absolute bottom-6 start-4 w-10 h-10 rounded-full bg-white/10" />
              <div className="absolute top-1/2 start-1/3 w-6 h-6 rounded-full bg-white/5" />

              {/* Product initial letter - large centered */}
              <span className={`text-5xl font-bold ${config.textColor} ${config.darkTextColor} opacity-30 absolute inset-0 flex items-center justify-center select-none`}>
                {displayName.charAt(0).toUpperCase()}
              </span>

              {/* Category icon */}
              <CategoryIcon className={`size-8 ${config.textColor} ${config.darkTextColor} mb-1.5 opacity-70 relative z-[1]`} />

              {/* Category name */}
              {product.category && (
                <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-white/20 text-muted-foreground/60 relative z-[1]">
                  {locale === 'ar' && product.category.nameAr ? product.category.nameAr : product.category.name}
                </span>
              )}
            </div>
          )}

          {/* Badges */}
          <div className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'} flex flex-col gap-1 z-10`}>
            {product.isNew && (
              <Badge className="badge-new-animated text-white text-[10px] px-1.5 py-0 font-semibold shadow-sm relative overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                <span className="relative">{t('new')}</span>
              </Badge>
            )}
            {isBestSeller && (
              <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-[10px] px-1.5 py-0 font-semibold shadow-sm flex items-center gap-0.5">
                <Trophy className="size-2.5" />
                {t('bestSeller')}
              </Badge>
            )}
            {discount > 0 && (
              <Badge className="badge-sale-animated text-white text-[10px] px-1.5 py-0 font-semibold shadow-sm animate-deal-pulse">
                -{discount}% {t('off')}
              </Badge>
            )}
            {/* Promotion Badge */}
            {activePromo && (
              <Badge className={`${activePromo.className} text-[10px] px-1.5 py-0 font-semibold shadow-sm flex items-center gap-0.5`}>
                <activePromo.icon className="size-2.5" />
                {locale === 'ar' ? activePromo.labelAr : activePromo.label}
              </Badge>
            )}
          </div>

          {/* Free Shipping Badge */}
          {product.hasFreeShipping && (
            <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} z-10`}>
              <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0">
                <Truck className="size-2.5 me-0.5" />
                {t('freeShipping')}
              </Badge>
            </div>
          )}

          {/* Low Stock Indicator with pulsing red dot */}
          {product.stock > 0 && product.stock <= 20 && (
            <div className={`absolute bottom-2 ${isRTL ? 'right-2' : 'left-2'} ${isRTL ? 'left-2' : 'right-2'} z-10`}>
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-md px-2 py-1.5 shadow-sm border border-white/20">
                <div className="flex items-center gap-1 mb-1">
                  <span className={`size-1.5 rounded-full ${stockPercent <= 20 ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className={`text-[9px] font-medium ${stockPercent <= 20 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {isRTL ? `${product.stock} فقط!` : product.stock <= 5 ? `Only ${product.stock} left!` : `${product.stock} left`}
                  </span>
                </div>
                <div className="w-full h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${stockColor}`}
                    style={{ width: `${stockPercent}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* "Just Sold" flash indicator */}
          {showJustSold && (
            <div className={`absolute bottom-2 ${isRTL ? 'left-2' : 'right-2'} z-10 animate-just-sold`}>
              <div className="flex items-center gap-1 bg-emerald-500/90 text-white text-[9px] font-medium px-2 py-1 rounded-full shadow-sm backdrop-blur-sm">
                <Package className="size-2.5" />
                {isRTL ? 'تم البيع للتو' : 'Just Sold'}
              </div>
            </div>
          )}

          {/* Gradient overlay at bottom of image for text readability */}
          <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent z-[5] pointer-events-none" />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

          {/* Quick View overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
            <div className="px-4 py-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-lg border border-emerald-200 dark:border-emerald-800">
              {isRTL ? 'عرض سريع' : 'Quick View'}
            </div>
          </div>

          {/* Hover Actions */}
          <div
            className={`absolute ${
              isRTL ? 'left-2' : 'right-2'
            } top-1/2 -translate-y-1/2 flex flex-col gap-1.5 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300`}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="size-8 rounded-full shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-emerald-50 dark:hover:bg-emerald-900 border border-white/20"
                  onClick={handleWishlist}
                  aria-label="Wishlist"
                >
                  <Heart
                    className={`size-3.5 transition-transform ${
                      isWishlisted
                        ? 'fill-red-500 text-red-500'
                        : 'text-gray-600 dark:text-gray-400'
                    } ${heartBounce ? 'animate-heart-bounce' : ''}`}
                    style={heartBounce ? { transformOrigin: 'center bottom' } : undefined}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isRTL ? 'left' : 'right'} className="text-xs">
                {isWishlisted ? (isRTL ? 'إزالة من المفضلة' : 'Remove from Wishlist') : (isRTL ? 'أضف للمفضلة' : 'Add to Wishlist')}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className={`size-8 rounded-full shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-emerald-50 dark:hover:bg-emerald-900 border border-white/20 ${
                    isComparing ? 'bg-emerald-500 text-white ring-2 ring-emerald-500/30 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 dark:text-white' : 'text-gray-600 dark:text-gray-400'
                  }`}
                  onClick={handleCompare}
                  aria-label={t('addToCompare')}
                >
                  {isComparing ? <Check className="size-3.5" /> : <GitCompare className="size-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={isRTL ? 'left' : 'right'} className="text-xs">
                {t('addToCompare')}
              </TooltipContent>
            </Tooltip>

            {onQuickView && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="size-8 rounded-full shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-emerald-50 dark:hover:bg-emerald-900 text-gray-600 dark:text-gray-400 border border-white/20"
                    onClick={handleQuickView}
                    aria-label={t('quickView')}
                  >
                    <Eye className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isRTL ? 'left' : 'right'} className="text-xs">
                  {t('quickView')}
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {/* Add to Cart - slides up from bottom on hover (desktop only) with animated cart icon */}
          <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out hidden md:block z-20">
            <div className="bg-gradient-to-t from-black/80 via-black/60 to-transparent pt-8 pb-0">
              <Button
                size="sm"
                className={`w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs h-9 rounded-none shadow-lg ${cartBounce ? 'animate-cart-bounce' : ''}`}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? (
                  t('outOfStock')
                ) : (
                  <>
                    <ShoppingCart className={`size-3 me-1 ${cartBounce ? 'animate-cart-slide' : ''}`} />
                    {t('addToCart')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 space-y-1.5 flex-1 flex flex-col">
          {/* Store Name + Location Badge */}
          {product.store && (
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
              <span className="text-[10px] text-muted-foreground truncate">
                {product.store.name}
              </span>
              {product.store.isVerified && (
                <BadgeCheck className="size-3 text-emerald-500 shrink-0" />
              )}
              <span className="text-[9px] text-muted-foreground/70 flex items-center gap-0.5 ms-auto shrink-0">
                <MapPin className="size-2" />
                {MENA_CITIES[Math.abs(hashCode(product.storeId)) % MENA_CITIES.length]}
              </span>
            </div>
          )}

          {/* Product Name */}
          <h3 className="text-sm font-medium leading-tight line-clamp-2 min-h-[2.5rem] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {displayName}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex items-center">{renderStars(product.rating)}</div>
            <span className="text-[10px] text-muted-foreground font-medium">
              {(product.rating ?? 0).toFixed(1)} ({product.reviewCount})
            </span>
          </div>

          {/* Price with enhanced strikethrough, discount percentage badge, and price drop indicator */}
          <div className="flex items-baseline gap-1.5 min-w-0 overflow-hidden">
            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 shrink-0 price-highlight">
              {formatPrice(product.price, currency)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-xs text-red-400 dark:text-red-400 line-through decoration-red-400/60 decoration-1 truncate">
                  {formatPrice(product.originalPrice, currency)}
                </span>
                {discount > 0 && (
                  <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 text-[9px] px-1 py-0 border-0 font-semibold shrink-0">
                    -{discount}%
                  </Badge>
                )}
                <TrendingDown className="size-3 text-red-400 animate-price-drop shrink-0" />
              </>
            )}
          </div>

          {/* Color Swatches Row */}
          {colorSwatches.length > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              {colorSwatches.slice(0, 5).map((color, idx) => (
                <div
                  key={idx}
                  className="w-3.5 h-3.5 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm transition-transform hover:scale-125 cursor-pointer"
                  style={{ backgroundColor: COLOR_MAP[color.toLowerCase()] || color }}
                  title={color}
                />
              ))}
              {colorSwatches.length > 5 && (
                <span className="text-[9px] text-muted-foreground ms-0.5">+{colorSwatches.length - 5}</span>
              )}
            </div>
          )}

          {/* Sold Count */}
          {product.soldCount > 0 && (
            <p className="text-[10px] text-muted-foreground">
              {product.soldCount.toLocaleString()} {isRTL ? 'مباع' : 'sold'}
            </p>
          )}

          {/* Listing Expiration Badge */}
          <ListingExpirationBadge createdAt={product.createdAt} />

          {/* Tax Badge */}
          {showTaxBadge && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 w-fit">
              {isRTL ? `شامل ض.ق ${taxRate}%` : `Incl. VAT ${taxRate}%`}
            </Badge>
          )}
          {taxRate === 0 && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 w-fit">
              {isRTL ? 'بدون ضريبة' : 'Excl. tax'}
            </Badge>
          )}

          {/* Spacer to push button to bottom */}
          <div className="flex-1" />

          {/* Promote Button - Only visible for seller's own products */}
          {isSeller && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-1 text-xs h-7 rounded-lg border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950 transition-all duration-200"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); nav.setView('promote-listing'); }}
            >
              <Zap className="size-3 me-1" />
              {isRTL ? 'روّج' : 'Promote'}
            </Button>
          )}

          {/* Add to Cart Button - full width at bottom (mobile visible always, desktop hidden since hover version) */}
          <Button
            size="sm"
            className={`w-full mt-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs h-8 rounded-lg shadow-sm shadow-emerald-500/20 transition-all duration-200 md:hidden ripple ${cartBounce ? 'animate-cart-bounce' : ''}`}
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? (
              t('outOfStock')
            ) : (
              <>
                <ShoppingCart className={`size-3 me-1 ${cartBounce ? 'animate-cart-slide' : ''}`} />
                {t('addToCart')}
              </>
            )}
          </Button>
        </div>
      </Link>
    </TooltipProvider>
  );
}
