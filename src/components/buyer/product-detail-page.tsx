'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Copy,
  BadgeCheck,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  Zap,
  Package,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  Facebook,
  Twitter,
  Link2,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  MapPin,
  Phone,
  RotateCcw,
  PackageCheck,
  CreditCard,
  Check,
  Sparkles,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { COLOR_MAP } from '@/lib/theme';
import { formatPrice } from '@/lib/currency';
import { SOCIAL_SHARE, APP_NAME, SHIPPING_CONFIG, DEFAULT_SELLER_PHONE } from '@/lib/config';

import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useCartStore } from '@/stores/cart-store';
import { useRecentlyViewedStore } from '@/stores/recently-viewed-store';
import { ProductCard, type Product } from '@/components/buyer/product-card';
import { ProductGallery } from '@/components/buyer/product-gallery';
import { ReviewsSection } from '@/components/buyer/reviews-section';
import { VariationSelector, type VariationType } from '@/components/buyer/variation-selector';
import { TieredPricing } from '@/components/buyer/tiered-pricing';
import { ProductShareDialog } from '@/components/common/product-share-dialog';
import { ReportListingDialog } from '@/components/common/report-listing-dialog';
import { ContactSellerButtons } from '@/components/common/contact-seller-buttons';
import { ListingComments } from '@/components/common/listing-comments';
import { ListingExpirationBadge } from '@/components/common/listing-expiration-badge';
import { AiReviewSummary } from '@/components/buyer/ai-review-summary';

interface TierPrice {
  minQty: number;
  price: number;
}

// --- Ripple Button Component ---
function RippleButton({ children, className, ...props }: React.ComponentProps<typeof Button>) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      width: 20px; height: 20px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.4);
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      left: ${x - 10}px;
      top: ${y - 10}px;
      pointer-events: none;
    `;

    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);

    props.onClick?.(e);
  };

  return (
    <Button ref={buttonRef} className={className} {...props} onClick={handleClick}>
      {children}
    </Button>
  );
}

export function ProductDetailPage({ productId }: { productId?: string }) {
  const { t, locale } = useI18n();
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
  const [showReviewFab, setShowReviewFab] = useState(false);
  const [shippingExpanded, setShippingExpanded] = useState(false);
  const [returnsExpanded, setReturnsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const similarScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  // Fetch recently viewed products (use the list API since we need multiple products by ID)
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

  // Show review FAB after scrolling past the main add-to-cart area
  useEffect(() => {
    const handleScroll = () => {
      setShowReviewFab(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
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

  const displayName = locale === 'ar' && product.nameAr ? product.nameAr : product.name;
  const displayDescription =
    locale === 'ar' && product.descriptionAr ? product.descriptionAr : product.description;

  const isComparing = compareIds.includes(product.id);

  // Get the effective price based on quantity and tiered pricing
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

  // Helper: map color names to hex codes for VariationSelector (uses shared COLOR_MAP)
  function getColorHex(colorName: string): string | undefined {
    return COLOR_MAP[colorName.toLowerCase()] || undefined;
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-32 md:pb-6">
      {/* Breadcrumb / Back + Recently Viewed Trail */}
      <div className="mb-4">
        <Link
          href="/shop"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
        >
          <BackIcon className="size-4" />
          {t('back')} / {t('shop')}
        </Link>
        {/* Recently Viewed breadcrumb trail */}
        {recentlyViewedProducts.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 overflow-x-auto scrollbar-thin pb-1">
            <Clock className="size-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] text-muted-foreground shrink-0 font-medium">{t('recentlyViewedTrail')}:</span>
            {recentlyViewedProducts.slice(0, 5).map((rv, i) => (
              <React.Fragment key={rv.id}>
                {i > 0 && <ChevronRight className="size-2.5 text-muted-foreground/40 shrink-0" />}
                <Link
                  href={`/product/${rv.id}`}
                  className="text-[10px] text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap max-w-[100px] truncate"
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
        {/* Image Gallery with zoom lens */}
        <div className="zoom-lens-container rounded-xl shadow-lg shadow-emerald-500/5 border border-border/50">
          <ProductGallery images={images} productName={displayName} category={product.category?.name || 'electronics'} />
        </div>

        {/* Product Info */}
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
            {/* You Save Callout */}
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

          {/* Tiered Pricing - Using TieredPricing component */}
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

          {/* Variations - Using VariationSelector */}
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
            {/* Animated Stock Progress Bar */}
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

          {/* Action Buttons - with animated gradient border */}
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

          {/* Seller Info Card - Enhanced with gradient background, verification, response time */}
          {product.store && (
            <Link
              href={`/store/${product.storeId}`}
              className="block p-4 rounded-xl border border-border hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 cursor-pointer card-hover-glow seller-card-gradient relative overflow-hidden"
            >
              {/* Subtle gradient background overlay */}
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
                {/* Action buttons row */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                  >
                    <Store className="size-3.5" />
                    {t('visitStore')}
                  </span>
                  <Button variant="ghost" size="sm" className="text-emerald-600 gap-1 shrink-0 h-8" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <MessageCircle className="size-3.5" />
                    {t('chatWithSeller')}
                  </Button>
                </div>
                {/* Store stats row */}
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
      </div>

      {/* AI Review Summary */}
      {product.reviewCount > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500">
              <Sparkles className="size-5 text-white" />
            </div>
            {t('aiReviewSummary')}
          </h2>
          <AiReviewSummary
            productId={product.id}
            productName={product.name}
            averageRating={product.rating}
            totalReviews={product.reviewCount}
          />
        </section>
      )}

      {/* Product Details Tabs with emerald accent and count badges */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-10">
        <TabsList className="w-full justify-start bg-muted/50 rounded-xl p-1 gap-0.5 tab-list-emerald">
          <TabsTrigger value="description" className="rounded-lg tab-trigger-emerald data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900 dark:data-[state=active]:text-emerald-300 data-[state=active]:shadow-sm">
            {t('description')}
          </TabsTrigger>
          <TabsTrigger value="specifications" className="rounded-lg tab-trigger-emerald data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900 dark:data-[state=active]:text-emerald-300 data-[state=active]:shadow-sm">
            {t('specifications')}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-lg tab-trigger-emerald data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900 dark:data-[state=active]:text-emerald-300 data-[state=active]:shadow-sm">
            {t('reviews')}
            <span className="ms-1 inline-flex items-center justify-center size-5 rounded-full bg-muted text-[10px] font-bold tab-count-badge">
              {product.reviewCount}
            </span>
          </TabsTrigger>
          <TabsTrigger value="questions" className="rounded-lg tab-trigger-emerald data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900 dark:data-[state=active]:text-emerald-300 data-[state=active]:shadow-sm">
            {t('questionsTab')}
            <span className="ms-1 inline-flex items-center justify-center size-5 rounded-full bg-muted text-[10px] font-bold tab-count-badge">
              {product.reviewCount > 0 ? Math.min(Math.round(product.reviewCount * 0.2), 10) : 0}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-4 tab-content-transition">
          <div className="bg-card rounded-xl border border-border p-6 overflow-hidden">
            {displayDescription ? (
              <div className="prose dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-line">
                {displayDescription}
              </div>
            ) : (
              <p className="text-muted-foreground">{t('noDescriptionAvailable')}</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="specifications" className="mt-4 tab-content-transition">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {Object.entries({
                SKU: product.sku || 'N/A',
                Category: product.category?.name || 'N/A',
                Stock: String(product.stock),
                Rating: `${product.rating}/5`,
                Sold: String(product.soldCount),
                'Free Shipping': product.hasFreeShipping ? 'Yes' : 'No',
                B2B: product.isB2b ? 'Available' : 'No',
              }).map(([key, val]) => (
                <div key={key} className="flex justify-between py-2.5 px-3 border-b border-border last:border-0 spec-row-alt">
                  <span className="text-sm text-muted-foreground">{key}</span>
                  <span className="text-sm font-medium">{val}</span>
                </div>
              ))}
              {/* Variations as specs */}
              {Object.entries(variations).map(([key, values]) => (
                <div key={key} className="flex justify-between py-2.5 px-3 border-b border-border last:border-0 spec-row-alt">
                  <span className="text-sm text-muted-foreground capitalize">{key}</span>
                  <span className="text-sm font-medium">{values.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4 tab-content-transition">
          <ReviewsSection
            productId={product.id}
            averageRating={product.rating}
            totalReviews={product.reviewCount}
          />
        </TabsContent>

        <TabsContent value="questions" className="mt-4 tab-content-transition">
          <div className="bg-card rounded-xl border border-border p-6">
            <ListingComments />
          </div>
        </TabsContent>
      </Tabs>

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
              {/* Current product + related in bundle view */}
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

      {/* Shipping & Returns - Expandable with icons */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900">
            <Truck className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          {isRTL ? 'الشحن والإرجاع' : 'Shipping & Returns'}
        </h2>
        <div className="space-y-3">
          {/* Shipping - Expandable */}
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
          {/* Returns - Expandable */}
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
          {/* Sample questions */}
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

      {/* Share this Product - Enhanced social sharing */}
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

      {/* You may also like - Horizontal scrollable section with arrows */}
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
              <Link href="/shop" className="text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5">
                {isRTL ? 'عرض الكل' : 'View All Similar'}
                {isRTL ? <ChevronLeft className="size-3.5" /> : <ArrowRight className="size-3.5" />}
              </Link>
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

      {/* Sticky Add to Cart Bar on Mobile - only show if product is in stock */}
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
    </div>
  );
}
