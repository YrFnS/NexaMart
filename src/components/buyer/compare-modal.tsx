'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Package, Award, Check, Crown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useAppStore } from '@/stores/app-store';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { type Product } from '@/components/buyer/product-card';

interface CompareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
}

type CompareRow = {
  label: string;
  labelAr: string;
  getValue: (p: Product) => string | number;
  getWinner?: (products: Product[]) => number | null; // returns index of winner, null if tie
  format?: (val: string | number) => string;
};

export function CompareModal({ open, onOpenChange, products }: CompareModalProps) {
  const { locale } = useI18n();
  const { currency } = useAppStore();
  const isRTL = locale === 'ar';

  const getImages = (product: Product): string[] => {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) return parsed.filter((img: string) => typeof img === 'string' && img.startsWith('/'));
      return [];
    } catch {
      return [];
    }
  };

  // Comparison rows definition
  const compareRows: CompareRow[] = [
    {
      label: 'Price',
      labelAr: 'السعر',
      getValue: (p) => p.price,
      getWinner: (prods) => {
        const prices = prods.map((p) => p.price);
        const min = Math.min(...prices);
        const winners = prices.filter((p) => p === min);
        return winners.length === 1 ? prices.indexOf(min) : null;
      },
      format: (val) => formatPrice(Number(val), currency),
    },
    {
      label: 'Rating',
      labelAr: 'التقييم',
      getValue: (p) => p.rating ?? 0,
      getWinner: (prods) => {
        const ratings = prods.map((p) => p.rating ?? 0);
        const max = Math.max(...ratings);
        const winners = ratings.filter((r) => r === max);
        return winners.length === 1 ? ratings.indexOf(max) : null;
      },
      format: (val) => `${Number(val).toFixed(1)} / 5`,
    },
    {
      label: 'Reviews',
      labelAr: 'التقييمات',
      getValue: (p) => p.reviewCount,
      getWinner: (prods) => {
        const reviews = prods.map((p) => p.reviewCount);
        const max = Math.max(...reviews);
        const winners = reviews.filter((r) => r === max);
        return winners.length === 1 ? reviews.indexOf(max) : null;
      },
      format: (val) => Number(val).toLocaleString(),
    },
    {
      label: 'Store',
      labelAr: 'المتجر',
      getValue: (p) => p.store?.name ?? '—',
    },
    {
      label: 'Category',
      labelAr: 'الفئة',
      getValue: (p) => {
        if (isRTL && p.category?.nameAr) return p.category.nameAr;
        return p.category?.name ?? '—';
      },
    },
    {
      label: 'Free Shipping',
      labelAr: 'شحن مجاني',
      getValue: (p) => p.hasFreeShipping ? 'yes' : 'no',
      getWinner: (prods) => {
        const hasShipping = prods.map((p) => p.hasFreeShipping);
        const trueCount = hasShipping.filter(Boolean).length;
        if (trueCount === prods.length || trueCount === 0) return null;
        return hasShipping.indexOf(true);
      },
      format: (val) => val === 'yes' ? (isRTL ? 'نعم' : 'Yes') : (isRTL ? 'لا' : 'No'),
    },
    {
      label: 'Stock',
      labelAr: 'المخزون',
      getValue: (p) => p.stock,
      getWinner: (prods) => {
        const stocks = prods.map((p) => p.stock);
        const max = Math.max(...stocks);
        const winners = stocks.filter((s) => s === max);
        return winners.length === 1 ? stocks.indexOf(max) : null;
      },
      format: (val) => Number(val) > 0 ? `${val} ${isRTL ? 'متوفر' : 'in stock'}` : (isRTL ? 'نفذ' : 'Out of stock'),
    },
    {
      label: 'Sold',
      labelAr: 'مباع',
      getValue: (p) => p.soldCount,
      getWinner: (prods) => {
        const solds = prods.map((p) => p.soldCount);
        const max = Math.max(...solds);
        const winners = solds.filter((s) => s === max);
        return winners.length === 1 ? solds.indexOf(max) : null;
      },
      format: (val) => Number(val).toLocaleString(),
    },
  ];

  if (products.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900">
              <Award className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            {isRTL ? 'مقارنة المنتجات' : 'Compare Products'}
          </DialogTitle>
          <DialogDescription>
            {isRTL
              ? `مقارنة ${products.length} منتج جنباً إلى جنب`
              : `Compare ${products.length} products side by side`}
          </DialogDescription>
        </DialogHeader>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Product Headers */}
            <thead>
              <tr>
                <th className="p-3 text-start border-b border-border bg-muted/30 w-36 shrink-0">
                  <span className="text-sm font-medium text-muted-foreground">
                    {isRTL ? 'المعيار' : 'Feature'}
                  </span>
                </th>
                {products.map((product) => {
                  const imgs = getImages(product);
                  const displayName = isRTL && product.nameAr ? product.nameAr : product.name;
                  return (
                    <th key={product.id} className="p-3 text-center border-b border-border min-w-[180px]">
                      <Link
                        href={`/product/${product.id}`}
                        className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity"
                        onClick={() => onOpenChange(false)}
                      >
                        {/* Product image */}
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted mx-auto">
                          {imgs.length > 0 ? (
                            <Image
                              src={imgs[0]}
                              alt={displayName}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900">
                              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                {displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-semibold line-clamp-1 max-w-[160px]">
                          {displayName}
                        </span>
                      </Link>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row, rowIdx) => {
                const winnerIdx = row.getWinner?.(products);
                return (
                  <tr key={rowIdx} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 text-start border-b border-border bg-muted/10">
                      <span className="text-sm font-medium text-muted-foreground">
                        {isRTL ? row.labelAr : row.label}
                      </span>
                    </td>
                    {products.map((product, pIdx) => {
                      const rawVal = row.getValue(product);
                      const displayVal = row.format ? row.format(rawVal) : String(rawVal);
                      const isWinner = winnerIdx === pIdx;

                      return (
                        <td
                          key={product.id}
                          className={`p-3 text-center border-b border-border transition-colors ${
                            isWinner
                              ? 'bg-emerald-50 dark:bg-emerald-950/30'
                              : ''
                          }`}
                        >
                          <div className={`flex items-center justify-center gap-1.5 ${
                            isWinner ? 'text-emerald-700 dark:text-emerald-300' : ''
                          }`}>
                            {isWinner && (
                              <Crown className="size-3.5 text-emerald-500 shrink-0" />
                            )}
                            {/* Special rendering for rating */}
                            {row.label === 'Rating' ? (
                              <div className="flex items-center gap-1">
                                <div className="flex items-center">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Star
                                      key={i}
                                      className={`size-3 ${
                                        i < Math.floor(product.rating ?? 0)
                                          ? 'fill-amber-400 text-amber-400'
                                          : 'text-muted-foreground/20'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-sm font-semibold">{(product.rating ?? 0).toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className={`text-sm ${isWinner ? 'font-bold' : ''}`}>
                                {displayVal}
                              </span>
                            )}
                            {isWinner && row.label === 'Free Shipping' && (
                              <Check className="size-3.5 text-emerald-500 shrink-0" />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Features comparison row */}
        <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Package className="size-4 text-emerald-600 dark:text-emerald-400" />
            {isRTL ? 'ملخص سريع' : 'Quick Summary'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {products.map((product) => {
              const displayName = isRTL && product.nameAr ? product.nameAr : product.name;
              const bestPrice = products.every((p) => product.price <= p.price);
              const bestRating = products.every((p) => (product.rating ?? 0) >= (p.rating ?? 0));
              const mostReviews = products.every((p) => product.reviewCount >= p.reviewCount);
              const mostStock = products.every((p) => product.stock >= p.stock);

              return (
                <div key={product.id} className="p-3 rounded-lg bg-card border border-border">
                  <p className="text-sm font-semibold mb-2 truncate">{displayName}</p>
                  <div className="space-y-1.5">
                    {bestPrice && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                        <Crown className="size-3 text-emerald-500" />
                        {isRTL ? 'أفضل سعر' : 'Best Price'}
                      </div>
                    )}
                    {bestRating && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                        <Crown className="size-3 text-emerald-500" />
                        {isRTL ? 'أعلى تقييم' : 'Highest Rating'}
                      </div>
                    )}
                    {mostReviews && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                        <Crown className="size-3 text-emerald-500" />
                        {isRTL ? 'أكثر تقييمات' : 'Most Reviews'}
                      </div>
                    )}
                    {mostStock && (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-300">
                        <Crown className="size-3 text-emerald-500" />
                        {isRTL ? 'أكثر مخزون' : 'Most Stock'}
                      </div>
                    )}
                    {!bestPrice && !bestRating && !mostReviews && !mostStock && (
                      <p className="text-xs text-muted-foreground">
                        {isRTL ? 'لا يتميز في أي فئة' : 'No leading category'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
