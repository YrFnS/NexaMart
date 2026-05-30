'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { GitCompare, X, Trash2, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { formatPrice } from '@/lib/currency';
import { getPlaceholderImage } from '@/lib/placeholder-image';
import { getViewUrl } from '@/lib/use-app-navigation';

interface CompareProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category?: string;
}

export function FloatingCompareBar() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const { compareIds, toggleCompare, clearCompare } = useAppStore();
  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  // Derive visibility from compareIds directly (no separate state needed)
  const isVisible = compareIds.length > 0;

  // Fetch product details for compared items
  useEffect(() => {
    if (compareIds.length === 0) return;
    let cancelled = false;
    fetch('/api/products?limit=100')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const allProducts: CompareProduct[] = (data.products || []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          name: (p.name as string) || '',
          price: (p.price as number) || 0,
          image: (p.image as string) || (p.images as string)?.[0] || '',
          category: (p.category as string) || 'electronics',
        }));
        const compareProducts = compareIds
          .map((id) => allProducts.find((p) => p.id === id))
          .filter(Boolean) as CompareProduct[];
        setProducts(compareProducts);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [compareIds]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-40 animate-in slide-in-from-bottom duration-300"
      dir={dir()}
    >
      <div className="mx-auto max-w-4xl px-4 pb-4 md:pb-6">
        <div className="bg-background/95 backdrop-blur-lg border border-border rounded-2xl shadow-2xl shadow-black/10 overflow-hidden">
          {/* Collapsed bar */}
          {!isExpanded ? (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                  <GitCompare className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm font-medium">
                  {isRTL ? `${compareIds.length} منتجات للمقارنة` : `${compareIds.length} products to compare`}
                </span>
              </div>
              <ChevronUp className="size-4 text-muted-foreground" />
            </button>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-emerald-600/10 via-teal-600/5 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                    <GitCompare className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold">
                      {isRTL ? 'مقارنة المنتجات' : 'Compare Products'}
                    </span>
                    <Badge
                      variant="secondary"
                      className="ms-2 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    >
                      {compareIds.length}/4
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 gap-1"
                    onClick={clearCompare}
                  >
                    <Trash2 className="size-3" />
                    {isRTL ? 'مسح الكل' : 'Clear All'}
                  </Button>
                </div>
              </div>

              {/* Mini product cards */}
              <div className="px-4 py-3">
                <div className="flex gap-3 overflow-x-auto scrollbar-thin">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/50 border border-border min-w-[180px] max-w-[220px] shrink-0 group"
                    >
                      {/* Product image */}
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={(e) => {
                              const img = e.currentTarget as unknown as HTMLImageElement;
                              if (!img.dataset.retried) {
                                img.dataset.retried = 'true';
                                img.src = getPlaceholderImage(product.category || 'electronics', product.name, 80, 80);
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
                            <GitCompare className="size-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        )}
                      </div>
                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium line-clamp-1">{product.name}</p>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                      {/* Remove button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => toggleCompare(product.id)}
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                  ))}

                  {/* Add more placeholder if less than 4 */}
                  {Array.from({ length: Math.max(0, 4 - products.length) }, (_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="flex items-center justify-center p-2 rounded-xl border-2 border-dashed border-muted-foreground/20 min-w-[120px] h-[56px] shrink-0"
                    >
                      <span className="text-xs text-muted-foreground">
                        {isRTL ? '+ إضافة' : '+ Add'}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Action row */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => setIsExpanded(false)}
                  >
                    {isRTL ? 'تصغير' : 'Collapse'}
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 gap-1"
                      onClick={clearCompare}
                    >
                      <Trash2 className="size-3" />
                      {isRTL ? 'مسح الكل' : 'Clear All'}
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs gap-1.5 shadow-md shadow-emerald-500/20"
                      disabled={compareIds.length < 2}
                    >
                      <Link href={getViewUrl('compare')}>
                        <GitCompare className="size-3.5" />
                        {isRTL ? 'مقارنة الآن' : 'Compare Now'}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
