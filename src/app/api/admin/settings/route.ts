import { NextResponse } from 'next/server';
import {
  APP_NAME,
  APP_TAGLINE,
  SHIPPING_CONFIG,
  COMMISSION_CONFIG,
  STORE_LIMITS,
  TAX_CONFIG,
  DEFAULT_TIMEZONE,
} from '@/lib/config';
import { checkApiRateLimit, RATE_LIMITS, requireAdminAuth } from '@/lib/security';

const settings: Record<string, Record<string, unknown>> = {
  commission: {
    commissionRate: COMMISSION_CONFIG.defaultRate,
    proSubscriptionPrice: COMMISSION_CONFIG.proSubscriptionPrice,
    aiTokenPrices: [
      { credits: 10, price: 4.99 },
      { credits: 50, price: 19.99 },
      { credits: 100, price: 34.99 },
    ],
    unlimitedMonthlyPrice: COMMISSION_CONFIG.unlimitedMonthlyPrice,
    paymentGatewayFee: COMMISSION_CONFIG.paymentGatewayFee,
    minPayoutThreshold: COMMISSION_CONFIG.minPayoutThreshold,
  },
  general: {
    siteName: APP_NAME,
    tagline: APP_TAGLINE,
    defaultLanguage: 'en',
    defaultCurrency: 'USD',
    timezone: DEFAULT_TIMEZONE,
  },
  store: {
    autoApproveStores: false,
    productApproval: true,
    reviewModeration: true,
    allowCustomStorefronts: true,
    maxProductsPerStore: STORE_LIMITS.maxProductsPerStore,
    maxImagesPerProduct: STORE_LIMITS.maxImagesPerProduct,
  },
  payment: {
    minOrderAmount: STORE_LIMITS.minOrderAmount,
    maxOrderAmount: STORE_LIMITS.maxOrderAmount,
    escrowPeriod: STORE_LIMITS.escrowPeriodDays,
    currencyConversionFee: COMMISSION_CONFIG.currencyConversionFee,
  },
  shipping: {
    freeShippingThreshold: SHIPPING_CONFIG.freeShippingThreshold,
    defaultShippingRate: SHIPPING_CONFIG.defaultShippingRate,
    estimatedDeliveryDays: SHIPPING_CONFIG.estimatedDeliveryDays,
    expressShipping: true,
    internationalShipping: true,
  },
  tax: {
    taxEnabled: true,
    taxRate: TAX_CONFIG.defaultRate,
    inclusivePricing: TAX_CONFIG.inclusivePricing,
    vatEnabled: true,
  },
  security: {
    twoFARequired: false,
    bruteForceProtection: true,
    csrfProtection: true,
    sessionTimeout: STORE_LIMITS.sessionTimeoutMinutes,
    maxLoginAttempts: STORE_LIMITS.maxLoginAttempts,
    rateLimit: STORE_LIMITS.rateLimitPerMinute,
  },
};

export async function GET(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const authError = requireAdminAuth(request);
  if (authError) return authError;
  const rateLimitResult = checkApiRateLimit(request, RATE_LIMITS.admin);
  if (!rateLimitResult.allowed && rateLimitResult.response) {
    return rateLimitResult.response;
  }
  try {
    const body = await request.json();
    const { section, data } = body;

    if (section && data) {
      settings[section] = { ...settings[section], ...data };
      return NextResponse.json({ success: true, section, data: settings[section] });
    }

    return NextResponse.json({ success: false, error: 'Missing section or data' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
}
