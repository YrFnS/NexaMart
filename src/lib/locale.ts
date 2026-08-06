export type Locale = 'en' | 'ar';

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALE_COOKIE = 'nexamart_locale';
export const LOCALE_STORAGE_KEY = 'nexamart_locale';
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function normalizeLocale(value: unknown): Locale {
  return typeof value === 'string' && value.trim().toLowerCase() === 'ar'
    ? 'ar'
    : DEFAULT_LOCALE;
}

export function localeDirection(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
