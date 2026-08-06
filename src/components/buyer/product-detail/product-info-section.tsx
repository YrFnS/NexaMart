'use client';

import Link from 'next/link';
import {
  BadgeCheck,
  Clock3,
  MapPin,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  Star,
  Store,
  Truck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Product } from '@/components/buyer/product-card';
import { TieredPricing } from '@/components/buyer/tiered-pricing';
import { VariationSelector } from '@/components/buyer/variation-selector';
import { ListingExpirationBadge } from '@/components/common/listing-expiration-badge';
import { formatPrice } from '@/lib/currency';
import { COLOR_MAP } from '@/lib/theme';

interface TierPrice {
  minQty: number;
  price: number;
}

interface ProductInfoSectionProps {
  product: Product;
  quantity: number;
  setQuantity: (quantity: number) => void;
  selectedVariations: Record<string, string>;
  setSelectedVariations: (
    value:
      | Record<string, string>
      | ((current: Record<string, string>) => Record<string, string>),
  ) => void;
  variations: Record<string, string[]>;
  tieredPricing: TierPrice[];
  discount: number;
  displayName: string;
  effectivePrice: number;
  stockStatus: 'outOfStock' | 'lowStock' | 'inStock';
  isRTL: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function getColorHex(colorName: string): string | undefined {
  return COLOR_MAP[colorName.toLowerCase()] || undefined;
}

function parseAttributes(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([key, option]) => [key, String(option)]),
    );
  } catch {
    return {};
  }
}

function optionIsAvailable(
  product: Product,
  type: string,
  value: string,
  selected: Record<string, string>,
): boolean {
  const activeVariants =
    product.variantSkus?.filter(
      (variant) => variant.isActive && variant.stock > 0,
    ) || [];
  if (activeVariants.length === 0) return product.stock > 0;

  return activeVariants.some((variant) => {
    const attributes = parseAttributes(variant.attributes);
    if (attributes[type] !== value) return false;
    return Object.entries(selected).every(
      ([selectedType, selectedValue]) =>
        selectedType === type ||
        !selectedValue ||
        attributes[selectedType] === selectedValue,
    );
  });
}

export function ProductInfoSection({
  product,
  quantity,
  setQuantity,
  selectedVariations,
  setSelectedVariations,
  variations,
  tieredPricing,
  discount,
  displayName,
  effectivePrice,
  stockStatus,
  isRTL,
  t,
}: ProductInfoSectionProps) {
  const hasVariants = Boolean(
    product.variantSkus?.some((variant) => variant.isActive),
  );
  const storeName =
    isRTL && product.store?.nameAr
      ? product.store.nameAr
      : product.store?.name;
  const hasOriginalPrice = Boolean(
    product.originalPrice && product.originalPrice > effectivePrice,
  );
  const saveAmount = hasOriginalPrice
    ? Number(product.originalPrice) - effectivePrice
    : 0;

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {product.isNew && (
            <Badge className="bg-amber-600 text-white">{t('new')}</Badge>
          )}
          {product.isSale && (
            <Badge className="bg-red-600 text-white">
              <Sparkles className="me-1 size-3" aria-hidden="true" />
              {t('sale')}
            </Badge>
          )}
          {product.isFeatured && (
            <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              {t('featured')}
            </Badge>
          )}
        </div>
        <h1 className="text-2xl font-bold leading-tight md:text-3xl">
          {displayName}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          className="flex items-center gap-1"
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
          <span className="ms-1 text-sm font-medium">
            {product.rating.toFixed(1)}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {product.reviewCount} {t('reviews')}
        </span>
        <span className="text-sm text-muted-foreground">
          {product.soldCount.toLocaleString()} {t('sold')}
        </span>
        <ListingExpirationBadge
          createdAt={product.createdAt}
          expiresAt={product.expiresAt}
        />
      </div>

      <div className="space-y-2 py-1">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-4xl font-extrabold tracking-tight text-amber-700 dark:text-amber-300 md:text-5xl">
            {formatPrice(effectivePrice)}
          </span>
          {hasOriginalPrice && product.originalPrice && (
            <>
              <span className="text-xl text-muted-foreground line-through decoration-red-400/60">
                {formatPrice(product.originalPrice)}
              </span>
              <Badge className="bg-red-600 text-white">
                -{discount}% {t('off')}
              </Badge>
            </>
          )}
        </div>
        {saveAmount > 0 && (
          <div className="flex w-fit items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {t('youSaveAmount', { amount: formatPrice(saveAmount) })}
          </div>
        )}
        {!hasVariants && effectivePrice < product.price && (
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {t('bulkPriceApplied', { quantity })}
          </p>
        )}
      </div>

      {!hasVariants && tieredPricing.length > 0 && (
        <TieredPricing
          tiers={tieredPricing.map((tier) => {
            const tierDiscount = Math.round(
              ((product.price - tier.price) / product.price) * 100,
            );
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

      {Object.entries(variations).some(([, values]) => values.length > 0) && (
        <VariationSelector
          variations={Object.entries(variations)
            .filter(([, values]) => values.length > 0)
            .map(([key, values]) => ({
              type: key,
              typeAr: t(`${key}Variation`) || key,
              options: values.map((value) => ({
                label: value,
                value,
                colorHex: key.toLowerCase().includes('color')
                  ? getColorHex(value)
                  : undefined,
                inStock: optionIsAvailable(
                  product,
                  key,
                  value,
                  selectedVariations,
                ),
              })),
              selected: selectedVariations[key],
            }))}
          onVariationChange={(type, value) =>
            setSelectedVariations((current) => ({
              ...current,
              [type]: value,
            }))
          }
          basePrice={product.price}
        />
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold">{t('quantity')}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-lg border">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 rounded-none"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              aria-label={isRTL ? 'تقليل الكمية' : 'Decrease quantity'}
            >
              <Minus className="size-4" aria-hidden="true" />
            </Button>
            <span
              className="w-12 text-center text-sm font-semibold"
              aria-live="polite"
            >
              {quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 rounded-none"
              onClick={() =>
                setQuantity(Math.min(product.stock, quantity + 1))
              }
              disabled={product.stock <= 0 || quantity >= product.stock}
              aria-label={isRTL ? 'زيادة الكمية' : 'Increase quantity'}
            >
              <Plus className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {product.stock > 0
              ? `${product.stock} ${t('available')}`
              : t('outOfStock')}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {stockStatus === 'inStock' && (
          <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <BadgeCheck className="me-1 size-3" aria-hidden="true" />
            {t('inStock')}
          </Badge>
        )}
        {stockStatus === 'lowStock' && (
          <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <Clock3 className="me-1 size-3" aria-hidden="true" />
            {t('lowStockOnlyLeft', { count: product.stock })}
          </Badge>
        )}
        {stockStatus === 'outOfStock' && (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
            {t('outOfStock')}
          </Badge>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          <ShoppingBag className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p>
            {isRTL
              ? 'يسجل NexaMart الطلب فقط. يتم الدفع مباشرةً للبائع عند الاستلام.'
              : 'NexaMart records the order only. Payment is made directly to the seller on delivery.'}
          </p>
        </div>
        <div className="flex items-start gap-2 rounded-xl border p-3 text-sm">
          <Truck className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
          <p>
            {product.hasFreeShipping
              ? isRTL
                ? 'هذا المنتج مميز بشحن مجاني ضمن شحنة البائع. يؤكد الإجمالي النهائي عند مراجعة الطلب.'
                : 'This item is marked for free shipping within the seller shipment. The final total is confirmed at order review.'
              : isRTL
                ? 'يُحسب الشحن لكل بائع عند مراجعة الطلب، ويضيف البائع بيانات الناقل والتتبع بعد الشحن.'
                : 'Shipping is calculated per seller at order review. The seller records carrier and tracking details after dispatch.'}
          </p>
        </div>
      </div>

      {product.store && (
        <Link
          href={`/store/${product.storeId}`}
          className="group block rounded-xl border p-4 transition-colors hover:border-amber-400 hover:bg-amber-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:hover:border-amber-700 dark:hover:bg-amber-950/20"
          aria-label={
            isRTL
              ? `فتح متجر ${storeName || product.store.name}`
              : `Open ${storeName || product.store.name} store`
          }
        >
          <div className="flex items-start gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-lg font-bold text-white">
              {product.store.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="truncate font-semibold">{storeName}</span>
                {product.store.isVerified && (
                  <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    <BadgeCheck className="me-1 size-3" aria-hidden="true" />
                    {t('verified')}
                  </Badge>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                  {product.store.rating.toFixed(1)}
                </span>
                {typeof product.store.productCount === 'number' && (
                  <span className="flex items-center gap-1">
                    <Package className="size-3" aria-hidden="true" />
                    {product.store.productCount}{' '}
                    {isRTL ? 'منتج' : 'products'}
                  </span>
                )}
                {product.store.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3" aria-hidden="true" />
                    {product.store.location}
                  </span>
                )}
              </div>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 group-hover:text-amber-800 dark:text-amber-300">
                <Store className="size-4" aria-hidden="true" />
                {t('visitStore')}
              </span>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
