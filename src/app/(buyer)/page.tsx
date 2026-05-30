'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const HomePage = dynamic(
  () => import('@/components/buyer/home-page').then(mod => ({ default: mod.HomePage })),
  {
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    ),
  }
);

const OnboardingFlow = dynamic(
  () => import('@/components/common/onboarding-flow').then(mod => ({ default: mod.OnboardingFlow })),
  { ssr: false }
);

const ONBOARDING_KEY = 'nexamart_onboarding_dismissed';

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const onboardingChecked = useRef(false);

  useEffect(() => {
    if (onboardingChecked.current) return;
    onboardingChecked.current = true;

    try {
      const dismissed = localStorage.getItem(ONBOARDING_KEY);
      if (!dismissed) {
        const timer = setTimeout(() => {
          setShowOnboarding(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage not available (SSR) - default to not showing
    }
  }, []);

  const handleOnboardingComplete = () => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // localStorage not available
    }
    setShowOnboarding(false);
  };

  return (
    <>
      <HomePage />
      {showOnboarding && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}
    </>
  );
}
