'use client';

import React from 'react';
import { Check, Clock3, PartyPopper, Shield } from 'lucide-react';
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
  paymentStatus: 'paid' | 'pending';
  selectedShipping: ShippingMethod;
  getEstimatedDelivery: () => string;
  setCurrentStep: (step: CheckoutStep) => void;
  onViewOrders: () => void;
  onContinueShopping: () => void;
}

export function CheckoutConfirmation({
  currency,
  total,
  orderNumber,
  paymentStatus,
  selectedShipping,
  getEstimatedDelivery,
  onViewOrders,
  onContinueShopping,
}: CheckoutConfirmationProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const isPaid = paymentStatus === 'paid';

  return (
    <div className="max-w-lg mx-auto text-center space-y-6 py-8">
      <div className="relative inline-block">
        <div
          className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center ${
            isPaid
              ? 'bg-emerald-100 dark:bg-emerald-900'
              : 'bg-amber-100 dark:bg-amber-900'
          }`}
        >
          {isPaid ? (
            <Check className="size-12 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Clock3 className="size-12 text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center animate-bounce">
          <PartyPopper className="size-5 text-white" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2">
          {isPaid ? t('b_orderConfirmed') : isRTL ? 'تم إنشاء الطلب' : 'Order created'}
        </h2>
        <p className="text-muted-foreground">
          {isPaid
            ? isRTL
              ? 'شكراً لك! تم استلام طلبك ودفعه بنجاح.'
              : 'Thank you! Your order and wallet payment were completed successfully.'
            : isRTL
              ? 'تم حفظ طلبك، لكن الدفع ما زال معلقاً ولم يتم خصم أي مبلغ.'
              : 'Your order is saved, but payment is still pending and no charge has been made.'}
        </p>
      </div>

      <Card className="text-start">
        <CardContent className="pt-4 space-y-3">
          <div className="flex justify-between text-sm gap-4">
            <span className="text-muted-foreground">{t('b_orderNumber')}</span>
            <span className="font-mono font-bold text-emerald-600 break-all text-end">
              {orderNumber}
            </span>
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
            <span className="text-muted-foreground">
              {isRTL ? 'حالة الدفع' : 'Payment status'}
            </span>
            <span
              className={
                isPaid
                  ? 'font-medium text-emerald-600 dark:text-emerald-400'
                  : 'font-medium text-amber-600 dark:text-amber-400'
              }
            >
              {isPaid ? (isRTL ? 'مدفوع' : 'Paid') : isRTL ? 'معلق' : 'Pending'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('estimatedDeliveryDate')}</span>
            <span>{getEstimatedDelivery()}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm font-semibold">
            <span>{t('total')}</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {formatPrice(total, currency)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div
        className={`flex items-start gap-2 p-3 rounded-lg text-start ${
          isPaid
            ? 'bg-amber-50 dark:bg-amber-950/30'
            : 'bg-sky-50 dark:bg-sky-950/30'
        }`}
      >
        <Shield
          className={`size-4 mt-0.5 flex-shrink-0 ${
            isPaid
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-sky-600 dark:text-sky-400'
          }`}
        />
        <p
          className={`text-xs leading-relaxed ${
            isPaid
              ? 'text-amber-700 dark:text-amber-300'
              : 'text-sky-700 dark:text-sky-300'
          }`}
        >
          {isPaid
            ? t('escrowNote')
            : isRTL
              ? 'سيبقى الطلب بحالة الانتظار إلى أن يتم ربط مزود الدفع وتأكيد العملية.'
              : 'The order remains pending until a configured payment provider confirms the transaction.'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={onViewOrders}
        >
          {t('b_viewOrders')}
        </Button>
        <Button variant="outline" onClick={onContinueShopping}>
          {t('continueShopping')}
        </Button>
      </div>
    </div>
  );
}
