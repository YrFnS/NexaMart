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
import { APP_NAME } from '@/lib/config';
import { useI18n } from '@/lib/i18n';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useAppStore } from '@/stores/app-store';
import { useUserStore } from '@/stores/user-store';
import { useWishlistStore } from '@/stores/wishlist-store';
import { type Product } from '@/components/buyer/product-card';
import { RippleButton } from './ripple-button';

interface ProductActionsProps {
  product: Product;
  displayName: string;
  stock: number;
  setShareOpen: (value: boolean) => void;
  shareWebSuccess: boolean;
  setShareWebSuccess: (value: boolean) => void;
  handleAddToCart: () => void;
  handleBuyNow: () => void;
  isRTL: boolean;
}

export function ProductActions({
  product,
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
  const toggleCompare = useAppStore((state) => state.toggleCompare);
  const isComparing = useAppStore((state) =>
    state.compareIds.includes(product.id),
  );
  const user = useUserStore((state) => state.user);
  const isHydrated = useUserStore((state) => state.isHydrated);
  const hydrateWishlist = useWishlistStore((state) => state.hydrate);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const isWishlisted = useWishlistStore((state) =>
    Boolean(state.productIds[product.id]),
  );
  const wishlistPending = useWishlistStore((state) =>
    Boolean(state.pendingProductIds[product.id]),
  );

  useEffect(() => {
    if (!isHydrated) return;
    void hydrateWishlist(user?.id || null);
  }, [hydrateWishlist, isHydrated, user?.id]);

  async function handleWishlist() {
    if (!isHydrated || wishlistPending) return;
    if (!user) {
      toast.info(
        isRTL
          ? 'سجّل الدخول لحفظ المنتج في المفضلة.'
          : 'Sign in to save this product to your wishlist.',
      );
      nav.setView('auth');
      return;
    }

    const result = await toggleWishlist(user.id, {
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
    });

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

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: displayName,
          text: `${product.name} - ${APP_NAME}`,
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
      <div className="relative rounded-xl p-[2px] action-buttons-gradient-border">
        <div className="flex flex-col gap-3 rounded-xl bg-background p-1 sm:flex-row">
          <RippleButton
            size="lg"
            className="h-12 flex-1 rounded-lg bg-amber-600 text-base text-white hover:bg-amber-700"
            onClick={handleAddToCart}
            disabled={stock === 0}
          >
            <ShoppingCart className="me-2 size-5" aria-hidden="true" />
            {t('addToCart')}
          </RippleButton>
          <RippleButton
            size="lg"
            variant="outline"
            className="h-12 flex-1 rounded-lg border-amber-600 text-base text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950"
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
          onClick={() => toggleCompare(product.id)}
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
