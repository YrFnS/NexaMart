import { NextResponse } from 'next/server';
import { z } from 'zod';
import { reserveAiCredits } from '@/lib/ai-access';
import { APP_NAME } from '@/lib/config';
import { openrouterChat } from '@/lib/openrouter';

const chatSchema = z
  .object({
    message: z.string().trim().min(1).max(2_000),
  })
  .strict();

export async function POST(request: Request) {
  const parsed = chatSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Message is required and must be 2,000 characters or fewer.' },
      { status: 400 },
    );
  }

  const access = await reserveAiCredits(request, { feature: 'chat' });
  if (access.response) return access.response;
  const { reservation } = access;

  try {
    const reply = await openrouterChat(
      [
        {
          role: 'system',
          content: `You are ${APP_NAME}'s shopping guidance assistant. Help with product discovery, comparison criteria, marketplace policies, and general shopping questions. Respond in the same language as the user. You do not have access to the user's account, cart, orders, location, payment details, or private seller data. Never claim that you looked up, tracked, changed, purchased, refunded, or contacted anything. For account-specific help, direct the user to the relevant NexaMart page or support center. Keep answers concise and clearly distinguish general guidance from verified marketplace data.`,
        },
        { role: 'user', content: parsed.data.message },
      ],
      undefined,
      { temperature: 0.5, max_tokens: 700 },
    );

    if (!reply) throw new Error('AI provider returned an empty response.');

    const response = NextResponse.json({
      reply,
      creditCost: reservation.cost,
      creditsRemaining: reservation.complete(),
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('AI chat error:', error);
    const creditsRemaining = await reservation.refund();
    return NextResponse.json(
      {
        error: 'The AI assistant is temporarily unavailable. No credit was charged.',
        code: 'AI_REQUEST_FAILED',
        creditsRemaining,
      },
      { status: 502 },
    );
  }
}
