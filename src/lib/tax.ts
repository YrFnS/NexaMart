import type { CurrencyCode } from './currency';
import { convertCurrency } from './currency';

export interface TaxResult {
  taxRate: number;
  taxAmount: number;
  total: number;
  taxLabel: string;
  taxLabelAr: string;
  isTaxExempt: boolean;
}

export interface CountryTaxInfo {
  countryCode: string;
  countryName: string;
  countryNameAr: string;
  vatRate: number; // Percentage (e.g., 5 for 5%)
  vatLabel: string;
  vatLabelAr: string;
  taxExemptCategories: string[]; // Category IDs that are tax-exempt
}

/**
 * VAT/Tax rates by country
 */
export const COUNTRY_TAX_RATES: Record<string, CountryTaxInfo> = {
  ae: {
    countryCode: 'ae',
    countryName: 'UAE',
    countryNameAr: 'الإمارات',
    vatRate: 5,
    vatLabel: 'VAT',
    vatLabelAr: 'ضريبة القيمة المضافة',
    taxExemptCategories: ['food-staples', 'education', 'healthcare', 'residential-rent'],
  },
  sa: {
    countryCode: 'sa',
    countryName: 'Saudi Arabia',
    countryNameAr: 'السعودية',
    vatRate: 15,
    vatLabel: 'VAT',
    vatLabelAr: 'ضريبة القيمة المضافة',
    taxExemptCategories: ['food-staples', 'education', 'healthcare', 'residential-rent'],
  },
  kw: {
    countryCode: 'kw',
    countryName: 'Kuwait',
    countryNameAr: 'الكويت',
    vatRate: 0,
    vatLabel: 'Tax',
    vatLabelAr: 'ضريبة',
    taxExemptCategories: [],
  },
  iq: {
    countryCode: 'iq',
    countryName: 'Iraq',
    countryNameAr: 'العراق',
    vatRate: 0,
    vatLabel: 'Tax',
    vatLabelAr: 'ضريبة',
    taxExemptCategories: [],
  },
  jo: {
    countryCode: 'jo',
    countryName: 'Jordan',
    countryNameAr: 'الأردن',
    vatRate: 16,
    vatLabel: 'VAT',
    vatLabelAr: 'ضريبة القيمة المضافة',
    taxExemptCategories: ['food-staples', 'education', 'healthcare', 'books', 'residential-rent'],
  },
  qa: {
    countryCode: 'qa',
    countryName: 'Qatar',
    countryNameAr: 'قطر',
    vatRate: 0,
    vatLabel: 'Tax',
    vatLabelAr: 'ضريبة',
    taxExemptCategories: [],
  },
  om: {
    countryCode: 'om',
    countryName: 'Oman',
    countryNameAr: 'عمان',
    vatRate: 5,
    vatLabel: 'VAT',
    vatLabelAr: 'ضريبة القيمة المضافة',
    taxExemptCategories: ['food-staples', 'education', 'healthcare', 'residential-rent'],
  },
  eg: {
    countryCode: 'eg',
    countryName: 'Egypt',
    countryNameAr: 'مصر',
    vatRate: 14,
    vatLabel: 'VAT',
    vatLabelAr: 'ضريبة القيمة المضافة',
    taxExemptCategories: ['food-staples', 'education', 'healthcare', 'books', 'residential-rent'],
  },
  bh: {
    countryCode: 'bh',
    countryName: 'Bahrain',
    countryNameAr: 'البحرين',
    vatRate: 5,
    vatLabel: 'VAT',
    vatLabelAr: 'ضريبة القيمة المضافة',
    taxExemptCategories: ['food-staples', 'education', 'healthcare', 'residential-rent'],
  },
  lb: {
    countryCode: 'lb',
    countryName: 'Lebanon',
    countryNameAr: 'لبنان',
    vatRate: 11,
    vatLabel: 'VAT',
    vatLabelAr: 'ضريبة القيمة المضافة',
    taxExemptCategories: ['food-staples', 'education', 'healthcare', 'books'],
  },
  ma: {
    countryCode: 'ma',
    countryName: 'Morocco',
    countryNameAr: 'المغرب',
    vatRate: 20,
    vatLabel: 'VAT',
    vatLabelAr: 'ضريبة القيمة المضافة',
    taxExemptCategories: ['food-staples', 'education', 'healthcare', 'books'],
  },
  dz: {
    countryCode: 'dz',
    countryName: 'Algeria',
    countryNameAr: 'الجزائر',
    vatRate: 19,
    vatLabel: 'VAT',
    vatLabelAr: 'ضريبة القيمة المضافة',
    taxExemptCategories: ['food-staples', 'education', 'healthcare', 'books'],
  },
  tn: {
    countryCode: 'tn',
    countryName: 'Tunisia',
    countryNameAr: 'تونس',
    vatRate: 19,
    vatLabel: 'VAT',
    vatLabelAr: 'ضريبة القيمة المضافة',
    taxExemptCategories: ['food-staples', 'education', 'healthcare', 'books'],
  },
  ps: {
    countryCode: 'ps',
    countryName: 'Palestine',
    countryNameAr: 'فلسطين',
    vatRate: 16,
    vatLabel: 'VAT',
    vatLabelAr: 'ضريبة القيمة المضافة',
    taxExemptCategories: ['food-staples', 'education', 'healthcare', 'books'],
  },
  sy: {
    countryCode: 'sy',
    countryName: 'Syria',
    countryNameAr: 'سوريا',
    vatRate: 0,
    vatLabel: 'Tax',
    vatLabelAr: 'ضريبة',
    taxExemptCategories: [],
  },
};

/**
 * Calculate tax for a given subtotal, country, and optional category.
 *
 * @param subtotal - The subtotal amount in USD
 * @param countryCode - The country code (e.g., 'ae', 'sa')
 * @param category - Optional category ID to check for tax exemption
 * @param currency - Optional currency code for the returned amounts (default: USD)
 * @returns TaxResult with tax rate, amount, total, and labels
 */
export function calculateTax(
  subtotal: number,
  countryCode: string,
  category?: string,
  currency: CurrencyCode = 'USD'
): TaxResult {
  const taxInfo = COUNTRY_TAX_RATES[countryCode.toLowerCase()];

  if (!taxInfo) {
    // Default: no tax for unknown countries
    return {
      taxRate: 0,
      taxAmount: 0,
      total: subtotal,
      taxLabel: 'Tax',
      taxLabelAr: 'ضريبة',
      isTaxExempt: false,
    };
  }

  // Check if category is tax-exempt
  const isExempt = category
    ? taxInfo.taxExemptCategories.some(
        (exempt) =>
          category.toLowerCase() === exempt ||
          category.toLowerCase().includes(exempt) ||
          exempt.includes(category.toLowerCase())
      )
    : false;

  const taxRate = isExempt ? 0 : taxInfo.vatRate;
  const taxAmount = subtotal * (taxRate / 100);
  // Convert to target currency
  const convertedSubtotal = convertCurrency(subtotal, 'USD', currency);
  const convertedTaxAmount = convertCurrency(taxAmount, 'USD', currency);
  const convertedTotal = convertedSubtotal + convertedTaxAmount;

  return {
    taxRate,
    taxAmount: convertedTaxAmount,
    total: convertedTotal,
    taxLabel: taxInfo.vatLabel,
    taxLabelAr: taxInfo.vatLabelAr,
    isTaxExempt: isExempt,
  };
}

/**
 * Get tax rate for a country
 */
export function getTaxRate(countryCode: string): number {
  const taxInfo = COUNTRY_TAX_RATES[countryCode.toLowerCase()];
  return taxInfo ? taxInfo.vatRate : 0;
}

/**
 * Check if a category is tax-exempt in a given country
 */
export function isTaxExempt(countryCode: string, category: string): boolean {
  const taxInfo = COUNTRY_TAX_RATES[countryCode.toLowerCase()];
  if (!taxInfo) return false;
  return taxInfo.taxExemptCategories.some(
    (exempt) =>
      category.toLowerCase() === exempt ||
      category.toLowerCase().includes(exempt) ||
      exempt.includes(category.toLowerCase())
  );
}

/**
 * Get tax info label for display
 */
export function getTaxLabel(countryCode: string, locale: 'en' | 'ar' = 'en'): string {
  const taxInfo = COUNTRY_TAX_RATES[countryCode.toLowerCase()];
  if (!taxInfo) return locale === 'ar' ? 'ضريبة' : 'Tax';
  return locale === 'ar' ? taxInfo.vatLabelAr : taxInfo.vatLabel;
}
