'use client';

import React, { useState } from 'react';
import {
  Star,
  ShoppingCart,
  Heart,
  Truck,
  BadgeCheck,
  Minus,
  Plus,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useCartStore } from '@/stores/cart-store';
import type { Product } from '@/components/buyer/product-card';

interface ProductQuickViewProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export function ProductQuickView({ product, open, onClose }: ProductQuickViewProps) {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const isRTL = locale === 'ar';

  if (!product) return null;

  const displayName = locale === 'ar' && product.nameAr ? product.nameAr : product.name;

  const images: string[] = (() => {
    try {
      return JSON.parse(product.images);
    } catch {
      return [];
    }
  })();

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice ?? undefined,
        image: images[0] || '/placeholder-product.svg',
        quantity: 1,
        storeId: product.storeId,
        storeName: product.store?.name || '',
      });
    }
    onClose();
  };

  const handleViewFullDetails = () => {
    nav.selectProduct(product.id);
    onClose();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`size-4 ${
          i < Math.floor(rating)
            ? 'fill-amber-400 text-amber-400'
            : i < rating
            ? 'fill-amber-400/50 text-amber-400'
            : 'text-muted-foreground/30'
        }`}
      />
    ));
  };

  // Parse variations
  const variations: Record<string, string[]> = (() => {
    try {
      return JSON.parse(product.variations || '{}');
    } catch {
      return {};
    }
  })();

  const variationKeys = Object.keys(variations).filter((k) => variations[k]?.length > 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="grid md:grid-cols-2 gap-0">
          {/* Product Image / Placeholder */}
          <div className="relative aspect-square bg-muted">
            {images[0] ? (
              <img
                src={images[0]}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
                <Eye className="size-16 text-emerald-300 dark:text-emerald-700 mb-2" />
                <p className="text-sm text-muted-foreground text-center px-6">{displayName}</p>
              </div>
            )}

            {/* Badges on image */}
            <div className="absolute top-3 start-3 flex flex-col gap-1">
              {product.isNew && (
                <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-2">
                  {t('new')}
                </Badge>
              )}
              {discount > 0 && (
                <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs px-2">
                  -{discount}% {t('off')}
                </Badge>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="p-5 flex flex-col gap-3">
            <DialogHeader className="p-0 space-y-0">
              <DialogTitle className="text-lg font-bold leading-tight">{displayName}</DialogTitle>
            </DialogHeader>

            {/* Store */}
            {product.store && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{product.store.name}</span>
                {product.store.isVerified && (
                  <BadgeCheck className="size-3.5 text-emerald-500" />
                )}
              </div>
            )}

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">{renderStars(product.rating)}</div>
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.reviewCount} {t('reviews')})
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Free shipping */}
            {product.hasFreeShipping && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <Truck className="size-3.5" />
                {t('freeShipping')}
              </div>
            )}

            <Separator />

            {/* Variations */}
            {variationKeys.length > 0 && (
              <div className="space-y-2">
                {variationKeys.slice(0, 2).map((key) => (
                  <div key={key}>
                    <p className="text-xs font-medium mb-1.5 capitalize">{key}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {variations[key].slice(0, 5).map((val, i) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs cursor-pointer hover:bg-emerald-50 hover:border-emerald-300 dark:hover:bg-emerald-950 dark:hover:border-emerald-700 transition-colors"
                        >
                          {val}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium">{t('quantity')}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="size-3" />
                </Button>
                <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-lg"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                >
                  <Plus className="size-3" />
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                {product.stock > 0 ? `${product.stock} ${t('inStock')}` : t('outOfStock')}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-auto pt-2">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-11"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="size-4 me-2" />
                {t('addToCart')}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-11 rounded-xl shrink-0"
                onClick={() => setIsWishlisted(!isWishlisted)}
              >
                <Heart className={`size-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>

            {/* View Full Details link */}
            <Button
              variant="ghost"
              className="w-full text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-sm"
              onClick={handleViewFullDetails}
            >
              {t('fullDetails')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
