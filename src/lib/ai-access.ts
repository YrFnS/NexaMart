import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  requireUserRole,
  type AuthenticatedUser,
} from '@/lib/auth';
import { db } from '@/lib/db';
import {
  checkApiRateLimit,
  validateCsrf,
  type RateLimitConfig,
} from '@/lib/security';
import type { SessionRole } from '@/lib/session';

const AI_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 8,
  windowSeconds: 60,
};

export const AI_CREDIT_COSTS = {
  chat: 1,
  productDescription: 2,
  reviewSummary: 2,
  rfq: 3,
  smartPricing: 2,
  translate: 1,
} as const;

export type AiFeature = keyof typeof AI_CREDIT_COSTS;

export interface AiCreditReservation {
  user: AuthenticatedUser;
  feature: AiFeature;
  cost: number;
  creditsRemaining: number;
  complete: () => number;
  refund: () => Promise<number>;
}

type AiAccessResult =
  | { reservation: AiCreditReservation; response: null }
  | { reservation: null; response: NextResponse };

function jsonError(
  status: number,
  error: string,
  code: string,
  extra: Record<string, unknown> = {},
): NextResponse {
  const response = NextResponse.json(
    { error, code, ...extra },
    { status },
  );
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

function hasProviderConfiguration(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

export async function reserveAiCredits(
  request: Request,
  options: {
    feature: AiFeature;
    allowedRoles?: readonly SessionRole[];
  },
): Promise<AiAccessResult> {
  const rateLimit = checkApiRateLimit(request, AI_RATE_LIMIT);
  if (!rateLimit.allowed && rateLimit.response) {
    return { reservation: null, response: rateLimit.response };
  }

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return {
      reservation: null,
      response: jsonError(
        403,
        csrf.error || 'Invalid request origin.',
        'INVALID_ORIGIN',
      ),
    };
  }

  const auth = await requireUserRole(
    request,
    options.allowedRoles || ['buyer', 'seller', 'admin'],
  );
  if (auth.response) {
    return { reservation: null, response: auth.response };
  }

  if (!hasProviderConfiguration()) {
    return {
      reservation: null,
      response: jsonError(
        503,
        'AI service is not configured.',
        'AI_PROVIDER_UNAVAILABLE',
      ),
    };
  }

  const cost = AI_CREDIT_COSTS[options.feature];
  const reservedBalance = await db.$transaction(async (tx) => {
    const reserved = await tx.user.updateMany({
      where: {
        id: auth.user.id,
        role: auth.user.role,
        isBanned: false,
        aiCredits: { gte: cost },
      },
      data: { aiCredits: { decrement: cost } },
    });

    if (reserved.count !== 1) return null;

    const current = await tx.user.findUnique({
      where: { id: auth.user.id },
      select: { aiCredits: true },
    });
    return current?.aiCredits ?? null;
  });

  if (reservedBalance === null) {
    return {
      reservation: null,
      response: jsonError(
        402,
        'You do not have enough AI credits for this request.',
        'AI_CREDITS_REQUIRED',
        {
          creditCost: cost,
          creditsRemaining: auth.user.aiCredits,
        },
      ),
    };
  }

  let state: 'reserved' | 'completed' | 'refunded' = 'reserved';

  const reservation: AiCreditReservation = {
    user: auth.user,
    feature: options.feature,
    cost,
    creditsRemaining: reservedBalance,
    complete: () => {
      state = 'completed';
      return reservedBalance;
    },
    refund: async () => {
      if (state !== 'reserved') return reservedBalance;
      state = 'refunded';

      try {
        return await db.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: auth.user.id },
            data: { aiCredits: { increment: cost } },
          });
          const current = await tx.user.findUnique({
            where: { id: auth.user.id },
            select: { aiCredits: true },
          });
          return current?.aiCredits ?? reservedBalance + cost;
        });
      } catch (error) {
        console.error('Failed to refund AI credits:', error);
        return reservedBalance;
      }
    },
  };

  return { reservation, response: null };
}

export function parseAiJson<T>(
  value: string,
  schema: z.ZodType<T>,
): T | null {
  try {
    const cleaned = value
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(cleaned) as unknown;
    const result = schema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}
