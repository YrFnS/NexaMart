'use client';

import React from 'react';
import { Check, PartyPopper, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';
import { formatPrice, type CurrencyCode } from '@/lib/currency';
import type { ShippingMethod, CheckoutStep } from '../../checkout-types';

interface CheckoutConfirmationProps {
  currency: CurrencyCode;
  total: number;
  orderNumber: string;
  selectedShipping: ShippingMethod;
  getEstimatedDelivery: () => string;
  setCurrentStep: (s: CheckoutStep) => void;
  onViewOrders: () => void;
  onContinueShopping: () => void;
}

export function CheckoutConfirmation({
  currency,
  total,
  orderNumber,
  selectedShipping,
  getEstimatedDelivery,
  onViewOrders,
  onContinueShopping,
}: CheckoutConfirmationProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  return (
    <div className="max-w-lg mx-auto text-center space-y-6 py-8">
      <div className="relative inline-block">
        <div className="w-24 h-24 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
          <Check className="size-12 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center animate-bounce">
          <PartyPopper className="size-5 text-white" />
        </div>
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-2">{t('b_orderConfirmed')}</h2>
        <p className="text-muted-foreground">
          {isRTL
            ? 'شكراً لك! تم استلام طلبك بنجاح.'
            : 'Thank you! Your order has been placed successfully.'}
        </p>
      </div>

      <Card className="text-start">
        <CardContent className="pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('b_orderNumber')}</span>
            <span className="font-mono font-bold text-emerald-600">{orderNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('b_orderDate')}</span>
            <span>{new Date().toLocaleDateString(getLocale(isRTL))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('shippingMethod')}</span>
            <span>{isRTL ? selectedShipping.nameAr : selectedShipping.name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('estimatedDeliveryDate')}</span>
            <span>{getEstimatedDelivery()}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm font-semibold">
            <span>{t('total')}</span>
            <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(total, currency)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg text-start">
        <Shield className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          {t('escrowNote')}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={onViewOrders}>
          {t('b_viewOrders')}
        </Button>
        <Button variant="outline" onClick={onContinueShopping}>
          {t('continueShopping')}
        </Button>
      </div>
    </div>
  );
}
