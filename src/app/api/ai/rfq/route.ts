import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseAiJson, reserveAiCredits } from '@/lib/ai-access';
import { openrouterChatJSON } from '@/lib/openrouter';

const rfqInputSchema = z
  .object({
    description: z.string().trim().min(10).max(3_000),
  })
  .strict();

const estimatedQuoteSchema = z.object({
  quotes: z
    .array(
      z.object({
        price: z.coerce.number().positive().max(1_000_000_000),
        moq: z.coerce.number().int().positive().max(10_000_000),
        delivery: z.string().trim().min(1).max(100),
        deliveryAr: z.string().trim().min(1).max(100),
        match: z.coerce.number().min(0).max(100),
        location: z.enum(['Local', 'Regional', 'International']),
      }),
    )
    .min(2)
    .max(6),
  recommendation: z.string().trim().min(1).max(1_000),
  recommendationAr: z.string().trim().min(1).max(1_000),
});

export async function POST(request: Request) {
  const parsedInput = rfqInputSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsedInput.success) {
    return NextResponse.json(
      { error: 'A detailed RFQ description between 10 and 3,000 characters is required.' },
      { status: 400 },
    );
  }

  const access = await reserveAiCredits(request, { feature: 'rfq' });
  if (access.response) return access.response;
  const { reservation } = access;

  try {
    const aiResponse = await openrouterChatJSON(
      [
        {
          role: 'system',
          content: `Create non-binding RFQ planning scenarios from the supplied request. You have not contacted suppliers and must not claim that any seller, factory, or marketplace vendor offered these terms. Return JSON with 2-6 quote scenarios containing only price, moq, delivery, deliveryAr, match, and location. location must be Local, Regional, or International. Also return recommendation and recommendationAr. Prices are rough planning estimates, not live market quotes. Do not include supplier names, verification claims, contact details, or guarantees. Return JSON only.`,
        },
        { role: 'user', content: parsedInput.data.description },
      ],
      undefined,
      { temperature: 0.3, max_tokens: 1_200 },
    );

    const estimate = parseAiJson(aiResponse, estimatedQuoteSchema);
    if (!estimate) {
      throw new Error('AI provider returned an invalid RFQ estimate.');
    }

    const quotes = estimate.quotes.map((quote, index) => ({
      supplier: `Estimated supplier profile ${index + 1}`,
      supplierAr: `ملف مورد تقديري ${index + 1}`,
      price: quote.price,
      moq: quote.moq,
      delivery: quote.delivery,
      deliveryAr: quote.deliveryAr,
      match: quote.match,
      verified: false,
      location: quote.location,
      estimated: true,
    }));

    const response = NextResponse.json({
      quotes,
      steps: [
        'Parsed the supplied requirements',
        'Generated non-binding planning scenarios',
        'Flagged all values as estimates requiring supplier confirmation',
      ],
      summary: `Generated ${quotes.length} planning scenarios. No suppliers were contacted.`,
      summaryAr: `تم إنشاء ${quotes.length} سيناريوهات تقديرية. لم يتم التواصل مع أي موردين.`,
      recommendation: estimate.recommendation,
      recommendationAr: estimate.recommendationAr,
      estimated: true,
      disclaimer:
        'These are AI-generated planning estimates, not supplier offers. Verify price, availability, MOQ, delivery, compliance, and seller identity before making a purchasing decision.',
      disclaimerAr:
        'هذه تقديرات تخطيطية مولدة بالذكاء الاصطناعي وليست عروضاً من موردين. تحقق من السعر والتوفر والحد الأدنى للطلب والتسليم والامتثال وهوية البائع قبل اتخاذ قرار الشراء.',
      creditCost: reservation.cost,
      creditsRemaining: reservation.complete(),
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('RFQ API error:', error);
    const creditsRemaining = await reservation.refund();
    return NextResponse.json(
      {
        error: 'RFQ estimate generation failed. No credit was charged.',
        code: 'AI_REQUEST_FAILED',
        creditsRemaining,
      },
      { status: 502 },
    );
  }
}
