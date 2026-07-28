'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Check,
  ClipboardCheck,
  CreditCard,
  Loader2,
  PartyPopper,
  Smartphone,
  Truck,
  Wallet,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';
import { LS_KEYS, SHIPPING_CONFIG } from '@/lib/config';
import { calculateTax } from '@/lib/tax';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useCartStore } from '@/stores/cart-store';
import { useUserStore } from '@/stores/user-store';
import type {
  CheckoutStep,
  Address,
  AppliedCoupon,
  AvailableCoupon,
  PaymentMethod,
  ShippingMethod,
  CheckoutStepInfo,
} from './checkout-types';
import {
  CheckoutShipping,
  DEFAULT_NEW_ADDRESS,
} from './checkout/components/checkout-shipping';
import { CheckoutPayment } from './checkout/components/checkout-payment';
import { CheckoutReview } from './checkout/components/checkout-review';
import { CheckoutConfirmation } from './checkout/components/checkout-confirmation';

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'card', name: 'Credit/Debit Card', nameAr: 'بطاقة ائتمان/خصم', icon: CreditCard },
  { id: 'apple_pay', name: 'Apple Pay', nameAr: 'Apple Pay', icon: Smartphone },
  { id: 'google_pay', name: 'Google Pay', nameAr: 'Google Pay', icon: Smartphone },
  { id: 'wallet', name: 'NexaMart Wallet', nameAr: 'محفظة نكسا مارت', icon: Wallet },
  { id: 'zain_cash', name: 'Zain Cash', nameAr: 'Zain Cash', icon: Banknote },
  { id: 'stc_pay', name: 'STC Pay', nameAr: 'STC Pay', icon: Banknote },
];

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
  { key: 'shipping', label: 'Shipping', labelAr: 'الشحن', icon: Truck },
  { key: 'payment', label: 'Payment', labelAr: 'الدفع', icon: CreditCard },
  { key: 'review', label: 'Review', labelAr: 'مراجعة', icon: ClipboardCheck },
  { key: 'confirmation', label: 'Confirmation', labelAr: 'تأكيد', icon: PartyPopper },
];

interface CheckoutApiResponse {
  orderNumber?: string;
  total?: number;
  paymentStatus?: 'paid' | 'pending';
  error?: string;
}

interface AddressApiResponse {
  addresses?: Array<{
    id: string;
    fullName: string;
    phone: string;
    address1: string;
    address2?: string | null;
    city: string;
    state?: string | null;
    postalCode?: string | null;
    country: string;
    isDefault?: boolean;
  }>;
}

function mapApiAddress(address: NonNullable<AddressApiResponse['addresses']>[number]): Address {
  return {
    id: address.id,
    name: address.fullName,
    phone: address.phone,
    address1: address.address1,
    address2: address.address2 || undefined,
    city: address.city,
    state: address.state || '',
    postalCode: address.postalCode || '',
    country: address.country,
    isDefault: address.isDefault,
  };
}

export function CheckoutPage() {
  const { t, locale } = useI18n();
  const { currency } = useAppStore();
  const nav = useAppNavigation();
  const router = useRouter();
  const { items, getTotal, getItemCount, clearCart } = useCartStore();
  const user = useUserStore(state => state.user);
  const sessionHydrated = useUserStore(state => state.hydrated);
  const refreshSession = useUserStore(state => state.refreshSession);
  const isRTL = locale === 'ar';

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState('card');
  const [selectedShippingId, setSelectedShippingId] = useState('standard');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);
  const [confirmedPaymentStatus, setConfirmedPaymentStatus] = useState<'paid' | 'pending'>('pending');
  const [orderError, setOrderError] = useState('');
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);

  const [newAddress, setNewAddress] = useState(DEFAULT_NEW_ADDRESS);
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [countryCode, setCountryCode] = useState('iq');
  const idempotencyKeyRef = useRef<string | null>(null);
  const persistedAddressRef = useRef<{ signature: string; id: string } | null>(null);

  useEffect(() => {
    if (sessionHydrated && !user) {
      router.replace('/auth?next=/checkout');
    }
  }, [router, sessionHydrated, user]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await fetch('/api/coupons?action=available', { cache: 'no-store' });
        if (!response.ok) return;
        const data = (await response.json()) as { coupons?: AvailableCoupon[] };
        setAvailableCoupons(data.coupons || []);
      } catch {
        // Coupon suggestions are optional; checkout validates coupons again server-side.
      }
    };
    void fetchCoupons();
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setSavedAddresses([]);
      setSelectedAddressId('');
      return () => {
        cancelled = true;
      };
    }

    const fetchAddresses = async () => {
      try {
        const response = await fetch('/api/addresses', {
          credentials: 'include',
          cache: 'no-store',
        });
        if (!response.ok) return;
        const data = (await response.json()) as AddressApiResponse;
        if (cancelled) return;
        const addresses = (data.addresses || []).map(mapApiAddress);
        setSavedAddresses(addresses);
        const defaultAddress = addresses.find(address => address.isDefault) || addresses[0];
        if (defaultAddress) setSelectedAddressId(defaultAddress.id);
        if (addresses.length === 0) setShowNewAddress(true);
      } catch {
        if (!cancelled) setShowNewAddress(true);
      }
    };

    void fetchAddresses();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.country);
      if (saved) setCountryCode(saved.toLowerCase().slice(0, 2));
    } catch {
      // Country selection remains on the default when storage is unavailable.
    }
  }, []);

  const itemCount = getItemCount();
  const subtotal = getTotal();
  const selectedShipping =
    SHIPPING_METHODS.find(method => method.id === selectedShippingId) || SHIPPING_METHODS[0];
  const shippingCost =
    selectedShipping.price === 0 && selectedShippingId === 'standard'
      ? subtotal >= SHIPPING_CONFIG.freeShippingThreshold
        ? 0
        : SHIPPING_CONFIG.defaultShippingRate
      : selectedShipping.price;

  // All catalog prices are stored in USD. Display components convert from USD.
  const taxResult = calculateTax(subtotal, countryCode, undefined, 'USD');
  const tax = taxResult.taxAmount;
  const taxRate = taxResult.taxRate;
  const taxLabel = isRTL ? taxResult.taxLabelAr : taxResult.taxLabel;
  const isTaxExempt = taxResult.isTaxExempt;
  const total = Math.max(0, taxResult.total + shippingCost - couponDiscount);

  const selectedAddress = savedAddresses.find(address => address.id === selectedAddressId);
  const selectedPayment = PAYMENT_METHODS.find(method => method.id === selectedPaymentId);
  const stepIndex = STEPS.findIndex(step => step.key === currentStep);

  const validateShipping = (): boolean => {
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
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal }),
      });
      const data = (await response.json()) as {
        valid?: boolean;
        coupon?: AppliedCoupon;
        discountAmount?: number;
        error?: string;
        errorAr?: string;
      };
      if (response.ok && data.valid && data.coupon) {
        setAppliedCoupon(data.coupon);
        setCouponDiscount(Number(data.discountAmount) || 0);
      } else {
        setCouponError(isRTL ? data.errorAr || data.error || '' : data.error || '');
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    } catch {
      setCouponError(t('b_failedToValidateCoupon'));
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    setCouponError('');
  };

  const persistNewAddress = async (): Promise<Address> => {
    const signature = JSON.stringify(newAddress);
    const previous = persistedAddressRef.current;
    const previousAddress = previous
      ? savedAddresses.find(address => address.id === previous.id)
      : undefined;
    if (previous?.signature === signature && previousAddress) return previousAddress;

    const draftAddress: Address = {
      id: `checkout-address-${Date.now()}`,
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

    try {
      const response = await fetch('/api/addresses', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newAddress.name,
          phone: newAddress.phone,
          address1: newAddress.address1,
          address2: newAddress.address2,
          city: newAddress.city,
          state: newAddress.state,
          postalCode: newAddress.postalCode,
          country: newAddress.country,
          label: 'Home',
          isDefault: savedAddresses.length === 0,
        }),
      });
      if (response.ok) {
        const data = (await response.json()) as {
          address?: NonNullable<AddressApiResponse['addresses']>[number];
        };
        if (data.address) {
          const saved = mapApiAddress(data.address);
          persistedAddressRef.current = { signature, id: saved.id };
          setSavedAddresses(addresses => [
            ...addresses.filter(address => address.id !== saved.id),
            saved,
          ]);
          return saved;
        }
      }
    } catch {
      // The address can still be used for this order if profile persistence fails.
    }

    persistedAddressRef.current = { signature, id: draftAddress.id };
    setSavedAddresses(addresses => [
      ...addresses.filter(address => address.id !== draftAddress.id),
      draftAddress,
    ]);
    return draftAddress;
  };

  const handleNextStep = async () => {
    setOrderError('');
    if (currentStep === 'shipping') {
      if (!validateShipping()) return;
      if (showNewAddress) {
        const address = await persistNewAddress();
        setSelectedAddressId(address.id);
      }
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setCurrentStep('review');
    } else if (currentStep === 'review') {
      await handlePlaceOrder();
    }
  };

  const handlePrevStep = () => {
    setOrderError('');
    if (currentStep === 'payment') setCurrentStep('shipping');
    else if (currentStep === 'review') setCurrentStep('payment');
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      router.replace('/auth?next=/checkout');
      return;
    }

    const address = showNewAddress
      ? {
          fullName: newAddress.name,
          phone: newAddress.phone,
          address1: newAddress.address1,
          address2: newAddress.address2 || null,
          city: newAddress.city,
          state: newAddress.state || null,
          postalCode: newAddress.postalCode || null,
          country: newAddress.country,
        }
      : selectedAddress
        ? {
            fullName: selectedAddress.name,
            phone: selectedAddress.phone,
            address1: selectedAddress.address1,
            address2: selectedAddress.address2 || null,
            city: selectedAddress.city,
            state: selectedAddress.state || null,
            postalCode: selectedAddress.postalCode || null,
            country: selectedAddress.country,
          }
        : null;

    if (!address) {
      setOrderError('Select or enter a shipping address.');
      setCurrentStep('shipping');
      return;
    }

    setIsPlacingOrder(true);
    setOrderError('');
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current =
        globalThis.crypto?.randomUUID?.() ||
        `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKeyRef.current,
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            variation: item.variation || null,
          })),
          shippingAddress: address,
          shippingMethod: selectedShippingId,
          paymentMethod: selectedPaymentId,
          couponCode: appliedCoupon?.code || '',
          countryCode,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as CheckoutApiResponse;

      if (response.status === 401) {
        router.replace('/auth?next=/checkout');
        return;
      }
      if (!response.ok || !data.orderNumber) {
        idempotencyKeyRef.current = null;
        setOrderError(data.error || 'Unable to place the order. Review the cart and try again.');
        return;
      }

      setOrderNumber(data.orderNumber);
      setConfirmedTotal(Number(data.total) || 0);
      setConfirmedPaymentStatus(data.paymentStatus || 'pending');
      setCurrentStep('confirmation');
      clearCart();
      idempotencyKeyRef.current = null;
      await refreshSession();
    } catch {
      // Keep the idempotency key after an unknown network failure so retrying
      // cannot create a duplicate order.
      setOrderError('The checkout response was interrupted. Retry safely with the same cart.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const getEstimatedDelivery = () => {
    const days = selectedShippingId === 'next_day' ? 1 : selectedShippingId === 'express' ? 3 : 7;
    const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return date.toLocaleDateString(getLocale(isRTL), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, index) => {
        const isActive = index === stepIndex;
        const isCompleted = index < stepIndex;
        const StepIcon = step.icon;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isActive
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {isCompleted ? <Check className="size-5" /> : <StepIcon className="size-5" />}
              </div>
              <span
                className={`text-[10px] md:text-xs font-medium ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isCompleted
                      ? 'text-emerald-500'
                      : 'text-muted-foreground'
                }`}
              >
                {isRTL ? step.labelAr : step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 md:w-16 mx-1 mb-5 transition-colors ${
                  index < stepIndex ? 'bg-emerald-500' : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  if (!sessionHydrated || !user) {
    return (
      <div className="container mx-auto flex min-h-[50vh] items-center justify-center px-4 py-12">
        <Loader2 className="size-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (items.length === 0 && currentStep !== 'confirmation') {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-xl font-bold mb-4">{t('emptyCart')}</h2>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
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
        {currentStep === 'payment' && (
          <CheckoutPayment
            selectedPaymentId={selectedPaymentId}
            setSelectedPaymentId={setSelectedPaymentId}
            PAYMENT_METHODS={PAYMENT_METHODS}
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
            availableCoupons={availableCoupons}
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
            paymentStatus={confirmedPaymentStatus}
            selectedShipping={selectedShipping}
            getEstimatedDelivery={getEstimatedDelivery}
            setCurrentStep={setCurrentStep}
            onViewOrders={() => nav.setView('orders')}
            onContinueShopping={() => nav.setView('shop')}
          />
        )}

        {orderError && currentStep !== 'confirmation' && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          >
            {orderError}
          </div>
        )}

        {currentStep !== 'confirmation' && (
          <div className="flex items-center justify-between mt-8 pt-4 border-t">
            {currentStep !== 'shipping' ? (
              <Button variant="outline" onClick={handlePrevStep} disabled={isPlacingOrder}>
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold min-w-[140px]"
              onClick={() => void handleNextStep()}
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="size-4 me-2 animate-spin" />
                  {t('b_processing')}
                </>
              ) : currentStep === 'review' ? (
                <>
                  <ArrowRight className="size-4 me-2" />
                  {t('placeOrder')}
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
