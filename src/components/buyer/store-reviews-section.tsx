'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Star,
  ThumbsUp,
  PenLine,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
  userNameAr?: string;
  rating: number;
  comment: string;
  commentAr?: string;
  date: string;
  helpful: number;
  verified: boolean;
}

interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

interface StoreReviewsSectionProps {
  storeName?: string;
  overallRating?: number;
  totalReviews?: number;
  distribution?: RatingDistribution;
}



export function StoreReviewsSection({
  storeName = 'Store',
  overallRating = 4.6,
  totalReviews = 1250,
  distribution = { 5: 65, 4: 22, 3: 8, 2: 3, 1: 2 },
}: StoreReviewsSectionProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  // Fetch reviews from API
  useEffect(() => {
    fetch('/api/store-reviews')
      .then((r) => r.json())
      .then((result) => {
        setReviews(result.reviews || result.data || result || []);
        setReviewsLoading(false);
      })
      .catch(() => {
        setReviews([]);
        setReviewsLoading(false);
      });
  }, []);

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    switch (sortBy) {
      case 'recent':
        return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'highest':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return sorted.sort((a, b) => a.rating - b.rating);
      default:
        return sorted;
    }
  }, [sortBy, reviews]);

  const renderStars = (rating: number, size = 'size-4') => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < Math.floor(rating)
            ? 'fill-amber-400 text-amber-400'
            : i < rating
            ? 'fill-amber-400/50 text-amber-400'
            : 'text-muted-foreground/30'
        }`}
      />
    ));
  };

  const handleSubmitReview = () => {
    setReviewSubmitted(true);
    setTimeout(() => {
      setReviewSubmitted(false);
      setReviewDialogOpen(false);
      setReviewText('');
    }, 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Overall Rating Summary */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-emerald-600 dark:text-emerald-400">
                {overallRating}
              </div>
              <div className="flex items-center gap-0.5 mt-2 justify-center">
                {renderStars(overallRating)}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {totalReviews.toLocaleString()} {t('reviews')}
              </p>
            </div>

            <Separator orientation="vertical" className="hidden sm:block h-24" />

            <div className="flex-1 w-full space-y-2">
              {([5, 4, 3, 2, 1] as const).map((star) => (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-3 text-end">{star}</span>
                  <Star className="size-3.5 fill-amber-400 text-amber-400 shrink-0" />
                  <Progress
                    value={distribution[star]}
                    className="flex-1 h-2.5"
                  />
                  <span className="text-muted-foreground w-10 text-xs">
                    {distribution[star]}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sort + Write Review */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {isRTL ? 'ترتيب حسب' : 'Sort by'}:
          </span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">
                {isRTL ? 'الأحدث' : 'Most Recent'}
              </SelectItem>
              <SelectItem value="highest">
                {isRTL ? 'الأعلى تقييماً' : 'Highest Rated'}
              </SelectItem>
              <SelectItem value="lowest">
                {isRTL ? 'الأدنى تقييماً' : 'Lowest Rated'}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
              <PenLine className="size-4" />
              {t('writeReview')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>
              {isRTL ? `اكتب تقييماً لـ ${storeName}` : `Write a Review for ${storeName}`}
            </DialogTitle>
            <div className="space-y-4 mt-4">
              {/* Star selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">{t('ratings')}</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setReviewRating(s)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`size-7 ${
                          s <= reviewRating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder={isRTL ? 'شارك تجربتك...' : 'Share your experience...'}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
              />
              <Button
                onClick={handleSubmitReview}
                disabled={!reviewText.trim() || reviewSubmitted}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {reviewSubmitted
                  ? isRTL ? 'تم إرسال التقييم!' : 'Review Submitted!'
                  : isRTL ? 'إرسال التقييم' : 'Submit Review'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Review List */}
      <div className="space-y-3">
        {reviews.length === 0 && !reviewsLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Star className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">{t('noResults')}</p>
            <p className="text-sm">{isRTL ? 'لا توجد تقييمات' : 'No reviews yet'}</p>
          </div>
        )}
        {sortedReviews.map((review) => (
          <Card key={review.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 text-xs font-semibold">
                      {(isRTL && review.userNameAr ? review.userNameAr : review.userName).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium">
                        {isRTL && review.userNameAr ? review.userNameAr : review.userName}
                      </p>
                      {review.verified && (
                        <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px] px-1.5 py-0 border-0">
                          {t('verifiedPurchase')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      {renderStars(review.rating, 'size-3')}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(review.date).toLocaleDateString(getLocale(isRTL), {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isRTL && review.commentAr ? review.commentAr : review.comment}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-7 px-2">
                  <ThumbsUp className="size-3" />
                  {isRTL ? 'مفيد' : 'Helpful'} ({review.helpful})
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
