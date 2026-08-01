'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';

export function BackToTop() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const compareActive = useAppStore((state) => state.compareIds.length > 0);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 500);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(1, scrollY / docHeight) : 0);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const size = 48;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - scrollProgress * circumference;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={t('backToTop')}
      data-compare-active={compareActive ? 'true' : 'false'}
      className={`nexa-floating-secondary fixed z-40 rounded-full transition-all duration-300 ease-out ${
        isRTL ? 'right-4' : 'left-4'
      } ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
      }`}
    >
      <svg
        width={size}
        height={size}
        aria-hidden="true"
        className="rotate-[-90deg] drop-shadow-lg"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-amber-200 dark:text-amber-950"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#nexaAmberGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-150 ease-out"
        />
        <defs>
          <linearGradient id="nexaAmberGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/30 transition-transform hover:scale-105">
          <ArrowUp className="size-5" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}
