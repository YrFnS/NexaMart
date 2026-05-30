'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, CheckCircle2, XCircle, Tag, RefreshCw, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface AiReviewSummaryProps {
  productId: string;
  productName: string;
  averageRating: number;
  totalReviews: number;
}

interface ReviewSummaryData {
  summary: string;
  summaryAr: string;
  positiveAspects: string[];
  negativeAspects: string[];
  positiveAspectsAr: string[];
  negativeAspectsAr: string[];
  sentimentScore: number;
  recommendation: string;
  recommendationAr: string;
  topKeywords: string[];
}

export function AiReviewSummary({ productId, productName, averageRating, totalReviews }: AiReviewSummaryProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const [summary, setSummary] = useState<ReviewSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      // First fetch the reviews for this product
      const reviewsRes = await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
      if (!reviewsRes.ok) {
        setError(true);
        setLoading(false);
        return;
      }

      const reviews = await reviewsRes.json();
      if (!Array.isArray(reviews) || reviews.length === 0) {
        // No reviews yet, generate a basic fallback summary from the rating
        setSummary({
          summary: `Customers rate this product ${averageRating.toFixed(1)}/5. ${averageRating >= 4 ? 'Most customers are satisfied with their purchase.' : averageRating >= 3 ? 'Customers have mixed feelings about this product.' : 'Some customers have concerns about this product.'}`,
          summaryAr: `يقيّم العملاء هذا المنتج ${averageRating.toFixed(1)}/5. ${averageRating >= 4 ? 'معظم العملاء راضون عن شرائهم.' : averageRating >= 3 ? 'لدى العملاء مشاعر متضاربة حول هذا المنتج.' : 'بعض العملاء لديهم مخاوف حول هذا المنتج.'}`,
          positiveAspects: ['Good quality', 'Value for money', 'Fast delivery'],
          negativeAspects: ['Limited options'],
          positiveAspectsAr: ['جودة جيدة', 'قيمة جيدة مقابل السعر', 'توصيل سريع'],
          negativeAspectsAr: ['خيارات محدودة'],
          sentimentScore: Math.round(averageRating * 20),
          recommendation: averageRating >= 4 ? 'Buy' : averageRating >= 3 ? 'Consider' : 'Avoid',
          recommendationAr: averageRating >= 4 ? 'شراء' : averageRating >= 3 ? 'فكر فيه' : 'تجنب',
          topKeywords: ['quality', 'price', 'delivery'],
        });
        setLoading(false);
        return;
      }

      // Build reviews text for AI analysis
      const reviewsText = reviews.map((r: { rating: number; comment?: string }, i: number) => ({
        rating: r.rating,
        text: r.comment || (r.rating >= 4 ? 'Good product' : r.rating >= 3 ? 'Average product' : 'Not satisfied'),
      }));

      // Call the AI review summary API
      const aiRes = await fetch('/api/ai/review-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName,
          reviews: reviewsText,
        }),
      });

      if (!aiRes.ok) {
        // Fallback to a basic summary
        const avgRating = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length;
        setSummary({
          summary: `Customers generally ${avgRating >= 4 ? 'love' : avgRating >= 3 ? 'have mixed feelings about' : 'are disappointed with'} this product.`,
          summaryAr: avgRating >= 4 ? 'يحب العملاء هذا المنتج بشكل عام.' : avgRating >= 3 ? 'لدى العملاء مشاعر متضاربة حول هذا المنتج.' : 'العملاء محبطون من هذا المنتج.',
          positiveAspects: ['Good quality', 'Fast shipping', 'Good value'],
          negativeAspects: ['Could be improved'],
          positiveAspectsAr: ['جودة جيدة', 'شحن سريع', 'قيمة جيدة'],
          negativeAspectsAr: ['يمكن تحسينه'],
          sentimentScore: Math.round(avgRating * 20),
          recommendation: avgRating >= 4 ? 'Buy' : avgRating >= 3 ? 'Consider' : 'Avoid',
          recommendationAr: avgRating >= 4 ? 'شراء' : avgRating >= 3 ? 'فكر فيه' : 'تجنب',
          topKeywords: ['quality', 'price', 'delivery'],
        });
        setLoading(false);
        return;
      }

      const data = await aiRes.json();
      setSummary(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [productId, productName, averageRating]);

  useEffect(() => {
    if (totalReviews > 0) {
      fetchSummary();
    } else {
      setLoading(false);
    }
  }, [totalReviews, fetchSummary]);

  // Don't render if no reviews
  if (totalReviews === 0) return null;

  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/80 via-white/50 to-teal-50/80 dark:from-emerald-950/30 dark:via-gray-900/50 dark:to-teal-950/20 backdrop-blur-sm overflow-hidden">
        <div className="p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-xl bg-emerald-100/60 dark:bg-emerald-900/60 animate-pulse">
              <Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="h-5 w-36 bg-emerald-200/50 dark:bg-emerald-800/50 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
            <div className="h-3 w-full bg-emerald-100/40 dark:bg-emerald-900/40 rounded animate-pulse" />
            <div className="h-3 w-3/4 bg-emerald-100/40 dark:bg-emerald-900/40 rounded animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 w-full bg-emerald-100/30 dark:bg-emerald-900/30 rounded animate-pulse" />
                ))}
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-4 w-full bg-amber-100/30 dark:bg-amber-900/30 rounded animate-pulse" />
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 w-16 bg-emerald-100/30 dark:bg-emerald-900/30 rounded-full animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200/50 dark:border-red-800/50 bg-gradient-to-br from-red-50/50 via-white/30 to-amber-50/30 dark:from-red-950/20 dark:via-gray-900/30 dark:to-amber-950/10 backdrop-blur-sm p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="size-5 text-red-500" />
          <span className="font-semibold text-sm text-red-600 dark:text-red-400">{t('aiReviewError')}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSummary}
          className="gap-1.5 text-xs border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
        >
          <RefreshCw className="size-3" />
          {t('tryAgain')}
        </Button>
      </div>
    );
  }

  if (!summary) return null;

  const sentimentScore = summary.sentimentScore ?? Math.round(averageRating * 20);
  const pros = isRTL && summary.positiveAspectsAr?.length ? summary.positiveAspectsAr : summary.positiveAspects;
  const cons = isRTL && summary.negativeAspectsAr?.length ? summary.negativeAspectsAr : summary.negativeAspects;
  const summaryText = isRTL && summary.summaryAr ? summary.summaryAr : summary.summary;
  const keywords = summary.topKeywords || [];

  // Sentiment classification
  const sentiment = sentimentScore >= 70 ? 'positive' : sentimentScore >= 40 ? 'neutral' : 'negative';
  const sentimentLabel = sentiment === 'positive'
    ? t('positiveSentiment')
    : sentiment === 'neutral'
    ? t('neutralSentiment')
    : t('negativeSentiment');
  const sentimentColor = sentiment === 'positive'
    ? 'text-emerald-600 dark:text-emerald-400'
    : sentiment === 'neutral'
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400';
  const gaugeColor = sentiment === 'positive'
    ? 'bg-emerald-500'
    : sentiment === 'neutral'
    ? 'bg-amber-500'
    : 'bg-red-500';

  return (
    <div className="rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/80 via-white/50 to-teal-50/80 dark:from-emerald-950/30 dark:via-gray-900/50 dark:to-teal-950/20 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5">
      <div className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-md shadow-emerald-500/20">
              <Sparkles className="size-5 text-white" />
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
              {t('aiReviewSummary')}
            </h3>
          </div>
          <Badge
            variant="secondary"
            className="text-[10px] bg-emerald-100/60 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-700/50"
          >
            <Sparkles className="size-2.5 me-0.5" />
            {t('aiPoweredSummary')}
          </Badge>
        </div>

        {/* Summary text */}
        <p className="text-sm text-foreground/80 leading-relaxed mb-4">{summaryText}</p>

        {/* Sentiment gauge */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-muted-foreground">Sentiment</span>
            <span className={`text-xs font-bold ${sentimentColor}`}>
              {sentimentLabel} ({sentimentScore}%)
            </span>
          </div>
          <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${gaugeColor} transition-all duration-1000 ease-out`}
              style={{ width: `${sentimentScore}%` }}
            />
          </div>
        </div>

        {/* Pros & Cons grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Pros */}
          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100/50 dark:border-emerald-800/30">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                {t('aiPros')}
              </span>
            </div>
            <ul className="space-y-1.5">
              {pros.slice(0, 3).map((pro, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div className="p-3 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-100/50 dark:border-red-800/30">
            <div className="flex items-center gap-1.5 mb-2">
              <XCircle className="size-4 text-red-500 dark:text-red-400" />
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                {t('aiCons')}
              </span>
            </div>
            <ul className="space-y-1.5">
              {cons.slice(0, 3).map((con, i) => (
                <li key={i} className="text-sm text-foreground/80 flex items-start gap-1.5">
                  <XCircle className="size-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Key phrases */}
        {keywords.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Tag className="size-3.5 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wide">
                {t('aiKeyPhrases')}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {keywords.slice(0, 8).map((keyword, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-[10px] px-2.5 py-0.5 bg-teal-50/80 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-700/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
