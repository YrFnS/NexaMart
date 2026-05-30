'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Check,
  CreditCard,
  Truck,
  ClipboardCheck,
  PartyPopper,
  ArrowLeft,
  ArrowRight,
  Shield,
  Plus,
  MapPin,
  Smartphone,
  Wallet,
  Banknote,
  Lock,
  Loader2,
  AlertTriangle,
  Zap,
  Package,
  Clock,
  Tag,
  X,
  CheckCircle2,
  Sparkles,
  Gift,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';
import { LS_KEYS, SHIPPING_CONFIG, APP_NAME } from '@/lib/config';
import { formatPrice, CURRENCIES, type CurrencyCode } from '@/lib/currency';
import { calculateTax, getTaxLabel } from '@/lib/tax';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useCartStore } from '@/stores/cart-store';
import { useUserStore } from '@/stores/user-store';
import { getPlaceholderImage } from '@/lib/placeholder-image';

type CheckoutStep = 'shipping' | 'payment' | 'review' | 'confirmation';

interface AppliedCoupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrder: number;
  maxDiscount: number | null;
  description: string;
  descriptionAr: string;
  expiry: string;
}

interface AvailableCoupon {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrder: number;
  maxDiscount: number | null;
  expiry: string;
  description: string;
  descriptionAr: string;
  isActive: boolean;
  usageCount: number;
  usageLimit: number | null;
  category: string;
}

interface Address {
  id: string;
  name: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  nameAr: string;
  icon: React.ElementType;
}

interface ShippingMethod {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  days: string;
  daysAr: string;
  icon: React.ElementType;
}

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
  { id: SHIPPING_CONFIG.methods.standard.id, name: 'Standard Shipping', nameAr: 'شحن عادي', price: SHIPPING_CONFIG.methods.standard.price, days: `${SHIPPING_CONFIG.methods.standard.days} days`, daysAr: `${SHIPPING_CONFIG.methods.standard.days} أيام`, icon: Package },
  { id: SHIPPING_CONFIG.methods.express.id, name: 'Express Shipping', nameAr: 'شحن سريع', price: SHIPPING_CONFIG.methods.express.price, days: `${SHIPPING_CONFIG.methods.express.days} days`, daysAr: `${SHIPPING_CONFIG.methods.express.days} أيام`, icon: Zap },
  { id: SHIPPING_CONFIG.methods.nextDay.id, name: 'Next Day Delivery', nameAr: 'توصيل اليوم التالي', price: SHIPPING_CONFIG.methods.nextDay.price, days: `${SHIPPING_CONFIG.methods.nextDay.days} day`, daysAr: 'يوم واحد', icon: Truck },
];

const COUNTRIES = [
  { code: 'IQ', name: 'Iraq', nameAr: 'العراق' },
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية' },
  { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة' },
  { code: 'KW', name: 'Kuwait', nameAr: 'الكويت' },
  { code: 'BH', name: 'Bahrain', nameAr: 'البحرين' },
  { code: 'QA', name: 'Qatar', nameAr: 'قطر' },
  { code: 'OM', name: 'Oman', nameAr: 'عُمان' },
  { code: 'JO', name: 'Jordan', nameAr: 'الأردن' },
  { code: 'LB', name: 'Lebanon', nameAr: 'لبنان' },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر' },
  { code: 'TR', name: 'Turkey', nameAr: 'تركيا' },
  { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة' },
  { code: 'GB', name: 'United Kingdom', nameAr: 'المملكة المتحدة' },
  { code: 'DE', name: 'Germany', nameAr: 'ألمانيا' },
  { code: 'FR', name: 'France', nameAr: 'فرنسا' },
];

const STEPS: { key: CheckoutStep; label: string; labelAr: string; icon: React.ElementType }[] = [
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

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);

  // New address form
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  // Saved addresses (from localStorage or mock)
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);

  // Fetch available coupons
  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await fetch('/api/coupons?action=available');
        if (res.ok) {
          const data = await res.json();
          setAvailableCoupons(data.coupons || []);
        }
      } catch {
        // ignore
      }
    };
    fetchCoupons();
  }, []);

  // Load addresses from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_ADDRESS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Address[];
        setSavedAddresses(parsed);
        const defaultAddr = parsed.find((a) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        }
      }
      // No addresses in localStorage — start empty so user can add their own
    } catch {
      // ignore
    }
  }, []);

  const itemCount = getItemCount();
  const subtotal = getTotal();
  const selectedShipping = SHIPPING_METHODS.find((m) => m.id === selectedShippingId) || SHIPPING_METHODS[0];
  const shippingCost = selectedShipping.price === 0 && selectedShippingId === 'standard'
    ? (subtotal >= SHIPPING_CONFIG.freeShippingThreshold ? 0 : 9.99)
    : selectedShipping.price;

  // Get country code from localStorage for tax calculation
  const [countryCode, setCountryCode] = useState('sa');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.country);
      if (saved) setCountryCode(saved);
    } catch {
      // ignore
    }
  }, []);

  const taxResult = calculateTax(subtotal, countryCode, undefined, currency);
  const tax = taxResult.taxAmount;
  const taxRate = taxResult.taxRate;
  const taxLabel = isRTL ? taxResult.taxLabelAr : taxResult.taxLabel;
  const isTaxExempt = taxResult.isTaxExempt;

  // Convert shipping cost to selected currency
  const shippingCostConverted = shippingCost; // Will be formatted with currency by formatPrice
  const couponDiscountConverted = couponDiscount; // Will be formatted with currency
  const total = taxResult.total + (shippingCost === 0 ? 0 : shippingCost) - couponDiscountConverted; // taxResult.total already includes subtotal+tax in target currency

  const selectedAddress = savedAddresses.find((a) => a.id === selectedAddressId);
  const selectedPayment = PAYMENT_METHODS.find((m) => m.id === selectedPaymentId);

  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  // Group items by store for review
  const groupsByStore: Record<string, { storeName: string; items: typeof items }> = {};
  items.forEach((item) => {
    if (!groupsByStore[item.storeId]) {
      groupsByStore[item.storeId] = { storeName: item.storeName, items: [] };
    }
    groupsByStore[item.storeId].items.push(item);
  });

  const saveAddressToLocalStorage = (addresses: Address[]) => {
    try {
      localStorage.setItem(LS_ADDRESS_KEY, JSON.stringify(addresses));
    } catch {
      // ignore
    }
  };

  const validateShipping = (): boolean => {
    const errors: Record<string, boolean> = {};
    if (!selectedAddressId && !showNewAddress) {
      errors.address = true;
    }
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

  const handleNextStep = () => {
    if (currentStep === 'shipping') {
      if (!validateShipping()) return;
      // Save new address if adding one
      if (showNewAddress && newAddress.name) {
        const newAddr: Address = {
          id: 'addr_' + Date.now(),
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
        const updated = [...savedAddresses, newAddr];
        setSavedAddresses(updated);
        saveAddressToLocalStorage(updated);
        setSelectedAddressId(newAddr.id);
      }
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      setCurrentStep('review');
    } else if (currentStep === 'review') {
      handlePlaceOrder();
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'payment') setCurrentStep('shipping');
    else if (currentStep === 'review') setCurrentStep('payment');
  };

  const handlePlaceOrder = async () => {
    setIsPlacingOrder(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Generate UUID-like order number
    const ordNum = 'NXM-' + crypto.randomUUID?.()?.substring(0, 8).toUpperCase() || 
      Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
    setOrderNumber(ordNum);
    setIsPlacingOrder(false);
    setCurrentStep('confirmation');
    clearCart();
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
      {STEPS.map((step, idx) => {
        const isActive = idx === stepIndex;
        const isCompleted = idx < stepIndex;
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
                  isActive ? 'text-emerald-600 dark:text-emerald-400' : isCompleted ? 'text-emerald-500' : 'text-muted-foreground'
                }`}
              >
                {isRTL ? step.labelAr : step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-8 md:w-16 mx-1 mb-5 transition-colors ${
                  idx < stepIndex ? 'bg-emerald-500' : 'bg-muted'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderShippingStep = () => (
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
        onClick={() => {
          setShowNewAddress(!showNewAddress);
          setSelectedAddressId('');
        }}
      >
        <Plus className="size-4 me-2" />
        {t('b_addNewAddress')}
      </Button>

      {/* New Address Form */}
      {showNewAddress && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs">
                  {t('b_fullName')} *
                </Label>
                <Input
                  id="name"
                  value={newAddress.name}
                  onChange={(e) => setNewAddress((p) => ({ ...p, name: e.target.value }))}
                  className={`h-9 text-sm ${validationErrors.name ? 'border-red-500' : ''}`}
                  placeholder={t('b_enterName')}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs">
                  {t('phone')} *
                </Label>
                <Input
                  id="phone"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress((p) => ({ ...p, phone: e.target.value }))}
                  className={`h-9 text-sm ${validationErrors.phone ? 'border-red-500' : ''}`}
                  placeholder="+966 5X XXX XXXX"
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label htmlFor="address1" className="text-xs">
                  {t('b_addressLine1')} *
                </Label>
                <Input
                  id="address1"
                  value={newAddress.address1}
                  onChange={(e) => setNewAddress((p) => ({ ...p, address1: e.target.value }))}
                  className={`h-9 text-sm ${validationErrors.address1 ? 'border-red-500' : ''}`}
                  placeholder={t('b_streetNumberAndHouse')}
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <Label htmlFor="address2" className="text-xs">
                  {t('b_addressLine2')}
                </Label>
                <Input
                  id="address2"
                  value={newAddress.address2}
                  onChange={(e) => setNewAddress((p) => ({ ...p, address2: e.target.value }))}
                  className="h-9 text-sm"
                  placeholder={t('b_aptSuiteEtc')}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="city" className="text-xs">
                  {t('b_city')} *
                </Label>
                <Input
                  id="city"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
                  className={`h-9 text-sm ${validationErrors.city ? 'border-red-500' : ''}`}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="state" className="text-xs">
                  {t('b_stateProvince')} *
                </Label>
                <Input
                  id="state"
                  value={newAddress.state}
                  onChange={(e) => setNewAddress((p) => ({ ...p, state: e.target.value }))}
                  className={`h-9 text-sm ${validationErrors.state ? 'border-red-500' : ''}`}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="postalCode" className="text-xs">
                  {t('b_zipPostalCode')} *
                </Label>
                <Input
                  id="postalCode"
                  value={newAddress.postalCode}
                  onChange={(e) => setNewAddress((p) => ({ ...p, postalCode: e.target.value }))}
                  className={`h-9 text-sm ${validationErrors.postalCode ? 'border-red-500' : ''}`}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  {t('b_country')} *
                </Label>
                <Select
                  value={newAddress.country}
                  onValueChange={(value) => setNewAddress((p) => ({ ...p, country: value }))}
                >
                  <SelectTrigger className={`h-9 text-sm ${validationErrors.country ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder={t('b_selectCountry')} />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {isRTL ? country.nameAr : country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
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
                  selectedShippingId === method.id
                    ? 'bg-emerald-100 dark:bg-emerald-900'
                    : 'bg-muted'
                }`}>
                  <MethodIcon className={`size-5 ${
                    selectedShippingId === method.id
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {isRTL ? method.nameAr : method.name}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />
                      {isRTL ? method.daysAr : method.days}
                    </span>
                  </div>
                </div>
                <span className={`font-semibold text-sm ${
                  isFree ? 'text-emerald-600' : ''
                }`}>
                  {isFree ? t('free') : method.price > 0 ? formatPrice(method.price, currency) : t('free')}
                </span>
              </label>
            );
          })}
        </div>
      </RadioGroup>
    </div>
  );

  const renderPaymentStep = () => (
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

  const renderReviewStep = () => (
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
                onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
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
                  {isTaxExempt ? (t('taxExempt')) : (t('noTax'))}
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
            <Shield className="size-3" />
            {t('b_pricesDisplayedIn', { currency: isRTL ? (CURRENCIES[currency]?.nameAr || currency) : (CURRENCIES[currency]?.name || currency) })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderConfirmationStep = () => (
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
        <h2 className="text-2xl font-bold mb-2">
          {t('b_orderConfirmed')}
        </h2>
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

      {/* Escrow Note */}
      <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg text-start">
        <Shield className="size-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
          {t('escrowNote')}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => nav.setView('orders')}
        >
          {t('b_viewOrders')}
        </Button>
        <Button variant="outline" onClick={() => nav.setView('shop')}>
          {t('continueShopping')}
        </Button>
      </div>
    </div>
  );

  // Empty cart redirect
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
        {currentStep === 'shipping' && renderShippingStep()}
        {currentStep === 'payment' && renderPaymentStep()}
        {currentStep === 'review' && renderReviewStep()}
        {currentStep === 'confirmation' && renderConfirmationStep()}

        {/* Navigation Buttons */}
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
              onClick={handleNextStep}
              disabled={isPlacingOrder}
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="size-4 me-2 animate-spin" />
                  {t('b_processing')}
                </>
              ) : currentStep === 'review' ? (
                <>
                  <Lock className="size-4 me-2" />
                  {t('placeOrder')}
                </>
              ) : (
                <>
                  {t('next')}
                  {isRTL ? <ArrowLeft className="size-4 ms-1" /> : <ArrowRight className="size-4 ms-1" />}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
