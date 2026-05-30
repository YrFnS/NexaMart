'use client';

import { useEffect } from 'react';
import { useI18n } from '@/lib/i18n';

export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();

  useEffect(() => {
    const html = document.documentElement;
    const isRTL = locale === 'ar';
    html.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    html.setAttribute('lang', locale);
  }, [locale]);

  return <>{children}</>;
}
