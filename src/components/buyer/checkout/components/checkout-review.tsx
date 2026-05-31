'use client';

import React from 'react';
import Image from 'next/image';
import {
  Check,
  CreditCard,
  Truck,
  ClipboardCheck,
  MapPin,
  Lock,
  Loader2,
  AlertTriangle,
  Tag,
  X,
  CheckCircle2,
  Sparkles,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';
import { formatPrice, CURRENCIES, type CurrencyCode } from '@/lib/currency';
import type { Address, ShippingMethod, PaymentMethod, AppliedCoupon, AvailableCoupon, CheckoutStep } from '../../checkout-types';
import { getPlaceholderImage } from '@/lib/placeholder-image';

interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  storeId: string;
  storeName: string;
}

interface CheckoutReviewProps {
  currency: CurrencyCode;
  itemCount: number;
  subtotal: number;
  shippingCost: number;
  tax: number;
  taxRate: number;
  taxLabel: string;
  isTaxExempt: boolean;
  total: number;
  appliedCoupon: AppliedCoupon | null;
  couponDiscount: number;
  couponError: string;
  isApplyingCoupon: boolean;
  couponCode: string;
  availableCoupons: AvailableCoupon[];
  items: CartItem[];
  selectedAddress: Address | undefined;
  showNewAddress: boolean;
  newAddress: { name: string; address1: string; address2?: string; city: string; state: string; postalCode: string; country: string; phone: string };
  selectedShipping: ShippingMethod;
  selectedPayment: PaymentMethod | undefined;
  setCurrentStep: (s: CheckoutStep) => void;
  handleApplyCoupon: () => void;
  handleRemoveCoupon: () => void;
  setCouponCode: (v: string) => void;
  getEstimatedDelivery: () => string;
}

export function CheckoutReview({
  currency,
  itemCount,
  subtotal,
  shippingCost,
  tax,
  taxRate,
  taxLabel,
  isTaxExempt,
  total,
  appliedCoupon,
  couponDiscount,
  couponError,
  isApplyingCoupon,
  couponCode,
  availableCoupons,
  items,
  selectedAddress,
  showNewAddress,
  newAddress,
  selectedShipping,
  selectedPayment,
  setCurrentStep,
  handleApplyCoupon,
  handleRemoveCoupon,
  setCouponCode,
  getEstimatedDelivery,
}: CheckoutReviewProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <ClipboardCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
        {t('b_reviewOrder')}
      </h2>

      {/* Shipping Address Summary */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="size-4 text-emerald-600" />
              {t('b_shippingAddress')}
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-emerald-600" onClick={() => setCurrentStep('shipping')}>
              {t('edit')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedAddress && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{selectedAddress.name}</p>
              <p>{selectedAddress.address1}{selectedAddress.address2 ? `, ${selectedAddress.address2}` : ''}</p>
              <p>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</p>
              <p>{selectedAddress.country}</p>
              <p>{selectedAddress.phone}</p>
            </div>
          )}
          {showNewAddress && newAddress.name && (
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{newAddress.name}</p>
              <p>{newAddress.address1}{newAddress.address2 ? `, ${newAddress.address2}` : ''}</p>
              <p>{newAddress.city}, {newAddress.state} {newAddress.postalCode}, {newAddress.country}</p>
              <p>{newAddress.phone}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shipping Method Summary */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Truck className="size-4 text-emerald-600" />
              {t('shippingMethod')}
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-emerald-600" onClick={() => setCurrentStep('shipping')}>
              {t('edit')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <selectedShipping.icon className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{isRTL ? selectedShipping.nameAr : selectedShipping.name}</span>
            <span className="text-muted-foreground">({isRTL ? selectedShipping.daysAr : selectedShipping.days})</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {t('b_estimatedDelivery')} {getEstimatedDelivery()}
          </p>
        </CardContent>
      </Card>

      {/* Payment Method Summary */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="size-4 text-emerald-600" />
              {t('paymentMethod')}
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-emerald-600" onClick={() => setCurrentStep('payment')}>
              {t('edit')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedPayment && (
            <div className="flex items-center gap-2 text-sm">
              <selectedPayment.icon className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-medium">{isRTL ? selectedPayment.nameAr : selectedPayment.name}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {t('b_itemsUpper')} ({itemCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (!img.dataset.retried) {
                      img.dataset.retried = 'true';
                      img.src = getPlaceholderImage('electronics', item.name, 48, 48);
                    }
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.storeName} · {t('b_qty')}: {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {formatPrice(item.price * item.quantity, currency)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Promo Code */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Tag className="size-4 text-emerald-600 dark:text-emerald-400" />
            {t('promoCode')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {appliedCoupon ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-emerald-700 dark:text-emerald-300">{appliedCoupon.code}</span>
                    <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px]">
                      {appliedCoupon.discountType === 'percentage'
                        ? `${appliedCoupon.discountValue}% ${t('b_offLower')}`
                        : appliedCoupon.discountType === 'free_shipping'
                        ? t('b_freeShippingLabel')
                        : `${formatPrice(appliedCoupon.discountValue, currency)} ${t('b_offLower')}`}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isRTL ? appliedCoupon.descriptionAr : appliedCoupon.description}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-8 w-8 p-0"
                onClick={handleRemoveCoupon}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); }}
                placeholder={t('b_enterPromoCode')}
                className={`h-9 text-sm uppercase ${couponError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }}
              />
              <Button
                onClick={handleApplyCoupon}
                disabled={isApplyingCoupon || !couponCode.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-4 shrink-0"
              >
                {isApplyingCoupon ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : t('apply')}
              </Button>
            </div>
          )}
          {couponError && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertTriangle className="size-3" />
              {couponError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Available Coupons */}
      {availableCoupons.length > 0 && !appliedCoupon && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Gift className="size-4 text-amber-500" />
              {t('b_availableCoupons')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {availableCoupons.slice(0, 4).map((coupon) => (
                <button
                  key={coupon.id}
                  type="button"
                  onClick={() => { setCouponCode(coupon.code); }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-dashed border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors text-start"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                      <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-emerald-700 dark:text-emerald-300">{coupon.code}</span>
                      <p className="text-[10px] text-muted-foreground">{isRTL ? coupon.descriptionAr : coupon.description}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] shrink-0">
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}%`
                      : coupon.discountType === 'free_shipping'
                      ? t('b_freeShip')
                      : `$${coupon.discountValue}`}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Totals */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('subtotal')}</span>
            <span>{formatPrice(subtotal, currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {t('shipping')} ({isRTL ? selectedShipping.nameAr : selectedShipping.name})
            </span>
            <span className={shippingCost === 0 ? 'text-emerald-600' : ''}>
              {shippingCost === 0 ? t('free') : formatPrice(shippingCost, currency)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {taxLabel} {taxRate > 0 && `(${taxRate}%)`}
            </span>
            <span className="flex items-center gap-1.5">
              {taxRate === 0 ? (
                <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px]">
                  {isTaxExempt ? t('taxExempt') : t('noTax')}
                </Badge>
              ) : (
                <span>{formatPrice(tax, currency)}</span>
              )}
            </span>
          </div>
          {appliedCoupon && couponDiscount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Tag className="size-3" />
                {t('b_couponDiscount')} ({appliedCoupon.code})
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">-{formatPrice(couponDiscount, currency)}</span>
            </div>
          )}
          {appliedCoupon && couponDiscount === 0 && appliedCoupon.discountType === 'free_shipping' && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Tag className="size-3" />
                {t('b_freeShippingLabel')} ({appliedCoupon.code})
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">{t('b_applied')}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>{t('total')}</span>
            <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(Math.max(0, total), currency)}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
            <Lock className="size-3" />
            {t('b_pricesDisplayedIn', { currency: isRTL ? (CURRENCIES[currency]?.nameAr || currency) : (CURRENCIES[currency]?.name || currency) })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
