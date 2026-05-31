'use client';

import React, { useState, useEffect } from 'react';
import { Check, CreditCard, Truck, ClipboardCheck, PartyPopper, ArrowLeft, ArrowRight, Loader2, Smartphone, Wallet, Banknote, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';
import { LS_KEYS, SHIPPING_CONFIG } from '@/lib/config';
import { formatPrice, type CurrencyCode } from '@/lib/currency';
import { calculateTax } from '@/lib/tax';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useCartStore } from '@/stores/cart-store';
import { useUserStore } from '@/stores/user-store';
import type { CheckoutStep, Address, AppliedCoupon, AvailableCoupon, PaymentMethod, ShippingMethod, CheckoutStepInfo } from './checkout-types';
import { CheckoutShipping, DEFAULT_NEW_ADDRESS } from './checkout/components/checkout-shipping';
import { CheckoutPayment } from './checkout/components/checkout-payment';
import { CheckoutReview } from './checkout/components/checkout-review';
import { CheckoutConfirmation } from './checkout/components/checkout-confirmation';

const LS_ADDRESS_KEY = LS_KEYS.checkoutAddress;

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 'card', name: 'Credit/Debit Card', nameAr: 'بطاقة ائتمان/خصم', icon: CreditCard },
  { id: 'apple_pay', name: 'Apple Pay', nameAr: 'Apple Pay', icon: Smartphone },
  { id: 'google_pay', name: 'Google Pay', nameAr: 'Google Pay', icon: Smartphone },
  { id: 'wallet', name: 'NexaMart Wallet', nameAr: 'محفظة نكسا مارت', icon: Wallet },
  { id: 'zain_cash', name: 'Zain Cash', nameAr: 'Zain Cash', icon: Banknote },
  { id: 'stc_pay', name: 'STC Pay', nameAr: 'STC Pay', icon: Banknote },
];

const SHIPPING_METHODS: ShippingMethod[] = [
  { id: SHIPPING_CONFIG.methods.standard.id, name: 'Standard Shipping', nameAr: 'شحن عادي', price: SHIPPING_CONFIG.methods.standard.price, days: `${SHIPPING_CONFIG.methods.standard.days} days`, daysAr: `${SHIPPING_CONFIG.methods.standard.days} أيام`, icon: Truck },
  { id: SHIPPING_CONFIG.methods.express.id, name: 'Express Shipping', nameAr: 'شحن سريع', price: SHIPPING_CONFIG.methods.express.price, days: `${SHIPPING_CONFIG.methods.express.days} days`, daysAr: `${SHIPPING_CONFIG.methods.express.days} أيام`, icon: Zap },
  { id: SHIPPING_CONFIG.methods.nextDay.id, name: 'Next Day Delivery', nameAr: 'توصيل اليوم التالي', price: SHIPPING_CONFIG.methods.nextDay.price, days: `${SHIPPING_CONFIG.methods.nextDay.days} day`, daysAr: 'يوم واحد', icon: Truck },
];

const STEPS: CheckoutStepInfo[] = [
  { key: 'shipping', label: 'Shipping', labelAr: 'الشحن', icon: Truck },
  { key: 'payment', label: 'Payment', labelAr: 'الدفع', icon: CreditCard },
  { key: 'review', label: 'Review', labelAr: 'مراجعة', icon: ClipboardCheck },
  { key: 'confirmation', label: 'Confirmation', labelAr: 'تأكيد', icon: PartyPopper },
];

export function CheckoutPage() {
  const { t, locale } = useI18n();
  const { currency } = useAppStore();
  const nav = useAppNavigation();
  const { items, getTotal, getItemCount, clearCart } = useCartStore();
  const user = useUserStore((s) => s.user);
  const isRTL = locale === 'ar';

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [selectedPaymentId, setSelectedPaymentId] = useState('card');
  const [selectedShippingId, setSelectedShippingId] = useState('standard');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
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
  const [countryCode, setCountryCode] = useState('sa');

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch('/api/coupons?action=available');
        if (res.ok) { const data = await res.json(); setAvailableCoupons(data.coupons || []); }
      } catch { /* ignore */ }
    };
    fetchCoupons();
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_ADDRESS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Address[];
        setSavedAddresses(parsed);
        const defaultAddr = parsed.find((a) => a.isDefault);
        if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    try { const saved = localStorage.getItem(LS_KEYS.country); if (saved) setCountryCode(saved); }
    catch { /* ignore */ }
  }, []);

  const itemCount = getItemCount();
  const subtotal = getTotal();
  const selectedShipping = SHIPPING_METHODS.find((m) => m.id === selectedShippingId) || SHIPPING_METHODS[0];
  const shippingCost = selectedShipping.price === 0 && selectedShippingId === 'standard'
    ? (subtotal >= SHIPPING_CONFIG.freeShippingThreshold ? 0 : 9.99)
    : selectedShipping.price;

  const taxResult = calculateTax(subtotal, countryCode, undefined, currency);
  const tax = taxResult.taxAmount;
  const taxRate = taxResult.taxRate;
  const taxLabel = isRTL ? taxResult.taxLabelAr : taxResult.taxLabel;
  const isTaxExempt = taxResult.isTaxExempt;
  const total = taxResult.total + (shippingCost === 0 ? 0 : shippingCost) - couponDiscount;

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId);
  const selectedPayment = PAYMENT_METHODS.find((m) => m.id === selectedPaymentId);
  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  const saveAddressToLocalStorage = (addresses: Address[]) => {
    try { localStorage.setItem(LS_ADDRESS_KEY, JSON.stringify(addresses)); } catch { /* ignore */ }
  };

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
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon(data.coupon);
        setCouponDiscount(data.discountAmount);
        setCouponError('');
      } else {
        setCouponError(isRTL ? (data.errorAr || data.error) : data.error);
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    } catch { setCouponError(t('b_failedToValidateCoupon')); }
    finally { setIsApplyingCoupon(false); }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null); setCouponDiscount(0); setCouponCode(''); setCouponError('');
  };

  const handleNextStep = () => {
    if (currentStep === 'shipping') {
      if (!validateShipping()) return;
      if (showNewAddress && newAddress.name) {
        const newAddr: Address = {
          id: 'addr_' + Date.now(), name: newAddress.name, phone: newAddress.phone,
          address1: newAddress.address1, address2: newAddress.address2 || undefined,
          city: newAddress.city, state: newAddress.state, postalCode: newAddress.postalCode,
          country: newAddress.country, isDefault: savedAddresses.length === 0,
        };
        const updated = [...savedAddresses, newAddr];
        setSavedAddresses(updated);
        saveAddressToLocalStorage(updated);
        setSelectedAddressId(newAddr.id);
      }
      setCurrentStep('payment');
    } else if (currentStep === 'payment') { setCurrentStep('review'); }
    else if (currentStep === 'review') { handlePlaceOrder(); }
  };

  const handlePrevStep = () => {
    if (currentStep === 'payment') setCurrentStep('shipping');
    else if (currentStep === 'review') setCurrentStep('payment');
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const ordNum = 'NXM-' + (crypto.randomUUID?.()?.substring(0, 8).toUpperCase() ||
      Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase());
    setOrderNumber(ordNum);
    setIsPlacingOrder(false);
    setCurrentStep('confirmation');
    clearCart();
  };

  const getEstimatedDelivery = () => {
    const days = selectedShippingId === 'next_day' ? 1 : selectedShippingId === 'express' ? 3 : 7;
    const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return date.toLocaleDateString(getLocale(isRTL), { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, idx) => {
        const isActive = idx === stepIndex;
        const isCompleted = idx < stepIndex;
        const StepIcon = step.icon;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                isCompleted ? 'bg-emerald-500 text-white'
                : isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-muted text-muted-foreground'
              }`}>
                {isCompleted ? <Check className="size-5" /> : <StepIcon className="size-5" />}
              </div>
              <span className={`text-[10px] md:text-xs font-medium ${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : isCompleted ? 'text-emerald-500' : 'text-muted-foreground'
              }`}>
                {isRTL ? step.labelAr : step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-0.5 w-8 md:w-16 mx-1 mb-5 transition-colors ${
                idx < stepIndex ? 'bg-emerald-500' : 'bg-muted'
              }`} />
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
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => nav.setView('shop')}>
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
            currency={currency} subtotal={subtotal}
            selectedAddressId={selectedAddressId} setSelectedAddressId={setSelectedAddressId}
            selectedShippingId={selectedShippingId} setSelectedShippingId={setSelectedShippingId}
            showNewAddress={showNewAddress} setShowNewAddress={setShowNewAddress}
            savedAddresses={savedAddresses} newAddress={newAddress}
            setNewAddress={setNewAddress} validationErrors={validationErrors}
            SHIPPING_METHODS={SHIPPING_METHODS}
          />
        )}
        {currentStep === 'payment' && (
          <CheckoutPayment
            selectedPaymentId={selectedPaymentId} setSelectedPaymentId={setSelectedPaymentId}
            PAYMENT_METHODS={PAYMENT_METHODS}
          />
        )}
        {currentStep === 'review' && (
          <CheckoutReview
            currency={currency} itemCount={itemCount} subtotal={subtotal}
            shippingCost={shippingCost} tax={tax} taxRate={taxRate}
            taxLabel={taxLabel} isTaxExempt={isTaxExempt} total={total}
            appliedCoupon={appliedCoupon} couponDiscount={couponDiscount}
            couponError={couponError} isApplyingCoupon={isApplyingCoupon}
            couponCode={couponCode} availableCoupons={availableCoupons}
            items={items} selectedAddress={selectedAddress}
            showNewAddress={showNewAddress} newAddress={newAddress}
            selectedShipping={selectedShipping} selectedPayment={selectedPayment}
            setCurrentStep={setCurrentStep} handleApplyCoupon={handleApplyCoupon}
            handleRemoveCoupon={handleRemoveCoupon} setCouponCode={setCouponCode}
            getEstimatedDelivery={getEstimatedDelivery}
          />
        )}
        {currentStep === 'confirmation' && (
          <CheckoutConfirmation
            currency={currency} total={total} orderNumber={orderNumber}
            selectedShipping={selectedShipping} getEstimatedDelivery={getEstimatedDelivery}
            setCurrentStep={setCurrentStep} onViewOrders={() => nav.setView('orders')}
            onContinueShopping={() => nav.setView('shop')}
          />
        )}

        {currentStep !== 'confirmation' && (
          <div className="flex items-center justify-between mt-8 pt-4 border-t">
            {currentStep !== 'shipping' ? (
              <Button variant="outline" onClick={handlePrevStep}>
                {isRTL ? <ArrowRight className="size-4 me-1" /> : <ArrowLeft className="size-4 me-1" />}
                {t('back')}
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => nav.setView('cart')}>
                {isRTL ? <ArrowRight className="size-4 me-1" /> : <ArrowLeft className="size-4 me-1" />}
                {t('b_backToCart')}
              </Button>
            )}
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold min-w-[140px]"
              onClick={handleNextStep} disabled={isPlacingOrder}
            >
              {isPlacingOrder ? (
                <><Loader2 className="size-4 me-2 animate-spin" />{t('b_processing')}</>
              ) : currentStep === 'review' ? (
                <><ArrowRight className="size-4 me-2" />{t('placeOrder')}</>
              ) : (
                <>{t('next')}{isRTL ? <ArrowLeft className="size-4 ms-1" /> : <ArrowRight className="size-4 ms-1" />}</>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
