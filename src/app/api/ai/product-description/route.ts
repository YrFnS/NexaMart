import { NextResponse } from 'next/server';
import { z } from 'zod';
import { reserveAiCredits } from '@/lib/ai-access';
import { openrouterChat } from '@/lib/openrouter';

const descriptionSchema = z
  .object({
    productName: z.string().trim().min(2).max(160),
    category: z.string().trim().max(100).optional(),
    features: z.string().trim().max(3_000).optional(),
    language: z.enum(['en', 'ar']).default('en'),
  })
  .strict();

export async function POST(request: Request) {
  const parsed = descriptionSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please check the product-description details.' },
      { status: 400 },
    );
  }

  const access = await reserveAiCredits(request, {
    feature: 'productDescription',
    allowedRoles: ['seller', 'admin'],
  });
  if (access.response) return access.response;
  const { reservation } = access;

  const targetLanguage = parsed.data.language === 'ar' ? 'Arabic' : 'English';

  try {
    const description = await openrouterChat(
      [
        {
          role: 'system',
          content: `You write accurate e-commerce product copy in ${targetLanguage}. Use only the supplied product facts; never invent certifications, materials, dimensions, warranties, performance claims, discounts, availability, or shipping promises. Produce a concise headline, key features, buyer benefits, and a restrained call to action in 150-250 words.`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            productName: parsed.data.productName,
            category: parsed.data.category || null,
            features: parsed.data.features || null,
          }),
        },
      ],
      undefined,
      { temperature: 0.5, max_tokens: 700 },
    );

    if (!description) {
      throw new Error('AI provider returned an empty description.');
    }

    const response = NextResponse.json({
      description,
      language: parsed.data.language,
      creditCost: reservation.cost,
      creditsRemaining: reservation.complete(),
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('Product description API error:', error);
    const creditsRemaining = await reservation.refund();
    return NextResponse.json(
      {
        error: 'Description generation failed. No credit was charged.',
        code: 'AI_REQUEST_FAILED',
        creditsRemaining,
      },
      { status: 502 },
    );
  }
}
