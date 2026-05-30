'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';
import { useRecentlyViewedStore } from '@/stores/recently-viewed-store';
import { ProductCard, type Product } from '@/components/buyer/product-card';

export function RecentlyViewedSection() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const { productIds, clearHistory } = useRecentlyViewedStore();

  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Compute displayed products from fetched data, filtered by current IDs
  const products = productIds.length >= 2
    ? productIds.slice(0, 20)
        .map((id) => fetchedProducts.find((p) => p.id === id))
        .filter(Boolean) as Product[]
    : [];

  // Fetch product details by IDs from the API
  useEffect(() => {
    if (productIds.length < 2) return;
    let cancelled = false;
    const idsParam = productIds.slice(0, 20).join(',');
    fetch(`/api/products?ids=${idsParam}&limit=20`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const allProducts: Product[] = data.products || [];
        setFetchedProducts(allProducts);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [productIds]);

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
  }, [checkScroll, products]);

  // Re-check scroll after products load
  useEffect(() => {
    if (products.length > 0) {
      setTimeout(checkScroll, 100);
    }
  }, [products, checkScroll]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.7;
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  };

  // Only show when there are 2+ recently viewed products
  if (products.length < 2) return null;

  return (
    <section className="container mx-auto px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500 shrink-0" />
          <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900">
            <Clock className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              {isRTL ? 'تابع من حيث توقفت' : 'Continue Where You Left Off'}
            </h2>
          </div>
          <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {products.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 gap-1.5"
          onClick={clearHistory}
        >
          <Trash2 className="size-3.5" />
          {isRTL ? 'مسح السجل' : 'Clear History'}
        </Button>
      </div>

      {/* Horizontal Scrollable with scroll indicators */}
      <div className="relative group/scroll">
        {/* Left scroll indicator */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-white/90 dark:bg-card/90 shadow-lg border border-border flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300 hover:bg-white dark:hover:bg-card hover:shadow-xl"
            aria-label="Scroll left"
          >
            {isRTL ? <ChevronRight className="size-4 text-foreground" /> : <ChevronLeft className="size-4 text-foreground" />}
          </button>
        )}

        <div ref={scrollRef} className="overflow-x-auto scrollbar-thin pb-2">
          <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
            {products.map((product) => (
              <div key={product.id} className="w-48 md:w-56 flex-shrink-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        {/* Right scroll indicator */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 size-9 rounded-full bg-white/90 dark:bg-card/90 shadow-lg border border-border flex items-center justify-center opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300 hover:bg-white dark:hover:bg-card hover:shadow-xl"
            aria-label="Scroll right"
          >
            {isRTL ? <ChevronLeft className="size-4 text-foreground" /> : <ChevronRight className="size-4 text-foreground" />}
          </button>
        )}
      </div>
    </section>
  );
}
