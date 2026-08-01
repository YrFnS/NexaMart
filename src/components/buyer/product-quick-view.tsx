'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  BadgeCheck,
  Eye,
  Heart,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Star,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { type Product } from '@/components/buyer/product-card';
import { parseVariationOptions } from '@/lib/checkout-authority';
import { formatPrice } from '@/lib/currency';
import { useI18n } from '@/lib/i18n';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useCartStore } from '@/stores/cart-store';
import { useUserStore } from '@/stores/user-store';
import {
  type WishlistProduct,
  useWishlistStore,
} from '@/stores/wishlist-store';

interface ProductQuickViewProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

function parseImages(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (image): image is string =>
        typeof image === 'string' &&
        (image.startsWith('/') ||
          image.startsWith('https://') ||
          image.startsWith('http://')),
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

export function ProductQuickView({
  product,
  open,
  onClose,
}: ProductQuickViewProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const nav = useAppNavigation();
  const addItem = useCartStore((state) => state.addItem);
  const user = useUserStore((state) => state.user);
  const isHydrated = useUserStore((state) => state.isHydrated);
  const hydrateWishlist = useWishlistStore((state) => state.hydrate);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const productId = product?.id || '';
  const isWishlisted = useWishlistStore((state) =>
    Boolean(productId && state.productIds[productId]),
  );
  const wishlistPending = useWishlistStore((state) =>
    Boolean(productId && state.pendingProductIds[productId]),
  );
  const [quantity, setQuantity] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    void hydrateWishlist(user?.id || null);
  }, [hydrateWishlist, isHydrated, user?.id]);

  useEffect(() => {
    setQuantity(1);
    setImageFailed(false);
  }, [open, productId]);

  const images = useMemo(
    () => (product ? parseImages(product.images) : []),
    [product],
  );

  if (!product) return null;

  const displayName =
    isRTL && product.nameAr ? product.nameAr : product.name;
  const storeName =
    isRTL && product.store?.nameAr
      ? product.store.nameAr
      : product.store?.name;
  const variationOptions = parseVariationOptions(product.variations);
  const hasOptions =
    Boolean(product.variantSkus?.some((variant) => variant.isActive)) ||
    Object.keys(variationOptions).length > 0;
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0;
  const outOfStock = product.stock <= 0;
  const imageSource =
    !imageFailed && images[0] ? images[0] : '/placeholder-product.svg';

  function openProduct() {
    nav.selectProduct(product.id);
    onClose();
  }

  function handlePrimaryAction() {
    if (hasOptions) {
      openProduct();
      return;
    }
    if (outOfStock) return;

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice ?? undefined,
      image: imageSource,
      quantity,
      storeId: product.storeId,
      storeName: product.store?.name || '',
      hasFreeShipping: product.hasFreeShipping,
    });
    toast.success(
      isRTL ? 'تمت إضافة المنتج إلى السلة.' : 'Product added to your cart.',
    );
    onClose();
  }

  async function handleWishlist() {
    if (!isHydrated || wishlistPending) return;
    if (!user) {
      toast.info(
        isRTL
          ? 'سجّل الدخول لحفظ المنتج في المفضلة.'
          : 'Sign in to save this product to your wishlist.',
      );
      onClose();
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
    } else {
      const error = useWishlistStore.getState().error;
      if (error) toast.error(error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-2xl"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <div className="grid md:grid-cols-2">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <Image
              src={imageSource}
              alt={displayName}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              onError={() => setImageFailed(true)}
            />
            {imageSource === '/placeholder-product.svg' && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/70 dark:to-orange-950/70">
                <Eye className="mb-2 size-14 text-amber-300 dark:text-amber-700" />
                <p className="max-w-[80%] text-center text-sm text-muted-foreground">
                  {displayName}
                </p>
              </div>
            )}

            <div className="absolute start-3 top-3 flex flex-col gap-1">
              {product.isNew && (
                <Badge className="bg-amber-600 text-white hover:bg-amber-700">
                  {t('new')}
                </Badge>
              )}
              {discount > 0 && (
                <Badge className="bg-red-600 text-white hover:bg-red-700">
                  -{discount}% {t('off')}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 p-5">
            <DialogHeader className="space-y-1 text-start">
              <DialogTitle className="text-xl leading-tight">
                {displayName}
              </DialogTitle>
              <DialogDescription>
                {hasOptions
                  ? isRTL
                    ? 'اعرض الملخص ثم افتح صفحة المنتج لاختيار SKU متاح.'
                    : 'Review the summary, then open the product page to choose an available SKU.'
                  : isRTL
                    ? 'ملخص سريع للسعر والمخزون الحاليين.'
                    : 'A quick summary of the current price and inventory.'}
              </DialogDescription>
            </DialogHeader>

            {product.store && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>{storeName}</span>
                {product.store.isVerified && (
                  <BadgeCheck
                    className="size-4 text-amber-600"
                    aria-label={isRTL ? 'متجر موثق' : 'Verified store'}
                  />
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <div
                className="flex items-center"
                aria-label={`${product.rating.toFixed(1)} / 5`}
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    aria-hidden="true"
                    className={`size-4 ${
                      index < Math.floor(product.rating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating.toFixed(1)} · {product.reviewCount}{' '}
                {t('reviews')}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {product.hasFreeShipping && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <Truck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>
                  {isRTL
                    ? 'هذا المنتج مميز بشحن مجاني ضمن شحنة هذا البائع. يؤكد الإجمالي عند مراجعة الطلب.'
                    : 'This item is marked for free shipping within this seller shipment. The final total is confirmed at order review.'}
                </span>
              </div>
            )}

            {hasOptions && (
              <div className="space-y-3 rounded-xl border bg-muted/30 p-3">
                <p className="text-sm font-semibold">
                  {isRTL ? 'الخيارات المتاحة' : 'Available options'}
                </p>
                {Object.entries(variationOptions).map(([name, values]) => (
                  <div key={name}>
                    <p className="mb-1 text-xs font-medium capitalize">{name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {values.slice(0, 8).map((value) => (
                        <Badge key={value} variant="outline" className="text-xs">
                          {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  {isRTL
                    ? 'تُختار التركيبة الفعلية في صفحة المنتج حتى يستخدم الطلب السعر والمخزون الصحيحين.'
                    : 'Choose the exact combination on the product page so the order uses the correct price and stock.'}
                </p>
              </div>
            )}

            {!hasOptions && (
              <>
                <Separator />
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium">{t('quantity')}</span>
                  <div className="flex items-center rounded-lg border">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-10 rounded-none"
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                      disabled={quantity <= 1}
                      aria-label={isRTL ? 'تقليل الكمية' : 'Decrease quantity'}
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </Button>
                    <span className="w-10 text-center text-sm font-semibold" aria-live="polite">
                      {quantity}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-10 rounded-none"
                      onClick={() =>
                        setQuantity((current) =>
                          Math.min(product.stock, current + 1),
                        )
                      }
                      disabled={outOfStock || quantity >= product.stock}
                      aria-label={isRTL ? 'زيادة الكمية' : 'Increase quantity'}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                  <span className="text-xs text-muted-foreground" aria-live="polite">
                    {outOfStock
                      ? t('outOfStock')
                      : `${product.stock} ${t('inStock')}`}
                  </span>
                </div>
              </>
            )}

            <div className="mt-auto flex gap-2 pt-2">
              <Button
                type="button"
                className="h-11 flex-1 rounded-xl bg-amber-600 text-white hover:bg-amber-700"
                onClick={handlePrimaryAction}
                disabled={!hasOptions && outOfStock}
              >
                <ShoppingCart className="me-2 size-4" aria-hidden="true" />
                {hasOptions
                  ? isRTL
                    ? 'اختيار الخيارات'
                    : 'Choose options'
                  : t('addToCart')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-11 shrink-0 rounded-xl"
                onClick={() => void handleWishlist()}
                disabled={!isHydrated || wishlistPending}
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
                    className={`size-4 ${
                      isWishlisted ? 'fill-red-500 text-red-500' : ''
                    }`}
                    aria-hidden="true"
                  />
                )}
              </Button>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="w-full text-amber-700 hover:bg-amber-50 hover:text-amber-800 dark:text-amber-300 dark:hover:bg-amber-950"
              onClick={openProduct}
            >
              {t('fullDetails')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
