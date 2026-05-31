'use client';

import React from 'react';
import Link from 'next/link';
import {
  Star,
  Heart,
  GitCompare,
  Truck,
  Shield,
  Clock,
  Minus,
  Plus,
  Share2,
  BadgeCheck,
  MessageCircle,
  Sparkles,
  Store,
  Check,
  MapPin,
  Package,
  Zap,
  ShoppingCart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { COLOR_MAP } from '@/lib/theme';
import { formatPrice } from '@/lib/currency';
import { APP_NAME, DEFAULT_SELLER_PHONE, SOCIAL_SHARE } from '@/lib/config';

import { type Product } from '@/components/buyer/product-card';
import { VariationSelector } from '@/components/buyer/variation-selector';
import { TieredPricing } from '@/components/buyer/tiered-pricing';
import { ReportListingDialog } from '@/components/common/report-listing-dialog';
import { ContactSellerButtons } from '@/components/common/contact-seller-buttons';
import { ListingExpirationBadge } from '@/components/common/listing-expiration-badge';

interface TierPrice {
  minQty: number;
  price: number;
}

interface ProductInfoSectionProps {
  product: Product;
  quantity: number;
  setQuantity: (q: number) => void;
  selectedVariations: Record<string, string>;
  setSelectedVariations: (v: Record<string, string>) => void;
  images: string[];
  variations: Record<string, string[]>;
  tieredPricing: TierPrice[];
  discount: number;
  displayName: string;
  displayDescription: string;
  isComparing: boolean;
  toggleCompare: (id: string) => void;
  effectivePrice: number;
  stockStatus: 'outOfStock' | 'lowStock' | 'inStock';
  isWishlisted: boolean;
  setIsWishlisted: (v: boolean) => void;
  shareOpen: boolean;
  setShareOpen: (v: boolean) => void;
  copied: boolean;
  setCopied: (v: boolean) => void;
  shareWebSuccess: boolean;
  setShareWebSuccess: (v: boolean) => void;
  handleAddToCart: () => void;
  handleBuyNow: () => void;
  locale: string;
  isRTL: boolean;
  t: (key: string, params?: Record<string, unknown>) => string;
}

function getColorHex(colorName: string): string | undefined {
  return COLOR_MAP[colorName.toLowerCase()] || undefined;
}

export function ProductInfoSection(props: ProductInfoSectionProps) {
  const {
    product, quantity, setQuantity, selectedVariations, setSelectedVariations,
    images, variations, tieredPricing, discount, displayName,
    isComparing, toggleCompare, effectivePrice, stockStatus,
    isWishlisted, setIsWishlisted,
    shareOpen, setShareOpen, copied, setCopied, shareWebSuccess, setShareWebSuccess,
    handleAddToCart, handleBuyNow,
    locale, isRTL, t,
  } = props;

  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const text = product ? `${product.name} - ${APP_NAME}` : `${APP_NAME} Product`;

    switch (platform) {
      case 'whatsapp':
        window.open(SOCIAL_SHARE.whatsapp(text + ' ' + url));
        break;
      case 'telegram':
        window.open(SOCIAL_SHARE.telegram(url, text));
        break;
      case 'facebook':
        window.open(SOCIAL_SHARE.facebook(url));
        break;
      case 'copy':
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
    setShareOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Title & Badges */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {product.isNew && (
            <Badge className="bg-emerald-500 text-white text-xs">{t('new')}</Badge>
          )}
          {product.isSale && (
            <Badge className="bg-red-500 text-white text-xs sale-badge-shimmer relative overflow-hidden">
              <Sparkles className="size-3 me-0.5" />
              {t('sale')}
            </Badge>
          )}
          {product.isFeatured && (
            <Badge className="bg-amber-500 text-white text-xs">{t('featured')}</Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold leading-tight">{displayName}</h1>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-full"
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({
                    title: displayName,
                    text: `${product.name} - ${APP_NAME}`,
                    url: window.location.href,
                  });
                } catch {
                  await navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              } else {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
          >
            {copied ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
          </Button>
          {copied && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
              {t('productLinkCopied')}
            </span>
          )}
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              className={`size-4 ${
                i < Math.floor(product.rating)
                  ? 'fill-amber-400 text-amber-400'
                  : i < product.rating
                  ? 'fill-amber-400/50 text-amber-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          ))}
          <span className="text-sm font-medium ms-1">{(product.rating ?? 0).toFixed(1)}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          ({product.reviewCount} {t('reviews')})
        </span>
        <span className="text-sm text-muted-foreground">
          {product.soldCount.toLocaleString()} {t('sold')}
        </span>
        <ListingExpirationBadge createdAt={product.createdAt || new Date().toISOString()} expiresAt={(product as unknown as Record<string, unknown>).expiresAt as string | undefined} />
      </div>

      {/* Price */}
      <div className="space-y-2 py-2">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-4xl md:text-5xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatPrice(effectivePrice)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <>
              <span className="text-xl text-muted-foreground line-through decoration-red-400/60">
                {formatPrice(product.originalPrice)}
              </span>
              <Badge className="bg-red-500 text-white text-sm font-bold animate-discount-soft-pulse">
                -{discount}% {t('off')}
              </Badge>
            </>
          )}
        </div>
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg w-fit">
            <Sparkles className="size-3.5" />
            {t('youSaveAmount', { amount: formatPrice(product.originalPrice - product.price) })}
          </div>
        )}
        {effectivePrice < product.price && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            {t('bulkPriceApplied', { quantity })}
          </p>
        )}
      </div>

      {/* Tiered Pricing */}
      {tieredPricing.length > 0 && (
        <TieredPricing
          tiers={tieredPricing.map((tier) => {
            const tierDiscount = Math.round(((product.price - tier.price) / product.price) * 100);
            return {
              minQty: tier.minQty,
              price: tier.price,
              discount: tierDiscount > 0 ? tierDiscount : undefined,
            };
          })}
          currentQty={quantity}
          basePrice={product.price}
        />
      )}

      {/* Variations */}
      {Object.entries(variations).filter(([, values]) => values.length > 0).length > 0 && (
        <VariationSelector
          variations={Object.entries(variations)
            .filter(([, values]) => values.length > 0)
            .map(([key, values]) => ({
              type: key,
              typeAr: t(key + 'Variation') || key,
              options: values.map((val) => ({
                label: val,
                value: val,
                colorHex: key.toLowerCase().includes('color') ? getColorHex(val) : undefined,
                inStock: true,
              })),
              selected: selectedVariations[key],
            }))
          }
          onVariationChange={(type, value) =>
            setSelectedVariations((prev) => ({ ...prev, [type]: value }))
          }
          basePrice={product.price}
        />
      )}

      {/* Quantity */}
      <div>
        <h4 className="text-sm font-semibold mb-2">{t('quantity')}</h4>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-border rounded-lg">
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-none"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="size-3" />
            </Button>
            <span className="w-12 text-center font-medium text-sm">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-9 rounded-none"
              onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
              disabled={quantity >= (product.stock || 99)}
            >
              <Plus className="size-3" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            {product.stock > 0 ? `${product.stock} ${t('available')}` : t('outOfStock')}
          </span>
        </div>
      </div>

      {/* Stock Status */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {stockStatus === 'inStock' && (
            <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 gap-1">
              <BadgeCheck className="size-3" />
              {t('inStock')}
            </Badge>
          )}
          {stockStatus === 'lowStock' && (
            <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 gap-1">
              <Clock className="size-3" />
              {t('lowStockOnlyLeft', { count: product.stock })}
            </Badge>
          )}
          {stockStatus === 'outOfStock' && (
            <Badge variant="secondary" className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 gap-1">
              {t('outOfStock')}
            </Badge>
          )}
        </div>
        {product.stock > 0 && product.stock <= 50 && (
          <div className="space-y-1">
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full animate-stock-fill ${
                  product.stock <= 5 ? 'bg-red-500' : product.stock <= 15 ? 'bg-amber-500' : 'stock-bar-gradient'
                }`}
                style={{ width: `${Math.min(100, (product.stock / 50) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              {product.stock <= 5
                ? t('sellingFast')
                : product.stock <= 15
                ? t('limitedStock')
                : t('currentlyInStock')}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="relative p-[2px] rounded-xl action-buttons-gradient-border">
        <div className="flex flex-col sm:flex-row gap-3 rounded-xl bg-background p-1">
          <RippleButton
            size="lg"
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-base h-12 rounded-lg"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="size-5 me-2" />
            {t('addToCart')}
          </RippleButton>
          <RippleButton
            size="lg"
            variant="outline"
            className="flex-1 border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-base h-12 rounded-lg"
            onClick={handleBuyNow}
            disabled={product.stock === 0}
          >
            <Zap className="size-5 me-2" />
            {t('buyNow')}
          </RippleButton>
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 ${isWishlisted ? 'text-red-500 border-red-300' : ''}`}
          onClick={() => setIsWishlisted(!isWishlisted)}
        >
          <Heart className={`size-4 ${isWishlisted ? 'fill-red-500' : ''}`} />
          {isWishlisted ? t('wishlisted') : t('wishlist')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 ${isComparing ? 'text-emerald-600 border-emerald-300' : ''}`}
          onClick={() => toggleCompare(product.id)}
        >
          <GitCompare className="size-4" />
          {t('compare')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={async () => {
            if (navigator.share) {
              try {
                await navigator.share({
                  title: displayName,
                  text: `${product.name} - ${APP_NAME}`,
                  url: window.location.href,
                });
                setShareWebSuccess(true);
                setTimeout(() => setShareWebSuccess(false), 2000);
              } catch {
                setShareOpen(true);
              }
            } else {
              setShareOpen(true);
            }
          }}
        >
          {shareWebSuccess ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
          {shareWebSuccess ? t('copied') : t('shareProduct')}
        </Button>
        <ReportListingDialog listingTitle={displayName} />
      </div>

      {/* Estimated Delivery Date */}
      {product.stock > 0 && (
        <div className="flex items-center gap-2 p-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200 dark:border-teal-800">
          <Truck className="size-5 text-teal-600 dark:text-teal-400" />
          <div>
            <span className="text-sm font-medium text-teal-700 dark:text-teal-300">
              {(() => {
                const now = new Date();
                const hoursLeft = 23 - now.getHours();
                const deliveryDate = new Date(now);
                deliveryDate.setDate(deliveryDate.getDate() + (product.hasFreeShipping ? 3 : 5));
                const dateStr = deliveryDate.toLocaleDateString(isRTL ? 'ar-IQ' : 'en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });
                return t('orderWithinHours', { hours: hoursLeft, date: dateStr });
              })()}
            </span>
            {product.hasFreeShipping && (
              <p className="text-xs text-teal-600/70 dark:text-teal-400/70">{t('freeShipping')}</p>
            )}
          </div>
        </div>
      )}

      {/* Shipping Info */}
      {product.hasFreeShipping && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <Truck className="size-5 text-emerald-600" />
          <div>
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              {t('freeShipping')}
            </span>
            <p className="text-xs text-muted-foreground">{t('fastDeliveryDesc')}</p>
          </div>
        </div>
      )}

      {/* Escrow Note */}
      <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/50 rounded-lg border border-amber-200 dark:border-amber-800">
        <Shield className="size-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-300">{t('escrowNote')}</p>
      </div>

      {/* Seller Info Card */}
      {product.store && (
        <Link
          href={`/store/${product.storeId}`}
          className="block p-4 rounded-xl border border-border hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 cursor-pointer card-hover-glow seller-card-gradient relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/80 via-transparent to-teal-50/50 dark:from-emerald-950/30 dark:via-transparent dark:to-teal-950/20 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-white dark:ring-gray-800">
                {product.store.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold truncate">{product.store.name}</span>
                  {product.store.isVerified && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full verified-check-anim">
                      <BadgeCheck className="size-3" />
                      {t('verified')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <div className="flex items-center">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-muted-foreground ms-0.5">
                      {(product.store?.rating ?? 0).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-medium">
                    <Clock className="size-2.5" />
                    {t('responseTime')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                <Store className="size-3.5" />
                {t('visitStore')}
              </span>
              <Button variant="ghost" size="sm" className="text-emerald-600 gap-1 shrink-0 h-8" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <MessageCircle className="size-3.5" />
                {t('chatWithSeller')}
              </Button>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="size-2.5" />{product.store?.location || t('defaultLocation')}</span>
              <span className="flex items-center gap-1"><Package className="size-2.5" />{t('onTimeDelivery')}</span>
              <span className="flex items-center gap-1"><Shield className="size-2.5" />{t('protected')}</span>
            </div>
          </div>
        </Link>
      )}

      {/* Contact Seller Buttons */}
      <ContactSellerButtons
        phone={DEFAULT_SELLER_PHONE}
        storeName={product.store?.name}
        productId={product.id}
      />
    </div>
  );
}


