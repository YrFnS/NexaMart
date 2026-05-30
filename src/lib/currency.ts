export type CurrencyCode = 'USD' | 'EUR' | 'AED' | 'SAR' | 'KWD' | 'IQD' | 'JOD' | 'QAR' | 'OMR' | 'EGP';
import { LS_KEYS } from '@/lib/config';

export interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  symbolAr: string;
  name: string;
  nameAr: string;
  exchangeRate: number;
  decimals: number;
  symbolPosition: 'before' | 'after'; // Some currencies place symbol after amount
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  USD: {
    code: 'USD',
    symbol: '$',
    symbolAr: '$',
    name: 'US Dollar',
    nameAr: 'دولار أمريكي',
    exchangeRate: 1,
    decimals: 2,
    symbolPosition: 'before',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    symbolAr: '€',
    name: 'Euro',
    nameAr: 'يورو',
    exchangeRate: 0.92,
    decimals: 2,
    symbolPosition: 'before',
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    symbolAr: 'د.إ',
    name: 'UAE Dirham',
    nameAr: 'درهم إماراتي',
    exchangeRate: 3.67,
    decimals: 2,
    symbolPosition: 'after',
  },
  SAR: {
    code: 'SAR',
    symbol: 'ر.س',
    symbolAr: 'ر.س',
    name: 'Saudi Riyal',
    nameAr: 'ريال سعودي',
    exchangeRate: 3.75,
    decimals: 2,
    symbolPosition: 'after',
  },
  KWD: {
    code: 'KWD',
    symbol: 'د.ك',
    symbolAr: 'د.ك',
    name: 'Kuwaiti Dinar',
    nameAr: 'دينار كويتي',
    exchangeRate: 0.31,
    decimals: 3,
    symbolPosition: 'before',
  },
  IQD: {
    code: 'IQD',
    symbol: 'ع.د',
    symbolAr: 'ع.د',
    name: 'Iraqi Dinar',
    nameAr: 'دينار عراقي',
    exchangeRate: 1310,
    decimals: 0,
    symbolPosition: 'after',
  },
  JOD: {
    code: 'JOD',
    symbol: 'د.ا',
    symbolAr: 'د.ا',
    name: 'Jordanian Dinar',
    nameAr: 'دينار أردني',
    exchangeRate: 0.71,
    decimals: 3,
    symbolPosition: 'before',
  },
  QAR: {
    code: 'QAR',
    symbol: 'ر.ق',
    symbolAr: 'ر.ق',
    name: 'Qatari Riyal',
    nameAr: 'ريال قطري',
    exchangeRate: 3.64,
    decimals: 2,
    symbolPosition: 'after',
  },
  OMR: {
    code: 'OMR',
    symbol: 'ر.ع',
    symbolAr: 'ر.ع',
    name: 'Omani Rial',
    nameAr: 'ريال عماني',
    exchangeRate: 0.38,
    decimals: 3,
    symbolPosition: 'before',
  },
  EGP: {
    code: 'EGP',
    symbol: 'ج.م',
    symbolAr: 'ج.م',
    name: 'Egyptian Pound',
    nameAr: 'جنيه مصري',
    exchangeRate: 48.5,
    decimals: 2,
    symbolPosition: 'after',
  },
};

/** Country code to default currency mapping */
export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyCode> = {
  jo: 'JOD',
  ae: 'AED',
  sa: 'SAR',
  iq: 'IQD',
  eg: 'EGP',
  kw: 'KWD',
  bh: 'SAR',  // Bahrain uses its own Dinar but SAR is common for GCC commerce
  om: 'OMR',
  qa: 'QAR',
  lb: 'USD',  // Lebanon - USD commonly used
  ma: 'EUR',  // Morocco - EUR commonly used
  dz: 'EUR',  // Algeria - EUR commonly used
  tn: 'EUR',  // Tunisia - EUR commonly used
  ps: 'JOD',  // Palestine - JOD commonly used
  sy: 'USD',  // Syria - USD commonly used
};

/**
 * Convert an amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode
): number {
  if (from === to) return amount;
  // Convert to USD first, then to target
  const amountInUsd = amount / CURRENCIES[from].exchangeRate;
  return amountInUsd * CURRENCIES[to].exchangeRate;
}

/**
 * Format a price amount in a given currency with proper symbol and decimals.
 * Automatically uses the currency from the app store if available.
 *
 * @param amount - The price amount (assumed to be in USD)
 * @param currency - Target currency code (default: USD)
 * @param locale - Locale for formatting ('en' or 'ar')
 */
export function formatPrice(
  amount: number,
  currency: CurrencyCode = 'USD',
  locale?: 'en' | 'ar'
): string {
  // Guard against null/undefined amounts that would crash .toFixed()
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const info = CURRENCIES[currency];
  if (!info) return `$${safeAmount.toFixed(2)}`;

  // Try to get locale from i18n store if not provided
  const effectiveLocale = locale || (typeof window !== 'undefined' ? getStoredLocale() : 'en');

  // Convert amount from USD to target currency
  const converted = convertCurrency(safeAmount, 'USD', currency);

  const symbol = effectiveLocale === 'ar' ? info.symbolAr : info.symbol;
  const formattedAmount = formatNumber(converted, info.decimals, effectiveLocale);

  if (info.symbolPosition === 'after') {
    return `${formattedAmount} ${symbol}`;
  }
  return `${symbol}${formattedAmount}`;
}

/**
 * Format price without conversion (amount already in the target currency)
 */
export function formatPriceLocal(
  amount: number,
  currency: CurrencyCode = 'USD',
  locale?: 'en' | 'ar'
): string {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const info = CURRENCIES[currency];
  if (!info) return `$${safeAmount.toFixed(2)}`;

  const effectiveLocale = locale || (typeof window !== 'undefined' ? getStoredLocale() : 'en');
  const symbol = effectiveLocale === 'ar' ? info.symbolAr : info.symbol;
  const formattedAmount = formatNumber(safeAmount, info.decimals, effectiveLocale);

  if (info.symbolPosition === 'after') {
    return `${formattedAmount} ${symbol}`;
  }
  return `${symbol}${formattedAmount}`;
}

/**
 * Format number with proper thousands separators
 */
function formatNumber(value: number, decimals: number, locale: string): string {
  const fixed = value.toFixed(decimals);
  if (locale === 'ar') {
    // Use Arabic-Indic digits for Arabic locale
    return fixed.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
  }
  // Add thousands separators for English
  const parts = fixed.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/**
 * Get stored locale from i18n Zustand store
 */
function getStoredLocale(): 'en' | 'ar' {
  try {
    // Try to read from localStorage directly (avoids Zustand hook in non-React context)
    const stored = localStorage.getItem(LS_KEYS.locale);
    if (stored === 'ar' || stored === 'en') return stored;
  } catch {
    // localStorage not available
  }
  return 'en';
}

/**
 * Get the currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: CurrencyCode, locale?: 'en' | 'ar'): string {
  const info = CURRENCIES[currency];
  if (!info) return '$';
  const effectiveLocale = locale || (typeof window !== 'undefined' ? getStoredLocale() : 'en');
  return effectiveLocale === 'ar' ? info.symbolAr : info.symbol;
}

/**
 * Get all currency codes as an array
 */
export function getCurrencyList(): CurrencyInfo[] {
  return Object.values(CURRENCIES);
}

/**
 * Get the default currency for a country code
 */
export function getCurrencyForCountry(countryCode: string): CurrencyCode {
  return COUNTRY_CURRENCY_MAP[countryCode.toLowerCase()] || 'USD';
}
