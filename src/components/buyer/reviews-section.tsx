'use client';

import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, BadgeCheck, ImagePlus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/lib/i18n';
import { useUserStore } from '@/stores/user-store';

interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  comment?: string;
  images: string;
  isVerified: boolean;
  helpful: number;
  createdAt: string;
  user?: { name: string | null; avatar: string | null };
}

interface ReviewsSectionProps {
  productId: string;
  averageRating: number;
  totalReviews: number;
}

type SortOption = 'newest' | 'highest' | 'lowest' | 'helpful';

export function ReviewsSection({ productId, averageRating, totalReviews }: ReviewsSectionProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const { user } = useUserStore();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [writingReview, setWritingReview] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [helpfulIds, setHelpfulIds] = useState<Set<string>>(new Set());

  // Star distribution calculation
  const distribution = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) distribution[r.rating - 1]++;
  });

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reviews?productId=${productId}`);
        if (res.ok) {
          const data = await res.json();
          setReviews(Array.isArray(data) ? data : []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [productId]);

  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'helpful':
        return b.helpful - a.helpful;
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const handleSubmitReview = async () => {
    if (newRating === 0 || !newComment.trim()) return;
    const userId = user?.id;
    if (!userId) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          productId,
          rating: newRating,
          comment: newComment,
        }),
      });
      if (res.ok) {
        const newReview = await res.json();
        setReviews((prev) => [newReview, ...prev]);
        setNewRating(0);
        setNewComment('');
        setWritingReview(false);
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = (reviewId: string) => {
    if (helpfulIds.has(reviewId)) return;
    setHelpfulIds((prev) => new Set(prev).add(reviewId));
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, helpful: r.helpful + 1 } : r))
    );
  };

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

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'newest', label: 'Newest' },
    { value: 'highest', label: 'Highest' },
    { value: 'lowest', label: 'Lowest' },
    { value: 'helpful', label: 'Most Helpful' },
  ];

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="flex flex-col md:flex-row gap-6 p-6 bg-card rounded-xl border border-border relative overflow-hidden">
        {/* Decorative gradient accent */}
        <div className="absolute top-0 end-0 w-32 h-32 rounded-full bg-emerald-100/30 dark:bg-emerald-900/20 blur-3xl" />
        {/* Average Rating */}
        <div className="flex flex-col items-center justify-center min-w-[140px]">
          <span className="text-5xl font-bold text-foreground">{(averageRating ?? 0).toFixed(1)}</span>
          <div className="flex items-center mt-2">{renderStars(averageRating)}</div>
          <span className="text-sm text-muted-foreground mt-1">
            {totalReviews} {t('reviews')}
          </span>
        </div>

        {/* Distribution */}
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star - 1];
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="text-sm w-3 text-end">{star}</span>
                <Star className="size-3 fill-amber-400 text-amber-400" />
                <Progress value={pct} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-8">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write Review & Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Button
          onClick={() => setWritingReview(!writingReview)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {t('writeReview')}
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('sortBy')}:</span>
          <div className="flex gap-1">
            {sortOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={sortBy === opt.value ? 'default' : 'outline'}
                size="sm"
                className={`text-xs h-7 ${
                  sortBy === opt.value
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : ''
                }`}
                onClick={() => setSortBy(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Write Review Form */}
      {writingReview && (
        <div className="p-4 bg-card rounded-xl border border-border space-y-4">
          <h4 className="font-semibold">{t('writeReview')}</h4>

          {/* Star Rating Selector */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }, (_, i) => (
              <button
                key={i}
                onClick={() => setNewRating(i + 1)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`size-7 ${
                    i < newRating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/30'
                  }`}
                />
              </button>
            ))}
            <span className="text-sm text-muted-foreground ms-2">
              {newRating > 0 ? `${newRating}/5` : ''}
            </span>
          </div>

          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your experience with this product..."
            rows={4}
          />

          {/* Review Title */}
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder={isRTL ? 'عنوان المراجعة (اختياري)' : 'Review title (optional)'}
            className="text-sm"
          />

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
            >
              <ImagePlus className="size-4" />
              Add Photos
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWritingReview(false);
                  setNewRating(0);
                  setNewComment('');
                }}
              >
                {t('cancel')}
              </Button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                onClick={handleSubmitReview}
                disabled={newRating === 0 || !newComment.trim() || submitting}
              >
                <Send className="size-3.5" />
                {submitting ? t('loading') : t('apply')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
        {loading ? (
          Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="p-4 rounded-xl border border-border animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
              </div>
              <div className="mt-3 h-16 bg-muted rounded" />
            </div>
          ))
        ) : sortedReviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="size-12 mx-auto mb-3 opacity-20" />
            <p>{t('noResults')}</p>
          </div>
        ) : (
          sortedReviews.map((review) => {
            const reviewImages: string[] = (() => {
              try {
                return JSON.parse(review.images);
              } catch {
                return [];
              }
            })();

            const userName = review.user?.name || 'Anonymous';
            const initials = userName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={review.id}
                className="p-4 rounded-xl border border-border bg-card hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{userName}</span>
                      {review.isVerified && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 gap-0.5"
                        >
                          <BadgeCheck className="size-3" />
                          {t('verifiedPurchase')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex">{renderStars(review.rating, 'size-3')}</div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString(
                          isRTL ? 'ar-IQ' : 'en-US'
                        )}
                      </span>
                    </div>

                    {review.comment && (
                      <p className="text-sm mt-2 text-foreground/90 leading-relaxed">
                        {review.comment}
                      </p>
                    )}

                    {/* Review Images */}
                    {reviewImages.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {reviewImages.map((img, i) => (
                          <div
                            key={i}
                            className="w-16 h-16 rounded-lg overflow-hidden bg-muted"
                          >
                            <img
                              src={img}
                              alt={`Review photo ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Helpful Button */}
                    <button
                      onClick={() => handleHelpful(review.id)}
                      className={`flex items-center gap-1 mt-2 text-xs transition-colors ${
                        helpfulIds.has(review.id)
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400'
                      }`}
                    >
                      <ThumbsUp className="size-3" />
                      <span>{t('helpful')} ({review.helpful})</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
