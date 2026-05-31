'use client';

import React from 'react';
import { CreditCard, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useI18n } from '@/lib/i18n';
import type { PaymentMethod } from '../../checkout-types';

interface CheckoutPaymentProps {
  selectedPaymentId: string;
  setSelectedPaymentId: (v: string) => void;
  PAYMENT_METHODS: PaymentMethod[];
}

export function CheckoutPayment({
  selectedPaymentId,
  setSelectedPaymentId,
  PAYMENT_METHODS,
}: CheckoutPaymentProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <CreditCard className="size-5 text-emerald-600 dark:text-emerald-400" />
        {t('paymentMethod')}
      </h2>

      <RadioGroup value={selectedPaymentId} onValueChange={setSelectedPaymentId}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PAYMENT_METHODS.map((method) => {
            const MethodIcon = method.icon;
            return (
              <label
                key={method.id}
                htmlFor={`pay-${method.id}`}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPaymentId === method.id
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <RadioGroupItem value={method.id} id={`pay-${method.id}`} />
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                  <MethodIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-medium">
                  {isRTL ? method.nameAr : method.name}
                </span>
              </label>
            );
          })}
        </div>
      </RadioGroup>

      {selectedPaymentId === 'card' && (
        <Card className="bg-muted/30">
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">{t('b_cardNumber')}</Label>
              <Input placeholder="4242 4242 4242 4242" className="h-9 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t('b_expiryDate')}</Label>
                <Input placeholder="MM/YY" className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">CVV</Label>
                <Input placeholder="123" className="h-9 text-sm" type="password" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="size-3" />
        {isRTL
          ? 'جميع المعاملات مشفرة وآمنة'
          : 'All transactions are encrypted and secure'}
      </div>
    </div>
  );
}
