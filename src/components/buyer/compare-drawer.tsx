'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { GitCompare, Trash2, X } from 'lucide-react';
import { CompareModal } from '@/components/buyer/compare-modal';
import type { Product } from '@/components/buyer/product-card';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/currency';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';

function productImages(product: Product): string[] {
  try {
    const images = JSON.parse(product.images) as unknown;
    return Array.isArray(images)
      ? images.filter(
          (value): value is string =>
            typeof value === 'string' &&
            (value.startsWith('/') || value.startsWith('https://')),
        )
      : [];
  } catch {
    return [];
  }
}

export function CompareDrawer() {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  const { compareIds, toggleCompare, clearCompare, currency } = useAppStore();
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (compareIds.length === 0) return;

    const controller = new AbortController();
    fetch(`/api/products?ids=${encodeURIComponent(compareIds.join(','))}&limit=4`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (!controller.signal.aborted) setCatalog(payload?.products || []);
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [compareIds]);

  if (compareIds.length === 0) return null;

  const products = compareIds
    .map((id) => catalog.find((product) => product.id === id))
    .filter((product): product is Product => Boolean(product));

  return (
    <>
      <section
        aria-label={isRTL ? 'مقارنة المنتجات' : 'Product comparison'}
        className="nexa-compare-drawer fixed inset-x-3 z-40 animate-in slide-in-from-bottom duration-300 md:inset-x-0"
      >
        <div className="rounded-xl border border-amber-200 bg-card/95 shadow-2xl backdrop-blur-lg dark:border-amber-900 md:rounded-none md:border-x-0 md:border-b-0">
          <div className="container mx-auto flex items-center gap-3 px-3 py-2 md:px-4 md:py-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
              <GitCompare aria-hidden="true" className="size-5 text-amber-700 dark:text-amber-300" />
            </div>

            <div className="min-w-0 flex-1 md:hidden">
              <p className="truncate text-sm font-semibold">
                {isRTL ? 'منتجات للمقارنة' : 'Products selected'}
              </p>
              <p className="text-xs text-muted-foreground">{compareIds.length}/4</p>
            </div>

            <div className="hidden min-w-0 flex-1 items-center gap-2 overflow-x-auto md:flex">
              {products.map((product) => {
                const name = isRTL && product.nameAr ? product.nameAr : product.name;
                const image = productImages(product)[0];
                return (
                  <article key={product.id} className="flex shrink-0 items-center gap-2 rounded-lg bg-muted/50 px-2 py-1.5">
                    <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-amber-100 dark:bg-amber-950">
                      {image ? (
                        <Image src={image} alt={name} fill sizes="40px" className="object-cover" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-xs font-bold text-amber-700 dark:text-amber-300">
                          {name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="max-w-28 min-w-0">
                      <p className="truncate text-xs font-medium">{name}</p>
                      <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                        {formatPrice(product.price, currency)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCompare(product.id)}
                      aria-label={isRTL ? `إزالة ${name}` : `Remove ${name}`}
                      className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                    >
                      <X aria-hidden="true" className="size-3.5" />
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
                className="size-10 border-red-200 text-red-600 md:w-auto md:px-3"
                onClick={clearCompare}
                aria-label={isRTL ? 'مسح المقارنة' : 'Clear comparison'}
              >
                <Trash2 aria-hidden="true" className="size-4" />
                <span className="ms-1.5 hidden md:inline">{isRTL ? 'مسح الكل' : 'Clear all'}</span>
              </Button>
              <Button
                type="button"
                className="h-10 bg-gradient-to-r from-amber-500 to-amber-700 px-3 text-white"
                onClick={() => setModalOpen(true)}
                disabled={compareIds.length < 2}
              >
                <GitCompare aria-hidden="true" className="me-1.5 size-4" />
                {isRTL ? 'قارن' : 'Compare'}
                <span className="ms-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">
                  {compareIds.length}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <CompareModal open={modalOpen} onOpenChange={setModalOpen} products={products} />
    </>
  );
}
