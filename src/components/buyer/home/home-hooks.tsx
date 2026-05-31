'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

// --- Intersection Observer Hook for Section Animations ---
export function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// --- Section with entrance animation ---
export function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, isInView } = useInView(0.05);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'} ${className}`}
    >
      {children}
    </div>
  );
}

// --- Scrollable Section with scroll buttons ---
export function ScrollableSection({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.7;
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="relative group/scroll">
      {/* Left scroll indicator */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-white/90 dark:bg-card/90 shadow-lg border border-border flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300 hover:bg-white dark:hover:bg-card hover:shadow-xl"
          aria-label="Scroll left"
        >
          <ChevronLeft className="size-4 text-foreground" />
        </button>
      )}

      <div ref={scrollRef} className="overflow-x-auto scrollbar-thin pb-2">
        <div className="flex gap-4">
          {children}
        </div>
      </div>

      {/* Right scroll indicator */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-white/90 dark:bg-card/90 shadow-lg border border-border flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300 hover:bg-white dark:hover:bg-card hover:shadow-xl"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-4 text-foreground" />
        </button>
      )}
    </div>
  );
}

// --- Section Header with title, icon, and optional action ---
export function SectionHeader({
  title,
  icon: Icon,
  actionLabel,
  onAction,
  isRTL,
}: {
  title: string;
  icon: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
  isRTL?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {/* Decorative emerald accent line */}
        <div className="w-1 h-8 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500 shrink-0" />
        <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/70">
          <Icon className="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>
        </div>
      </div>
      {actionLabel && onAction && (
        <Button
          variant="ghost"
          size="sm"
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-all duration-200 group/viewall"
          onClick={onAction}
        >
          {actionLabel}
          {isRTL ? (
            <ArrowLeft className="size-4 ms-1 transition-transform group-hover/viewall:-translate-x-0.5" />
          ) : (
            <ArrowRight className="size-4 ms-1 transition-transform group-hover/viewall:translate-x-0.5" />
          )}
        </Button>
      )}
    </div>
  );
}

// --- Flip Clock Countdown Digit ---
export function FlipDigit({ value, label, prevValue }: { value: number; label: string; prevValue: number }) {
  const changed = prevValue !== value;
  return (
    <div className="relative min-w-[50px]">
      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center overflow-hidden" style={{ perspective: '200px' }}>
        <span className={`text-xl font-bold block leading-none ${changed ? 'animate-flip' : ''}`}>
          {String(value).padStart(2, '0')}
        </span>
        <span className="text-[10px] text-white/70">
          {label === 'hours' ? 'H' : label === 'minutes' ? 'M' : 'S'}
        </span>
      </div>
    </div>
  );
}

// --- Animated Counter Hook ---
export function useCounter(target: number, duration: number = 2000, start: boolean = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    let animationFrame: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * target));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, start]);
  return count;
}
