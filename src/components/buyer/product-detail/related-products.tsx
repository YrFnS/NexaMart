'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Facebook,
  Heart,
  Link2,
  MessageCircle,
  PackageCheck,
  RotateCcw,
  Share2,
  ShoppingCart,
  Truck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductCard, type Product } from '@/components/buyer/product-card';
import { formatPrice } from '@/lib/currency';
import { RippleButton } from './ripple-button';

interface RelatedProductsProps {
  product: Product;
  relatedProducts: Product[];
  similarProducts: Product[];
  recentlyViewedProducts: Product[];
  similarScrollRef: React.RefObject<HTMLDivElement | null>;
  shareOpen: boolean;
  setShareOpen: (value: boolean) => void;
  copied: boolean;
  handleShare: (platform: string) => void;
  handleAddToCart: () => void;
  handleBuyNow: () => void;
  effectivePrice: number;
  isRTL: boolean;
  t: (key: string, params?: Record<string, unknown>) => string;
}

export function RelatedProducts({
  product,
  relatedProducts,
  similarProducts,
  recentlyViewedProducts,
  similarScrollRef,
  shareOpen,
  setShareOpen,
  copied,
  handleShare,
  handleAddToCart,
  handleBuyNow,
  effectivePrice,
  isRTL,
  t,
}: RelatedProductsProps) {
  const [showStickyPurchaseActions, setShowStickyPurchaseActions] =
    useState(false);
  const suggestions = useMemo(() => {
    const seen = new Set<string>([product.id]);
    return [...similarProducts, ...relatedProducts].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [product.id, relatedProducts, similarProducts]);

  useEffect(() => {
    const primaryActions = document.querySelector<HTMLElement>(
      '[data-product-primary-actions]',
    );
    if (!primaryActions || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyPurchaseActions(!entry?.isIntersecting);
      },
      {
        // Hide the fixed layer before the complete controls reach the space
        // occupied by the purchase bar and mobile navigation.
        rootMargin: '0px 0px 160px 0px',
        threshold: 0.01,
      },
    );
    observer.observe(primaryActions);
    return () => observer.disconnect();
  }, [product.id]);

  return (
    <>
      <section className="mb-10" aria-labelledby="fulfillment-details-title">
        <h2
          id="fulfillment-details-title"
          className="mb-4 flex items-center gap-2 text-xl font-bold"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
            <Truck
              className="size-4 text-amber-700 dark:text-amber-300"
              aria-hidden="true"
            />
          </span>
          {isRTL ? 'الشحن والإرجاع' : 'Shipping & returns'}
        </h2>

        <div className="space-y-3">
          <details className="group rounded-xl border bg-card">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-xl p-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2">
              <span className="flex items-center gap-3">
                <Truck
                  className="size-5 text-amber-600"
                  aria-hidden="true"
                />
                {isRTL ? 'كيف يُحسب الشحن؟' : 'How shipping is calculated'}
              </span>
              <ChevronRight
                className={`size-4 text-muted-foreground transition-transform group-open:rotate-90 ${
                  isRTL ? 'rotate-180 group-open:rotate-90' : ''
                }`}
                aria-hidden="true"
              />
            </summary>
            <div className="space-y-2 border-t px-4 py-4 text-sm text-muted-foreground">
              <p>
                {isRTL
                  ? 'يحسب الخادم الشحن بصورة مستقلة لكل بائع عند مراجعة الطلب، ولا يعتمد على تقدير محفوظ في المتصفح.'
                  : 'The server calculates shipping independently for each seller during order review; it does not trust a browser-side estimate.'}
              </p>
              <p>
                {product.hasFreeShipping
                  ? isRTL
                    ? 'هذا المنتج مميز بشحن مجاني ضمن شحنة هذا البائع. يبقى إجمالي الطلب النهائي معتمداً على بقية البائعين والعنوان.'
                    : 'This item is marked for free shipping within this seller shipment. The final order total still depends on the address and any other sellers.'
                  : isRTL
                    ? 'لا يعرض NexaMart موعداً مضموناً قبل أن يؤكد البائع الطلب ويسجل الناقل ورقم التتبع.'
                    : 'NexaMart does not promise a delivery date before the seller confirms the order and records the carrier and tracking number.'}
              </p>
            </div>
          </details>

          <details className="group rounded-xl border bg-card">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-xl p-4 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2">
              <span className="flex items-center gap-3">
                <RotateCcw
                  className="size-5 text-amber-600"
                  aria-hidden="true"
                />
                {isRTL ? 'كيف تعمل الإرجاعات؟' : 'How returns work'}
              </span>
              <ChevronRight
                className={`size-4 text-muted-foreground transition-transform group-open:rotate-90 ${
                  isRTL ? 'rotate-180 group-open:rotate-90' : ''
                }`}
                aria-hidden="true"
              />
            </summary>
            <div className="space-y-3 border-t px-4 py-4 text-sm text-muted-foreground">
              <p className="flex items-start gap-2">
                <PackageCheck
                  className="mt-0.5 size-4 shrink-0 text-amber-600"
                  aria-hidden="true"
                />
                <span>
                  {isRTL
                    ? 'بعد التسليم يمكن للمشتري طلب إرجاع لعنصر طلب وSKU محددين، ضمن الكمية المتبقية القابلة للإرجاع.'
                    : 'After delivery, the buyer may request a return for one exact order item and SKU, limited to the remaining returnable quantity.'}
                </span>
              </p>
              <p>
                {isRTL
                  ? 'يسجل البائع حالة المنتج المرتجع. الاستبدال يستخدم شحنة بديلة فعلية مع ناقل وتتبع، وأي استرداد مالي يتم خارج NexaMart.'
                  : 'The seller records the returned-item disposition. Exchanges use a persisted replacement shipment with carrier and tracking; any refund is completed outside NexaMart.'}
              </p>
            </div>
          </details>
        </div>
      </section>

      {suggestions.length > 0 && (
        <section className="mb-10" aria-labelledby="suggested-products-title">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              id="suggested-products-title"
              className="flex items-center gap-2 text-xl font-bold"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                <Heart
                  className="size-4 text-amber-700 dark:text-amber-300"
                  aria-hidden="true"
                />
              </span>
              {isRTL ? 'منتجات مقترحة' : 'Suggested products'}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 rounded-full"
                onClick={() =>
                  similarScrollRef.current?.scrollBy({
                    left: isRTL ? 280 : -280,
                    behavior: 'smooth',
                  })
                }
                aria-label={isRTL ? 'المنتجات السابقة' : 'Previous products'}
              >
                {isRTL ? (
                  <ChevronRight className="size-4" aria-hidden="true" />
                ) : (
                  <ChevronLeft className="size-4" aria-hidden="true" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 rounded-full"
                onClick={() =>
                  similarScrollRef.current?.scrollBy({
                    left: isRTL ? -280 : 280,
                    behavior: 'smooth',
                  })
                }
                aria-label={isRTL ? 'المنتجات التالية' : 'Next products'}
              >
                {isRTL ? (
                  <ChevronLeft className="size-4" aria-hidden="true" />
                ) : (
                  <ChevronRight className="size-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
          <div
            ref={similarScrollRef}
            className="overflow-x-auto scroll-smooth pb-2"
          >
            <div className="flex min-w-max gap-4">
              {suggestions.slice(0, 12).map((item) => (
                <div key={item.id} className="w-48 shrink-0 md:w-56">
                  <ProductCard product={item} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {recentlyViewedProducts.length > 0 && (
        <section className="mb-10" aria-labelledby="recent-products-title">
          <h2
            id="recent-products-title"
            className="mb-4 flex items-center gap-2 text-xl font-bold"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
              <ShoppingCart
                className="size-4 text-amber-700 dark:text-amber-300"
                aria-hidden="true"
              />
            </span>
            {t('recentlyViewed')}
          </h2>
          <div className="overflow-x-auto pb-2">
            <div className="flex min-w-max gap-4">
              {recentlyViewedProducts.map((item) => (
                <div key={item.id} className="w-48 shrink-0 md:w-56">
                  <ProductCard product={item} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {product.stock > 0 && showStickyPurchaseActions && (
        <div
          data-product-purchase-actions
          className="nexa-product-purchase-actions fixed inset-x-0 z-40 flex items-center justify-between gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur-sm md:hidden"
          style={{ bottom: 'var(--nexa-mobile-nav-total)' }}
          aria-label={
            isRTL ? 'إجراءات شراء المنتج' : 'Product purchase actions'
          }
        >
          <p className="text-lg font-bold text-amber-700 dark:text-amber-300">
            {formatPrice(effectivePrice)}
          </p>
          <div className="flex items-center gap-2">
            <RippleButton
              size="lg"
              variant="outline"
              className="h-11 border-amber-600 px-3 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950"
              onClick={handleBuyNow}
            >
              <Zap className="me-1 size-4" aria-hidden="true" />
              {t('buyNow')}
            </RippleButton>
            <RippleButton
              size="lg"
              className="h-11 bg-amber-600 px-3 text-white hover:bg-amber-700"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="me-1 size-4" aria-hidden="true" />
              {t('addToCart')}
            </RippleButton>
          </div>
        </div>
      )}

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('shareProduct')}</DialogTitle>
            <DialogDescription>
              {isRTL
                ? 'شارك رابط صفحة المنتج. لا تتم مشاركة بيانات حسابك أو طلباتك.'
                : 'Share the public product-page link. Your account and order data are not included.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-16 flex-col gap-1.5"
              onClick={() => handleShare('whatsapp')}
            >
              <MessageCircle
                className="size-5 text-green-600"
                aria-hidden="true"
              />
              <span className="text-xs">WhatsApp</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-16 flex-col gap-1.5"
              onClick={() => handleShare('telegram')}
            >
              <Link2 className="size-5 text-sky-600" aria-hidden="true" />
              <span className="text-xs">Telegram</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-16 flex-col gap-1.5"
              onClick={() => handleShare('facebook')}
            >
              <Facebook
                className="size-5 text-blue-600"
                aria-hidden="true"
              />
              <span className="text-xs">Facebook</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-16 flex-col gap-1.5"
              onClick={() => handleShare('copy')}
            >
              {copied ? (
                <Check
                  className="size-5 text-amber-600"
                  aria-hidden="true"
                />
              ) : (
                <Copy className="size-5" aria-hidden="true" />
              )}
              <span className="text-xs">
                {copied
                  ? isRTL
                    ? 'تم النسخ'
                    : 'Copied'
                  : isRTL
                    ? 'نسخ الرابط'
                    : 'Copy link'}
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
