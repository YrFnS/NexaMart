'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  Truck,
  RotateCcw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Package,
  Clock,
  PackageCheck,
  Shield,
  CreditCard,
  Store,
  ArrowRight,
  Zap,
  Share2,
  Copy,
  Check,
  Facebook,
  Twitter,
  Link2,
  HelpCircle,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatPrice } from '@/lib/currency';
import { SHIPPING_CONFIG } from '@/lib/config';

import { ProductCard, type Product } from '@/components/buyer/product-card';
import { RippleButton } from './ripple-button';

interface TierPrice {
  minQty: number;
  price: number;
}

interface RelatedProductsProps {
  product: Product;
  relatedProducts: Product[];
  similarProducts: Product[];
  recentlyViewedProducts: Product[];
  similarScrollRef: React.RefObject<HTMLDivElement | null>;
  shippingExpanded: boolean;
  setShippingExpanded: (v: boolean) => void;
  returnsExpanded: boolean;
  setReturnsExpanded: (v: boolean) => void;
  shareOpen: boolean;
  setShareOpen: (v: boolean) => void;
  copied: boolean;
  setCopied: (v: boolean) => void;
  handleShare: (platform: string) => void;
  handleAddToCart: () => void;
  handleBuyNow: () => void;
  effectivePrice: number;
  isRTL: boolean;
  locale: string;
  t: (key: string, params?: Record<string, unknown>) => string;
}

export function RelatedProducts(props: RelatedProductsProps) {
  const {
    product, relatedProducts, similarProducts, recentlyViewedProducts,
    similarScrollRef,
    shippingExpanded, setShippingExpanded,
    returnsExpanded, setReturnsExpanded,
    shareOpen, setShareOpen, copied, setCopied,
    handleShare, handleAddToCart, handleBuyNow,
    effectivePrice,
    isRTL,
    t,
  } = props;

  const displayName = isRTL && product.nameAr ? product.nameAr : product.name;
  const locale = isRTL ? 'ar' : 'en';

  return (
    <>
      {/* Frequently Bought Together */}
      {relatedProducts.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <ShoppingCart className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              {t('frequentlyBoughtTogether')}
            </h2>
            {product.store && (
              <Badge variant="secondary" className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Store className="size-2.5 me-0.5" />
                {t('fromSameStore')}
              </Badge>
            )}
          </div>
          <div className="p-4 bg-card rounded-xl border border-border">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                  <Package className="size-6 text-emerald-400" />
                </div>
                <div className="max-w-[120px]">
                  <p className="text-xs font-medium line-clamp-1">{displayName}</p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(product.price)}</p>
                </div>
              </div>
              <span className="text-lg font-bold text-muted-foreground">+</span>
              {relatedProducts.slice(0, 2).map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-3 rounded-lg border border-border">
                  <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                    <Package className="size-6 text-muted-foreground" />
                  </div>
                  <div className="max-w-[120px]">
                    <p className="text-xs font-medium line-clamp-1">{isRTL && p.nameAr ? p.nameAr : p.name}</p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(p.price)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground">{t('bundlePrice')}: </span>
                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatPrice(product.price + relatedProducts.slice(0, 2).reduce((sum, p) => sum + p.price, 0))}
                </span>
              </div>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <ShoppingCart className="size-3.5 me-1" />
                {t('addAllToCart')}
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* People also bought */}
      {relatedProducts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900">
              <ShoppingCart className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            {t('peopleAlsoBought')}
          </h2>
          <div className="overflow-x-auto scrollbar-thin pb-2">
            <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
              {relatedProducts.map((p) => (
                <div key={p.id} className="w-48 md:w-56 flex-shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Shipping & Returns - Expandable */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900">
            <Truck className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          {isRTL ? 'الشحن والإرجاع' : 'Shipping & Returns'}
        </h2>
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              onClick={() => setShippingExpanded(!shippingExpanded)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <Truck className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-start">
                  <h3 className="font-semibold text-sm">{isRTL ? 'خيارات الشحن' : 'Shipping Options'}</h3>
                  <p className="text-xs text-muted-foreground">{isRTL ? 'انقر للتفاصيل' : 'Click for details'}</p>
                </div>
              </div>
              <ChevronDown className={`size-4 text-muted-foreground expand-icon-rotate ${shippingExpanded ? 'open' : ''}`} />
            </button>
            {shippingExpanded && (
              <div className="px-4 pb-4 space-y-2 text-sm animate-expand">
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-2"><Package className="size-3.5" />{isRTL ? 'قياسي' : 'Standard'}</span>
                  <span className="font-medium">{isRTL ? '3-5 أيام' : '3-5 days'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border">
                  <span className="text-muted-foreground flex items-center gap-2"><Zap className="size-3.5" />{isRTL ? 'سريع' : 'Express'}</span>
                  <span className="font-medium">{isRTL ? '1-2 أيام' : '1-2 days'}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground flex items-center gap-2"><Truck className="size-3.5" />{isRTL ? 'مجاني فوق' : 'Free over'}</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatPrice(SHIPPING_CONFIG.freeShippingThreshold)}</span>
                </div>
              </div>
            )}
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              onClick={() => setReturnsExpanded(!returnsExpanded)}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <RotateCcw className="size-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-start">
                  <h3 className="font-semibold text-sm">{isRTL ? 'سياسة الإرجاع' : 'Return Policy'}</h3>
                  <p className="text-xs text-muted-foreground">{isRTL ? 'إرجاع مجاني 30 يوم' : '30-day free returns'}</p>
                </div>
              </div>
              <ChevronDown className={`size-4 text-muted-foreground expand-icon-rotate ${returnsExpanded ? 'open' : ''}`} />
            </button>
            {returnsExpanded && (
              <div className="px-4 pb-4 space-y-2 text-sm animate-expand">
                <div className="flex items-center gap-2 py-2 border-b border-border">
                  <PackageCheck className="size-4 text-emerald-500" />
                  <span>{isRTL ? 'إرجاع مجاني خلال 30 يوم' : 'Free returns within 30 days'}</span>
                </div>
                <div className="flex items-center gap-2 py-2 border-b border-border">
                  <Shield className="size-4 text-emerald-500" />
                  <span>{isRTL ? 'ضمان استرداد الأموال' : 'Money-back guarantee'}</span>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <CreditCard className="size-4 text-emerald-500" />
                  <span>{isRTL ? 'استرداد خلال 3-5 أيام عمل' : 'Refund in 3-5 business days'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Ask a Question Section */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900">
            <HelpCircle className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          {isRTL ? 'اطرح سؤالاً' : 'Ask a Question'}
        </h2>
        <div className="p-4 bg-card rounded-xl border border-border">
          <div className="flex gap-3">
            <Input
              placeholder={isRTL ? 'اكتب سؤالك هنا...' : 'Type your question here...'}
              className="flex-1 input-emerald"
            />
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0">
              {isRTL ? 'إرسال' : 'Submit'}
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {(isRTL
              ? ['هل هذا المنتج متوفر؟', 'ما وقت التوصيل؟', 'هل الشحن مجاني؟']
              : ['Is this in stock?', 'What is delivery time?', 'Is shipping free?']
            ).map((q) => (
              <button
                key={q}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Share this Product */}
      <section className="mb-10">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <Share2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          {isRTL ? 'شارك هذا المنتج' : 'Share this Product'}
        </h2>
        <div className="p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              className="gap-2 social-icon-hover hover:bg-green-50 dark:hover:bg-green-950 hover:border-green-300 dark:hover:border-green-700"
              onClick={() => handleShare('whatsapp')}
            >
              <MessageCircle className="size-4 text-green-600" />
              WhatsApp
            </Button>
            <Button
              variant="outline"
              className="gap-2 social-icon-hover hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700"
              onClick={() => handleShare('telegram')}
            >
              <Link2 className="size-4 text-blue-500" />
              Telegram
            </Button>
            <Button
              variant="outline"
              className="gap-2 social-icon-hover hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700"
              onClick={() => handleShare('facebook')}
            >
              <Facebook className="size-4 text-blue-600" />
              Facebook
            </Button>
            <Button
              variant="outline"
              className="gap-2 social-icon-hover hover:bg-sky-50 dark:hover:bg-sky-950 hover:border-sky-300 dark:hover:border-sky-700"
              onClick={() => handleShare('copy')}
            >
              {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4 text-sky-500" />}
              {copied ? (isRTL ? 'تم النسخ!' : 'Copied!') : (isRTL ? 'نسخ الرابط' : 'Copy Link')}
            </Button>
          </div>
        </div>
      </section>

      {/* You may also like */}
      {similarProducts.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <Heart className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              {isRTL ? 'قد يعجبك أيضاً' : 'You May Also Like'}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => similarScrollRef.current?.scrollBy({ left: -280, behavior: 'smooth' })}
              >
                {isRTL ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => similarScrollRef.current?.scrollBy({ left: 280, behavior: 'smooth' })}
              >
                {isRTL ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />}
              </Button>
            </div>
          </div>
          <div ref={similarScrollRef} className="overflow-x-auto scrollbar-thin pb-2 scroll-smooth">
            <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
              {similarProducts.map((p, i) => (
                <div key={p.id} className="w-44 md:w-52 flex-shrink-0 animate-card-appear" style={{ animationDelay: `${i * 0.08}s` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Products Carousel */}
      {relatedProducts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900">
              <ShoppingCart className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            {t('similarProducts')}
          </h2>
          <div className="overflow-x-auto scrollbar-thin pb-2 scroll-smooth">
            <div className="grid grid-flow-col auto-cols-[180px] md:auto-cols-[220px] gap-4">
              {relatedProducts.map((p) => (
                <div key={p.id} className="flex-shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recently Viewed */}
      {recentlyViewedProducts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900">
              <Clock className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            {t('recentlyViewed')}
          </h2>
          <div className="overflow-x-auto scrollbar-thin pb-2">
            <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
              {recentlyViewedProducts.map((p) => (
                <div key={p.id} className="w-48 md:w-56 flex-shrink-0">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Sticky Add to Cart Bar on Mobile */}
      {product.stock > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 flex items-center justify-between gap-3 z-50 safe-area-bottom">
          <div>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatPrice(effectivePrice)}
            </p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-xs text-red-400 line-through">
                {formatPrice(product.originalPrice)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <RippleButton
              size="lg"
              variant="outline"
              className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 h-11 px-4"
              onClick={handleBuyNow}
            >
              <Zap className="size-4 me-1" />
              {t('buyNow')}
            </RippleButton>
            <RippleButton
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-11 px-4"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="size-4 me-1" />
              {t('addToCart')}
            </RippleButton>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>{t('shareProduct')}</DialogTitle>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Button
              variant="outline"
              className="h-16 flex-col gap-1.5 hover:bg-green-50 dark:hover:bg-green-950 hover:border-green-300 dark:hover:border-green-700"
              onClick={() => handleShare('whatsapp')}
            >
              <span className="text-lg">💬</span>
              <span className="text-xs">WhatsApp</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex-col gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700"
              onClick={() => handleShare('telegram')}
            >
              <span className="text-lg">✈️</span>
              <span className="text-xs">Telegram</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex-col gap-1.5 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700"
              onClick={() => handleShare('facebook')}
            >
              <span className="text-lg">📘</span>
              <span className="text-xs">Facebook</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex-col gap-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:border-emerald-300 dark:hover:border-emerald-700"
              onClick={() => handleShare('copy')}
            >
              <Copy className="size-5" />
              <span className="text-xs">{copied ? 'Copied!' : 'Copy Link'}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
