'use client';

import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Sparkles,
  Store,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { LS_KEYS } from '@/lib/config';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const steps = [
  {
    titleKey: 'onboardingStep1Title',
    descKey: 'onboardingStep1Desc',
    icon: ShoppingBag,
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-50 via-teal-50 to-cyan-50',
    darkBgGradient: 'dark:from-emerald-950/50 dark:via-teal-950/50 dark:to-cyan-950/50',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    titleKey: 'onboardingStep2Title',
    descKey: 'onboardingStep2Desc',
    icon: Sparkles,
    gradient: 'from-teal-500 to-cyan-600',
    bgGradient: 'from-teal-50 via-cyan-50 to-sky-50',
    darkBgGradient: 'dark:from-teal-950/50 dark:via-cyan-950/50 dark:to-sky-950/50',
    iconBg: 'bg-teal-100 dark:bg-teal-900',
    iconColor: 'text-teal-600 dark:text-teal-400',
  },
  {
    titleKey: 'onboardingStep3Title',
    descKey: 'onboardingStep3Desc',
    icon: Store,
    gradient: 'from-cyan-500 to-blue-600',
    bgGradient: 'from-cyan-50 via-blue-50 to-indigo-50',
    darkBgGradient: 'dark:from-cyan-950/50 dark:via-blue-950/50 dark:to-indigo-950/50',
    iconBg: 'bg-cyan-100 dark:bg-cyan-900',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
  },
];

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const [currentStep, setCurrentStep] = useState(0);

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  const handleNext = () => {
    if (isLastStep) {
      localStorage.setItem(LS_KEYS.onboarded, 'true');
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(LS_KEYS.onboarded, 'true');
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`relative w-full max-w-md bg-gradient-to-br ${step.bgGradient} ${step.darkBgGradient} rounded-2xl shadow-2xl overflow-hidden`}>
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 end-4 p-1.5 rounded-full bg-white/50 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 transition-colors z-10"
          aria-label={t('skip')}
        >
          <X className="size-4 text-muted-foreground" />
        </button>

        {/* Illustration area */}
        <div className="relative flex items-center justify-center py-12 px-6">
          {/* Decorative circles */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full bg-white/20" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-56 h-56 rounded-full bg-white/10" />
          </div>

          {/* Icon */}
          <div className={`relative p-6 rounded-2xl ${step.iconBg} shadow-lg`}>
            <Icon className={`size-16 ${step.iconColor}`} />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 text-center space-y-3">
          <h2 className="text-xl md:text-2xl font-bold">
            {t(step.titleKey)}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {t(step.descKey)}
          </p>

          {/* Dot indicators */}
          <div className="flex items-center justify-center gap-2 pt-4">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === currentStep
                    ? `w-8 h-2 bg-gradient-to-r ${step.gradient}`
                    : 'w-2 h-2 bg-muted-foreground/20 hover:bg-muted-foreground/40'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              variant="ghost"
              className="flex-1 text-muted-foreground"
              onClick={handleSkip}
            >
              {t('skip')}
            </Button>
            <Button
              className={`flex-1 bg-gradient-to-r ${step.gradient} text-white shadow-md`}
              onClick={handleNext}
            >
              {isLastStep ? t('getStarted') : t('next')}
              <NextIcon className="size-4 ms-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
