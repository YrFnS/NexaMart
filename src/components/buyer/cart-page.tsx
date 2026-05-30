'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Shield,
  Tag,
  ShoppingBag,
  X,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Heart,
  Truck,
  Clock,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { SHIPPING_CONFIG } from '@/lib/config';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useCartStore, type CartItem } from '@/stores/cart-store';
import { ProductCard, type Product } from '@/components/buyer/product-card';
import { getPlaceholderImage } from '@/lib/placeholder-image';

// --- Empty Cart Sad Face SVG Illustration ---
function EmptyCartIllustration() {
  return (
    <div className="animate-float-sad">
      <svg width="80" height="80" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Shopping bag body */}
        <rect x="28" y="48" width="72" height="60" rx="8" className="fill-emerald-100 dark:fill-emerald-900/50 stroke-emerald-300 dark:stroke-emerald-700" strokeWidth="2" />
        {/* Bag handle */}
        <path d="M44 48V36C44 27.2 51.2 20 60 20H68C76.8 20 84 27.2 84 36V48" className="stroke-emerald-400 dark:stroke-emerald-600" strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* Sad eyes */}
        <circle cx="52" cy="70" r="4" className="fill-emerald-400 dark:fill-emerald-500" />
        <circle cx="76" cy="70" r="4" className="fill-emerald-400 dark:fill-emerald-500" />
        {/* Sad mouth */}
        <path d="M50 88C54 84 62 82 64 82C66 82 74 84 78 88" className="stroke-emerald-400 dark:stroke-emerald-500" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Tear drop */}
        <ellipse cx="84" cy="76" rx="2.5" ry="3.5" className="fill-cyan-300 dark:fill-cyan-500" opacity="0.6" />
      </svg>
    </div>
  );
}

// --- Format variation string/object into readable key-value pairs ---
function formatVariation(variation: string | Record<string, string> | undefined): { key: string; value: string }[] {
  if (!variation) return [];
  if (typeof variation === 'object') {
    return Object.entries(variation).map(([key, value]) => ({ key, value }));
  }
  // Try to parse as JSON
  try {
    const parsed = JSON.parse(variation);
    if (typeof parsed === 'object' && parsed !== null) {
      return Object.entries(parsed).map(([key, value]) => ({ key: String(key), value: String(value) }));
    }
  } catch {
    // Not JSON, return as-is
  }
  // Plain string
  return [{ key: '', value: String(variation) }];
}

export function CartPage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const { items, removeItem, updateQuantity, clearCart, getTotal, getItemCount } = useCartStore();
  const isRTL = locale === 'ar';

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [promoAnimClass, setPromoAnimClass] = useState('');
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [savedItems, setSavedItems] = useState<string[]>([]);
  const [saveHeartAnim, setSaveHeartAnim] = useState<string | null>(null);

  // "You might also like" products
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/products?limit=4')
      .then((res) => res.json())
      .then((data) => setRecommendedProducts(data.products || []))
      .catch(() => {});
  }, []);

  // Group items by store
  const groupsByStore: Record<string, { storeName: string; items: CartItem[] }> = {};
  items.forEach((item) => {
    if (!groupsByStore[item.storeId]) {
      groupsByStore[item.storeId] = { storeName: item.storeName, items: [] };
    }
    groupsByStore[item.storeId].items.push(item);
  });
  const groupedByStore = Object.entries(groupsByStore);

  const subtotal = getTotal();
  const shippingCost = subtotal >= SHIPPING_CONFIG.freeShippingThreshold ? 0 : 9.99;
  const taxRate = 0.08;
  const tax = subtotal * taxRate;
  const discountAmount = promoApplied ? promoDiscount : 0;
  const total = subtotal + shippingCost + tax - discountAmount;

  const handleApplyPromo = () => {
    setPromoError('');
    setPromoAnimClass('');
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoError(t('b_pleaseEnterPromoCode'));
      setPromoAnimClass('animate-promo-error');
      return;
    }
    // Simulate promo validation
    if (code === 'NEXA10') {
      setPromoApplied(true);
      setPromoDiscount(subtotal * 0.1);
      setPromoError('');
      setPromoAnimClass('animate-promo-success');
    } else if (code === 'SAVE20') {
      setPromoApplied(true);
      setPromoDiscount(subtotal * 0.2);
      setPromoError('');
      setPromoAnimClass('animate-promo-success');
    } else {
      setPromoError(t('b_invalidPromoCode'));
      setPromoApplied(false);
      setPromoDiscount(0);
      setPromoAnimClass('animate-promo-error');
    }
    setTimeout(() => setPromoAnimClass(''), 600);
  };

  const handleRemovePromo = () => {
    setPromoApplied(false);
    setPromoDiscount(0);
    setPromoCode('');
    setPromoError('');
    setPromoAnimClass('');
  };

  const handleConfirmRemove = () => {
    if (removeTarget) {
      removeItem(removeTarget);
      setRemoveTarget(null);
    }
  };

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
    handleRemovePromo();
  };

  const handleSaveForLater = (productId: string) => {
    setSaveHeartAnim(productId);
    setTimeout(() => setSaveHeartAnim(null), 500);
    setSavedItems(prev => [...prev, productId]);
  };

  const getEstimatedDelivery = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString(getLocale(isRTL), { month: 'short', day: 'numeric' });
  };

  // Empty cart state with sad face illustration
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <EmptyCartIllustration />
          <h1 className="text-2xl md:text-3xl font-bold">{t('emptyCart')}</h1>
          <p className="text-muted-foreground">
            {isRTL
              ? 'استكشف منتجاتنا الرائعة وابدأ التسوق الآن!'
              : 'Explore our amazing products and start shopping now!'}
          </p>
          <Button
            asChild
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
          >
            <Link href="/shop">
              <ShoppingBag className="size-4 me-2" />
              {t('continueShopping')}
            </Link>
          </Button>

          <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto">
            {isRTL
              ? 'تصفح المتاجر المفضلة لديك أو ابحث عن منتجات جديدة'
              : 'Browse your favorite stores or discover new products'}
          </p>

          {/* You might also like section even on empty cart */}
          {recommendedProducts.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h2 className="text-lg font-bold mb-4">
                {t('youMightAlsoLike')}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {recommendedProducts.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900">
            <ShoppingCart className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('yourCart')}</h1>
            <p className="text-sm text-muted-foreground">
              {getItemCount()} {t('b_items')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-red-600"
            onClick={() => setShowClearConfirm(true)}
          >
            <Trash2 className="size-4 me-1" />
            {t('b_clearCart')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {groupedByStore.map(([storeId, group]) => (
            <Card key={storeId} className="overflow-hidden">
              <CardHeader className="pb-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <ShoppingBag className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <CardTitle className="text-sm font-semibold">{group.storeName}</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">
                    {group.items.length} {t('b_items')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {group.items.map((item, idx) => (
                  <React.Fragment key={item.productId}>
                    {idx > 0 && <Separator />}
                    <div className="flex gap-4 p-4 hover:bg-muted/20 transition-colors">
                      {/* Product Image */}
                      <div
                        className="relative w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer"
                        onClick={() => {
                          nav.selectProduct(item.productId);
                        }}
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                          sizes="96px"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            if (!img.dataset.retried) {
                              img.dataset.retried = 'true';
                              img.src = getPlaceholderImage('electronics', item.name, 96, 96);
                            }
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3
                              className="font-medium text-sm md:text-base line-clamp-2 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors"
                              onClick={() => {
                                nav.selectProduct(item.productId);
                              }}
                            >
                              {item.name}
                            </h3>
                            {item.variation && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                {formatVariation(item.variation).map(({ key, value }) => (
                                  <Badge
                                    key={key}
                                    className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0 border border-emerald-200 dark:border-emerald-800"
                                  >
                                    {key}: {value}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-red-500 flex-shrink-0"
                            onClick={() => setRemoveTarget(item.productId)}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>

                        <div className="flex items-end justify-between mt-2 gap-2 flex-wrap">
                          {/* Quantity Controls with ripple animation */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8 rounded-lg ripple"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="size-3" />
                            </Button>
                            <span className="w-10 text-center text-sm font-semibold tabular-nums transition-all duration-200">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="size-8 rounded-lg ripple"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            >
                              <Plus className="size-3" />
                            </Button>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Save for Later button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-muted-foreground hover:text-red-500 gap-1"
                              onClick={(e) => { e.stopPropagation(); handleSaveForLater(item.productId); }}
                            >
                              <Heart className={`size-3 ${savedItems.includes(item.productId) ? 'fill-red-500 text-red-500' : ''} ${saveHeartAnim === item.productId ? 'animate-save-heart' : ''}`} />
                              {t('save')}
                            </Button>

                            {/* Price */}
                            <div className="text-end">
                              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                                {formatPrice(item.price * item.quantity)}
                              </p>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <p className="text-xs text-red-400 line-through decoration-red-400/60">
                                  {formatPrice(item.originalPrice * item.quantity)}
                                </p>
                              )}
                              {item.quantity > 1 && (
                                <p className="text-[10px] text-muted-foreground">
                                  {formatPrice(item.price)} × {item.quantity}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Estimated delivery date */}
                        <div className="mt-2 flex items-center gap-1.5">
                          <div className="delivery-badge inline-flex items-center gap-1 px-2 py-1 rounded-md">
                            <Truck className="size-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-[10px] text-muted-foreground">
                              {t('b_estDelivery')}
                            </span>
                            <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                              {getEstimatedDelivery(item.quantity > 3 ? 7 : 4)}
                            </span>
                          </div>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[8px] px-1.5 py-0">
                              <Tag className="size-2 me-0.5" />
                              {t('b_deal')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </CardContent>
            </Card>
          ))}

          {/* Continue Shopping */}
          <Button
            variant="ghost"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
            onClick={() => nav.setView('shop')}
          >
            {isRTL ? <ArrowRight className="size-4 me-1" /> : <ArrowLeft className="size-4 me-1" />}
            {t('continueShopping')}
          </Button>

          {/* You might also like section */}
          {recommendedProducts.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" />
                {t('youMightAlsoLike')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {recommendedProducts.slice(0, 4).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar - Sticky on desktop */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Tag className="size-5 text-emerald-600 dark:text-emerald-400" />
                {t('orderSummary')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('subtotal')}</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>

              {/* Shipping */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('shipping')}</span>
                <span className={shippingCost === 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'font-medium'}>
                  {shippingCost === 0 ? t('free') : formatPrice(shippingCost)}
                </span>
              </div>
              {shippingCost > 0 && (
                <p className="text-[10px] text-muted-foreground">
                  {t('freeShippingOverThreshold', { amount: formatPrice(SHIPPING_CONFIG.freeShippingThreshold) })}
                </p>
              )}

              {/* Tax */}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('b_tax')} ({(taxRate * 100).toFixed(0)}%)
                </span>
                <span className="font-medium">{formatPrice(tax)}</span>
              </div>

              {/* Discount */}
              {promoApplied && discountAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {t('discount')}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                    -{formatPrice(discountAmount)}
                  </span>
                </div>
              )}

              <Separator />

              {/* Total */}
              <div className="flex justify-between text-lg font-bold">
                <span>{t('total')}</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatPrice(Math.max(0, total))}
                </span>
              </div>

              {/* Promo Code Input with feedback animation */}
              {!promoApplied ? (
                <div className={`space-y-2 ${promoAnimClass}`}>
                  <label className="text-xs font-medium text-muted-foreground">
                    {t('promoCode')}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value);
                        setPromoError('');
                        setPromoAnimClass('');
                      }}
                      placeholder={t('b_enterPromoCode')}
                      className="text-sm h-9"
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyPromo()}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 h-9 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                      onClick={handleApplyPromo}
                    >
                      {t('applyCode')}
                    </Button>
                  </div>
                  {promoError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertTriangle className="size-3" />
                      {promoError}
                    </p>
                  )}
                </div>
              ) : (
                <div className={`flex items-center justify-between bg-emerald-50 dark:bg-emerald-950 p-2.5 rounded-lg animate-coupon-success`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {promoCode.toUpperCase()}
                    </span>
                    <Badge className="bg-emerald-500 text-white text-[9px] px-1.5 py-0">
                      -{Math.round((promoDiscount / subtotal) * 100)}%
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-emerald-600 hover:text-red-500"
                    onClick={handleRemovePromo}
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              )}

              <Separator />

              {/* Escrow Note */}
              <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg">
                <Shield className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  {t('escrowNote')}
                </p>
              </div>

              {/* Checkout Button with shimmer effect */}
              <Button
                size="lg"
                className="w-full btn-shimmer text-white font-semibold h-12 rounded-xl shadow-lg shadow-emerald-500/20"
                onClick={() => nav.setView('checkout')}
              >
                {t('checkout')}
                {isRTL ? (
                  <ArrowLeft className="size-4 ms-2" />
                ) : (
                  <ArrowRight className="size-4 ms-2" />
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Remove Item Confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('b_removeItem')}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? 'هل أنت متأكد من إزالة هذا المنتج من سلة التسوق؟'
                : 'Are you sure you want to remove this item from your cart?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t('removeFromCart')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Cart Confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('b_clearCartQuestion')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? 'سيتم إزالة جميع المنتجات من سلة التسوق. لا يمكن التراجع عن هذا الإجراء.'
                : 'All items will be removed from your cart. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearCart}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="size-4 me-2" />
              {t('b_clearCart')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
