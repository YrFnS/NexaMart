'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { GitCompare, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { type Product } from '@/components/buyer/product-card';
import { CompareModal } from '@/components/buyer/compare-modal';

export function CompareDrawer() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const { compareIds, toggleCompare, clearCompare, currency } = useAppStore();
  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Compute displayed products from fetched data, preserving compare order
  const products = compareIds.length > 0
    ? compareIds
        .map((id) => fetchedProducts.find((p) => p.id === id))
        .filter(Boolean) as Product[]
    : [];

  // Fetch product details for compared items
  useEffect(() => {
    if (compareIds.length === 0) return;
    let cancelled = false;
    const idsParam = compareIds.join(',');
    fetch(`/api/products?ids=${idsParam}&limit=4`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const allProducts: Product[] = data.products || [];
        setFetchedProducts(allProducts);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [compareIds]);

  // Auto-hide when no items
  if (compareIds.length === 0) return null;

  const getImages = (product: Product): string[] => {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) return parsed.filter((img: string) => typeof img === 'string' && img.startsWith('/'));
      return [];
    } catch {
      return [];
    }
  };

  return (
    <>
      {/* Floating compare bar at the bottom */}
      <div className="fixed bottom-0 inset-x-0 z-40 animate-in slide-in-from-bottom duration-300">
        <div className="bg-white/95 dark:bg-card/95 backdrop-blur-lg border-t border-border shadow-2xl">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              {/* Compare icon */}
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 shrink-0">
                <GitCompare className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>

              {/* Product thumbnails */}
              <div className="flex items-center gap-2 overflow-x-auto flex-1 scrollbar-thin">
                {products.map((product) => {
                  const imgs = getImages(product);
                  const displayName = isRTL && product.nameAr ? product.nameAr : product.name;
                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1.5 shrink-0 group/item"
                    >
                      {/* Thumbnail */}
                      <div className="relative w-10 h-10 rounded-md overflow-hidden bg-muted shrink-0">
                        {imgs.length > 0 ? (
                          <Image
                            src={imgs[0]}
                            alt={displayName}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              {displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Name & Price */}
                      <div className="min-w-0 max-w-[100px]">
                        <p className="text-xs font-medium truncate">{displayName}</p>
                        <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatPrice(product.price, currency)}
                        </p>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={() => toggleCompare(product.id)}
                        className="size-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors shrink-0"
                        aria-label={isRTL ? 'إزالة' : 'Remove'}
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  );
                })}

                {/* Empty slots */}
                {Array.from({ length: Math.max(0, 4 - products.length) }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="flex items-center justify-center w-24 h-12 border-2 border-dashed border-muted-foreground/20 rounded-lg shrink-0"
                  >
                    <span className="text-[10px] text-muted-foreground/50">
                      {isRTL ? `فارغ ${products.length + i + 1}` : `Slot ${products.length + i + 1}`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-800 text-xs gap-1.5"
                  onClick={clearCompare}
                >
                  <Trash2 className="size-3" />
                  {isRTL ? 'مسح الكل' : 'Clear All'}
                </Button>
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs shadow-lg shadow-emerald-500/20 gap-1.5"
                  onClick={() => setIsModalOpen(true)}
                  disabled={compareIds.length < 2}
                >
                  <GitCompare className="size-3" />
                  {isRTL ? 'قارن الآن' : 'Compare Now'}
                  <span className="bg-white/20 rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                    {compareIds.length}
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Compare Modal */}
      <CompareModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        products={products}
      />
    </>
  );
}
