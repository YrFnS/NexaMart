'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, ShoppingBag, Users, ShieldCheck, Package } from 'lucide-react';
import Image from 'next/image';
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

const SHOWCASE_IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80',
];

const SHOWCASE_LABELS = ['Edison Smart Watch', 'Studio Headphones', 'Polaroid Camera'];
const SHOWCASE_PRICES = ['AED 299', 'AED 449', 'AED 189'];

export function HeroSection({ heroSlides, bestDiscount }: HeroSectionProps) {
  const { t, locale } = useI18n();
  const { setView } = useAppNavigation();
  const isRTL = locale === 'ar';
  const [currentSlide, setCurrentSlide] = useState(0);

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

  const currentIndex = currentSlide % SHOWCASE_IMAGES.length;

  return (
    <section className="relative overflow-hidden w-full">
      {/* Full-width editorial background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&q=80"
          alt="Premium MENA marketplace shopping experience"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          quality={85}
        />
        {/* Overlay gradient: espresso/black at bottom to transparent at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
      </div>

      {/* Hero content */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8">
        <div className="py-16 md:py-24 lg:py-28 min-h-[520px] md:min-h-[580px] lg:min-h-[640px] flex items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">

            {/* Left side (60%) – Typography + CTA */}
            <div className="lg:col-span-3 space-y-6 md:space-y-7">
              {/* Seasonal tag */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium border border-white/10">
                <ShoppingBag className="size-4" style={{ color: '#d4a853' }} />
                <span className="text-white/90">{t('appName')}</span>
                <span style={{ color: '#d4a853' }}>◆</span>
                <span className="text-white/70 text-xs">{t('heroTitle')}</span>
              </div>

              {/* Main heading */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-white">
                {heroSlides[currentSlide].title}
              </h1>

              {/* Subheading */}
              <p className="text-lg md:text-xl text-white/80 max-w-xl leading-relaxed">
                {heroSlides[currentSlide].description}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-wrap gap-4 pt-2">
                <Button
                  size="lg"
                  className="font-bold rounded-xl px-8 h-12 shadow-lg text-black hover:brightness-110 transition-all"
                  style={{ backgroundColor: '#d4a853' }}
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
                  className="font-bold rounded-xl px-8 h-12 border-white/40 text-white bg-transparent hover:bg-white/10 backdrop-blur-sm transition-all"
                  onClick={() => setView('deals')}
                >
                  <ShoppingBag className="size-5 me-2" />
                  {t('deals')}
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-6 pt-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(212, 168, 83, 0.15)' }}>
                    <Package className="size-4" style={{ color: '#d4a853' }} />
                  </div>
                  <span className="text-white/70 text-sm font-medium">10K+ Products</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(212, 168, 83, 0.15)' }}>
                    <Users className="size-4" style={{ color: '#d4a853' }} />
                  </div>
                  <span className="text-white/70 text-sm font-medium">500+ Sellers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(212, 168, 83, 0.15)' }}>
                    <ShieldCheck className="size-4" style={{ color: '#d4a853' }} />
                  </div>
                  <span className="text-white/70 text-sm font-medium">{t('securePayments')}</span>
                </div>
              </div>
            </div>

            {/* Right side (40%) – Editorial product showcase card */}
            <div className="lg:col-span-2 hidden lg:flex justify-center items-center">
              <div className="relative">
                {/* Product card */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black/40 backdrop-blur-md w-72">
                  {/* Product image */}
                  <div className="relative h-64 w-full">
                    <Image
                      src={SHOWCASE_IMAGES[currentIndex]}
                      alt={SHOWCASE_LABELS[currentIndex]}
                      fill
                      className="object-cover transition-opacity duration-700"
                      sizes="(max-width: 768px) 100vw, 288px"
                      key={currentIndex}
                    />
                    {/* Gradient overlay on image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    {/* Price badge */}
                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1">
                      <span className="text-white font-bold text-sm">{SHOWCASE_PRICES[currentIndex]}</span>
                    </div>
                    {/* Gold accent tag */}
                    <div
                      className="absolute top-3 right-3 rounded-md px-2 py-0.5 text-xs font-bold text-black"
                      style={{ backgroundColor: '#d4a853' }}
                    >
                      {bestDiscount > 0 ? `-${bestDiscount}%` : 'NEW'}
                    </div>
                  </div>
                  {/* Card content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-white font-semibold text-sm">{SHOWCASE_LABELS[currentIndex]}</p>
                      <p className="text-white/50 text-xs mt-0.5">{t('featuredProducts')}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg key={star} className="size-3.5" style={{ color: star <= 4 ? '#d4a853' : '#444' }} viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="text-white/40 text-xs ms-1">(4.0)</span>
                    </div>
                  </div>
                </div>

                {/* Decorative gold ring */}
                <div
                  className="absolute -z-10 rounded-2xl border-2 w-72 h-80"
                  style={{
                    borderColor: 'rgba(212, 168, 83, 0.2)',
                    top: '1rem',
                    [isRTL ? 'left' : 'right']: '1rem',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Navigation Dots + Gold progress bar */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20">
        <div className="flex items-center gap-2.5">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`transition-all duration-300 rounded-full ${
                i === currentSlide
                  ? 'w-10 h-3 shadow-lg'
                  : 'w-3 h-3 bg-white/30 hover:bg-white/50 hover:scale-125'
              }`}
              style={i === currentSlide ? { backgroundColor: '#d4a853', boxShadow: '0 0 12px rgba(212, 168, 83, 0.5)' } : undefined}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        {/* Auto-advance progress bar */}
        <div className="w-32 h-0.5 rounded-full bg-white/20 overflow-hidden">
          <div
            key={currentSlide}
            className="h-full rounded-full hero-progress-bar"
            style={{
              '--carousel-duration': `${UI_CONFIG.carouselAutoAdvanceMs}ms`,
              backgroundColor: '#d4a853',
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Arrow navigation */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1/2 -translate-y-1/2 left-3 md:left-5 size-10 md:size-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white border border-white/10 z-20 transition-all duration-300 hover:scale-110"
        onClick={prevSlide}
      >
        <PrevIcon className="size-5 md:size-6" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1/2 -translate-y-1/2 right-3 md:right-5 size-10 md:size-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white border border-white/10 z-20 transition-all duration-300 hover:scale-110"
        onClick={nextSlide}
      >
        <NextIcon className="size-5 md:size-6" />
      </Button>
    </section>
  );
}
