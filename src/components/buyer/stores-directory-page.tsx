'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Star,
  BadgeCheck,
  MapPin,
  Package,
  Store,
  SlidersHorizontal,
  Grid3X3,
  ArrowUpDown,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { useAppNavigation } from '@/lib/use-app-navigation';

interface StoreItem {
  id: string;
  name: string;
  nameAr: string;
  rating: number;
  productCount: number;
  isVerified: boolean;
  location: string;
  locationAr: string;
  category: string;
  categoryAr: string;
  joinedDate: string;
  gradient: string;
}

const storeCategories = [
  { en: 'Electronics', ar: 'إلكترونيات' },
  { en: 'Fashion', ar: 'أزياء' },
  { en: 'Home & Garden', ar: 'منزل وحديقة' },
  { en: 'Sports', ar: 'رياضة' },
  { en: 'Beauty', ar: 'جمال' },
  { en: 'Automotive', ar: 'سيارات' },
];



type SortOption = 'rating' | 'productCount' | 'newest';

export function StoresDirectoryPage() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const { selectStore } = useAppNavigation();

  const [stores, setStores] = useState<StoreItem[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [followedStores, setFollowedStores] = useState<Set<string>>(new Set());
  const [followBounce, setFollowBounce] = useState<string | null>(null);

  // Fetch stores from API
  useEffect(() => {
    fetch('/api/stores')
      .then((r) => r.json())
      .then((result) => {
        setStores(result.stores || result.data || result || []);
        setStoresLoading(false);
      })
      .catch(() => {
        setStores([]);
        setStoresLoading(false);
      });
  }, []);

  const filteredStores = useMemo(() => {
    let result = [...stores];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.nameAr.includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((s) => s.category === selectedCategory);
    }

    // Verified filter
    if (showVerifiedOnly) {
      result = result.filter((s) => s.isVerified);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'productCount':
          return b.productCount - a.productCount;
        case 'newest':
          return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [stores, searchQuery, selectedCategory, showVerifiedOnly, sortBy]);

  const handleVisitStore = useCallback(
    (storeId: string) => {
      selectStore(storeId);
    },
    [selectStore]
  );

  const handleToggleFollow = useCallback((e: React.MouseEvent, storeId: string) => {
    e.stopPropagation();
    setFollowedStores((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) {
        next.delete(storeId);
      } else {
        next.add(storeId);
      }
      return next;
    });
    setFollowBounce(storeId);
    setTimeout(() => setFollowBounce(null), 600);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900">
            <Store className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('storeDirectory')}</h1>
            <p className="text-sm text-muted-foreground">{t('storeDirectoryDesc')}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
          <Input
            placeholder={t('storeSearchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={isRTL ? 'pr-9' : 'pl-9'}
          />
        </div>

        {/* Category Select */}
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder={t('storeCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories')}</SelectItem>
            {storeCategories.map((cat) => (
              <SelectItem key={cat.en} value={cat.en}>
                {isRTL ? cat.ar : cat.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <ArrowUpDown className="size-4 me-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">{t('sortByRating')}</SelectItem>
            <SelectItem value="productCount">{t('sortByProductCount')}</SelectItem>
            <SelectItem value="newest">{t('sortByNewest')}</SelectItem>
          </SelectContent>
        </Select>

        {/* Verified Only Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              <SlidersHorizontal className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56" align={isRTL ? 'start' : 'end'}>
            <div className="space-y-3">
              <h4 className="font-medium text-sm">{t('filter')}</h4>
              <Separator />
              <div className="flex items-center gap-2">
                <Checkbox
                  id="verified-filter"
                  checked={showVerifiedOnly}
                  onCheckedChange={(checked) => setShowVerifiedOnly(checked === true)}
                />
                <Label htmlFor="verified-filter" className="text-sm cursor-pointer flex items-center gap-1.5">
                  <BadgeCheck className="size-4 text-emerald-500" />
                  {t('verifiedStores')}
                </Label>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filteredStores.length} {isRTL ? 'متجر' : 'stores'}
        </p>
        {showVerifiedOnly && (
          <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
            <BadgeCheck className="size-3 me-1" />
            {t('verifiedStores')}
          </Badge>
        )}
      </div>

      {/* Stores Grid */}
      {filteredStores.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="size-24 rounded-full bg-muted flex items-center justify-center">
            <Store className="size-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">{t('noStoresFound')}</h2>
          <p className="text-sm text-muted-foreground max-w-sm text-center">
            {t('noStoresFoundDesc')}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setShowVerifiedOnly(false);
            }}
          >
            {t('clearFilters')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStores.map((store) => (
            <Card
              key={store.id}
              className="hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 cursor-pointer group"
              onClick={() => handleVisitStore(store.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  {/* Store Logo - Gradient Initial */}
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${store.gradient || 'from-emerald-500 to-teal-500'} flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0 group-hover:scale-105 transition-transform duration-300`}
                  >
                    {(isRTL ? store.nameAr : store.name).charAt(0)}
                  </div>

                  {/* Store Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="font-semibold text-sm truncate">
                        {isRTL ? store.nameAr : store.name}
                      </h3>
                      {store.isVerified && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-[9px] font-medium text-emerald-700 dark:text-emerald-300">
                          <BadgeCheck className="size-3" />
                          {t('verified')}
                        </span>
                      )}
                    </div>

                    {/* Rating with stars */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`size-3 ${i < Math.floor(store.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-foreground">{(store.rating ?? 0).toFixed(1)}</span>
                    </div>

                    {/* Product Count & Location */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Package className="size-3" />
                        {store.productCount} {isRTL ? 'منتج' : 'products'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" />
                        {isRTL ? store.locationAr : store.location}
                      </span>
                    </div>

                    {/* Category + Follow Button */}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {isRTL ? store.categoryAr : store.category}
                      </Badge>
                      <button
                        onClick={(e) => handleToggleFollow(e, store.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all duration-300 ${
                          followedStores.has(store.id)
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'bg-muted/50 text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600'
                        } ${followBounce === store.id ? 'animate-follow-heart' : ''}`}
                      >
                        <Heart className={`size-3 ${followedStores.has(store.id) ? 'fill-white' : ''}`} />
                        {followedStores.has(store.id) ? (isRTL ? 'متابَع' : 'Following') : (isRTL ? 'متابعة' : 'Follow')}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
