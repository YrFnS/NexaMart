'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

type BannerState = 'hidden' | 'offline' | 'online';

export function OfflineBanner() {
  const { t, dir } = useI18n();
  const [bannerState, setBannerState] = useState<BannerState>(() =>
    typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'hidden'
  );
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setBannerState('online');
      // Auto-dismiss the "back online" banner after 4 seconds
      setTimeout(() => {
        setBannerState('hidden');
      }, 4000);
    };

    const handleOffline = () => {
      setBannerState('offline');
      setIsDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    setBannerState('hidden');
  }, []);

  if (bannerState === 'hidden' || isDismissed) {
    return null;
  }

  const isOffline = bannerState === 'offline';

  return (
    <div
      dir={dir()}
      className={`
        fixed top-0 left-0 right-0 z-[60]
        flex items-center justify-center gap-3 px-4 py-2.5
        text-sm font-medium
        transition-transform duration-300 ease-in-out
        ${isOffline
          ? 'bg-amber-500 text-white dark:bg-amber-600'
          : 'bg-emerald-500 text-white dark:bg-emerald-600'
        }
      `}
      role="status"
      aria-live="polite"
    >
      {/* Icon */}
      {isOffline ? (
        <WifiOff className="size-4 shrink-0" />
      ) : (
        <Wifi className="size-4 shrink-0 animate-pulse" />
      )}

      {/* Message */}
      <span>
        {isOffline ? t('youAreOffline') : t('backOnline')}
        <span className="hidden sm:inline opacity-80">
          {' — '}
          {isOffline ? t('offlineDesc') : t('backOnlineDesc')}
        </span>
      </span>

      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDismiss}
        className="size-6 p-0 text-white/80 hover:text-white hover:bg-white/20 shrink-0"
        aria-label={t('close')}
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
