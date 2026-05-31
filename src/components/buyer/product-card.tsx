'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Heart, ShoppingCart, GitCompare, Eye, Star, Truck, BadgeCheck,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useCartStore } from '@/stores/cart-store';
import { useUserStore } from '@/stores/user-store';
import { useRecentlyViewedStore } from '@/stores/recently-viewed-store';

export interface Product {
  id: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  price: number;
  originalPrice?: number;
  images: string;
  categoryId: string;
  storeId: string;
  sku?: string;
  stock: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  views?: number;
  isFeatured: boolean;
  isNew: boolean;
  isSale: boolean;
  isB2b: boolean;
  hasFreeShipping: boolean;
  variations: string;
  tieredPricing: string;
  tags: string;
  category?: { id: string; name: string; nameAr?: string };
  store?: { id: string; name: string; nameAr?: string; rating: number; isVerified: boolean; location?: string; productCount?: number };
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  promotionType?: 'bump-up' | 'featured-ad' | 'premium-ad' | 'urgent-badge' | 'spotlight' | null;
}

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  onView?: (productId: string) => void;
}

// Unsplash fallback images — deterministic by product.id hash
const UNSPLASH_IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',  // watch/product
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',  // headphones
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80',  // camera
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',  // shoes
  'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=400&q=80',  // fashion
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&q=80',  // home decor
  'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&q=80',  // shopping
];

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash;
}

function getUnsplashImage(productId: string): string {
  const idx = Math.abs(hashCode(productId)) % UNSPLASH_IMAGES.length;
  return UNSPLASH_IMAGES[idx];
}

// Gold accent color
const GOLD = 'oklch(0.75 0.12 85)';
const GOLD_DARK = 'oklch(0.65 0.14 85)';

export function ProductCard({ product, onQuickView, onView }: ProductCardProps) {
  const { t, locale } = useI18n();
  const { toggleCompare, compareIds } = useAppStore();
  const { addProduct: addToRecentlyViewed } = useRecentlyViewedStore();
  const nav = useAppNavigation();
  const addItem = useCartStore((s) => s.addItem);
  const { user } = useUserStore();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [heartBounce, setHeartBounce] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);

  // Parse valid local images (must start with '/')
  const localImages: string[] = (() => {
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

  const hasValidLocalImage = localImages.length > 0;
  // Determine the image source: local first, then Unsplash fallback
  const imageSrc = hasValidLocalImage ? localImages[0] : getUnsplashImage(product.id);
  const showRealImage = !imgError;

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const displayName = locale === 'ar' && product.nameAr ? product.nameAr : product.name;
  const isRTL = locale === 'ar';

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
      image: localImages[0] || imageSrc,
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
  const isSeller = user?.role === 'seller';

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
        className="group relative bg-card rounded-xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col flex-shrink-0 card-hover-shadow border border-border hover:border-border/80"
      >
        {/* Image Section */}
        <div className="relative aspect-square overflow-hidden bg-muted shrink-0">
          {showRealImage ? (
            <Image
              src={imageSrc}
              alt={displayName}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
              loading="eager"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted">
              <span className="text-4xl font-bold text-muted-foreground/20 select-none">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Badges */}
          <div className={`absolute top-2 ${isRTL ? 'right-2' : 'left-2'} flex flex-col gap-1 z-10`}>
            {product.isNew && (
              <Badge className="text-white text-[10px] px-1.5 py-0 font-semibold shadow-sm bg-gradient-to-r from-[oklch(0.75_0.12_85)] to-[oklch(0.65_0.14_85)]">
                {t('new')}
              </Badge>
            )}
            {discount > 0 && (
              <Badge className="text-white text-[10px] px-1.5 py-0 font-semibold shadow-sm bg-red-500">
                -{discount}% {t('off')}
              </Badge>
            )}
          </div>

          {/* Free Shipping Badge */}
          {product.hasFreeShipping && (
            <div className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} z-10`}>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm">
                <Truck className="size-2.5 me-0.5" />
                {t('freeShipping')}
              </Badge>
            </div>
          )}

          {/* Gradient overlay at bottom of image for text readability */}
          <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent z-[5] pointer-events-none" />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

          {/* Quick View overlay on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
            <div className="px-4 py-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-xs font-semibold shadow-lg border border-border/50" style={{ color: GOLD }}>
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
                  className="size-8 rounded-full shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-red-50 dark:hover:bg-red-950 border border-white/20"
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
                  className={`size-8 rounded-full shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-white/20 ${
                    isComparing ? 'text-white ring-2 hover:brightness-110' : 'hover:bg-muted text-gray-600 dark:text-gray-400'
                  }`}
                  style={isComparing ? { backgroundColor: GOLD, boxShadow: `0 0 0 2px ${GOLD}50` } : undefined}
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
                    className="size-8 rounded-full shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-muted text-gray-600 dark:text-gray-400 border border-white/20"
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

          {/* Add to Cart - slides up from bottom on hover (desktop only) */}
          <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out hidden md:block z-20">
            <div className="bg-gradient-to-t from-black/80 via-black/60 to-transparent pt-8 pb-0">
              <Button
                size="sm"
                className={`w-full text-white text-xs h-9 rounded-none shadow-lg transition-all duration-200 ${cartBounce ? 'animate-cart-bounce' : ''}`}
                style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD_DARK})` }}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? (
                  t('outOfStock')
                ) : (
                  <>
                    <ShoppingCart className="size-3 me-1" />
                    {t('addToCart')}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-3 space-y-1 flex-1 flex flex-col">
          {/* Store Name + Verification Badge */}
          {product.store && (
            <div className="flex items-center gap-1 min-w-0 overflow-hidden">
              <span className="text-[10px] text-muted-foreground truncate">
                {product.store.name}
              </span>
              {product.store.isVerified && (
                <BadgeCheck className="size-3 shrink-0" style={{ color: GOLD }} />
              )}
            </div>
          )}

          {/* Product Name */}
          <h3 className="text-sm font-medium leading-tight line-clamp-2 min-h-[2.5rem] transition-colors" style={{ '--tw-group-hover-color': GOLD } as React.CSSProperties}>
            <span className="group-hover:opacity-80">{displayName}</span>
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1">
            <div className="flex items-center">{renderStars(product.rating)}</div>
            <span className="text-[10px] text-muted-foreground font-medium">
              {(product.rating ?? 0).toFixed(1)} ({product.reviewCount})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 min-w-0 overflow-hidden">
            <span className="text-base font-bold shrink-0" style={{ color: GOLD }}>
              {product.price.toLocaleString()} {locale === 'ar' ? 'ر.س' : 'SAR'}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-muted-foreground/60 line-through decoration-1 truncate">
                {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Spacer to push button to bottom */}
          <div className="flex-1" />

          {/* Promote Button - Only visible for seller's own products */}
          {isSeller && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-1 text-xs h-7 rounded-lg transition-all duration-200"
              style={{ borderColor: GOLD, color: GOLD }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); nav.setView('promote-listing'); }}
            >
              {locale === 'ar' ? 'روّج' : 'Promote'}
            </Button>
          )}

          {/* Add to Cart Button - full width at bottom (mobile visible always, desktop hidden since hover version) */}
          <Button
            size="sm"
            className={`w-full mt-1 text-white text-xs h-8 rounded-lg shadow-sm transition-all duration-200 md:hidden ripple ${cartBounce ? 'animate-cart-bounce' : ''}`}
            style={{ background: `linear-gradient(90deg, ${GOLD}, ${GOLD_DARK})` }}
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            {product.stock === 0 ? (
              t('outOfStock')
            ) : (
              <>
                <ShoppingCart className="size-3 me-1" />
                {t('addToCart')}
              </>
            )}
          </Button>
        </div>
      </Link>
    </TooltipProvider>
  );
}
