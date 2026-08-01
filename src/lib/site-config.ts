import { APP_NAME as configuredAppName } from '@/lib/config';

function normalizeSiteUrl(value: string | undefined): string {
  const fallback = 'http://localhost:3000';
  const candidate = value?.trim() || fallback;

  try {
    return new URL(candidate).origin;
  } catch {
    try {
      return new URL(`https://${candidate.replace(/^\/+/, '')}`).origin;
    } catch {
      return fallback;
    }
  }
}

export const SITE_NAME = configuredAppName;
export const SITE_TAGLINE = 'Multi-vendor ordering and fulfilment';
export const SITE_DESCRIPTION =
  'Browse products from independent stores, place pay-on-delivery orders, and track fulfilment, returns, and exchanges in one marketplace.';
export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_DOMAIN,
);
export const SITE_HOST = new URL(SITE_URL).host;

export function absoluteSiteUrl(pathOrUrl: string): string {
  try {
    return new URL(pathOrUrl, SITE_URL).toString();
  } catch {
    return SITE_URL;
  }
}
