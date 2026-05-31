import React from 'react';

export type CheckoutStep = 'shipping' | 'payment' | 'review' | 'confirmation';

export interface AppliedCoupon {
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

export interface AvailableCoupon {
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

export interface Address {
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

export interface PaymentMethod {
  id: string;
  name: string;
  nameAr: string;
  icon: React.ElementType;
}

export interface ShippingMethod {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  days: string;
  daysAr: string;
  icon: React.ElementType;
}

export interface CheckoutStepInfo {
  key: CheckoutStep;
  label: string;
  labelAr: string;
  icon: React.ElementType;
}
