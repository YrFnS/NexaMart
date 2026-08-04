'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CirclePause,
  CirclePlay,
  PackageCheck,
  ShoppingBag,
  Store,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { UI_CONFIG } from '@/lib/config';

interface HeroSlide {
  title: string;
  description: string;
  gradient: string;
  cta: string;
  ctaLink: string;
  icon: string;
}

interface HeroSectionProps {
  heroSlides: HeroSlide[];
  bestDiscount: number;
}

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeToReducedMotion(callback: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

function getReducedMotionSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerReducedMotionSnapshot() {
  return false;
}

export function HeroSection({ heroSlides, bestDiscount }: HeroSectionProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const slides = useMemo(
    () =>
      heroSlides.length > 0
        ? heroSlides
        : [
            {
              title: t('heroTitle'),
              description: t('heroDesc'),
              gradient: 'from-amber-800 via-amber-700 to-orange-700',
              cta: t('shopNow'),
              ctaLink: '/shop',
              icon: 'ShoppingBag',
            },
          ],
    [heroSlides, t],
  );
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );

  useEffect(() => {
    if (paused || prefersReducedMotion || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setCurrentSlide((current) => (current + 1) % slides.length);
    }, UI_CONFIG.carouselAutoAdvanceMs);
    return () => window.clearInterval(timer);
  }, [paused, prefersReducedMotion, slides.length]);

  const safeSlideIndex = currentSlide % slides.length;
  const slide = slides[safeSlideIndex] || slides[0];
  const PreviousIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  function previousSlide() {
    setCurrentSlide((current) =>
      (current - 1 + slides.length) % slides.length,
    );
  }

  function nextSlide() {
    setCurrentSlide((current) => (current + 1) % slides.length);
  }

  return (
    <section
      className="relative isolate min-h-[32rem] overflow-hidden"
      aria-roledescription={isRTL ? 'عارض شرائح' : 'carousel'}
      aria-label={isRTL ? 'عروض السوق' : 'Marketplace highlights'}
      onFocusCapture={() => setPaused(true)}
    >
      <Image
        src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80"
        alt=""
        fill
        preload
        className="-z-20 object-cover"
        sizes="100vw"
        quality={85}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/70 to-black/35 rtl:bg-gradient-to-l" />
      <div
        className={`absolute inset-0 -z-10 bg-gradient-to-br ${slide.gradient} opacity-20 transition-colors duration-500`}
        aria-hidden="true"
      />

      <div className="container mx-auto flex min-h-[32rem] items-center px-5 py-16 md:min-h-[36rem] md:px-8 md:py-20">
        <div className="max-w-3xl text-white">
          <div className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 text-sm font-semibold backdrop-blur">
            <ShoppingBag className="size-4 text-amber-300" aria-hidden="true" />
            <span>{t('appName')}</span>
            {bestDiscount > 0 && (
              <span className="text-amber-200">
                {isRTL
                  ? `خصومات مسجلة تصل إلى ${bestDiscount}%`
                  : `Recorded discounts up to ${bestDiscount}%`}
              </span>
            )}
          </div>

          <div
            key={safeSlideIndex}
            role="group"
            aria-roledescription={isRTL ? 'شريحة' : 'slide'}
            aria-label={
              isRTL
                ? `${safeSlideIndex + 1} من ${slides.length}`
                : `${safeSlideIndex + 1} of ${slides.length}`
            }
          >
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              {slide.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 md:text-xl md:leading-8">
              {slide.description}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="min-h-12 rounded-xl bg-amber-500 px-7 font-bold text-black hover:bg-amber-400"
              >
                <Link
                  href={slide.ctaLink || '/shop'}
                  target={slide.ctaLink.startsWith('/') ? undefined : '_blank'}
                  rel={
                    slide.ctaLink.startsWith('/')
                      ? undefined
                      : 'noopener noreferrer'
                  }
                >
                  {slide.cta}
                  {isRTL ? (
                    <ArrowLeft className="ms-2 size-5" aria-hidden="true" />
                  ) : (
                    <ArrowRight className="ms-2 size-5" aria-hidden="true" />
                  )}
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-12 rounded-xl border-white/50 bg-black/20 px-7 font-bold text-white hover:bg-white/15 hover:text-white"
              >
                <Link href="/shop?sale=true">
                  <ShoppingBag className="me-2 size-5" aria-hidden="true" />
                  {t('deals')}
                </Link>
              </Button>
            </div>
          </div>

          <div className="mt-8 grid max-w-2xl gap-3 text-sm text-white/80 sm:grid-cols-3">
            <div className="flex min-h-11 items-center gap-2">
              <Store className="size-5 shrink-0 text-amber-300" aria-hidden="true" />
              <span>{isRTL ? 'متاجر مستقلة' : 'Independent stores'}</span>
            </div>
            <div className="flex min-h-11 items-center gap-2">
              <PackageCheck
                className="size-5 shrink-0 text-amber-300"
                aria-hidden="true"
              />
              <span>{isRTL ? 'الدفع عند الاستلام' : 'Pay on delivery'}</span>
            </div>
            <div className="flex min-h-11 items-center gap-2">
              <Truck className="size-5 shrink-0 text-amber-300" aria-hidden="true" />
              <span>{isRTL ? 'تتبع تنفيذ الطلب' : 'Tracked fulfilment'}</span>
            </div>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute start-3 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full border border-white/20 bg-black/45 text-white backdrop-blur hover:bg-black/65 hover:text-white md:start-5 md:size-12"
            onClick={previousSlide}
            aria-label={isRTL ? 'الشريحة السابقة' : 'Previous slide'}
          >
            <PreviousIcon className="size-5 md:size-6" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute end-3 top-1/2 z-20 size-11 -translate-y-1/2 rounded-full border border-white/20 bg-black/45 text-white backdrop-blur hover:bg-black/65 hover:text-white md:end-5 md:size-12"
            onClick={nextSlide}
            aria-label={isRTL ? 'الشريحة التالية' : 'Next slide'}
          >
            <NextIcon className="size-5 md:size-6" aria-hidden="true" />
          </Button>

          <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-1">
            <div
              className="flex items-center rounded-full border border-white/15 bg-black/45 p-1 backdrop-blur"
              role="group"
              aria-label={isRTL ? 'شرائح العرض' : 'Hero slides'}
            >
              {slides.map((item, index) => (
                <button
                  key={`${item.title}-${index}`}
                  type="button"
                  className="flex size-11 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  onClick={() => setCurrentSlide(index)}
                  aria-label={
                    isRTL
                      ? `الانتقال إلى الشريحة ${index + 1}`
                      : `Go to slide ${index + 1}`
                  }
                  aria-current={index === safeSlideIndex ? 'true' : undefined}
                >
                  <span
                    className={`block rounded-full transition-all ${
                      index === safeSlideIndex
                        ? 'h-2.5 w-6 bg-amber-400'
                        : 'size-2.5 bg-white/50'
                    }`}
                    aria-hidden="true"
                  />
                </button>
              ))}
              <button
                type="button"
                className="flex size-11 items-center justify-center rounded-full text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => setPaused((value) => !value)}
                disabled={prefersReducedMotion}
                aria-label={
                  prefersReducedMotion
                    ? isRTL
                      ? 'العرض التلقائي متوقف حسب تفضيل تقليل الحركة'
                      : 'Automatic slides disabled by reduced-motion preference'
                    : paused
                      ? isRTL
                        ? 'تشغيل العرض التلقائي'
                        : 'Play automatic slides'
                      : isRTL
                        ? 'إيقاف العرض التلقائي'
                        : 'Pause automatic slides'
                }
                aria-pressed={paused || prefersReducedMotion}
              >
                {paused || prefersReducedMotion ? (
                  <CirclePlay className="size-5" aria-hidden="true" />
                ) : (
                  <CirclePause className="size-5" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
