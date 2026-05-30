'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Store, Star, Search, MapPin, BadgeCheck, Package, ArrowLeft,
  Filter, ChevronRight, X, SlidersHorizontal, Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { useAppNavigation, getViewUrl } from '@/lib/use-app-navigation';
import { MENA_CITIES } from '@/lib/reference-data';

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  productCount: number;
  category?: string;
  location?: string;
  createdAt: string;
  owner?: {
    name: string;
    avatar?: string;
  };
}

const storeLocations = MENA_CITIES.map(c => ({ id: c.value, name: c.label, nameAr: c.labelAr }));



export function StoresPage() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const { selectStore } = useAppNavigation();

  const [stores, setStores] = useState<StoreData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'products' | 'newest'>('rating');
  const [showFilters, setShowFilters] = useState(false);
  const [followedStores, setFollowedStores] = useState<Set<string>>(new Set());
  const [followBounce, setFollowBounce] = useState<string | null>(null);
  const [storeCategories, setStoreCategories] = useState<{id: string; name: string; nameAr: string}[]>([]);

  // Fetch categories from API
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        const cats = Array.isArray(data) ? data : [];
        setStoreCategories(cats.map((c: {id: string; name: string; nameAr?: string; slug: string}) => ({
          id: c.slug || c.id,
          name: c.name,
          nameAr: c.nameAr || c.name,
        })));
      })
      .catch(() => {});
  }, []);

  // Fetch stores from API
  useEffect(() => {
    const fetchStores = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (selectedCategory) params.set('category', selectedCategory);
        if (selectedRating > 0) params.set('minRating', String(selectedRating));
        if (verifiedOnly) params.set('verified', 'true');
        params.set('sort', sortBy);

        const res = await fetch(`/api/stores?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setStores(data.stores || data.data || []);
        } else {
          setStores([]);
        }
      } catch {
        setStores([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStores();
  }, [searchQuery, selectedCategory, selectedRating, verifiedOnly, sortBy]);

  // Client-side filtering for mock data fields (category, location, verified)
  const filteredStores = useMemo(() => {
    return stores.filter((store) => {
      if (searchQuery && !store.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedCategory && store.category !== selectedCategory) return false;
      if (selectedRating > 0 && store.rating < selectedRating) return false;
      if (verifiedOnly && !store.isVerified) return false;
      return true;
    });
  }, [stores, searchQuery, selectedCategory, selectedRating, verifiedOnly]);

  const activeFilterCount = [
    selectedCategory !== null,
    selectedRating > 0,
    verifiedOnly,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedCategory(null);
    setSelectedRating(0);
    setVerifiedOnly(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <Link
          href={getViewUrl('home')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald-600 transition-colors mb-4"
        >
          <ArrowLeft className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
          {t('back')}
        </Link>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Store className="size-6 text-emerald-600" />
              {t('storeDirectory')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {`${filteredStores.length} ${t('verifiedStoresCount')}`}
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchStores')}
              className={`${isRTL ? 'pr-9' : 'pl-9'} h-11 rounded-xl`}
            />
          </div>
          <Button
            variant="outline"
            className={`gap-1.5 h-11 ${activeFilterCount > 0 ? 'border-emerald-300 text-emerald-600' : ''}`}
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline">{t('filters')}</span>
            {activeFilterCount > 0 && (
              <Badge className="bg-emerald-600 text-white text-[9px] size-5 p-0 flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'rating' | 'products' | 'newest')}>
            <SelectTrigger className="w-[150px] h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">
                {t('topRated')}
              </SelectItem>
              <SelectItem value="products">
                {t('mostProducts')}
              </SelectItem>
              <SelectItem value="newest">
                {t('newest')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            {selectedCategory && (
              <Badge className="gap-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 cursor-pointer" onClick={() => setSelectedCategory(null)}>
                {storeCategories.find((c) => c.id === selectedCategory)?.[isRTL ? 'nameAr' : 'name']}
                <X className="size-3" />
              </Badge>
            )}
            {selectedRating > 0 && (
              <Badge className="gap-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 cursor-pointer" onClick={() => setSelectedRating(0)}>
                <Star className="size-3 fill-amber-500 text-amber-500" />
                {selectedRating}+
                <X className="size-3" />
              </Badge>
            )}
            {verifiedOnly && (
              <Badge className="gap-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 cursor-pointer" onClick={() => setVerifiedOnly(false)}>
                <BadgeCheck className="size-3" />
                {t('verified')}
                <X className="size-3" />
              </Badge>
            )}
            <Button variant="ghost" size="sm" className="text-xs text-red-500" onClick={clearAllFilters}>
              {t('clearAll')}
            </Button>
          </div>
        )}

        {/* Stores Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-16 text-center">
              <Store className="size-16 mx-auto text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {t('noStoresFound')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('tryAdjustingFilters')}
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={clearAllFilters}>
                {t('clearFilters')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStores.map((store) => (
              <Card
                key={store.id}
                className="border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                onClick={() => selectStore(store.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="size-12 border-2 border-emerald-100 dark:border-emerald-900">
                      <AvatarImage src={store.logo} />
                      <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-lg">
                        {store.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-semibold truncate">{store.name}</h3>
                        {store.isVerified && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-[9px] font-medium text-emerald-700 dark:text-emerald-300">
                            <BadgeCheck className="size-3" />
                            {t('verified')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`size-3 ${i < Math.floor(store.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-semibold">{(store.rating ?? 0).toFixed(1)}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ({store.reviewCount})
                        </span>
                      </div>
                    </div>
                  </div>

                  {store.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {store.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <Package className="size-2.5" />
                      {store.productCount} {t('products')}
                    </Badge>
                    {store.category && (
                      <Badge variant="outline" className="text-[10px]">
                        {storeCategories.find((c) => c.id === store.category)?.[isRTL ? 'nameAr' : 'name'] || store.category}
                      </Badge>
                    )}
                    {store.location && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="size-2.5" />
                        {storeLocations.find((l) => l.id === store.location)?.[isRTL ? 'nameAr' : 'name'] || store.location}
                      </span>
                    )}
                    {/* Follow Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFollowedStores((prev) => {
                          const next = new Set(prev);
                          if (next.has(store.id)) next.delete(store.id); else next.add(store.id);
                          return next;
                        });
                        setFollowBounce(store.id);
                        setTimeout(() => setFollowBounce(null), 600);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all duration-300 ${
                        followedStores.has(store.id)
                          ? 'bg-emerald-500 text-white shadow-md'
                          : 'bg-muted/50 text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600'
                      } ${followBounce === store.id ? 'animate-follow-heart' : ''}`}
                    >
                      <Heart className={`size-3 ${followedStores.has(store.id) ? 'fill-white' : ''}`} />
                      {followedStores.has(store.id) ? t('following') : t('follow')}
                    </button>
                  </div>

                  <div className="flex items-center justify-end mt-3">
                    <ChevronRight className={`size-4 text-muted-foreground group-hover:text-emerald-500 transition-colors ${isRTL ? 'rotate-180' : ''}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Filter Sheet */}
      <Sheet open={showFilters} onOpenChange={setShowFilters}>
        <SheetContent side={isRTL ? 'right' : 'left'} className="w-80">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Filter className="size-4 text-emerald-600" />
              {t('filterStores')}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Category Filter */}
            <div>
              <h4 className="text-sm font-medium mb-3">{t('category')}</h4>
              <div className="flex flex-wrap gap-2">
                {storeCategories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600'
                    }`}
                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  >
                    {isRTL ? cat.nameAr : cat.name}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Rating Filter */}
            <div>
              <h4 className="text-sm font-medium mb-3">{t('minimumRating')}</h4>
              <div className="flex gap-2">
                {[0, 3, 3.5, 4, 4.5].map((rating) => (
                  <button
                    key={rating}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                      selectedRating === rating
                        ? 'bg-emerald-600 text-white'
                        : 'bg-muted/50 text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                    }`}
                    onClick={() => setSelectedRating(selectedRating === rating ? 0 : rating)}
                  >
                    {rating === 0 ? (
                      t('all')
                    ) : (
                      <>
                        <Star className="size-2.5 fill-amber-400 text-amber-400" />
                        {rating}+
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Verified Filter */}
            <div>
              <button
                className={`w-full px-4 py-3 rounded-xl text-sm transition-colors flex items-center gap-2 ${
                  verifiedOnly
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted/50 text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                }`}
                onClick={() => setVerifiedOnly(!verifiedOnly)}
              >
                <BadgeCheck className="size-4" />
                {t('verifiedStoresOnly')}
              </button>
            </div>

            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setShowFilters(false)}
            >
              {t('applyFilters')}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
