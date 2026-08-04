import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseAiJson, reserveAiCredits } from '@/lib/ai-access';
import { openrouterChatJSON } from '@/lib/openrouter';

const pricingInputSchema = z
  .object({
    productName: z.string().trim().min(2).max(160),
    category: z.string().trim().max(100).optional(),
    cost: z.coerce.number().positive().max(1_000_000_000).default(25),
    competitorPrices: z
      .array(z.coerce.number().positive().max(1_000_000_000))
      .max(30)
      .default([]),
    targetMargin: z.coerce.number().min(1).max(90).default(30),
  })
  .strict();

const recommendationSchema = z.object({
  recommendation: z.string().trim().min(1).max(1_000),
  recommendationAr: z.string().trim().min(1).max(1_000),
  confidence: z.coerce.number().min(0).max(100),
});

type PricingInput = z.infer<typeof pricingInputSchema>;

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function buildPricingData(input: PricingInput) {
  const suggestedPrice = roundMoney(
    input.cost / (1 - input.targetMargin / 100),
  );
  const prices = input.competitorPrices;
  const marketAverage = prices.length
    ? roundMoney(prices.reduce((sum, price) => sum + price, 0) / prices.length)
    : null;
  const competitorRange = prices.length
    ? { min: Math.min(...prices), max: Math.max(...prices) }
    : null;

  return {
    suggestedPrice,
    marketAverage,
    competitorRange,
    breakdown: {
      baseCost: input.cost,
      targetMargin: input.targetMargin,
      categoryMultiplier: 1,
      priceRange: {
        conservative: roundMoney(suggestedPrice * 0.95),
        moderate: suggestedPrice,
        aggressive: roundMoney(suggestedPrice * 1.1),
      },
    },
    competitors: prices.map((price, index) => ({
      name: `Provided competitor ${index + 1}`,
      price,
      rating: null,
      supplied: true,
    })),
  };
}

function formulaFallback(input: PricingInput, creditsRemaining: number) {
  const pricing = buildPricingData(input);
  const confidence = input.competitorPrices.length >= 5
    ? 70
    : input.competitorPrices.length > 0
      ? 55
      : 35;

  return NextResponse.json({
    ...pricing,
    confidence,
    recommendation:
      'Formula-based estimate using the supplied cost and target margin. No live market data was queried.',
    recommendationAr:
      'تقدير مبني على معادلة باستخدام التكلفة وهامش الربح المدخلين. لم يتم الاستعلام عن بيانات سوق مباشرة.',
    estimated: true,
    source: 'formula_only',
    marketDataSource: input.competitorPrices.length
      ? 'caller_supplied_prices'
      : 'none',
    disclaimer:
      'This is a planning estimate, not a verified market price. Confirm taxes, fees, demand, inventory, and competitor data before publishing.',
    disclaimerAr:
      'هذا تقدير للتخطيط وليس سعراً سوقياً موثقاً. تحقق من الضرائب والرسوم والطلب والمخزون وبيانات المنافسين قبل النشر.',
    creditCost: 0,
    creditsRemaining,
  });
}

export async function POST(request: Request) {
  const parsedInput = pricingInputSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsedInput.success) {
    return NextResponse.json(
      { error: 'Please check the smart-pricing inputs.' },
      { status: 400 },
    );
  }

  const access = await reserveAiCredits(request, {
    feature: 'smartPricing',
    allowedRoles: ['seller', 'admin'],
  });
  if (access.response) return access.response;
  const { reservation } = access;
  const pricing = buildPricingData(parsedInput.data);

  try {
    const aiResponse = await openrouterChatJSON(
      [
        {
          role: 'system',
          content: `Provide cautious pricing guidance based only on the supplied cost, target margin, category, formula price, and caller-supplied competitor prices. You have no live market access. Do not invent competitor names, prices, ratings, demand, sales, or market averages. Return JSON with recommendation, recommendationAr, and confidence (0-100) only. Explicitly mention missing market evidence when no competitor prices were supplied.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            productName: parsedInput.data.productName,
            category: parsedInput.data.category || null,
            cost: parsedInput.data.cost,
            targetMargin: parsedInput.data.targetMargin,
            formulaPrice: pricing.suggestedPrice,
            competitorPrices: parsedInput.data.competitorPrices,
          }),
        },
      ],
      undefined,
      { temperature: 0.2, max_tokens: 500 },
    );

    const guidance = parseAiJson(aiResponse, recommendationSchema);
    if (!guidance) {
      const creditsRemaining = await reservation.refund();
      return formulaFallback(parsedInput.data, creditsRemaining);
    }

    const response = NextResponse.json({
      ...pricing,
      ...guidance,
      estimated: true,
      source: 'formula_with_ai_guidance',
      marketDataSource: parsedInput.data.competitorPrices.length
        ? 'caller_supplied_prices'
        : 'none',
      disclaimer:
        'This is a planning estimate, not a verified market price. Confirm taxes, fees, demand, inventory, and competitor data before publishing.',
      disclaimerAr:
        'هذا تقدير للتخطيط وليس سعراً سوقياً موثقاً. تحقق من الضرائب والرسوم والطلب والمخزون وبيانات المنافسين قبل النشر.',
      creditCost: reservation.cost,
      creditsRemaining: reservation.complete(),
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('Smart pricing API error:', error);
    const creditsRemaining = await reservation.refund();
    return formulaFallback(parsedInput.data, creditsRemaining);
  }
}
