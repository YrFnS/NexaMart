'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { Product as ProductType } from '@/components/buyer/product-card';
import { ReviewsSection } from '@/components/buyer/reviews-section';
import { AiReviewSummary } from '@/components/buyer/ai-review-summary';
import { ListingComments } from '@/components/common/listing-comments';

interface ProductReviewsTabProps {
  product: ProductType;
  activeTab: string;
  setActiveTab: (v: string) => void;
  isRTL: boolean;
  t: (key: string, params?: Record<string, unknown>) => string;
}

export function ProductReviewsTab(props: ProductReviewsTabProps) {
  const {
    product, activeTab, setActiveTab,
    isRTL,
    t,
  } = props;

  const displayDescription = product.description;

  return (
    <>
      {/* AI Review Summary */}
      {product.reviewCount > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500">
              <Sparkles className="size-5 text-white" />
            </div>
            {t('aiReviewSummary')}
          </h2>
          <AiReviewSummary
            productId={product.id}
            productName={product.name}
            averageRating={product.rating}
            totalReviews={product.reviewCount}
          />
        </section>
      )}

      {/* Product Details Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-10">
        <TabsList className="w-full justify-start bg-muted/50 rounded-xl p-1 gap-0.5 tab-list-emerald">
          <TabsTrigger value="description" className="rounded-lg tab-trigger-emerald data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900 dark:data-[state=active]:text-emerald-300 data-[state=active]:shadow-sm">
            {t('description')}
          </TabsTrigger>
          <TabsTrigger value="specifications" className="rounded-lg tab-trigger-emerald data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900 dark:data-[state=active]:text-emerald-300 data-[state=active]:shadow-sm">
            {t('specifications')}
          </TabsTrigger>
          <TabsTrigger value="reviews" className="rounded-lg tab-trigger-emerald data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900 dark:data-[state=active]:text-emerald-300 data-[state=active]:shadow-sm">
            {t('reviews')}
            <span className="ms-1 inline-flex items-center justify-center size-5 rounded-full bg-muted text-[10px] font-bold tab-count-badge">
              {product.reviewCount}
            </span>
          </TabsTrigger>
          <TabsTrigger value="questions" className="rounded-lg tab-trigger-emerald data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-700 dark:data-[state=active]:bg-emerald-900 dark:data-[state=active]:text-emerald-300 data-[state=active]:shadow-sm">
            {t('questionsTab')}
            <span className="ms-1 inline-flex items-center justify-center size-5 rounded-full bg-muted text-[10px] font-bold tab-count-badge">
              {product.reviewCount > 0 ? Math.min(Math.round(product.reviewCount * 0.2), 10) : 0}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-4 tab-content-transition">
          <div className="bg-card rounded-xl border border-border p-6 overflow-hidden">
            {displayDescription ? (
              <div className="prose dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-line">
                {displayDescription}
              </div>
            ) : (
              <p className="text-muted-foreground">{t('noDescriptionAvailable')}</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="specifications" className="mt-4 tab-content-transition">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {Object.entries({
                SKU: product.sku || 'N/A',
                Category: product.category?.name || 'N/A',
                Stock: String(product.stock),
                Rating: `${product.rating}/5`,
                Sold: String(product.soldCount),
                'Free Shipping': product.hasFreeShipping ? 'Yes' : 'No',
                B2B: product.isB2b ? 'Available' : 'No',
              }).map(([key, val]) => (
                <div key={key} className="flex justify-between py-2.5 px-3 border-b border-border last:border-0 spec-row-alt">
                  <span className="text-sm text-muted-foreground">{key}</span>
                  <span className="text-sm font-medium">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4 tab-content-transition">
          <ReviewsSection
            productId={product.id}
            averageRating={product.rating}
            totalReviews={product.reviewCount}
          />
        </TabsContent>

        <TabsContent value="questions" className="mt-4 tab-content-transition">
          <div className="bg-card rounded-xl border border-border p-6">
            <ListingComments />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
