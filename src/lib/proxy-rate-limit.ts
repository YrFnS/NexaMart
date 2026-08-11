export const SESSION_READ_RATE_LIMIT = {
  maxRequests: 120,
  windowSeconds: 60,
} as const;

export function proxyRateLimitIdentifier(
  pathname: string,
  clientIp: string,
  verifiedSessionUserId?: string,
): string {
  if (pathname === '/api/auth/session' && verifiedSessionUserId) {
    return `user:${verifiedSessionUserId}`;
  }

  return clientIp || 'unknown';
}
