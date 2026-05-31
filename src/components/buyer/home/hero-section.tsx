'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, Sparkles, Zap, TrendingUp, Flame, ShoppingBag, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useAppNavigation } from '@/lib/use-app-navigation';
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

export function HeroSection({ heroSlides, bestDiscount }: HeroSectionProps) {
  const { t, locale } = useI18n();
  const { setView } = useAppNavigation();
  const isRTL = locale === 'ar';
  const [currentSlide, setCurrentSlide] = useState(0);

  const iconMap: Record<string, React.ElementType> = {
    Sparkles, Zap, TrendingUp, Flame, ShoppingBag, Star: Sparkles,
    Gift: ShoppingBag, Globe: TrendingUp,
  };

  // Auto-advance hero
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, UI_CONFIG.carouselAutoAdvanceMs);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
  const NextIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <section className="relative overflow-hidden container mx-auto px-4">
      {/* Hero Banner Carousel */}
      {heroSlides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-all duration-800 ease-in-out ${
            i === currentSlide ? 'opacity-100 scale-100 hero-slide-enter' : 'opacity-0 scale-105 hero-slide-exit'
          }`}
          aria-hidden={i !== currentSlide}
        >
          <div className={`relative bg-gradient-to-br ${slide.gradient} h-full w-full`}>
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            }} />
          </div>
        </div>
      ))}

      {/* Particle/Sparkle overlay */}
      <div className="absolute inset-0 z-[2] pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="hero-sparkle"
            style={{
              left: `${5 + (i * 4.7) % 90}%`,
              top: `${10 + (i * 7.3) % 80}%`,
              '--sparkle-duration': `${2 + (i % 4)}s`,
              '--sparkle-delay': `${(i * 0.3) % 3}s`,
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              opacity: 0.4 + (i % 5) * 0.1,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Vignette effect */}
      <div className="hero-vignette" />

      {/* Hero content - sits on top of slides */}
      <div className="relative z-10">
        <div className="px-6 py-14 md:px-12 lg:px-16 md:py-20 lg:py-24 text-white min-h-[340px] md:min-h-[440px] lg:min-h-[480px] flex items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Text content */}
            <div className="space-y-5 md:space-y-6">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium">
                {React.createElement(iconMap[heroSlides[currentSlide].icon] || Sparkles, { className: 'size-4 text-emerald-200' })}
                <span className="text-white/95">{t('appName')}</span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow-sm">
                {heroSlides[currentSlide].title}
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-lg leading-relaxed font-medium">
                {heroSlides[currentSlide].description}
              </p>
              <div className="flex flex-wrap gap-4 pt-3">
                <Button
                  size="lg"
                  className="glassmorphism-btn text-white font-bold rounded-xl px-8 h-12 shadow-lg"
                  onClick={() => {
                    const link = heroSlides[currentSlide]?.ctaLink || '/shop';
                    if (link.startsWith('/')) {
                      setView(link.slice(1) as 'shop' | 'deals');
                    } else {
                      window.open(link, '_blank');
                    }
                  }}
                >
                  {heroSlides[currentSlide].cta}
                  {isRTL ? (
                    <ArrowLeft className="size-5 ms-2" />
                  ) : (
                    <ArrowRight className="size-5 ms-2" />
                  )}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="glassmorphism-btn text-white font-bold rounded-xl px-8 h-12"
                  onClick={() => setView('deals')}
                >
                  <Flame className="size-5 me-2" />
                  {t('deals')}
                </Button>
              </div>
            </div>

            {/* Right: Floating product showcase cards */}
            <div className="hidden lg:flex justify-center items-center relative">
              <div className="relative">
                {/* Main floating card */}
                <div className="bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/25 shadow-2xl w-72 animate-float-slow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <ShoppingBag className="size-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{t('featuredProducts')}</p>
                      <p className="text-white/60 text-xs">{t('aiPowered')}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[0, 1, 2].map((idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white/10 rounded-lg p-2.5">
                        <div className="w-9 h-9 rounded-md bg-white/20 flex items-center justify-center shrink-0">
                          <Package className="size-4 text-white/70" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="h-2.5 bg-white/25 rounded-full w-3/4" />
                          <div className="h-2 bg-white/15 rounded-full w-1/2 mt-1.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Small floating badge */}
                <div className="absolute -top-4 -right-4 bg-white/20 backdrop-blur-md rounded-xl px-3 py-2 border border-white/30 shadow-lg animate-float-delayed">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-emerald-300" />
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                </div>

                {/* Small floating discount badge */}
                <div className="absolute -bottom-3 -left-3 bg-white/20 backdrop-blur-md rounded-xl px-3 py-2 border border-white/30 shadow-lg animate-float">
                  <div className="flex items-center gap-1.5">
                    <Flame className="size-3.5 text-orange-300" />
                    <span className="text-white text-xs font-bold">{bestDiscount > 0 ? `-${bestDiscount}%` : ''}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Navigation Dots + Progress Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
        <div className="flex items-center gap-2.5">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`transition-all duration-300 rounded-full ${
                i === currentSlide
                  ? 'w-10 h-3 bg-white shadow-lg shadow-white/40'
                  : 'w-3 h-3 bg-white/40 hover:bg-white/60 hover:scale-125'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        {/* Auto-advance progress bar */}
        <div className="w-32 h-0.5 rounded-full bg-white/20 overflow-hidden">
          <div
            key={currentSlide}
            className="hero-progress-bar"
            style={{ '--carousel-duration': `${UI_CONFIG.carouselAutoAdvanceMs}ms` } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Scroll down indicator */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 opacity-60">
        <span className="text-white/70 text-[10px] tracking-widest uppercase font-medium">{isRTL ? 'مرر للأسفل' : 'Scroll'}</span>
        <svg className="animate-scroll-bounce size-4 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 13l5 5 5-5" />
          <path d="M7 6l5 5 5-5" />
        </svg>
      </div>

      {/* Arrows */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1/2 -translate-y-1/2 left-3 md:left-5 size-10 md:size-12 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white border-none z-20 transition-all duration-300 hover:scale-110"
        onClick={prevSlide}
      >
        <PrevIcon className="size-5 md:size-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1/2 -translate-y-1/2 right-3 md:right-5 size-10 md:size-12 rounded-full bg-black/20 hover:bg-black/40 backdrop-blur-sm text-white border-none z-20 transition-all duration-300 hover:scale-110"
        onClick={nextSlide}
      >
        <NextIcon className="size-5 md:size-6" />
      </Button>
    </section>
  );
}
