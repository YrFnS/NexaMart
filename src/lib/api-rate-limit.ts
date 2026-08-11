import type { NextResponse } from 'next/server';
import {
  checkDistributedRateLimit,
  type DistributedRateLimitInput,
  type DistributedRateLimitResult,
} from '@/lib/distributed-rate-limit';
import {
  getClientIdentifier,
  rateLimitResponse,
  RATE_LIMITS,
  type RateLimitConfig,
} from '@/lib/security';

export type DistributedRateLimitChecker = (
  input: DistributedRateLimitInput,
) => Promise<DistributedRateLimitResult>;

export interface DistributedApiRateLimitResult
  extends DistributedRateLimitResult {
  response?: NextResponse;
}

export async function checkDistributedApiRateLimit(
  request: Request,
  namespace: string,
  config: RateLimitConfig = RATE_LIMITS.general,
  checker: DistributedRateLimitChecker = checkDistributedRateLimit,
): Promise<DistributedApiRateLimitResult> {
  const result = await checker({
    namespace,
    identifier: getClientIdentifier(request),
    maxRequests: config.maxRequests,
    windowSeconds: config.windowSeconds,
  });

  if (!result.allowed) {
    return {
      ...result,
      response: rateLimitResponse(result.resetAt),
    };
  }

  return result;
}
