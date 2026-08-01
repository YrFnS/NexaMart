'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  ClipboardCheck,
  Loader2,
  PartyPopper,
  Truck,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';
import { LS_KEYS, SHIPPING_CONFIG } from '@/lib/config';
import { calculateTax } from '@/lib/tax';
import {
  calculateStoreShippingCents,
  resolveTaxCountryCode,
  toCents,
} from '@/lib/checkout-authority';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useCartStore } from '@/stores/cart-store';
import { useUserStore } from '@/stores/user-store';
import type {
  CheckoutStep,
  Address,
  AppliedCoupon,
  PaymentMethod,
  ShippingMethod,
  CheckoutStepInfo,
} from './checkout-types';
import {
  CheckoutShipping,
  DEFAULT_NEW_ADDRESS,
} from './checkout/components/checkout-shipping';
import { CheckoutReview } from './checkout/components/checkout-review';
import { CheckoutConfirmation } from './checkout/components/checkout-confirmation';

const LS_ADDRESS_KEY = LS_KEYS.checkoutAddress;

const ORDER_METHOD: PaymentMethod = {
  id: 'cash_on_delivery',
  name: 'Cash on delivery',
  nameAr: 'الدفع عند الاستلام',
  icon: Banknote,
};

const SHIPPING_METHODS: ShippingMethod[] = [
  {
    id: SHIPPING_CONFIG.methods.standard.id,
    name: 'Standard Shipping',
    nameAr: 'شحن عادي',
    price: SHIPPING_CONFIG.methods.standard.price,
    days: `${SHIPPING_CONFIG.methods.standard.days} days`,
    daysAr: `${SHIPPING_CONFIG.methods.standard.days} أيام`,
    icon: Truck,
  },
  {
    id: SHIPPING_CONFIG.methods.express.id,
    name: 'Express Shipping',
    nameAr: 'شحن سريع',
    price: SHIPPING_CONFIG.methods.express.price,
    days: `${SHIPPING_CONFIG.methods.express.days} days`,
    daysAr: `${SHIPPING_CONFIG.methods.express.days} أيام`,
    icon: Zap,
  },
  {
    id: SHIPPING_CONFIG.methods.nextDay.id,
    name: 'Next Day Delivery',
    nameAr: 'توصيل اليوم التالي',
    price: SHIPPING_CONFIG.methods.nextDay.price,
    days: `${SHIPPING_CONFIG.methods.nextDay.days} day`,
    daysAr: 'يوم واحد',
    icon: Truck,
  },
];

const STEPS: CheckoutStepInfo[] = [
  { key: 'shipping', label: 'Delivery', labelAr: 'التوصيل', icon: Truck },
  { key: 'review', label: 'Review', labelAr: 'مراجعة', icon: ClipboardCheck },
  { key: 'confirmation', label: 'Placed', labelAr: 'تم الطلب', icon: PartyPopper },
];

interface CheckoutResponse {
  orderNumbers?: string[];
  total?: number;
  error?: string;
  currency?: 'USD';
}

export function CheckoutPage() {
  const { t, locale } = useI18n();
  const { currency } = useAppStore();
  const nav = useAppNavigation();
  const { items, getTotal, getItemCount, clearCart } = useCartStore();
  const user = useUserStore((state) => state.user);
  const isHydrated = useUserStore((state) => state.isHydrated);
  const isRTL = locale === 'ar';

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedShippingId, setSelectedShippingId] = useState('standard');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);
  const [checkoutError, setCheckoutError] = useState('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [newAddress, setNewAddress] = useState(DEFAULT_NEW_ADDRESS);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        if (user) {
          try {
            const response = await fetch('/api/addresses', {
              credentials: 'same-origin',
              cache: 'no-store',
            });
            if (response.ok) {
              const data = (await response.json()) as { addresses?: Address[] };
              const addresses = data.addresses || [];
              if (!cancelled) {
                setSavedAddresses(addresses);
                const defaultAddress = addresses.find((address) => address.isDefault);
                if (defaultAddress) setSelectedAddressId(defaultAddress.id);
              }
              if (addresses.length > 0) return;
            }
          } catch {
            // Fall through to local guest addresses.
          }
        }

        try {
          const stored = localStorage.getItem(LS_ADDRESS_KEY);
          if (!stored || cancelled) return;
          const addresses = JSON.parse(stored) as Address[];
          setSavedAddresses(addresses);
          const defaultAddress = addresses.find((address) => address.isDefault);
          if (defaultAddress) setSelectedAddressId(defaultAddress.id);
        } catch {
          // Storage may be unavailable.
        }
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [user]);

  const itemCount = getItemCount();
  const subtotal = getTotal();
  const selectedAddress = savedAddresses.find(
    (address) => address.id === selectedAddressId,
  );
  const selectedShipping =
    SHIPPING_METHODS.find((method) => method.id === selectedShippingId) ||
    SHIPPING_METHODS[0];
  const addressForTotals =
    selectedAddress || (showNewAddress ? newAddress : undefined);
  const taxCountryCode =
    resolveTaxCountryCode(addressForTotals?.country || '') || 'iq';
  const itemsByStore = new Map<string, typeof items>();
  for (const item of items) {
    const storeItems = itemsByStore.get(item.storeId) || [];
    storeItems.push(item);
    itemsByStore.set(item.storeId, storeItems);
  }
  const shippingCost = [...itemsByStore.values()].reduce(
    (sum, storeItems) => {
      const storeSubtotalCents = storeItems.reduce(
        (storeSum, item) =>
          storeSum + toCents(item.price) * item.quantity,
        0,
      );
      return (
        sum +
        calculateStoreShippingCents(
          selectedShippingId as 'standard' | 'express' | 'next_day',
          storeSubtotalCents,
          storeItems.map((item) => ({
            hasFreeShipping: Boolean(item.hasFreeShipping),
          })),
        ) /
          100
      );
    },
    0,
  );
  const taxableSubtotal = Math.max(0, subtotal - couponDiscount);
  const taxResult = calculateTax(taxableSubtotal, taxCountryCode);
  const tax = taxResult.taxAmount;
  const taxRate = taxResult.taxRate;
  const taxLabel = isRTL ? taxResult.taxLabelAr : taxResult.taxLabel;
  const isTaxExempt = taxResult.isTaxExempt;
  const total = taxableSubtotal + shippingCost + tax;
  const selectedPayment = ORDER_METHOD;
  const stepIndex = STEPS.findIndex((step) => step.key === currentStep);

  function saveGuestAddresses(addresses: Address[]) {
    try {
      localStorage.setItem(LS_ADDRESS_KEY, JSON.stringify(addresses));
    } catch {
      // Storage may be unavailable.
    }
  }

  function validateShipping(): boolean {
    const errors: Record<string, boolean> = {};
    if (!selectedAddressId && !showNewAddress) errors.address = true;
    if (showNewAddress) {
      if (!newAddress.name) errors.name = true;
      if (!newAddress.phone) errors.phone = true;
      if (!newAddress.address1) errors.address1 = true;
      if (!newAddress.city) errors.city = true;
      if (!newAddress.state) errors.state = true;
      if (!newAddress.postalCode) errors.postalCode = true;
      if (!newAddress.country) errors.country = true;
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode,
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            variation: item.variation,
          })),
        }),
      });
      const data = await response.json();
      if (data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponDiscount(data.discountAmount);
      } else {
        setCouponError(isRTL ? data.errorAr || data.error : data.error);
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    } catch {
      setCouponError(t('b_failedToValidateCoupon'));
    } finally {
      setIsApplyingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    setCouponError('');
  }

  async function persistNewAddress(): Promise<Address | null> {
    const address: Address = {
      id: `addr_${Date.now()}`,
      name: newAddress.name,
      phone: newAddress.phone,
      address1: newAddress.address1,
      address2: newAddress.address2 || undefined,
      city: newAddress.city,
      state: newAddress.state,
      postalCode: newAddress.postalCode,
      country: newAddress.country,
      isDefault: savedAddresses.length === 0,
    };

    if (!user) {
      const updated = [...savedAddresses, address];
      setSavedAddresses(updated);
      saveGuestAddresses(updated);
      return address;
    }

    setIsSavingAddress(true);
    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: 'Home',
          fullName: address.name,
          phone: address.phone,
          address1: address.address1,
          address2: address.address2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          isDefault: address.isDefault,
        }),
      });
      const data = (await response.json()) as {
        address?: Address;
        error?: string;
      };
      if (!response.ok || !data.address) {
        throw new Error(data.error || 'Failed to save the shipping address.');
      }
      setSavedAddresses((current) => [...current, data.address!]);
      return data.address;
    } finally {
      setIsSavingAddress(false);
    }
  }

  async function handleNextStep() {
    setCheckoutError('');
    if (currentStep === 'shipping') {
      if (!validateShipping()) return;
      if (showNewAddress) {
        try {
          const address = await persistNewAddress();
          if (!address) return;
          setSelectedAddressId(address.id);
          setShowNewAddress(false);
        } catch (error) {
          setCheckoutError(
            error instanceof Error
              ? error.message
              : 'Failed to save the address.',
          );
          return;
        }
      }
      setCurrentStep('review');
    } else if (currentStep === 'review') {
      await handlePlaceOrder();
    }
  }

  function handlePrevStep() {
    if (currentStep === 'review') setCurrentStep('shipping');
  }

  async function handlePlaceOrder() {
    if (!isHydrated) return;
    if (!user) {
      window.location.assign('/auth?redirect=/checkout');
      return;
    }

    const address = selectedAddress || (showNewAddress ? newAddress : undefined);
    if (!address) {
      setCheckoutError('Please select a shipping address.');
      setCurrentStep('shipping');
      return;
    }

    setIsPlacingOrder(true);
    setCheckoutError('');
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey,
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            variation: item.variation,
          })),
          shippingMethod: selectedShippingId,
          paymentMethod: 'cash_on_delivery',
          couponCode: appliedCoupon?.code,
          addressId: selectedAddress?.id.startsWith('addr_')
            ? undefined
            : selectedAddress?.id,
          address: {
            name: address.name,
            phone: address.phone,
            address1: address.address1,
            address2: address.address2,
            city: address.city,
            state: address.state,
            postalCode: address.postalCode,
            country: address.country,
          },
        }),
      });
      const data = (await response.json()) as CheckoutResponse;
      if (!response.ok || !data.orderNumbers?.length) {
        throw new Error(data.error || 'The order could not be completed.');
      }

      setOrderNumber(data.orderNumbers.join(', '));
      setConfirmedTotal(data.total ?? total);
      clearCart();
      setCurrentStep('confirmation');
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : 'The order could not be completed.',
      );
    } finally {
      setIsPlacingOrder(false);
    }
  }

  function getEstimatedDelivery() {
    const days =
      selectedShippingId === 'next_day'
        ? 1
        : selectedShippingId === 'express'
          ? 3
          : 7;
    return new Date(Date.now() + days * 86_400_000).toLocaleDateString(
      getLocale(isRTL),
      { year: 'numeric', month: 'long', day: 'numeric' },
    );
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => {
        const active = index === stepIndex;
        const completed = index < stepIndex;
        const StepIcon = step.icon;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  completed
                    ? 'bg-amber-500 text-white'
                    : active
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/30'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {completed ? (
                  <Check className="size-5" />
                ) : (
                  <StepIcon className="size-5" />
                )}
              </div>
              <span
                className={`text-[10px] md:text-xs font-medium ${
                  active
                    ? 'text-amber-600 dark:text-amber-400'
                    : completed
                      ? 'text-amber-500'
                      : 'text-muted-foreground'
                }`}
              >
                {isRTL ? step.labelAr : step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-12 md:w-24 mx-1 mb-5 ${
                  index < stepIndex ? 'bg-amber-500' : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  if (items.length === 0 && currentStep !== 'confirmation') {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold mb-4">{t('emptyCart')}</h2>
        <Button
          className="bg-amber-600 hover:bg-amber-700 text-white"
          onClick={() => nav.setView('shop')}
        >
          {t('continueShopping')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {renderStepIndicator()}
      <div className="max-w-3xl mx-auto">
        {currentStep === 'shipping' && (
          <CheckoutShipping
            currency={currency}
            subtotal={subtotal}
            selectedAddressId={selectedAddressId}
            setSelectedAddressId={setSelectedAddressId}
            selectedShippingId={selectedShippingId}
            setSelectedShippingId={setSelectedShippingId}
            showNewAddress={showNewAddress}
            setShowNewAddress={setShowNewAddress}
            savedAddresses={savedAddresses}
            newAddress={newAddress}
            setNewAddress={setNewAddress}
            validationErrors={validationErrors}
            SHIPPING_METHODS={SHIPPING_METHODS}
          />
        )}
        {currentStep === 'review' && (
          <CheckoutReview
            currency={currency}
            itemCount={itemCount}
            subtotal={subtotal}
            shippingCost={shippingCost}
            tax={tax}
            taxRate={taxRate}
            taxLabel={taxLabel}
            isTaxExempt={isTaxExempt}
            total={total}
            appliedCoupon={appliedCoupon}
            couponDiscount={couponDiscount}
            couponError={couponError}
            isApplyingCoupon={isApplyingCoupon}
            couponCode={couponCode}
              items={items}
            selectedAddress={selectedAddress}
            showNewAddress={showNewAddress}
            newAddress={newAddress}
            selectedShipping={selectedShipping}
            selectedPayment={selectedPayment}
            setCurrentStep={setCurrentStep}
            handleApplyCoupon={handleApplyCoupon}
            handleRemoveCoupon={handleRemoveCoupon}
            setCouponCode={setCouponCode}
            getEstimatedDelivery={getEstimatedDelivery}
          />
        )}
        {currentStep === 'confirmation' && (
          <CheckoutConfirmation
            currency={currency}
            total={confirmedTotal ?? total}
            orderNumber={orderNumber}
            selectedShipping={selectedShipping}
            getEstimatedDelivery={getEstimatedDelivery}
            setCurrentStep={setCurrentStep}
            onViewOrders={() => nav.setView('orders')}
            onContinueShopping={() => nav.setView('shop')}
          />
        )}

        {checkoutError && (
          <p className="mt-4 text-sm text-red-600 text-center" role="alert">
            {checkoutError}
          </p>
        )}

        {currentStep !== 'confirmation' && (
          <div className="flex items-center justify-between mt-8 pt-4 border-t">
            {currentStep === 'review' ? (
              <Button variant="outline" onClick={handlePrevStep}>
                {isRTL ? (
                  <ArrowRight className="size-4 me-1" />
                ) : (
                  <ArrowLeft className="size-4 me-1" />
                )}
                {t('back')}
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => nav.setView('cart')}>
                {isRTL ? (
                  <ArrowRight className="size-4 me-1" />
                ) : (
                  <ArrowLeft className="size-4 me-1" />
                )}
                {t('b_backToCart')}
              </Button>
            )}
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold min-w-[150px]"
              onClick={() => void handleNextStep()}
              disabled={isPlacingOrder || isSavingAddress}
            >
              {isPlacingOrder || isSavingAddress ? (
                <>
                  <Loader2 className="size-4 me-2 animate-spin" />
                  {t('b_processing')}
                </>
              ) : currentStep === 'review' ? (
                <>
                  {isRTL ? 'إرسال الطلب' : 'Place order'}
                  <ArrowRight className="size-4 ms-2" />
                </>
              ) : (
                <>
                  {t('next')}
                  {isRTL ? (
                    <ArrowLeft className="size-4 ms-1" />
                  ) : (
                    <ArrowRight className="size-4 ms-1" />
                  )}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
