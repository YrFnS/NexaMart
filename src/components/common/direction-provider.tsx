'use client';

import type { ReactNode } from 'react';
import { I18nProvider } from '@/lib/i18n';
import type { Locale } from '@/lib/locale';

export function DirectionProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale: Locale;
}) {
  return (
    <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>
  );
}
