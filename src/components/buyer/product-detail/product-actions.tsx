'use client';

import React, { useEffect } from 'react';
import {
  Check,
  GitCompare,
  Heart,
  Loader2,
  Share2,
  ShoppingCart,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { type Product } from '@/components/buyer/product-card';
import { APP_NAME } from '@/lib/config';
import { useI18n } from '@/lib/i18n';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useAppStore } from '@/stores/app-store';
import { useUserStore } from '@/stores/user-store';
import { useWishlistStore, type WishlistProduct } from '@/stores/wishlist-store';
import { RippleButton } from './ripple-button';

interface ProductActionsProps {
  product?: Product;
  productId?: string;
  productName?: string;
  displayName: string;
  stock: number;
  isWishlisted?: boolean;
  setIsWishlisted?: (value: boolean) => void;
  shareOpen?: boolean;
  setShareOpen: (value: boolean) => void;
  copied?: boolean;
  setCopied?: (value: boolean) => void;
  shareWebSuccess: boolean;
  setShareWebSuccess: (value: boolean) => void;
  handleAddToCart: () => void;
  handleBuyNow: () => void;
  isRTL: boolean;
  listingTitle?: string;
  t?: (key: string, params?: Record<string, unknown>) => string;
}

function wishlistProduct(
  product: Product | undefined,
  productId: string,
  productName: string,
  stock: number,
): WishlistProduct {
  if (product) {
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

  return {
    id: productId,
    name: productName,
    price: 0,
    images: '[]',
    stock,
    rating: 0,
    reviewCount: 0,
    storeId: '',
    variations: '{}',
    store: null,
  };
}

export function ProductActions({
  product,
  productId,
  productName,
  displayName,
  stock,
  setShareOpen,
  shareWebSuccess,
  setShareWebSuccess,
  handleAddToCart,
  handleBuyNow,
  isRTL,
}: ProductActionsProps) {
  const { t } = useI18n();
  const nav = useAppNavigation();
  const resolvedProductId = product?.id || productId || '';
  const resolvedProductName = product?.name || productName || displayName;
  const toggleCompare = useAppStore((state) => state.toggleCompare);
  const isComparing = useAppStore((state) =>
    state.compareIds.includes(resolvedProductId),
  );
  const user = useUserStore((state) => state.user);
  const isHydrated = useUserStore((state) => state.isHydrated);
  const hydrateWishlist = useWishlistStore((state) => state.hydrate);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const isWishlisted = useWishlistStore((state) =>
    Boolean(state.productIds[resolvedProductId]),
  );
  const wishlistPending = useWishlistStore((state) =>
    Boolean(state.pendingProductIds[resolvedProductId]),
  );

  useEffect(() => {
    if (!isHydrated) return;
    void hydrateWishlist(user?.id || null);
  }, [hydrateWishlist, isHydrated, user?.id]);

  async function handleWishlist() {
    if (!resolvedProductId || !isHydrated || wishlistPending) return;
    if (!user) {
      toast.info(
        isRTL
          ? 'سجّل الدخول لحفظ المنتج في المفضلة.'
          : 'Sign in to save this product to your wishlist.',
      );
      nav.setView('auth');
      return;
    }

    const result = await toggleWishlist(
      user.id,
      wishlistProduct(
        product,
        resolvedProductId,
        resolvedProductName,
        stock,
      ),
    );

    if (result === 'added') {
      if (!product) await hydrateWishlist(user.id, true);
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

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayName,
          text: `${resolvedProductName} - ${APP_NAME}`,
          url: window.location.href,
        });
        setShareWebSuccess(true);
        window.setTimeout(() => setShareWebSuccess(false), 2000);
        return;
      } catch {
        // Fall back to the explicit share options when native sharing is dismissed.
      }
    }
    setShareOpen(true);
  }

  return (
    <>
      <div
        data-product-primary-actions
        className="relative rounded-xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-700 p-[2px]"
      >
        <div className="flex flex-col gap-3 rounded-xl bg-background p-1 sm:flex-row">
          <RippleButton
            size="lg"
            className="min-h-12 w-full shrink-0 rounded-lg bg-amber-600 text-base text-white hover:bg-amber-700 sm:flex-1"
            onClick={handleAddToCart}
            disabled={stock === 0}
          >
            <ShoppingCart className="me-2 size-5" aria-hidden="true" />
            {t('addToCart')}
          </RippleButton>
          <RippleButton
            size="lg"
            variant="outline"
            className="min-h-12 w-full shrink-0 rounded-lg border-amber-600 text-base text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950 sm:flex-1"
            onClick={handleBuyNow}
            disabled={stock === 0}
          >
            <Zap className="me-2 size-5" aria-hidden="true" />
            {t('buyNow')}
          </RippleButton>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className={`h-10 gap-1.5 ${
            isWishlisted
              ? 'border-red-300 text-red-600 dark:border-red-900 dark:text-red-300'
              : ''
          }`}
          onClick={() => void handleWishlist()}
          disabled={wishlistPending || !isHydrated}
          aria-pressed={isWishlisted}
          aria-label={
            isWishlisted
              ? isRTL
                ? `إزالة ${displayName} من المفضلة`
                : `Remove ${displayName} from wishlist`
              : isRTL
                ? `إضافة ${displayName} إلى المفضلة`
                : `Add ${displayName} to wishlist`
          }
        >
          {wishlistPending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Heart
              className={`size-4 ${isWishlisted ? 'fill-red-500' : ''}`}
              aria-hidden="true"
            />
          )}
          {isWishlisted
            ? isRTL
              ? 'محفوظ'
              : 'Saved'
            : isRTL
              ? 'المفضلة'
              : 'Wishlist'}
        </Button>

        <Button
          type="button"
          variant="outline"
          className={`h-10 gap-1.5 ${
            isComparing
              ? 'border-amber-300 text-amber-700 dark:border-amber-900 dark:text-amber-300'
              : ''
          }`}
          onClick={() => toggleCompare(resolvedProductId)}
          disabled={!resolvedProductId}
          aria-pressed={isComparing}
        >
          <GitCompare className="size-4" aria-hidden="true" />
          {isComparing
            ? isRTL
              ? 'تمت الإضافة للمقارنة'
              : 'Comparing'
            : t('compare')}
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-10 gap-1.5"
          onClick={() => void handleShare()}
        >
          {shareWebSuccess ? (
            <Check className="size-4 text-amber-600" aria-hidden="true" />
          ) : (
            <Share2 className="size-4" aria-hidden="true" />
          )}
          {shareWebSuccess
            ? isRTL
              ? 'تمت المشاركة'
              : 'Shared'
            : t('shareProduct')}
        </Button>
      </div>
    </>
  );
}
