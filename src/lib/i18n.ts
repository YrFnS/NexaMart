'use client';

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import en from './locales/en.json';
import ar from './locales/ar.json';
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_STORAGE_KEY,
  localeDirection,
  normalizeLocale,
  type Locale,
} from './locale';

export type { Locale } from './locale';

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  dir: () => 'ltr' | 'rtl';
}

const translations: Record<Locale, Record<string, string>> = { en, ar };
const I18nContext = createContext<I18nValue | null>(null);

function persistLocale(locale: Locale) {
  if (typeof document === 'undefined') return;

  document.documentElement.lang = locale;
  document.documentElement.dir = localeDirection(locale);

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storage can be unavailable in strict privacy modes.
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(() =>
    normalizeLocale(initialLocale),
  );

  const setLocale = useCallback((nextLocale: Locale) => {
    const normalized = normalizeLocale(nextLocale);
    setLocaleState(normalized);
    persistLocale(normalized);
  }, []);

  useEffect(() => {
    const hasLocaleCookie = document.cookie
      .split(';')
      .some((entry) => entry.trim().startsWith(`${LOCALE_COOKIE}=`));

    if (!hasLocaleCookie) {
      try {
        const legacyLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
        if (legacyLocale) {
          const normalized = normalizeLocale(legacyLocale);
          if (normalized !== locale) {
            setLocaleState(normalized);
            persistLocale(normalized);
            return;
          }
        }
      } catch {
        // Ignore legacy storage migration failures.
      }
    }

    persistLocale(locale);
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      let text = translations[locale]?.[key] || translations.en[key] || key;
      if (params) {
        for (const [parameter, value] of Object.entries(params)) {
          text = text.replaceAll(`{${parameter}}`, String(value));
        }
      }
      return text;
    },
    [locale],
  );

  const dir = useCallback(() => localeDirection(locale), [locale]);
  const value = useMemo(
    () => ({ locale, setLocale, t, dir }),
    [dir, locale, setLocale, t],
  );

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider.');
  }
  return context;
}
