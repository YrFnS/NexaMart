'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { GitCompare, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { type Product } from '@/components/buyer/product-card';
import { CompareModal } from '@/components/buyer/compare-modal';

function isRenderableImage(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    (value.startsWith('/') ||
      value.startsWith('https://') ||
      value.startsWith('http://'))
  );
}

export function CompareDrawer() {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  const { compareIds, toggleCompare, clearCompare, currency } = useAppStore();
  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const products = compareIds
    .map((id) => fetchedProducts.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));

  useEffect(() => {
    if (compareIds.length === 0) {
      setFetchedProducts([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/products?ids=${encodeURIComponent(compareIds.join(','))}&limit=4`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled) setFetchedProducts(data?.products || []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [compareIds]);

  if (compareIds.length === 0) return null;

  const getImages = (product: Product): string[] => {
    try {
      const parsed = JSON.parse(product.images) as unknown;
      return Array.isArray(parsed) ? parsed.filter(isRenderableImage) : [];
    } catch {
      return [];
    }
  };

  return (
    <>
      <section
        aria-label={isRTL ? 'مقارنة المنتجات' : 'Product comparison'}
        className="nexa-compare-drawer fixed inset-x-3 z-40 animate-in slide-in-from-bottom duration-300 md:inset-x-0"
      >
        <div className="rounded-xl border border-amber-200 bg-card/95 shadow-2xl backdrop-blur-lg dark:border-amber-900 md:rounded-none md:border-x-0 md:border-b-0">
          <div className="container mx-auto flex items-center gap-3 px-3 py-2 md:px-4 md:py-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
              <GitCompare className="size-5 text-amber-700 dark:text-amber-300" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1 md:hidden">
              <p className="truncate text-sm font-semibold">
                {isRTL ? 'منتجات للمقارنة' : 'Products selected'}
              </p>
              <p className="text-xs text-muted-foreground">
                {compareIds.length}/4
              </p>
            </div>

            <div className="hidden min-w-0 flex-1 items-center gap-2 overflow-x-auto md:flex">
              {products.map((product) => {
                const images = getImages(product);
                const displayName =
                  isRTL && product.nameAr ? product.nameAr : product.name;
                return (
                  <article
                    key={product.id}
                    className="flex shrink-0 items-center gap-2 rounded-lg bg-muted/50 px-2 py-1.5"
                  >
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
                      {images[0] ? (
                        <Image
                          src={images[0]}
                          alt={displayName}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="max-w-28 min-w-0">
                      <p className="truncate text-xs font-medium">{displayName}</p>
                      <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                        {formatPrice(product.price, currency)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCompare(product.id)}
                      className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                      aria-label={
                        isRTL
                          ? `إزالة ${displayName} من المقارنة`
                          : `Remove ${displayName} from comparison`
                      }
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </article>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950 md:w-auto md:px-3"
                onClick={clearCompare}
                aria-label={isRTL ? 'مسح المقارنة' : 'Clear comparison'}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                <span className="ms-1.5 hidden md:inline">
                  {isRTL ? 'مسح الكل' : 'Clear all'}
                </span>
              </Button>
              <Button
                type="button"
                className="h-10 bg-gradient-to-r from-amber-500 to-amber-700 px-3 text-white hover:from-amber-600 hover:to-amber-800"
                onClick={() => setIsModalOpen(true)}
                disabled={compareIds.length < 2}
              >
                <GitCompare className="me-1.5 size-4" aria-hidden="true" />
                {isRTL ? 'قارن' : 'Compare'}
                <span className="ms-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                  {compareIds.length}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <CompareModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        products={products}
      />
    </>
  );
}
