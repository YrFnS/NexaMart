'use client';

import React, { useEffect, useState } from 'react';
import { Cookie, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/lib/i18n';
import { LS_KEYS } from '@/lib/config';

const CONSENT_KEY = LS_KEYS.cookieConsent;

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

type ConsentState = 'undecided' | 'accepted' | 'rejected' | 'customized';

function getStoredConsent(): {
  state: ConsentState;
  preferences: CookiePreferences;
} | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function CookieConsentBanner() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    if (getStoredConsent()) return;
    const timer = window.setTimeout(() => setVisible(true), 800);
    return () => window.clearTimeout(timer);
  }, []);

  const saveConsent = (state: ConsentState, prefs = preferences) => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ state, preferences: prefs }));
    } catch {
      // Consent remains session-only when storage is unavailable.
    }
    setVisible(false);
  };

  if (!visible) return null;

  const preferenceRows = [
    {
      key: 'analytics' as const,
      label: t('analyticsCookies'),
      description: t('analyticsCookiesDesc'),
    },
    {
      key: 'marketing' as const,
      label: t('marketingCookies'),
      description: t('marketingCookiesDesc'),
    },
    {
      key: 'functional' as const,
      label: t('functionalCookies'),
      description: t('functionalCookiesDesc'),
    },
  ];

  return (
    <section
      className="nexa-cookie-banner fixed inset-x-0 z-[60] animate-slide-up"
      dir={isRTL ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="mx-auto max-w-3xl px-4 pb-4 md:pb-4">
        <div className="relative rounded-2xl border border-amber-200 bg-card p-5 shadow-2xl dark:border-amber-900 md:p-6">
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="absolute end-3 top-3 flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t('close')}
          >
            <X className="size-4" aria-hidden="true" />
          </button>

          <div className="mb-4 flex items-start gap-3 pe-10">
            <div className="shrink-0 rounded-xl bg-amber-100 p-2 dark:bg-amber-950">
              <Cookie className="size-5 text-amber-700 dark:text-amber-300" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 id="cookie-consent-title" className="mb-1 text-sm font-semibold">
                {t('weUseCookies')}
              </h2>
              <p id="cookie-consent-description" className="text-xs leading-relaxed text-muted-foreground">
                {t('cookieDesc')}
              </p>
            </div>
          </div>

          {showCustomize && (
            <div className="mb-4 space-y-3 rounded-xl bg-muted/50 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{t('essentialCookies')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('essentialCookiesDesc')}
                  </p>
                </div>
                <Switch checked disabled aria-label={t('essentialCookies')} />
              </div>

              {preferenceRows.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{row.label}</p>
                    <p className="text-xs text-muted-foreground">{row.description}</p>
                  </div>
                  <Switch
                    checked={preferences[row.key]}
                    aria-label={row.label}
                    onCheckedChange={(checked) =>
                      setPreferences((current) => ({
                        ...current,
                        [row.key]: checked,
                      }))
                    }
                  />
                </div>
              ))}

              <div className="mt-1 flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300">
                <Shield className="size-3" aria-hidden="true" />
                <span>{t('privacyProtected')}</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setShowCustomize((current) => !current)}
              className="min-h-10 text-start text-xs font-medium text-amber-700 hover:underline dark:text-amber-300"
            >
              {showCustomize ? t('hideOptions') : t('customizePreferences')}
            </button>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10 text-xs"
                onClick={() =>
                  saveConsent('rejected', {
                    essential: true,
                    analytics: false,
                    marketing: false,
                    functional: false,
                  })
                }
              >
                {t('rejectAll')}
              </Button>
              <Button
                type="button"
                size="sm"
                className="min-h-10 bg-amber-600 text-xs text-white hover:bg-amber-700"
                onClick={() =>
                  showCustomize
                    ? saveConsent('customized')
                    : saveConsent('accepted', {
                        essential: true,
                        analytics: true,
                        marketing: true,
                        functional: true,
                      })
                }
              >
                {showCustomize ? t('savePreferences') : t('acceptAll')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
