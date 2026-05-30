'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  GitCompare, Plus, X, Search, Star, Truck, Package,
  ShoppingCart, Trophy, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useCartStore } from '@/stores/cart-store';
import { formatPrice } from '@/lib/currency';
import { IMAGE_SERVICES } from '@/lib/config';
import { getPlaceholderImage } from '@/lib/placeholder-image';

interface CompareProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  storeName: string;
  category: string;
  stock: number;
  hasFreeShipping: boolean;
  features: string[];
}



export function ComparePage() {
  const { t, locale } = useI18n();
  const { compareIds, toggleCompare, clearCompare } = useAppStore();
  const addItem = useCartStore((s) => s.addItem);
  const isRTL = locale === 'ar';

  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>(compareIds.length > 0 ? compareIds.slice(0, 4) : []);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await fetch('/api/products?limit=20');
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data) ? data : data.items || data.products || []);
        } else {
          setProducts([]);
        }
      } catch {
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const selectedProducts = selectedIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as CompareProduct[];

  const filteredSearchProducts = products.filter(
    (p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !selectedIds.includes(p.id)
  );

  const handleAddProduct = (id: string) => {
    if (selectedIds.length < 4 && !selectedIds.includes(id)) {
      setSelectedIds([...selectedIds, id]);
      toggleCompare(id);
    }
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleRemoveProduct = (id: string) => {
    setSelectedIds(selectedIds.filter((i) => i !== id));
    toggleCompare(id);
  };

  const handleClearAll = () => {
    setSelectedIds([]);
    clearCompare();
  };

  // Comparison rows
  const compareRows: { label: string; getValue: (p: CompareProduct) => React.ReactNode; getBest?: (products: CompareProduct[]) => string }[] = [
    {
      label: t('price'),
      getValue: (p) => (
        <div>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(p.price)}</span>
          {p.originalPrice && (
            <span className="text-xs text-muted-foreground line-through ms-1">{formatPrice(p.originalPrice)}</span>
          )}
        </div>
      ),
      getBest: (products) => {
        const minPrice = Math.min(...products.map((p) => p.price));
        return products.find((p) => p.price === minPrice)?.id || '';
      },
    },
    {
      label: t('ratings'),
      getValue: (p) => (
        <div className="flex items-center gap-1">
          <Star className="size-3.5 fill-amber-400 text-amber-400" />
          <span className="text-sm font-medium">{p.rating}</span>
          <span className="text-[10px] text-muted-foreground">({p.reviewCount})</span>
        </div>
      ),
      getBest: (products) => {
        const maxRating = Math.max(...products.map((p) => p.rating));
        return products.find((p) => p.rating === maxRating)?.id || '';
      },
    },
    {
      label: t('b_store'),
      getValue: (p) => <span className="text-sm">{p.storeName}</span>,
    },
    {
      label: t('b_category'),
      getValue: (p) => <span className="text-sm">{p.category}</span>,
    },
    {
      label: t('b_stock'),
      getValue: (p) => (
        <Badge variant={p.stock > 0 ? 'secondary' : 'destructive'} className="text-[10px]">
          {p.stock > 0 ? `${p.stock} ${t('inStock')}` : t('outOfStock')}
        </Badge>
      ),
      getBest: (products) => {
        const maxStock = Math.max(...products.map((p) => p.stock));
        return products.find((p) => p.stock === maxStock)?.id || '';
      },
    },
    {
      label: t('freeShipping'),
      getValue: (p) => p.hasFreeShipping ? (
        <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px]">
          <Truck className="size-2.5 me-0.5" /> {t('free')}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      ),
    },
    {
      label: t('features'),
      getValue: (p) => (
        <div className="flex flex-wrap gap-1">
          {p.features.map((f, i) => (
            <Badge key={i} variant="secondary" className="text-[9px]">{f}</Badge>
          ))}
        </div>
      ),
    },
  ];

  const bestIds = selectedProducts.length > 1
    ? compareRows
        .map((row) => row.getBest?.(selectedProducts))
        .filter(Boolean)
        .reduce<Record<string, number>>((acc, id) => {
          if (id) acc[id] = (acc[id] || 0) + 1;
          return acc;
        }, {})
    : {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitCompare className="size-6 text-emerald-600" />
            {t('compare')}
          </h1>
          {selectedIds.length > 0 && (
            <Button variant="outline" size="sm" className="gap-1.5 text-red-500" onClick={handleClearAll}>
              <Trash2 className="size-3.5" />
              {t('b_clearAll')}
            </Button>
          )}
        </div>

        {/* Product Slots */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }, (_, i) => {
            const product = selectedProducts[i];
            return (
              <Card
                key={i}
                className={`border-0 shadow-sm ${product ? '' : 'border-dashed border-2 border-muted-foreground/20 bg-muted/30'}`}
              >
                {product ? (
                  <CardContent className="p-3 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 end-1 size-6 z-10 text-muted-foreground hover:text-red-500"
                      onClick={() => handleRemoveProduct(product.id)}
                    >
                      <X className="size-3.5" />
                    </Button>
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-2">
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
                            img.src = getPlaceholderImage(product.category || 'electronics', product.name, 200, 200);
                          }
                        }}
                      />
                    </div>
                    <h3 className="text-xs font-medium line-clamp-2">{product.name}</h3>
                    {bestIds[product.id] && bestIds[product.id] >= 2 && (
                      <Badge className="mt-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[9px]">
                        <Trophy className="size-2.5 me-0.5" />
                        {t('bestValue')}
                      </Badge>
                    )}
                  </CardContent>
                ) : (
                  <CardContent className="p-3 flex flex-col items-center justify-center h-full min-h-[180px]">
                    <Button
                      variant="outline"
                      className="gap-1.5 text-xs h-8 rounded-lg"
                      onClick={() => setShowSearch(true)}
                    >
                      <Plus className="size-3.5" />
                      {t('addProduct')}
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* Search Overlay */}
        {showSearch && (
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="relative mb-3">
                <Search className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input
                  placeholder={t('b_searchProductsToCompare')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={isRTL ? 'pr-9' : 'pl-9'}
                  autoFocus
                />
              </div>
              {searchQuery && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {filteredSearchProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{t('noResults')}</p>
                  ) : (
                    filteredSearchProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => handleAddProduct(product.id)}
                      >
                        <div className="relative size-10 rounded-lg overflow-hidden bg-muted shrink-0">
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
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{formatPrice(product.price)}</p>
                        </div>
                        <Plus className="size-4 text-emerald-600 shrink-0" />
                      </div>
                    ))
                  )}
                </div>
              )}
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
                {t('close')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Comparison Table */}
        {selectedProducts.length >= 2 ? (
          <Card className="border-0 shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="p-3 text-start text-sm font-medium w-32">{t('b_feature')}</th>
                    {selectedProducts.map((p) => (
                      <th key={p.id} className="p-3 text-center text-sm font-medium min-w-[160px]">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row, ri) => {
                    const bestId = row.getBest?.(selectedProducts) || '';
                    return (
                      <tr key={ri} className="border-t border-border">
                        <td className="p-3 text-sm text-muted-foreground font-medium">{row.label}</td>
                        {selectedProducts.map((p) => (
                          <td
                            key={p.id}
                            className={`p-3 text-center ${bestId === p.id ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
                          >
                            {row.getValue(p)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                  {/* Action Row */}
                  <tr className="border-t border-border">
                    <td className="p-3" />
                    {selectedProducts.map((p) => (
                      <td key={p.id} className="p-3 text-center">
                        <Button
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-lg gap-1"
                          onClick={() => {
                            addItem({
                              productId: p.id,
                              name: p.name,
                              price: p.price,
                              originalPrice: p.originalPrice,
                              image: p.image,
                              quantity: 1,
                              storeId: '',
                              storeName: p.storeName,
                            });
                          }}
                        >
                          <ShoppingCart className="size-3" />
                          {t('addToCart')}
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <div className="text-center py-16">
            <GitCompare className="size-16 mx-auto text-muted-foreground/20" />
            <h3 className="text-lg font-medium mt-4">
              {t('b_addProductsToCompare')}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t('b_selectProductsToCompare')}
            </p>
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => setShowSearch(true)}>
              <Plus className="size-4" />
              {t('b_addProducts')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
