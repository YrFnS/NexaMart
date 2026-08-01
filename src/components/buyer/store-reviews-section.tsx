'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';

interface StoreReview {
  id: string;
  userName: string;
  userAvatar: string | null;
  rating: number;
  comment: string;
  date: string;
}

interface DistributionEntry {
  count: number;
  percentage: number;
}

interface StoreReviewsResponse {
  reviews?: StoreReview[];
  total?: number;
  averageRating?: number;
  ratingDistribution?: Record<string, DistributionEntry>;
  error?: string;
}

interface StoreReviewsSectionProps {
  storeId: string;
  storeName: string;
}

export function StoreReviewsSection({
  storeId,
  storeName,
}: StoreReviewsSectionProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [total, setTotal] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [distribution, setDistribution] = useState<
    Record<string, DistributionEntry>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>(
    'recent',
  );

  const loadReviews = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError('');
      try {
        const query = new URLSearchParams({ storeId, limit: '50' });
        const response = await fetch(`/api/store-reviews?${query.toString()}`, {
          signal,
          cache: 'no-store',
        });
        const payload = (await response.json().catch(() => ({}))) as
          StoreReviewsResponse;
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load store reviews.');
        }
        setReviews(payload.reviews || []);
        setTotal(payload.total || 0);
        setAverageRating(payload.averageRating || 0);
        setDistribution(payload.ratingDistribution || {});
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === 'AbortError') return;
        setReviews([]);
        setTotal(0);
        setAverageRating(0);
        setDistribution({});
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load store reviews.',
        );
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [storeId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadReviews(controller.signal);
    return () => controller.abort();
  }, [loadReviews]);

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    if (sortBy === 'highest') {
      return sorted.sort((left, right) => right.rating - left.rating);
    }
    if (sortBy === 'lowest') {
      return sorted.sort((left, right) => left.rating - right.rating);
    }
    return sorted.sort(
      (left, right) =>
        new Date(right.date).getTime() - new Date(left.date).getTime(),
    );
  }, [reviews, sortBy]);

  function stars(rating: number, className = 'size-4') {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        aria-hidden="true"
        className={`${className} ${
          index < Math.floor(rating)
            ? 'fill-amber-400 text-amber-400'
            : 'text-muted-foreground/30'
        }`}
      />
    ));
  }

  if (loading && reviews.length === 0) {
    return (
      <div className="flex min-h-56 items-center justify-center" aria-busy="true">
        <Loader2 className="size-8 animate-spin text-amber-600" aria-hidden="true" />
      </div>
    );
  }

  return (
    <section
      className="max-w-3xl space-y-5"
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-labelledby="store-reviews-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="store-reviews-title" className="text-lg font-bold">
            {isRTL ? `تقييمات ${storeName}` : `${storeName} reviews`}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRTL
              ? 'تعرض هذه الصفحة التقييمات المحفوظة فعلياً لهذا المتجر.'
              : 'This page shows reviews actually stored for this shop.'}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadReviews()}
          disabled={loading}
        >
          <RefreshCw
            className={`me-2 size-4 ${loading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {isRTL ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {error && (
        <div
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-5">
          <div className="grid gap-5 sm:grid-cols-[11rem_minmax(0,1fr)] sm:items-center">
            <div className="text-center">
              <p className="text-5xl font-bold text-amber-700 dark:text-amber-300">
                {total > 0 ? averageRating.toFixed(1) : '—'}
              </p>
              <div
                className="mt-2 flex justify-center gap-0.5"
                aria-label={
                  total > 0
                    ? `${averageRating.toFixed(1)} / 5`
                    : isRTL
                      ? 'لا توجد تقييمات'
                      : 'No ratings'
                }
              >
                {stars(averageRating)}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {total.toLocaleString(getLocale(isRTL))} {t('reviews')}
              </p>
            </div>

            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const entry = distribution[String(rating)] || {
                  count: 0,
                  percentage: 0,
                };
                return (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-3 text-end">{rating}</span>
                    <Star
                      className="size-3.5 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                    <Progress
                      value={entry.percentage}
                      className="h-2.5 flex-1"
                      aria-label={`${rating}: ${entry.count}`}
                    />
                    <span className="w-12 text-end text-xs text-muted-foreground">
                      {entry.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {reviews.length > 0 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm text-muted-foreground">
            {isRTL ? 'ترتيب حسب' : 'Sort by'}
          </span>
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as typeof sortBy)}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">
                {isRTL ? 'الأحدث' : 'Most recent'}
              </SelectItem>
              <SelectItem value="highest">
                {isRTL ? 'الأعلى تقييماً' : 'Highest rated'}
              </SelectItem>
              <SelectItem value="lowest">
                {isRTL ? 'الأدنى تقييماً' : 'Lowest rated'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {sortedReviews.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-48 flex-col items-center justify-center text-center text-muted-foreground">
            <Star className="mb-3 size-10 opacity-40" aria-hidden="true" />
            <p className="font-medium">
              {isRTL ? 'لا توجد تقييمات لهذا المتجر.' : 'No reviews for this store yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="size-10 shrink-0">
                      <AvatarImage src={review.userAvatar || undefined} alt="" />
                      <AvatarFallback className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                        {review.userName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">
                        {review.userName}
                      </p>
                      <div
                        className="mt-0.5 flex gap-0.5"
                        aria-label={`${review.rating} / 5`}
                      >
                        {stars(review.rating, 'size-3')}
                      </div>
                    </div>
                  </div>
                  <time
                    dateTime={review.date}
                    className="shrink-0 text-xs text-muted-foreground"
                  >
                    {new Date(review.date).toLocaleDateString(
                      getLocale(isRTL),
                      {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      },
                    )}
                  </time>
                </div>
                {review.comment && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
