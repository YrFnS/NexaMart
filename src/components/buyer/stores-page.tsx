'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Star,
  Store,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n';

interface StoreData {
  id: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  slug: string;
  logo?: string | null;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  productCount: number;
  location?: string | null;
  memberSince: string;
}

interface StoresPayload {
  stores?: StoreData[];
  total?: number;
  page?: number;
  pages?: number;
  error?: string;
}

export function StoresPage() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const [stores, setStores] = useState<StoreData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState('0');
  const [verifiedOnly, setVerifiedOnly] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'products' | 'newest'>(
    'rating',
  );
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const query = new URLSearchParams({
          page: String(page),
          limit: '18',
          sort: sortBy,
        });
        if (searchQuery.trim()) query.set('search', searchQuery.trim());
        if (Number(minRating) > 0) query.set('minRating', minRating);
        if (verifiedOnly === 'verified') query.set('verified', 'true');

        const response = await fetch(`/api/stores?${query.toString()}`, {
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => ({}))) as
          StoresPayload;
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load stores.');
        }
        setStores(payload.stores || []);
        setTotal(payload.total || 0);
        setPages(Math.max(1, payload.pages || 1));
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === 'AbortError') return;
        setStores([]);
        setTotal(0);
        setPages(1);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load stores.',
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [minRating, page, reloadKey, searchQuery, sortBy, verifiedOnly]);

  function resetPage() {
    setPage(1);
  }

  return (
    <main
      className="min-h-screen bg-gradient-to-b from-amber-50/40 to-background dark:from-amber-950/10"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto max-w-6xl px-4 py-6">
        <Link
          href="/"
          className="mb-4 flex w-fit items-center gap-1 rounded-md text-sm text-muted-foreground transition-colors hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:hover:text-amber-300"
        >
          <ArrowLeft
            className={`size-4 ${isRTL ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
          {t('back')}
        </Link>

        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Store className="size-6 text-amber-600" aria-hidden="true" />
              {t('storeDirectory')}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
              {loading
                ? isRTL
                  ? 'جاري تحميل المتاجر...'
                  : 'Loading stores…'
                : isRTL
                  ? `${total.toLocaleString('ar-IQ')} متجر مطابق`
                  : `${total.toLocaleString('en-US')} matching stores`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setReloadKey((value) => value + 1)}
            disabled={loading}
          >
            <RefreshCw
              className={`me-2 size-4 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
        </div>

        <Card className="mb-6">
          <CardContent className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_10rem_11rem_10rem]">
            <div className="relative">
              <Search
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  resetPage();
                }}
                placeholder={t('searchStores')}
                className="h-11 ps-9"
              />
            </div>

            <Select
              value={minRating}
              onValueChange={(value) => {
                setMinRating(value);
                resetPage();
              }}
            >
              <SelectTrigger className="h-11" aria-label={isRTL ? 'أدنى تقييم' : 'Minimum rating'}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{isRTL ? 'كل التقييمات' : 'All ratings'}</SelectItem>
                <SelectItem value="3">3.0+</SelectItem>
                <SelectItem value="4">4.0+</SelectItem>
                <SelectItem value="4.5">4.5+</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={verifiedOnly}
              onValueChange={(value) => {
                setVerifiedOnly(value);
                resetPage();
              }}
            >
              <SelectTrigger className="h-11" aria-label={isRTL ? 'حالة التوثيق' : 'Verification filter'}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'كل المتاجر' : 'All stores'}</SelectItem>
                <SelectItem value="verified">{isRTL ? 'المتاجر الموثقة' : 'Verified stores'}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(value) => {
                setSortBy(value as typeof sortBy);
                resetPage();
              }}
            >
              <SelectTrigger className="h-11" aria-label={isRTL ? 'ترتيب المتاجر' : 'Sort stores'}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">{t('topRated')}</SelectItem>
                <SelectItem value="products">{t('mostProducts')}</SelectItem>
                <SelectItem value="newest">{t('newest')}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {error && (
          <div
            className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        {loading && stores.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => (
              <Card key={index}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stores.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
              <Store className="mb-4 size-14 text-muted-foreground/30" aria-hidden="true" />
              <h2 className="text-lg font-semibold">{t('noStoresFound')}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('tryAdjustingFilters')}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery('');
                  setMinRating('0');
                  setVerifiedOnly('all');
                  setSortBy('rating');
                  setPage(1);
                }}
              >
                {t('clearFilters')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => {
              const displayName =
                isRTL && store.nameAr ? store.nameAr : store.name;
              const description =
                isRTL && store.descriptionAr
                  ? store.descriptionAr
                  : store.description;
              return (
                <Link
                  key={store.id}
                  href={`/store/${store.id}`}
                  className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                >
                  <Card className="h-full transition-colors hover:border-amber-400 hover:bg-amber-50/40 dark:hover:border-amber-700 dark:hover:bg-amber-950/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-12 shrink-0 border border-amber-200 dark:border-amber-900">
                          <AvatarImage src={store.logo || undefined} alt="" />
                          <AvatarFallback className="bg-amber-100 font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                            {store.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h2 className="truncate text-sm font-semibold">
                              {displayName}
                            </h2>
                            {store.isVerified && (
                              <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                                <BadgeCheck className="me-1 size-3" aria-hidden="true" />
                                {t('verified')}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                            {store.rating.toFixed(1)} · {store.reviewCount}{' '}
                            {t('reviews')}
                          </p>
                        </div>
                      </div>

                      {description && (
                        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {description}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                          <Package className="size-3" aria-hidden="true" />
                          {store.productCount} {isRTL ? 'منتج' : 'products'}
                        </span>
                        {store.location && (
                          <span className="flex min-w-0 items-center gap-1">
                            <MapPin className="size-3 shrink-0" aria-hidden="true" />
                            <span className="truncate">{store.location}</span>
                          </span>
                        )}
                        <span className="ms-auto text-amber-700 dark:text-amber-300">
                          {isRTL ? (
                            <ChevronLeft className="size-4" aria-hidden="true" />
                          ) : (
                            <ChevronRight className="size-4" aria-hidden="true" />
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {pages > 1 && (
          <nav
            className="mt-7 flex items-center justify-center gap-3"
            aria-label={isRTL ? 'صفحات المتاجر' : 'Store pages'}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1 || loading}
            >
              {isRTL ? (
                <ChevronRight className="me-2 size-4" aria-hidden="true" />
              ) : (
                <ChevronLeft className="me-2 size-4" aria-hidden="true" />
              )}
              {isRTL ? 'السابق' : 'Previous'}
            </Button>
            <span className="text-sm text-muted-foreground" aria-live="polite">
              {page} / {pages}
            </span>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((value) => Math.min(pages, value + 1))}
              disabled={page >= pages || loading}
            >
              {isRTL ? 'التالي' : 'Next'}
              {isRTL ? (
                <ChevronLeft className="ms-2 size-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="ms-2 size-4" aria-hidden="true" />
              )}
            </Button>
          </nav>
        )}
      </div>
    </main>
  );
}
