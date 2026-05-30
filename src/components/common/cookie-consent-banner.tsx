'use client';

import React, { useState, useEffect } from 'react';
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

function getStoredConsent(): { state: ConsentState; preferences: CookiePreferences } | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return null;
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
    const stored = getStoredConsent();
    if (!stored) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (state: ConsentState, prefs?: CookiePreferences) => {
    const data = { state, preferences: prefs || preferences };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
    setVisible(false);
  };

  const handleAcceptAll = () => {
    saveConsent('accepted', {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    });
  };

  const handleRejectAll = () => {
    saveConsent('rejected', {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    });
  };

  const handleCustomize = () => {
    saveConsent('customized');
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 animate-slide-up"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mx-4 mb-[5.5rem] md:mb-4 max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-5 md:p-6">
          {/* Close button */}
          <button
            onClick={() => setVisible(false)}
            className="absolute top-3 end-3 text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t('close')}
          >
            <X className="size-4" />
          </button>

          {/* Icon + Message */}
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900 shrink-0">
              <Cookie className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                {t('weUseCookies')}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t('cookieDesc')}
              </p>
            </div>
          </div>

          {/* Customize Panel */}
          {showCustomize && (
            <div className="mb-4 p-4 bg-muted/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {t('essentialCookies')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('essentialCookiesDesc')}
                  </p>
                </div>
                <Switch checked disabled />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {t('analyticsCookies')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('analyticsCookiesDesc')}
                  </p>
                </div>
                <Switch
                  checked={preferences.analytics}
                  onCheckedChange={(c) => setPreferences((p) => ({ ...p, analytics: c }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {t('marketingCookies')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('marketingCookiesDesc')}
                  </p>
                </div>
                <Switch
                  checked={preferences.marketing}
                  onCheckedChange={(c) => setPreferences((p) => ({ ...p, marketing: c }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {t('functionalCookies')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('functionalCookiesDesc')}
                  </p>
                </div>
                <Switch
                  checked={preferences.functional}
                  onCheckedChange={(c) => setPreferences((p) => ({ ...p, functional: c }))}
                />
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                <Shield className="size-3" />
                <span>
                  {t('privacyProtected')}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <button
              onClick={() => setShowCustomize(!showCustomize)}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium text-start"
            >
              {showCustomize
                ? t('hideOptions')
                : t('customizePreferences')}
            </button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={handleRejectAll}
              >
                {t('rejectAll')}
              </Button>
              {showCustomize ? (
                <Button
                  size="sm"
                  className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleCustomize}
                >
                  {t('savePreferences')}
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleAcceptAll}
                >
                  {t('acceptAll')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
