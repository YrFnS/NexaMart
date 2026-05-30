'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { LS_KEYS } from '@/lib/config';
import { getCurrencyForCountry } from '@/lib/currency';

interface Country {
  code: string;
  flag: string;
  nameEn: string;
  nameAr: string;
  productCount: number;
}

const countries: Country[] = [
  { code: 'jo', flag: '🇯🇴', nameEn: 'Jordan', nameAr: 'الأردن', productCount: 12400 },
  { code: 'ae', flag: '🇦🇪', nameEn: 'UAE', nameAr: 'الإمارات', productCount: 28300 },
  { code: 'sa', flag: '🇸🇦', nameEn: 'Saudi Arabia', nameAr: 'السعودية', productCount: 35100 },
  { code: 'iq', flag: '🇮🇶', nameEn: 'Iraq', nameAr: 'العراق', productCount: 8700 },
  { code: 'eg', flag: '🇪🇬', nameEn: 'Egypt', nameAr: 'مصر', productCount: 19800 },
  { code: 'kw', flag: '🇰🇼', nameEn: 'Kuwait', nameAr: 'الكويت', productCount: 9500 },
  { code: 'bh', flag: '🇧🇭', nameEn: 'Bahrain', nameAr: 'البحرين', productCount: 5200 },
  { code: 'om', flag: '🇴🇲', nameEn: 'Oman', nameAr: 'عمان', productCount: 6300 },
  { code: 'qa', flag: '🇶🇦', nameEn: 'Qatar', nameAr: 'قطر', productCount: 7100 },
  { code: 'lb', flag: '🇱🇧', nameEn: 'Lebanon', nameAr: 'لبنان', productCount: 4600 },
  { code: 'ma', flag: '🇲🇦', nameEn: 'Morocco', nameAr: 'المغرب', productCount: 11200 },
  { code: 'dz', flag: '🇩🇿', nameEn: 'Algeria', nameAr: 'الجزائر', productCount: 7800 },
  { code: 'tn', flag: '🇹🇳', nameEn: 'Tunisia', nameAr: 'تونس', productCount: 3400 },
  { code: 'ps', flag: '🇵🇸', nameEn: 'Palestine', nameAr: 'فلسطين', productCount: 2800 },
  { code: 'sy', flag: '🇸🇾', nameEn: 'Syria', nameAr: 'سوريا', productCount: 3100 },
];

// Export countries array for reuse
export { countries };
export type { Country };

export function CountrySelector() {
  const { locale, dir } = useI18n();
  const { setCurrency } = useAppStore();
  const isRTL = dir() === 'rtl';
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.country);
      if (saved) {
        const found = countries.find(c => c.code === saved);
        if (found) return found;
      }
    } catch {
      // localStorage not available
    }
    return countries[0];
  });

  const handleSelect = (country: Country) => {
    setSelectedCountry(country);
    try {
      localStorage.setItem(LS_KEYS.country, country.code);
    } catch {
      // localStorage not available
    }
    // Auto-switch currency based on country
    const newCurrency = getCurrencyForCountry(country.code);
    setCurrency(newCurrency);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-sm">
          <span className="text-base">{selectedCountry.flag}</span>
          <span className="hidden sm:inline max-w-[80px] truncate">
            {isRTL ? selectedCountry.nameAr : selectedCountry.nameEn}
          </span>
          <Globe className="size-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-64 max-h-80 overflow-y-auto">
        {countries.map((country) => (
          <DropdownMenuItem
            key={country.code}
            onClick={() => handleSelect(country)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{country.flag}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {isRTL ? country.nameAr : country.nameEn}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {country.productCount.toLocaleString()} {isRTL ? 'منتج' : 'products'}
                </span>
              </div>
            </div>
            {selectedCountry.code === country.code && (
              <Check className="size-4 text-emerald-500 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
