'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BadgeCheck,
  Check,
  Eye,
  GitCompare,
  Heart,
  Loader2,
  ShoppingCart,
  Star,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { parseVariationOptions } from '@/lib/checkout-authority';
import { formatPrice } from '@/lib/currency';
import { useI18n } from '@/lib/i18n';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useAppStore } from '@/stores/app-store';
import { useCartStore } from '@/stores/cart-store';
import { useRecentlyViewedStore } from '@/stores/recently-viewed-store';
import { useUserStore } from '@/stores/user-store';
import {
  useWishlistStore,
  type WishlistProduct,
} from '@/stores/wishlist-store';

export interface ProductVariantSku {
  id: string;
  sku: string;
  attributes: string;
  optionKey: string;
  price: number;
  originalPrice?: number | null;
  stock: number;
  isActive: boolean;
}

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
  hasVariants?: boolean;
  variantSkus?: ProductVariantSku[];
  tieredPricing: string;
  tags: string;
  category?: { id: string; name: string; nameAr?: string };
  store?: {
    id: string;
    name: string;
    nameAr?: string;
    rating: number;
    isVerified: boolean;
    location?: string;
    productCount?: number;
  };
  createdAt: string;
  updatedAt?: string;
  expiresAt?: string;
  promotionType?:
    | 'bump-up'
    | 'featured-ad'
    | 'premium-ad'
    | 'urgent-badge'
    | 'spotlight'
    | null;
}

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  onView?: (productId: string) => void;
}

function parseImages(images: string): string[] {
  try {
    const parsed = JSON.parse(images) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value): value is string =>
        typeof value === 'string' &&
        (value.startsWith('/') ||
          value.startsWith('https://') ||
          value.startsWith('http://')),
    );
  } catch {
    return [];
  }
}

function toWishlistProduct(product: Product): WishlistProduct {
  return {
    id: product.id,
    name: product.name,
    nameAr: product.nameAr,
    price: product.price,
    originalPrice: product.originalPrice,
    images: product.images,
    stock: product.stock,
    rating: product.rating,
    reviewCount: product.reviewCount,
    storeId: product.storeId,
    variations: product.variations,
    hasFreeShipping: product.hasFreeShipping,
    store: product.store
      ? {
          id: product.store.id,
          name: product.store.name,
          nameAr: product.store.nameAr,
        }
      : null,
  };
}

export function ProductCard({
  product,
  onQuickView,
  onView,
}: ProductCardProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const nav = useAppNavigation();
  const currency = useAppStore((state) => state.currency);
  const compareIds = useAppStore((state) => state.compareIds);
  const toggleCompare = useAppStore((state) => state.toggleCompare);
  const addItem = useCartStore((state) => state.addItem);
  const addRecentlyViewed = useRecentlyViewedStore(
    (state) => state.addProduct,
  );
  const user = useUserStore((state) => state.user);
  const isHydrated = useUserStore((state) => state.isHydrated);
  const hydrateWishlist = useWishlistStore((state) => state.hydrate);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const wishlistItemId = useWishlistStore(
    (state) => state.productIds[product.id],
  );
  const wishlistPending = useWishlistStore(
    (state) => Boolean(state.pendingProductIds[product.id]),
  );
  const [imageFailed, setImageFailed] = useState(false);
  const [cartFeedback, setCartFeedback] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    void hydrateWishlist(user?.id || null);
  }, [hydrateWishlist, isHydrated, user?.id]);

  const images = useMemo(() => parseImages(product.images), [product.images]);
  const imageSource = !imageFailed
    ? images[0] || '/placeholder-product.svg'
    : '/placeholder-product.svg';
  const displayName =
    isRTL && product.nameAr ? product.nameAr : product.name;
  const storeName =
    isRTL && product.store?.nameAr
      ? product.store.nameAr
      : product.store?.name;
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0;
  const isComparing = compareIds.includes(product.id);
  const isWishlisted = Boolean(wishlistItemId);
  const hasOptions =
    Boolean(product.variantSkus?.some((variant) => variant.isActive)) ||
    Object.keys(parseVariationOptions(product.variations)).length > 0;
  const isOutOfStock = product.stock <= 0;
  const productHref = `/product/${product.id}`;

  function recordView() {
    addRecentlyViewed(product.id);
    onView?.(product.id);
  }

  async function handleWishlist() {
    if (!isHydrated || wishlistPending) return;
    if (!user) {
      toast.info(
        isRTL
          ? 'سجّل الدخول لحفظ المنتجات في المفضلة.'
          : 'Sign in to save products to your wishlist.',
      );
      nav.setView('auth');
      return;
    }

    const result = await toggleWishlist(user.id, toWishlistProduct(product));
    if (result === 'added') {
      toast.success(
        isRTL ? 'تمت الإضافة إلى المفضلة.' : 'Added to your wishlist.',
      );
    } else if (result === 'removed') {
      toast.success(
        isRTL ? 'تمت الإزالة من المفضلة.' : 'Removed from your wishlist.',
      );
    } else if (result === 'unchanged') {
      const error = useWishlistStore.getState().error;
      if (error) toast.error(error);
    }
  }

  function handleAddToCart() {
    if (hasOptions) {
      recordView();
      nav.selectProduct(product.id);
      return;
    }
    if (isOutOfStock) return;

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: imageSource,
      quantity: 1,
      storeId: product.storeId,
      storeName: product.store?.name || '',
      hasFreeShipping: product.hasFreeShipping,
    });
    setCartFeedback(true);
    window.setTimeout(() => setCartFeedback(false), 900);
    toast.success(isRTL ? 'تمت الإضافة إلى السلة.' : 'Added to cart.');
  }

  const wishlistLabel = isWishlisted
    ? isRTL
      ? `إزالة ${displayName} من المفضلة`
      : `Remove ${displayName} from wishlist`
    : isRTL
      ? `إضافة ${displayName} إلى المفضلة`
      : `Add ${displayName} to wishlist`;
  const compareLabel = isComparing
    ? isRTL
      ? `إزالة ${displayName} من المقارنة`
      : `Remove ${displayName} from comparison`
    : isRTL
      ? `إضافة ${displayName} إلى المقارنة`
      : `Add ${displayName} to comparison`;

  return (
    <article className="group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow duration-200 hover:shadow-lg focus-within:ring-2 focus-within:ring-amber-500/60">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Link
          href={productHref}
          onClick={recordView}
          className="absolute inset-0 z-0 block"
          aria-label={
            isRTL ? `عرض تفاصيل ${displayName}` : `View ${displayName} details`
          }
        >
          <Image
            src={imageSource}
            alt={displayName}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        </Link>

        <div
          className={`pointer-events-none absolute top-2 z-10 flex flex-col gap-1 ${
            isRTL ? 'right-2' : 'left-2'
          }`}
        >
          {product.isNew && (
            <Badge className="bg-amber-600 px-1.5 py-0 text-[10px] text-white">
              {t('new')}
            </Badge>
          )}
          {discount > 0 && (
            <Badge className="bg-red-600 px-1.5 py-0 text-[10px] text-white">
              -{discount}% {t('off')}
            </Badge>
          )}
        </div>

        {product.hasFreeShipping && (
          <Badge
            variant="secondary"
            className={`pointer-events-none absolute top-2 z-10 bg-background/90 px-1.5 py-0 text-[10px] shadow-sm backdrop-blur ${
              isRTL ? 'left-2' : 'right-2'
            }`}
          >
            <Truck className="me-1 size-3" aria-hidden="true" />
            {t('freeShipping')}
          </Badge>
        )}

        <div
          className={`absolute bottom-2 z-20 flex gap-2 ${
            isRTL ? 'left-2' : 'right-2'
          }`}
        >
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="size-10 rounded-full bg-background/95 shadow-md backdrop-blur hover:bg-red-50 dark:hover:bg-red-950"
            onClick={() => void handleWishlist()}
            disabled={wishlistPending || !isHydrated}
            aria-label={wishlistLabel}
            aria-pressed={isWishlisted}
          >
            {wishlistPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Heart
                className={`size-4 ${
                  isWishlisted ? 'fill-red-500 text-red-500' : ''
                }`}
                aria-hidden="true"
              />
            )}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="icon"
            className={`size-10 rounded-full bg-background/95 shadow-md backdrop-blur ${
              isComparing
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'hover:bg-amber-50 dark:hover:bg-amber-950'
            }`}
            onClick={() => toggleCompare(product.id)}
            aria-label={compareLabel}
            aria-pressed={isComparing}
          >
            {isComparing ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <GitCompare className="size-4" aria-hidden="true" />
            )}
          </Button>

          {onQuickView && (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="hidden size-10 rounded-full bg-background/95 shadow-md backdrop-blur hover:bg-amber-50 dark:hover:bg-amber-950 sm:inline-flex"
              onClick={() => onQuickView(product)}
              aria-label={
                isRTL
                  ? `عرض سريع لـ ${displayName}`
                  : `Quick view ${displayName}`
              }
            >
              <Eye className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {product.store && (
          <div className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
            <span className="truncate">{storeName}</span>
            {product.store.isVerified && (
              <BadgeCheck
                className="size-3 shrink-0 text-amber-600"
                aria-label={isRTL ? 'متجر موثّق' : 'Verified store'}
              />
            )}
          </div>
        )}

        <h3 className="min-h-10 text-sm font-semibold leading-5">
          <Link
            href={productHref}
            onClick={recordView}
            className="line-clamp-2 rounded-sm hover:text-amber-700 dark:hover:text-amber-300"
          >
            {displayName}
          </Link>
        </h3>

        <div
          className="flex items-center gap-1 text-xs text-muted-foreground"
          aria-label={
            isRTL
              ? `التقييم ${product.rating.toFixed(1)} من 5 من ${product.reviewCount} مراجعة`
              : `${product.rating.toFixed(1)} out of 5 from ${product.reviewCount} reviews`
          }
        >
          <Star
            className="size-3.5 fill-amber-400 text-amber-400"
            aria-hidden="true"
          />
          <span className="font-medium text-foreground">
            {(product.rating || 0).toFixed(1)}
          </span>
          <span>({product.reviewCount || 0})</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-amber-700 dark:text-amber-300">
              {formatPrice(product.price, currency)}
            </p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-xs text-muted-foreground line-through">
                {formatPrice(product.originalPrice, currency)}
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className={
              isOutOfStock
                ? 'border-red-300 text-red-700 dark:border-red-900 dark:text-red-300'
                : 'border-amber-300 text-amber-700 dark:border-amber-900 dark:text-amber-300'
            }
          >
            {isOutOfStock
              ? t('outOfStock')
              : hasOptions
                ? isRTL
                  ? 'خيارات'
                  : 'Options'
                : isRTL
                  ? 'متوفر'
                  : 'In stock'}
          </Badge>
        </div>

        <Button
          type="button"
          className="mt-1 h-10 w-full bg-amber-600 text-white hover:bg-amber-700"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          {cartFeedback ? (
            <Check className="me-2 size-4" aria-hidden="true" />
          ) : (
            <ShoppingCart className="me-2 size-4" aria-hidden="true" />
          )}
          {isOutOfStock
            ? t('outOfStock')
            : hasOptions
              ? isRTL
                ? 'اختر الخيارات'
                : 'Choose options'
              : cartFeedback
                ? isRTL
                  ? 'تمت الإضافة'
                  : 'Added'
                : t('addToCart')}
        </Button>
      </div>
    </article>
  );
}
