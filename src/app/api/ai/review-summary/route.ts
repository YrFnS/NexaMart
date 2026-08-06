import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseAiJson, reserveAiCredits } from '@/lib/ai-access';
import { openrouterChatJSON } from '@/lib/openrouter';

const reviewInputSchema = z
  .object({
    productName: z.string().trim().max(160).optional(),
    reviews: z
      .array(
        z.object({
          rating: z.coerce.number().int().min(1).max(5),
          text: z.string().trim().min(1).max(1_000),
        }),
      )
      .min(1)
      .max(20),
  })
  .strict();

const aiSummarySchema = z.object({
  summary: z.string().trim().min(1).max(1_500),
  summaryAr: z.string().trim().min(1).max(1_500),
  positiveAspects: z.array(z.string().trim().min(1).max(200)).max(10),
  negativeAspects: z.array(z.string().trim().min(1).max(200)).max(10),
  positiveAspectsAr: z.array(z.string().trim().min(1).max(200)).max(10),
  negativeAspectsAr: z.array(z.string().trim().min(1).max(200)).max(10),
  sentimentScore: z.coerce.number().min(0).max(100),
  recommendation: z.string().trim().min(1).max(80),
  recommendationAr: z.string().trim().min(1).max(80),
  topKeywords: z.array(z.string().trim().min(1).max(80)).max(12),
});

type ReviewInput = z.infer<typeof reviewInputSchema>;

function ratingOnlyResponse(input: ReviewInput, creditsRemaining: number) {
  const average =
    input.reviews.reduce((sum, review) => sum + review.rating, 0) /
    input.reviews.length;
  const sentimentScore = Math.round(average * 20);
  const recommendation =
    average >= 4 ? 'Positive rating trend' : average >= 3 ? 'Mixed rating trend' : 'Negative rating trend';
  const recommendationAr =
    average >= 4 ? 'اتجاه تقييمات إيجابي' : average >= 3 ? 'اتجاه تقييمات مختلط' : 'اتجاه تقييمات سلبي';

  return NextResponse.json({
    summary: `Rating-only fallback based on ${input.reviews.length} supplied review${input.reviews.length === 1 ? '' : 's'} with an average of ${average.toFixed(1)} out of 5. No review themes were inferred.`,
    summaryAr: `ملخص مبني على التقييمات فقط لعدد ${input.reviews.length} من المراجعات المقدمة، بمتوسط ${average.toFixed(1)} من 5. لم يتم استنتاج محاور للمراجعات.`,
    positiveAspects: [],
    negativeAspects: [],
    positiveAspectsAr: [],
    negativeAspectsAr: [],
    sentimentScore,
    recommendation,
    recommendationAr,
    topKeywords: [],
    source: 'rating_only',
    creditCost: 0,
    creditsRemaining,
  });
}

export async function POST(request: Request) {
  const parsedInput = reviewInputSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsedInput.success) {
    return NextResponse.json(
      { error: 'Please provide between 1 and 20 valid reviews.' },
      { status: 400 },
    );
  }

  const access = await reserveAiCredits(request, { feature: 'reviewSummary' });
  if (access.response) return access.response;
  const { reservation } = access;

  const reviewsText = parsedInput.data.reviews
    .map(
      (review, index) =>
        `Review ${index + 1} (${review.rating}/5): ${review.text}`,
    )
    .join('\n');

  try {
    const aiResponse = await openrouterChatJSON(
      [
        {
          role: 'system',
          content: `Analyze only the supplied product reviews. Return JSON with summary, summaryAr, positiveAspects, negativeAspects, positiveAspectsAr, negativeAspectsAr, sentimentScore (0-100), recommendation, recommendationAr, and topKeywords. Do not invent product facts, purchases, customer demographics, review themes, or keywords that are not supported by the provided text. Use empty arrays when evidence is insufficient. Return JSON only.`,
        },
        {
          role: 'user',
          content: `Product: ${parsedInput.data.productName || 'Unnamed product'}\n${reviewsText}`,
        },
      ],
      undefined,
      { temperature: 0.2, max_tokens: 1_100 },
    );

    const summary = parseAiJson(aiResponse, aiSummarySchema);
    if (!summary) {
      const creditsRemaining = await reservation.refund();
      return ratingOnlyResponse(parsedInput.data, creditsRemaining);
    }

    const response = NextResponse.json({
      ...summary,
      source: 'ai_review_text',
      creditCost: reservation.cost,
      creditsRemaining: reservation.complete(),
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('Review summary API error:', error);
    const creditsRemaining = await reservation.refund();
    return ratingOnlyResponse(parsedInput.data, creditsRemaining);
  }
}
