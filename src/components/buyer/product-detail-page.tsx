'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  ChevronLeft,
  Clock,
  ArrowLeft,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { APP_NAME } from '@/lib/config';
import { ReportListingDialog } from '@/components/common/report-listing-dialog';

import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useCartStore } from '@/stores/cart-store';
import { useRecentlyViewedStore } from '@/stores/recently-viewed-store';
import { type Product } from '@/components/buyer/product-card';

import { ProductGallerySection } from './product-detail/product-gallery-section';
import { ProductInfoSection } from './product-detail/product-info-section';
import { ProductActions } from './product-detail/product-actions';
import { ProductReviewsTab } from './product-detail/product-reviews-tab';
import { RelatedProducts } from './product-detail/related-products';

interface TierPrice {
  minQty: number;
  price: number;
}

export function ProductDetailPage({ productId }: { productId?: string }) {
  const { t: _t, locale } = useI18n();
  const t = _t as (key: string, params?: Record<string, unknown>) => string;
  const { toggleCompare, compareIds } = useAppStore();
  const nav = useAppNavigation();
  const selectedProductId = productId;
  const addItem = useCartStore((s) => s.addItem);
  const addRecentlyViewed = useRecentlyViewedStore((s) => s.addProduct);
  const isRTL = locale === 'ar';

  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<Product[]>([]);
  const [fetchingId, setFetchingId] = useState<string | null>(null);
  const loading = fetchingId === selectedProductId;

  // Selections
  const [quantity, setQuantity] = useState(1);
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string>>({});
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareWebSuccess, setShareWebSuccess] = useState(false);
  const [shippingExpanded, setShippingExpanded] = useState(false);
  const [returnsExpanded, setReturnsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const similarScrollRef = useRef<HTMLDivElement>(null);

  // Fetch product data using the individual product API
  useEffect(() => {
    if (!selectedProductId) return;
    let cancelled = false;
    const doFetch = async () => {
      setFetchingId(selectedProductId);
      try {
        const res = await fetch(`/api/products/${encodeURIComponent(selectedProductId)}`);
        if (cancelled) return;
        if (!res.ok) {
          if (!cancelled) setFetchingId(null);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        const found: Product | null = data.product || null;
        if (found && !cancelled) {
          setProduct(found);
          addRecentlyViewed(found.id);

          // Parse variations and set defaults
          try {
            const vars = JSON.parse(found.variations || '{}');
            const defaults: Record<string, string> = {};
            Object.entries(vars).forEach(([key, values]) => {
              if (Array.isArray(values) && values.length > 0) {
                defaults[key] = String(values[0]);
              }
            });
            setSelectedVariations(defaults);
          } catch {
            setSelectedVariations({});
          }

          // Similar products from API response
          const similar: Product[] = data.similarProducts || [];
          setSimilarProducts(similar.slice(0, 8));

          // Related products from API response
          const related: Product[] = data.relatedProducts || [];
          setRelatedProducts(related.slice(0, 4));
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setFetchingId(null);
      }
    };
    doFetch();
    return () => { cancelled = true; };
  }, [selectedProductId, addRecentlyViewed]);

  // Fetch recently viewed products
  useEffect(() => {
    const rvIds = useRecentlyViewedStore.getState().productIds.filter(
      (id) => id !== selectedProductId
    );
    if (rvIds.length === 0) return;
    fetch(`/api/products?limit=100`)
      .then((res) => res.json())
      .then((data) => {
        const allProducts: Product[] = data.products || [];
        const rvProducts = rvIds
          .map((id) => allProducts.find((p: Product) => p.id === id))
          .filter(Boolean) as Product[];
        setRecentlyViewedProducts(rvProducts.slice(0, 6));
      })
      .catch(() => {});
  }, [selectedProductId]);

  // Scroll to top on product change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedProductId]);

  const handleAddToCart = () => {
    if (!product) return;
    const images: string[] = (() => {
      try {
        return JSON.parse(product.images);
      } catch {
        return [];
      }
    })();
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice ?? undefined,
      image: images[0] || '/placeholder-product.svg',
      quantity,
      storeId: product.storeId,
      storeName: product.store?.name || '',
      variation: JSON.stringify(selectedVariations),
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    nav.setView('checkout');
  };

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const text = product ? `${product.name} - ${APP_NAME}` : `${APP_NAME} Product`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`);
        break;
      case 'telegram':
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'copy':
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
    setShareOpen(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-muted rounded-xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-muted rounded w-1/2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-1/4 animate-pulse" />
            <div className="h-20 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Package className="size-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">{t('productNotFound')}</h2>
          <p className="text-muted-foreground max-w-md">
            {t('productNotFoundDesc')}
          </p>
          <Button asChild
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Link href="/shop">
              <ArrowLeft className="size-4 me-2" />
              {t('backToShop')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const images: string[] = (() => {
    try {
      return JSON.parse(product.images);
    } catch {
      return [];
    }
  })();

  const variations: Record<string, string[]> = (() => {
    try {
      return JSON.parse(product.variations || '{}');
    } catch {
      return {};
    }
  })();

  const tieredPricing: TierPrice[] = (() => {
    try {
      return JSON.parse(product.tieredPricing || '[]');
    } catch {
      return [];
    }
  })();

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const displayName = isRTL && product.nameAr ? product.nameAr : product.name;

  const isComparing = compareIds.includes(product.id);

  const effectivePrice = (() => {
    for (const tier of [...tieredPricing].sort((a, b) => a.minQty - b.minQty)) {
      if (quantity >= tier.minQty) return tier.price;
    }
    return product.price;
  })();

  const stockStatus = (() => {
    if (product.stock === 0) return 'outOfStock';
    if (product.stock <= 10) return 'lowStock';
    return 'inStock';
  })();

  const BackIcon = isRTL ? ChevronRight : ChevronLeft;

  return (
    <div className="container mx-auto px-4 py-6 pb-32 md:pb-6">
      {/* Breadcrumb / Back + Recently Viewed Trail */}
      <div className="mb-4">
        <Link
          href="/shop"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
        >
          <BackIcon className="size-4" />
          {t('back')} / {t('shop')}
        </Link>
        {recentlyViewedProducts.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-thin pb-1">
            <Clock className="size-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground shrink-0 font-medium">{t('recentlyViewedTrail')}:</span>
            {recentlyViewedProducts.slice(0, 5).map((rv, i) => (
              <React.Fragment key={rv.id}>
                {i > 0 && <ChevronRight className="size-2.5 text-muted-foreground/40 shrink-0" />}
                <Link
                  href={`/product/${rv.id}`}
                  className="text-[10px] text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors whitespace-nowrap max-w-[100px] truncate"
                >
                  {isRTL && rv.nameAr ? rv.nameAr : rv.name}
                </Link>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-10">
        {/* Image Gallery */}
        <ProductGallerySection
          images={images}
          displayName={displayName}
          categoryName={product.category?.name || 'electronics'}
        />

        {/* Product Info */}
        <div className="space-y-5">
          <ProductInfoSection
            product={product}
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
            copied={copied}
            setCopied={setCopied}
            isRTL={isRTL}
            t={t}
          />

          <ReportListingDialog listingTitle={displayName} />

          <ProductActions
            t={t}
            productId={product.id}
            productName={product.name}
            displayName={displayName}
            stock={product.stock}
            isWishlisted={isWishlisted}
            setIsWishlisted={setIsWishlisted}
            shareOpen={shareOpen}
            setShareOpen={setShareOpen}
            copied={copied}
            setCopied={setCopied}
            shareWebSuccess={shareWebSuccess}
            setShareWebSuccess={setShareWebSuccess}
            handleAddToCart={handleAddToCart}
            handleBuyNow={handleBuyNow}
            isRTL={isRTL}
          />
        </div>
      </div>

      {/* Reviews Tab + AI Summary */}
      <ProductReviewsTab
        product={product}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isRTL={isRTL}
        t={t}
      />

      {/* Related Products, Shipping, Share Dialog, Sticky Bar */}
      <RelatedProducts
        product={product}
        relatedProducts={relatedProducts}
        similarProducts={similarProducts}
        recentlyViewedProducts={recentlyViewedProducts}
        similarScrollRef={similarScrollRef}
        shippingExpanded={shippingExpanded}
        setShippingExpanded={setShippingExpanded}
        returnsExpanded={returnsExpanded}
        setReturnsExpanded={setReturnsExpanded}
        shareOpen={shareOpen}
        setShareOpen={setShareOpen}
        copied={copied}
        setCopied={setCopied}
        handleShare={handleShare}
        handleAddToCart={handleAddToCart}
        handleBuyNow={handleBuyNow}
        effectivePrice={effectivePrice}
        isRTL={isRTL}
        locale={locale}
        t={t}
      />
    </div>
  );
}
