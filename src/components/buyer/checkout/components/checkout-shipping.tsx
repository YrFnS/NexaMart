'use client';

import React from 'react';
import {
  Truck,
  Package,
  Clock,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useI18n } from '@/lib/i18n';
import { SHIPPING_CONFIG } from '@/lib/config';
import { formatPrice, type CurrencyCode } from '@/lib/currency';
import type { Address, ShippingMethod } from '../../checkout-types';
import { CheckoutAddressForm } from './checkout-address-form';

interface NewAddressForm {
  name: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export const DEFAULT_NEW_ADDRESS: NewAddressForm = {
  name: '', phone: '', address1: '', address2: '', city: '', state: '', postalCode: '', country: '',
};

interface CheckoutShippingProps {
  currency: CurrencyCode;
  subtotal: number;
  selectedAddressId: string;
  setSelectedAddressId: (v: string) => void;
  selectedShippingId: string;
  setSelectedShippingId: (v: string) => void;
  showNewAddress: boolean;
  setShowNewAddress: (v: boolean) => void;
  savedAddresses: Address[];
  newAddress: NewAddressForm;
  setNewAddress: (v: NewAddressForm | ((prev: NewAddressForm) => NewAddressForm)) => void;
  validationErrors: Record<string, boolean>;
  SHIPPING_METHODS: ShippingMethod[];
}

export function CheckoutShipping({
  currency,
  subtotal,
  selectedAddressId,
  setSelectedAddressId,
  selectedShippingId,
  setSelectedShippingId,
  showNewAddress,
  setShowNewAddress,
  savedAddresses,
  newAddress,
  setNewAddress,
  validationErrors,
  SHIPPING_METHODS,
}: CheckoutShippingProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Truck className="size-5 text-emerald-600 dark:text-emerald-400" />
        {t('b_shippingAddress')}
      </h2>

      {/* Saved Addresses */}
      {savedAddresses.length > 0 && !showNewAddress && (
        <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
          <div className="space-y-3">
            {savedAddresses.map((addr) => (
              <label
                key={addr.id}
                htmlFor={addr.id}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedAddressId === addr.id
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <RadioGroupItem value={addr.id} id={addr.id} className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{addr.name}</span>
                    {addr.isDefault && (
                      <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px]">
                        {t('b_default')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {addr.address1}{addr.address2 ? `, ${addr.address2}` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {addr.city}, {addr.state} {addr.postalCode}
                  </p>
                  <p className="text-xs text-muted-foreground">{addr.country}</p>
                  <p className="text-xs text-muted-foreground mt-1">{addr.phone}</p>
                </div>
              </label>
            ))}
          </div>
        </RadioGroup>
      )}

      {validationErrors.address && !showNewAddress && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertTriangle className="size-3" />
          {t('b_pleaseSelectShippingAddress')}
        </p>
      )}

      {/* Add New Address Toggle */}
      <Button
        variant="outline"
        className="w-full border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
        onClick={() => { setShowNewAddress(!showNewAddress); setSelectedAddressId(''); }}
      >
        <MapPin className="size-4 me-2" />
        {t('b_addNewAddress')}
      </Button>

      {/* New Address Form */}
      {showNewAddress && (
        <CheckoutAddressForm
          newAddress={newAddress}
          setNewAddress={setNewAddress}
          validationErrors={validationErrors}
        />
      )}

      {/* Shipping Method Selection */}
      <Separator />
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Package className="size-5 text-emerald-600 dark:text-emerald-400" />
          {t('shippingMethod')}
        </h2>
        {subtotal >= SHIPPING_CONFIG.freeShippingThreshold && (
          <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] border-emerald-200 dark:border-emerald-800">
            <Truck className="size-3 me-1" />
            {t('freeShippingAvailable')}
          </Badge>
        )}
      </div>
      {subtotal < SHIPPING_CONFIG.freeShippingThreshold && (
        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/20 p-2.5 rounded-lg text-xs">
          <Truck className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-amber-700 dark:text-amber-300">
            {t('addMoreForFreeShipping', { amount: formatPrice(SHIPPING_CONFIG.freeShippingThreshold - subtotal, currency) })}
          </span>
        </div>
      )}
      <RadioGroup value={selectedShippingId} onValueChange={setSelectedShippingId}>
        <div className="space-y-3">
          {SHIPPING_METHODS.map((method) => {
            const MethodIcon = method.icon;
            const isFree = method.id === 'standard' && subtotal >= SHIPPING_CONFIG.freeShippingThreshold;
            return (
              <label
                key={method.id}
                htmlFor={`ship-${method.id}`}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedShippingId === method.id
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <RadioGroupItem value={method.id} id={`ship-${method.id}`} />
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedShippingId === method.id ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-muted'
                }`}>
                  <MethodIcon className={`size-5 ${
                    selectedShippingId === method.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{isRTL ? method.nameAr : method.name}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />
                      {isRTL ? method.daysAr : method.days}
                    </span>
                  </div>
                </div>
                <span className={`font-semibold text-sm ${isFree ? 'text-emerald-600' : ''}`}>
                  {isFree ? t('free') : method.price > 0 ? formatPrice(method.price, currency) : t('free')}
                </span>
              </label>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );
}
