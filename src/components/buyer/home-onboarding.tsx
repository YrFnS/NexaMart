'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const OnboardingFlow = dynamic(
  () =>
    import('@/components/common/onboarding-flow').then((module) => ({
      default: module.OnboardingFlow,
    })),
  { ssr: false },
);

const ONBOARDING_KEY = 'nexamart_onboarding_dismissed';

export function HomeOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    try {
      if (window.localStorage.getItem(ONBOARDING_KEY)) return;
      const timer = window.setTimeout(() => setShowOnboarding(true), 1_500);
      return () => window.clearTimeout(timer);
    } catch {
      return;
    }
  }, []);

  function completeOnboarding() {
    try {
      window.localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // The flow may still be dismissed when storage is unavailable.
    }
    setShowOnboarding(false);
  }

  return showOnboarding ? (
    <OnboardingFlow onComplete={completeOnboarding} />
  ) : null;
}
