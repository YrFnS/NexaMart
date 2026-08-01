'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Clock,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportListingDialog } from '@/components/common/report-listing-dialog';
import { type Product } from '@/components/buyer/product-card';
import { canonicalizeVariation } from '@/lib/checkout-authority';
import { APP_NAME } from '@/lib/config';
import { useI18n } from '@/lib/i18n';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useCartStore } from '@/stores/cart-store';
import { useRecentlyViewedStore } from '@/stores/recently-viewed-store';
import { ProductActions } from './product-detail/product-actions';
import { ProductGallerySection } from './product-detail/product-gallery-section';
import { ProductInfoSection } from './product-detail/product-info-section';
import { ProductReviewsTab } from './product-detail/product-reviews-tab';
import { RelatedProducts } from './product-detail/related-products';

interface TierPrice {
  minQty: number;
  price: number;
}

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

function parseVariations(value: string): Record<string, string[]> {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([key, options]) => [
        key,
        Array.isArray(options)
          ? options.filter((option): option is string => typeof option === 'string')
          : [],
      ]),
    );
  } catch {
    return {};
  }
}

function parseTieredPricing(value: string): TierPrice[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (tier): tier is TierPrice =>
        Boolean(tier) &&
        typeof tier === 'object' &&
        Number.isInteger((tier as TierPrice).minQty) &&
        Number.isFinite((tier as TierPrice).price),
    );
  } catch {
    return [];
  }
}

export function ProductDetailPage({ productId }: { productId?: string }) {
  const { t: translate, locale } = useI18n();
  const t = translate as (
    key: string,
    params?: Record<string, unknown>,
  ) => string;
  const isRTL = locale === 'ar';
  const nav = useAppNavigation();
  const addItem = useCartStore((state) => state.addItem);
  const addRecentlyViewed = useRecentlyViewedStore(
    (state) => state.addProduct,
  );

  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<
    Product[]
  >([]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [loadError, setLoadError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedVariations, setSelectedVariations] = useState<
    Record<string, string>
  >({});
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareWebSuccess, setShareWebSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [variantError, setVariantError] = useState('');
  const similarScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentProductId = productId;
    if (!currentProductId) return;

    const controller = new AbortController();

    async function loadProduct() {
      setLoading(true);
      setLoadError('');
      setProduct(null);
      setSimilarProducts([]);
      setRelatedProducts([]);
      setQuantity(1);
      setVariantError('');

      try {
        const response = await fetch(
          `/api/products/${encodeURIComponent(currentProductId)}`,
          { signal: controller.signal },
        );
        const payload = (await response.json().catch(() => ({}))) as {
          product?: Product;
          similarProducts?: Product[];
          relatedProducts?: Product[];
          error?: string;
        };
        if (!response.ok || !payload.product) {
          throw new Error(payload.error || 'Product not found.');
        }

        const found = payload.product;
        setProduct(found);
        setSimilarProducts((payload.similarProducts || []).slice(0, 8));
        setRelatedProducts((payload.relatedProducts || []).slice(0, 8));
        addRecentlyViewed(found.id);

        const activeVariants =
          found.variantSkus?.filter((variant) => variant.isActive) || [];
        const initialVariant =
          activeVariants.find((variant) => variant.stock > 0) ||
          activeVariants[0];
        if (initialVariant) {
          try {
            const attributes = JSON.parse(initialVariant.attributes) as unknown;
            setSelectedVariations(
              attributes &&
                typeof attributes === 'object' &&
                !Array.isArray(attributes)
                ? Object.fromEntries(
                    Object.entries(attributes).map(([key, value]) => [
                      key,
                      String(value),
                    ]),
                  )
                : {},
            );
          } catch {
            setSelectedVariations({});
          }
        } else {
          const defaults: Record<string, string> = {};
          for (const [key, values] of Object.entries(
            parseVariations(found.variations || '{}'),
          )) {
            if (values[0]) defaults[key] = values[0];
          }
          setSelectedVariations(defaults);
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        setLoadError(
          error instanceof Error ? error.message : 'Failed to load product.',
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    const timer = window.setTimeout(() => void loadProduct(), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [addRecentlyViewed, productId]);

  useEffect(() => {
    const ids = useRecentlyViewedStore
      .getState()
      .productIds.filter((id) => id !== productId)
      .slice(0, 6);
    if (ids.length === 0) {
      const timer = window.setTimeout(() => setRecentlyViewedProducts([]), 0);
      return () => window.clearTimeout(timer);
    }

    const controller = new AbortController();
    const query = new URLSearchParams({
      ids: ids.join(','),
      limit: String(ids.length),
    });

    fetch(`/api/products?${query.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Failed to load recent products.');
        return response.json() as Promise<{ products?: Product[] }>;
      })
      .then((payload) => {
        const byId = new Map(
          (payload.products || []).map((item) => [item.id, item]),
        );
        setRecentlyViewedProducts(
          ids
            .map((id) => byId.get(id))
            .filter((item): item is Product => Boolean(item)),
        );
      })
      .catch((error) => {
        if (!(error instanceof Error && error.name === 'AbortError')) {
          setRecentlyViewedProducts([]);
        }
      });

    return () => controller.abort();
  }, [productId]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [productId]);

  const activeVariantSkus = useMemo(
    () => product?.variantSkus?.filter((variant) => variant.isActive) || [],
    [product],
  );
  const selectedVariant = useMemo(() => {
    if (activeVariantSkus.length === 0) return null;
    const optionKey = canonicalizeVariation(selectedVariations);
    return (
      activeVariantSkus.find((variant) => variant.optionKey === optionKey) ||
      null
    );
  }, [activeVariantSkus, selectedVariations]);

  function handleAddToCart(): boolean {
    if (!product) return false;
    if (activeVariantSkus.length > 0 && !selectedVariant) {
      setVariantError(
        isRTL
          ? 'تركيبة الخيارات المحددة غير متوفرة. اختر تركيبة أخرى.'
          : 'This option combination is unavailable. Choose another combination.',
      );
      return false;
    }

    const availableStock = selectedVariant?.stock ?? product.stock;
    if (availableStock <= 0 || availableStock < quantity) {
      setVariantError(
        isRTL
          ? 'الكمية المطلوبة غير متوفرة.'
          : 'The requested quantity is unavailable.',
      );
      return false;
    }

    const images = parseStringArray(product.images);
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      price: selectedVariant?.price ?? product.price,
      originalPrice:
        selectedVariant?.originalPrice ?? product.originalPrice ?? undefined,
      image: images[0] || '/placeholder-product.svg',
      quantity,
      storeId: product.storeId,
      storeName: product.store?.name || '',
      hasFreeShipping: product.hasFreeShipping,
      variation:
        Object.keys(selectedVariations).length > 0
          ? JSON.stringify(selectedVariations)
          : undefined,
    });
    setVariantError('');
    return true;
  }

  function handleBuyNow() {
    if (handleAddToCart()) nav.setView('checkout');
  }

  async function handleShare(platform: string) {
    const url = window.location.href;
    const text = product
      ? `${product.name} - ${APP_NAME}`
      : `${APP_NAME} Product`;

    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2_000);
      } catch {
        setVariantError(
          isRTL
            ? 'تعذر نسخ الرابط من هذا المتصفح.'
            : 'The link could not be copied in this browser.',
        );
      }
      setShareOpen(false);
      return;
    }

    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    };
    const target = shareUrls[platform];
    if (target) {
      window.open(target, '_blank', 'noopener,noreferrer');
    }
    setShareOpen(false);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8" aria-busy="true">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-6 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
            <div className="h-20 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="flex size-20 items-center justify-center rounded-full bg-muted">
            {loadError ? (
              <AlertCircle className="size-10 text-red-500" aria-hidden="true" />
            ) : (
              <Package className="size-10 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
          <h1 className="text-2xl font-bold">{t('productNotFound')}</h1>
          <p
            className="max-w-md text-muted-foreground"
            role={loadError ? 'alert' : undefined}
          >
            {loadError || t('productNotFoundDesc')}
          </p>
          <Button asChild className="bg-amber-600 text-white hover:bg-amber-700">
            <Link href="/shop">
              <ArrowLeft className="me-2 size-4" aria-hidden="true" />
              {t('backToShop')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const images = parseStringArray(product.images);
  const variations = parseVariations(product.variations || '{}');
  const tieredPricing = parseTieredPricing(product.tieredPricing || '[]');
  const displayProduct: Product = {
    ...product,
    price: selectedVariant?.price ?? product.price,
    originalPrice:
      selectedVariant?.originalPrice ?? product.originalPrice ?? undefined,
    stock: selectedVariant?.stock ?? product.stock,
    sku: selectedVariant?.sku ?? product.sku,
  };
  const displayName =
    isRTL && product.nameAr ? product.nameAr : product.name;
  const eligibleTier = !selectedVariant
    ? [...tieredPricing]
        .sort((left, right) => right.minQty - left.minQty)
        .find((tier) => quantity >= tier.minQty)
    : undefined;
  const effectivePrice =
    selectedVariant?.price ?? eligibleTier?.price ?? product.price;
  const discount =
    displayProduct.originalPrice &&
    displayProduct.originalPrice > effectivePrice
      ? Math.round(
          ((displayProduct.originalPrice - effectivePrice) /
            displayProduct.originalPrice) *
            100,
        )
      : 0;
  const stockStatus =
    displayProduct.stock === 0
      ? 'outOfStock'
      : displayProduct.stock <= 10
        ? 'lowStock'
        : 'inStock';
  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  return (
    <div className="container mx-auto px-4 py-6 pb-32 md:pb-6">
      <div className="mb-4">
        <Link
          href="/shop"
          className="flex w-fit items-center gap-1 rounded-md text-sm text-muted-foreground transition-colors hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:hover:text-amber-300"
        >
          <BackIcon className="size-4" aria-hidden="true" />
          {t('back')} / {t('shop')}
        </Link>
        {recentlyViewedProducts.length > 0 && (
          <nav
            className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1"
            aria-label={t('recentlyViewedTrail')}
          >
            <Clock
              className="size-3 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="shrink-0 text-[11px] font-medium text-muted-foreground">
              {t('recentlyViewedTrail')}:
            </span>
            {recentlyViewedProducts.slice(0, 5).map((recent, index) => (
              <React.Fragment key={recent.id}>
                {index > 0 && (
                  <ChevronRight
                    className="size-2.5 shrink-0 text-muted-foreground/40"
                    aria-hidden="true"
                  />
                )}
                <Link
                  href={`/product/${recent.id}`}
                  className="max-w-[120px] shrink-0 truncate text-[11px] text-muted-foreground hover:text-amber-700 dark:hover:text-amber-300"
                >
                  {isRTL && recent.nameAr ? recent.nameAr : recent.name}
                </Link>
              </React.Fragment>
            ))}
          </nav>
        )}
      </div>

      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
        <ProductGallerySection
          images={images}
          displayName={displayName}
          categoryName={product.category?.name || ''}
        />

        <div className="space-y-5">
          <ProductInfoSection
            product={displayProduct}
            quantity={quantity}
            setQuantity={setQuantity}
            selectedVariations={selectedVariations}
            setSelectedVariations={setSelectedVariations}
            variations={variations}
            tieredPricing={tieredPricing}
            discount={discount}
            displayName={displayName}
            effectivePrice={effectivePrice}
            stockStatus={stockStatus}
            isRTL={isRTL}
            t={t}
          />

          <ReportListingDialog listingTitle={displayName} />

          {variantError && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {variantError}
            </p>
          )}

          <ProductActions
            product={product}
            displayName={displayName}
            stock={displayProduct.stock}
            setShareOpen={setShareOpen}
            shareWebSuccess={shareWebSuccess}
            setShareWebSuccess={setShareWebSuccess}
            handleAddToCart={handleAddToCart}
            handleBuyNow={handleBuyNow}
            isRTL={isRTL}
          />
        </div>
      </div>

      <ProductReviewsTab
        product={product}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRTL={isRTL}
        t={t}
      />

      <RelatedProducts
        product={displayProduct}
        relatedProducts={relatedProducts}
        similarProducts={similarProducts}
        recentlyViewedProducts={recentlyViewedProducts}
        similarScrollRef={similarScrollRef}
        shareOpen={shareOpen}
        setShareOpen={setShareOpen}
        copied={copied}
        handleShare={handleShare}
        handleAddToCart={handleAddToCart}
        handleBuyNow={handleBuyNow}
        effectivePrice={effectivePrice}
        isRTL={isRTL}
        t={t}
      />
    </div>
  );
}
