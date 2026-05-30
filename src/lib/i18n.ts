'use client';

import { create } from 'zustand';
import en from './locales/en.json';
import ar from './locales/ar.json';

export type Locale = 'en' | 'ar';

interface I18nState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: () => 'ltr' | 'rtl';
}

const translations: Record<Locale, Record<string, string>> = { en, ar };

export const useI18n = create<I18nState>((set, get) => ({
  locale: 'en',
  setLocale: (locale) => {
    set({ locale });
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    }
  },
  t: (key, params) => {
    const { locale } = get();
    let text = translations[locale]?.[key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  },
  dir: () => (get().locale === 'ar' ? 'rtl' : 'ltr'),
}));
