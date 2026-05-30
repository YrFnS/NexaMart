'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Star, ThumbsUp, ArrowLeft, Filter, ChevronDown, ShoppingBag, Calendar,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { getViewUrl } from '@/lib/use-app-navigation';
import { formatPrice } from '@/lib/currency';

interface UserReview {
  id: string;
  productName: string;
  productNameAr: string;
  productImage: string;
  productPrice: number;
  rating: number;
  reviewText: string;
  reviewTextAr?: string;
  date: string;
  helpfulCount: number;
  isVerified: boolean;
  hasImages: boolean;
}


export function MyReviewsPage() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'helpful'>('date');
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/reviews');
        if (res.ok) {
          const data = await res.json();
          const mapped = (Array.isArray(data) ? data : []).map((r: Record<string, unknown>) => ({
            id: (r.id as string) || '',
            productName: (r.productName as string) || (r.product?.name as string) || 'Product',
            productNameAr: (r.productNameAr as string) || (r.product?.nameAr as string) || '',
            productImage: (r.productImage as string) || '',
            productPrice: (r.productPrice as number) || (r.product?.price as number) || 0,
            rating: (r.rating as number) || 0,
            reviewText: (r.comment as string) || '',
            reviewTextAr: (r.commentAr as string) || '',
            date: r.createdAt ? new Date(r.createdAt as string).toISOString().split('T')[0] : (r.date as string) || '',
            helpfulCount: (r.helpfulCount as number) || 0,
            isVerified: (r.isVerified as boolean) || false,
            hasImages: (r.hasImages as boolean) || false,
          }));
          setReviews(mapped);
        }
      } catch {
        // API error — leave empty
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const filteredReviews = useMemo(() => {
    let filtered = [...reviews];
    if (ratingFilter !== null) {
      filtered = filtered.filter((r) => r.rating === ratingFilter);
    }
    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      filtered.sort((a, b) => b.helpfulCount - a.helpfulCount);
    }
    return filtered;
  }, [reviews, ratingFilter, sortBy]);

  const ratingDistribution = useMemo(() => {
    const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      dist[r.rating] = (dist[r.rating] || 0) + 1;
    });
    return dist;
  }, [reviews]);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return '0.0';
    const total = reviews.reduce((sum, r) => sum + r.rating, 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <Link
          href={getViewUrl('profile')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald-600 transition-colors mb-4"
        >
          <ArrowLeft className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
          {t('back')}
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <MessageSquare className="size-6 text-emerald-600" />
          {isRTL ? 'تقييماتي ومراجعاتي' : 'My Reviews & Ratings'}
        </h1>

        {/* Stats Card */}
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Average Rating */}
              <div className="text-center">
                <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                  {avgRating}
                </div>
                <div className="flex items-center gap-0.5 justify-center mt-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`size-4 ${
                        i < Math.round(Number(avgRating))
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {reviews.length} {isRTL ? 'تقييم' : 'reviews'}
                </p>
              </div>

              <Separator orientation="vertical" className="hidden sm:block h-20" />

              {/* Rating Distribution */}
              <div className="flex-1 w-full space-y-1.5">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <button
                    key={stars}
                    className={`flex items-center gap-2 w-full p-1.5 rounded-lg transition-colors ${
                      ratingFilter === stars
                        ? 'bg-emerald-50 dark:bg-emerald-950/30'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setRatingFilter(ratingFilter === stars ? null : stars)}
                  >
                    <span className="text-xs font-medium w-3">{stars}</span>
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{
                          width: `${reviews.length > 0 ? (ratingDistribution[stars] / reviews.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-5 text-end">
                      {ratingDistribution[stars]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter & Sort */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isRTL ? `${filteredReviews.length} تقييم` : `${filteredReviews.length} reviews`}
            </span>
            {ratingFilter && (
              <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] gap-1 cursor-pointer" onClick={() => setRatingFilter(null)}>
                {ratingFilter} <Star className="size-2.5 fill-emerald-600 text-emerald-600" />
                <span className="ms-0.5">✕</span>
              </Badge>
            )}
          </div>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'date' | 'helpful')}>
            <SelectTrigger className="w-[140px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">
                {isRTL ? 'الأحدث' : 'Most Recent'}
              </SelectItem>
              <SelectItem value="helpful">
                {isRTL ? 'الأكثر فائدة' : 'Most Helpful'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="py-16 text-center">
              <Star className="size-16 mx-auto text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {isRTL ? 'لا توجد تقييمات' : 'No reviews found'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {ratingFilter
                  ? isRTL
                    ? `لا توجد تقييمات بـ ${ratingFilter} نجوم`
                    : `No ${ratingFilter}-star reviews found`
                  : isRTL
                  ? 'لم تكتب أي تقييمات بعد'
                  : "You haven't written any reviews yet"}
              </p>
              {ratingFilter && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setRatingFilter(null)}
                >
                  {isRTL ? 'عرض الكل' : 'Show All'}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <Card key={review.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center shrink-0">
                      <ShoppingBag className="size-8 text-emerald-300 dark:text-emerald-700" />
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-medium truncate">
                            {isRTL ? review.productNameAr : review.productName}
                          </h3>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {formatPrice(review.productPrice)}
                          </p>
                        </div>
                        {review.isVerified && (
                          <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] shrink-0">
                            {isRTL ? 'شراء موثق' : 'Verified'}
                          </Badge>
                        )}
                      </div>

                      {/* Star Rating */}
                      <div className="flex items-center gap-1 mt-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`size-3.5 ${
                              i < review.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground/30'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-muted-foreground ms-1">
                          {review.rating}.0
                        </span>
                      </div>

                      {/* Review Text */}
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                        {isRTL && review.reviewTextAr ? review.reviewTextAr : review.reviewText}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="size-3" />
                          {formatDate(review.date)}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <ThumbsUp className="size-3" />
                          {review.helpfulCount} {isRTL ? 'مفيد' : 'helpful'}
                        </span>
                        {review.hasImages && (
                          <Badge variant="outline" className="text-[9px] py-0">
                            📷 {isRTL ? 'صور' : 'Photos'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
