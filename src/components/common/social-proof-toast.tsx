'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface SocialProof {
  name: string;
  nameAr: string;
  city: string;
  cityAr: string;
  product: string;
  productAr: string;
  timeAgo: string;
  timeAgoAr: string;
}

export function SocialProofToast() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const [socialProofs, setSocialProofs] = useState<SocialProof[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [currentProof, setCurrentProof] = useState<SocialProof | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Fetch social proofs from API
  useEffect(() => {
    fetch('/api/social-proof')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.proofs && data.proofs.length > 0) {
          setSocialProofs(data.proofs);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const showRandomProof = useCallback(() => {
    if (isDismissed || socialProofs.length === 0) return;

    const randomIndex = Math.floor(Math.random() * socialProofs.length);
    setCurrentProof(socialProofs[randomIndex]);
    setIsVisible(true);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  }, [isDismissed, socialProofs]);

  useEffect(() => {
    if (!loaded || socialProofs.length === 0) return;

    // Show first proof after 10 seconds
    const initialTimer = setTimeout(() => {
      showRandomProof();
    }, 10000);

    // Then show every 15-30 seconds
    const interval = setInterval(() => {
      const delay = 15000 + Math.random() * 15000;
      setTimeout(showRandomProof, delay % 15000);
    }, 20000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [showRandomProof, loaded, socialProofs.length]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  if (!currentProof || !isVisible || isDismissed) return null;

  const name = isRTL ? currentProof.nameAr : currentProof.name;
  const city = isRTL ? currentProof.cityAr : currentProof.city;
  const product = isRTL ? currentProof.productAr : currentProof.product;
  const timeAgo = isRTL ? currentProof.timeAgoAr : currentProof.timeAgo;

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={`fixed bottom-20 md:bottom-6 ${isRTL ? 'right-4' : 'left-4'} z-40 animate-in slide-in-from-bottom-4 fade-in duration-500`}
    >
      <div className="flex items-center gap-3 bg-card/95 backdrop-blur-md border border-border rounded-xl px-4 py-3 shadow-lg shadow-black/10 max-w-sm">
        <div className="flex items-center justify-center size-9 rounded-full bg-emerald-100 dark:bg-emerald-900 shrink-0">
          <ShoppingCart className="size-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-tight">
            <span className="font-semibold">{name}</span>
            <span className="text-muted-foreground"> {t('from')} </span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{city}</span>
          </p>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {t('purchased')} <span className="font-medium text-foreground">{product}</span>
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">{timeAgo}</p>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
          aria-label="Dismiss"
        >
          <X className="size-3 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
