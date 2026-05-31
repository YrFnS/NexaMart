'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';

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

interface CheckoutAddressFormProps {
  newAddress: NewAddressForm;
  setNewAddress: (v: NewAddressForm | ((prev: NewAddressForm) => NewAddressForm)) => void;
  validationErrors: Record<string, boolean>;
}

export function CheckoutAddressForm({ newAddress, setNewAddress, validationErrors }: CheckoutAddressFormProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs">{t('b_fullName')} *</Label>
            <Input
              id="name"
              value={newAddress.name}
              onChange={(e) => setNewAddress((p) => ({ ...p, name: e.target.value }))}
              className={`h-9 text-sm ${validationErrors.name ? 'border-red-500' : ''}`}
              placeholder={t('b_enterName')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="phone" className="text-xs">{t('phone')} *</Label>
            <Input
              id="phone"
              value={newAddress.phone}
              onChange={(e) => setNewAddress((p) => ({ ...p, phone: e.target.value }))}
              className={`h-9 text-sm ${validationErrors.phone ? 'border-red-500' : ''}`}
              placeholder="+966 5X XXX XXXX"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="address1" className="text-xs">{t('b_addressLine1')} *</Label>
            <Input
              id="address1"
              value={newAddress.address1}
              onChange={(e) => setNewAddress((p) => ({ ...p, address1: e.target.value }))}
              className={`h-9 text-sm ${validationErrors.address1 ? 'border-red-500' : ''}`}
              placeholder={t('b_streetNumberAndHouse')}
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <Label htmlFor="address2" className="text-xs">{t('b_addressLine2')}</Label>
            <Input
              id="address2"
              value={newAddress.address2}
              onChange={(e) => setNewAddress((p) => ({ ...p, address2: e.target.value }))}
              className="h-9 text-sm"
              placeholder={t('b_aptSuiteEtc')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="city" className="text-xs">{t('b_city')} *</Label>
            <Input
              id="city"
              value={newAddress.city}
              onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))}
              className={`h-9 text-sm ${validationErrors.city ? 'border-red-500' : ''}`}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="state" className="text-xs">{t('b_stateProvince')} *</Label>
            <Input
              id="state"
              value={newAddress.state}
              onChange={(e) => setNewAddress((p) => ({ ...p, state: e.target.value }))}
              className={`h-9 text-sm ${validationErrors.state ? 'border-red-500' : ''}`}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="postalCode" className="text-xs">{t('b_zipPostalCode')} *</Label>
            <Input
              id="postalCode"
              value={newAddress.postalCode}
              onChange={(e) => setNewAddress((p) => ({ ...p, postalCode: e.target.value }))}
              className={`h-9 text-sm ${validationErrors.postalCode ? 'border-red-500' : ''}`}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('b_country')} *</Label>
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
  );
}
