import { createHash, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuthenticatedUser } from '@/lib/auth';
import { SHIPPING_CONFIG } from '@/lib/config';
import { getTaxRate } from '@/lib/tax';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
} from '@/lib/security';

const VALID_SHIPPING_METHODS = ['standard', 'express', 'next_day'] as const;
const VALID_PAYMENT_METHODS = [
  'card',
  'apple_pay',
  'google_pay',
  'wallet',
  'zain_cash',
  'stc_pay',
] as const;

interface CheckoutLineInput {
  productId: string;
  quantity: number;
  variation: string | null;
}

interface ShippingAddressInput {
  fullName: string;
  phone: string;
  address1: string;
  address2: string | null;
  city: string;
  state: string | null;
  postalCode: string | null;
  country: string;
}

interface CheckoutResult {
  orderNumber: string;
  orderNumbers: string[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;
  total: number;
  currency: 'USD';
  paymentStatus: 'paid' | 'pending';
  requiresPayment: boolean;
}

interface StoredCheckout {
  requestHash: string;
  response: CheckoutResult;
}

class CheckoutError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'CheckoutError';
  }
}

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function cleanText(value: unknown, maxLength: number): string {
  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

function normalizeVariation(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') return cleanText(value, 500) || null;
  if (typeof value === 'object') {
    try {
      const entries = Object.entries(value as Record<string, unknown>)
        .map(([key, item]) => [cleanText(key, 80), cleanText(item, 160)] as const)
        .filter(([key]) => Boolean(key))
        .sort(([left], [right]) => left.localeCompare(right));
      return JSON.stringify(Object.fromEntries(entries)).slice(0, 500) || null;
    } catch {
      return null;
    }
  }
  return cleanText(value, 500) || null;
}

function parseLines(value: unknown): CheckoutLineInput[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) {
    throw new CheckoutError('Cart must contain between 1 and 50 line items.', 400);
  }

  const merged = new Map<string, CheckoutLineInput>();
  for (const rawLine of value) {
    if (!rawLine || typeof rawLine !== 'object') {
      throw new CheckoutError('Invalid cart item.', 400);
    }

    const line = rawLine as Record<string, unknown>;
    const productId = cleanText(line.productId, 80);
    const quantity = Number(line.quantity);
    const variation = normalizeVariation(line.variation);

    if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      throw new CheckoutError('Invalid product or quantity.', 400);
    }

    const key = `${productId}\u0000${variation || ''}`;
    const existing = merged.get(key);
    const combinedQuantity = (existing?.quantity || 0) + quantity;
    if (combinedQuantity > 99) {
      throw new CheckoutError('A product quantity cannot exceed 99.', 400);
    }
    merged.set(key, { productId, quantity: combinedQuantity, variation });
  }

  const lines = [...merged.values()];
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  if (totalQuantity > 250) {
    throw new CheckoutError('Cart quantity limit exceeded.', 400);
  }
  return lines;
}

function parseAddress(value: unknown): ShippingAddressInput {
  if (!value || typeof value !== 'object') {
    throw new CheckoutError('Shipping address is required.', 400);
  }

  const address = value as Record<string, unknown>;
  const parsed: ShippingAddressInput = {
    fullName: cleanText(address.fullName ?? address.name, 100),
    phone: cleanText(address.phone, 30),
    address1: cleanText(address.address1, 200),
    address2: cleanText(address.address2, 200) || null,
    city: cleanText(address.city, 100),
    state: cleanText(address.state, 100) || null,
    postalCode: cleanText(address.postalCode, 30) || null,
    country: cleanText(address.country, 100),
  };

  if (!parsed.fullName || !parsed.phone || !parsed.address1 || !parsed.city || !parsed.country) {
    throw new CheckoutError('Shipping address is incomplete.', 400);
  }
  return parsed;
}

function parseStoredCheckout(value: string): StoredCheckout | null {
  try {
    const parsed = JSON.parse(value) as Partial<StoredCheckout>;
    if (!parsed.requestHash || !parsed.response?.orderNumber) return null;
    return parsed as StoredCheckout;
  } catch {
    return null;
  }
}

function replayResponse(stored: StoredCheckout, requestHash: string): NextResponse {
  if (stored.requestHash !== requestHash) {
    return NextResponse.json(
      { error: 'This idempotency key was already used for a different checkout request.' },
      { status: 409 },
    );
  }
  const response = NextResponse.json(stored.response);
  response.headers.set('X-Idempotent-Replay', 'true');
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export async function POST(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json({ error: csrf.error || 'Invalid request origin' }, { status: 403 });
  }

  const auth = await requireAuthenticatedUser(request);
  if (auth.response || !auth.user) return auth.response;

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 64 * 1024) {
    return NextResponse.json({ error: 'Checkout request is too large.' }, { status: 413 });
  }

  const idempotencyKey = cleanText(request.headers.get('idempotency-key'), 200);
  if (!/^[A-Za-z0-9._:-]{8,200}$/.test(idempotencyKey)) {
    return NextResponse.json(
      { error: 'A valid Idempotency-Key header is required.' },
      { status: 400 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const requestHash = createHash('sha256')
    .update(JSON.stringify(body))
    .digest('hex');
  const idempotencyStorageKey = `checkout.idempotency.${auth.user.id}.${createHash('sha256')
    .update(idempotencyKey)
    .digest('hex')}`;

  try {
    const previous = await db.platformSettings.findUnique({
      where: { key: idempotencyStorageKey },
      select: { value: true },
    });
    if (previous) {
      const stored = parseStoredCheckout(previous.value);
      if (stored) return replayResponse(stored, requestHash);
    }

    const lines = parseLines(body.items);
    const address = parseAddress(body.shippingAddress);
    const shippingMethod = cleanText(body.shippingMethod, 30);
    const paymentMethod = cleanText(body.paymentMethod, 30);
    const countryCode = cleanText(body.countryCode, 2).toLowerCase() || 'iq';
    const couponCode = cleanText(body.couponCode, 80).toUpperCase();

    if (!VALID_SHIPPING_METHODS.includes(shippingMethod as (typeof VALID_SHIPPING_METHODS)[number])) {
      throw new CheckoutError('Invalid shipping method.', 400);
    }
    if (!VALID_PAYMENT_METHODS.includes(paymentMethod as (typeof VALID_PAYMENT_METHODS)[number])) {
      throw new CheckoutError('Invalid payment method.', 400);
    }

    const uniqueProductIds = [...new Set(lines.map(line => line.productId))];
    const products = await db.product.findMany({
      where: { id: { in: uniqueProductIds }, status: 'active' },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        storeId: true,
        store: { select: { ownerId: true } },
      },
    });

    if (products.length !== uniqueProductIds.length) {
      throw new CheckoutError('One or more products are unavailable.', 409);
    }

    const productById = new Map(products.map(product => [product.id, product]));
    const enrichedLines = lines.map(line => {
      const product = productById.get(line.productId);
      if (!product) throw new CheckoutError('Product not found.', 409);
      if (product.stock < line.quantity) {
        throw new CheckoutError(`Insufficient stock for ${product.name}.`, 409);
      }
      const unitPrice = money(Number(product.price));
      return {
        ...line,
        unitPrice,
        lineTotal: money(unitPrice * line.quantity),
        storeId: product.storeId,
        sellerId: product.store.ownerId,
      };
    });

    const groups = new Map<
      string,
      {
        storeId: string;
        sellerId: string;
        subtotal: number;
        items: typeof enrichedLines;
      }
    >();

    for (const line of enrichedLines) {
      const group = groups.get(line.storeId) || {
        storeId: line.storeId,
        sellerId: line.sellerId,
        subtotal: 0,
        items: [],
      };
      group.items.push(line);
      group.subtotal = money(group.subtotal + line.lineTotal);
      groups.set(line.storeId, group);
    }

    const orderGroups = [...groups.values()];
    const subtotal = money(orderGroups.reduce((sum, group) => sum + group.subtotal, 0));
    if (subtotal <= 0) throw new CheckoutError('Cart total must be greater than zero.', 400);

    let coupon:
      | {
          id: string;
          type: string;
          discount: number;
          minOrder: number;
          maxDiscount: number | null;
          storeId: string | null;
        }
      | null = null;
    let discount = 0;

    if (couponCode) {
      const record = await db.coupon.findUnique({ where: { code: couponCode } });
      const now = new Date();
      if (
        !record ||
        !record.isActive ||
        (record.expiresAt && record.expiresAt <= now) ||
        (record.usageLimit !== null && record.usedCount >= record.usageLimit)
      ) {
        throw new CheckoutError('Coupon is invalid or no longer available.', 409);
      }

      const eligibleSubtotal = record.storeId
        ? money(orderGroups
            .filter(group => group.storeId === record.storeId)
            .reduce((sum, group) => sum + group.subtotal, 0))
        : subtotal;

      if (eligibleSubtotal <= 0) {
        throw new CheckoutError('Coupon does not apply to these products.', 409);
      }
      if (eligibleSubtotal < Number(record.minOrder)) {
        throw new CheckoutError('The order does not meet the coupon minimum.', 409);
      }

      if (record.type === 'percentage') {
        discount = money(eligibleSubtotal * (Number(record.discount) / 100));
        if (record.maxDiscount !== null) {
          discount = Math.min(discount, money(Number(record.maxDiscount)));
        }
      } else if (record.type === 'fixed') {
        discount = Math.min(eligibleSubtotal, money(Number(record.discount)));
      }

      coupon = {
        id: record.id,
        type: record.type,
        discount: Number(record.discount),
        minOrder: Number(record.minOrder),
        maxDiscount: record.maxDiscount === null ? null : Number(record.maxDiscount),
        storeId: record.storeId,
      };
    }

    let shippingCost =
      shippingMethod === 'next_day'
        ? SHIPPING_CONFIG.methods.nextDay.price
        : shippingMethod === 'express'
          ? SHIPPING_CONFIG.methods.express.price
          : subtotal >= SHIPPING_CONFIG.freeShippingThreshold
            ? 0
            : SHIPPING_CONFIG.defaultShippingRate;

    if (coupon?.type === 'free_shipping') shippingCost = 0;
    shippingCost = money(shippingCost);

    const taxRate = getTaxRate(countryCode);
    const eligibleGroupSubtotal = coupon?.storeId
      ? orderGroups
          .filter(group => group.storeId === coupon.storeId)
          .reduce((sum, group) => sum + group.subtotal, 0)
      : subtotal;

    let allocatedDiscount = 0;
    const discountEligibleGroups = orderGroups.filter(
      group => !coupon?.storeId || group.storeId === coupon.storeId,
    );

    const allocations = orderGroups.map(group => {
      let groupDiscount = 0;
      if (discount > 0 && discountEligibleGroups.some(item => item.storeId === group.storeId)) {
        const eligibleIndex = discountEligibleGroups.findIndex(item => item.storeId === group.storeId);
        const isLastEligible = eligibleIndex === discountEligibleGroups.length - 1;
        groupDiscount = isLastEligible
          ? money(discount - allocatedDiscount)
          : money(discount * (group.subtotal / eligibleGroupSubtotal));
        allocatedDiscount = money(allocatedDiscount + groupDiscount);
      }
      const taxableAmount = Math.max(0, money(group.subtotal - groupDiscount));
      const groupTax = money(taxableAmount * (taxRate / 100));
      return { ...group, discount: groupDiscount, tax: groupTax };
    });

    const tax = money(allocations.reduce((sum, group) => sum + group.tax, 0));
    const total = money(subtotal + shippingCost + tax - discount);
    const paymentStatus = paymentMethod === 'wallet' ? 'paid' : 'pending';

    const transactionResult = await db.$transaction(
      async tx => {
        const existing = await tx.platformSettings.findUnique({
          where: { key: idempotencyStorageKey },
          select: { value: true },
        });
        if (existing) {
          const stored = parseStoredCheckout(existing.value);
          if (!stored) throw new CheckoutError('Stored checkout result is invalid.', 500);
          if (stored.requestHash !== requestHash) {
            throw new CheckoutError(
              'This idempotency key was already used for a different checkout request.',
              409,
            );
          }
          return stored.response;
        }

        if (paymentMethod === 'wallet') {
          const walletUpdate = await tx.user.updateMany({
            where: { id: auth.user.id, walletBalance: { gte: total } },
            data: { walletBalance: { decrement: total } },
          });
          if (walletUpdate.count !== 1) {
            throw new CheckoutError('Insufficient wallet balance.', 409);
          }
        }

        for (const line of enrichedLines) {
          const stockUpdate = await tx.product.updateMany({
            where: {
              id: line.productId,
              status: 'active',
              stock: { gte: line.quantity },
            },
            data: {
              stock: { decrement: line.quantity },
              soldCount: { increment: line.quantity },
            },
          });
          if (stockUpdate.count !== 1) {
            throw new CheckoutError('Product stock changed. Review the cart and try again.', 409);
          }
        }

        if (coupon) {
          const couponUpdate = await tx.coupon.updateMany({
            where: {
              id: coupon.id,
              isActive: true,
              ...(couponCode ? { code: couponCode } : {}),
            },
            data: { usedCount: { increment: 1 } },
          });
          if (couponUpdate.count !== 1) {
            throw new CheckoutError('Coupon is no longer available.', 409);
          }
        }

        const orderNumbers: string[] = [];
        for (let index = 0; index < allocations.length; index += 1) {
          const group = allocations[index];
          const groupShipping = index === 0 ? shippingCost : 0;
          const groupTotal = money(
            group.subtotal + groupShipping + group.tax - group.discount,
          );
          const orderNumber = `NXM-${Date.now().toString(36).toUpperCase()}-${randomUUID()
            .slice(0, 6)
            .toUpperCase()}-${index + 1}`;

          const order = await tx.order.create({
            data: {
              orderNumber,
              userId: auth.user.id,
              storeId: group.storeId,
              status: paymentStatus === 'paid' ? 'processing' : 'pending',
              subtotal: group.subtotal,
              shippingCost: groupShipping,
              discount: group.discount,
              tax: group.tax,
              total: groupTotal,
              paymentMethod,
              paymentStatus,
              shippingAddress: JSON.stringify(address),
              items: {
                create: group.items.map(item => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  price: item.unitPrice,
                  total: item.lineTotal,
                  variation: item.variation,
                })),
              },
            },
          });

          await tx.invoice.create({
            data: {
              orderId: order.id,
              invoiceNumber: `INV-${orderNumber.slice(4)}`,
              sellerId: group.sellerId,
              buyerId: auth.user.id,
              subtotal: group.subtotal,
              shipping: groupShipping,
              discount: group.discount,
              tax: group.tax,
              total: groupTotal,
              paymentMethod,
              status: paymentStatus === 'paid' ? 'paid' : 'unpaid',
            },
          });

          orderNumbers.push(orderNumber);
        }

        const result: CheckoutResult = {
          orderNumber: orderNumbers[0],
          orderNumbers,
          subtotal,
          shippingCost,
          discount,
          tax,
          total,
          currency: 'USD',
          paymentStatus,
          requiresPayment: paymentStatus !== 'paid',
        };

        await tx.platformSettings.create({
          data: {
            key: idempotencyStorageKey,
            value: JSON.stringify({ requestHash, response: result } satisfies StoredCheckout),
          },
        });

        return result;
      },
      { isolationLevel: 'Serializable' },
    );

    const response = NextResponse.json(transactionResult, { status: 201 });
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';
    if (code === 'P2002') {
      const replay = await db.platformSettings.findUnique({
        where: { key: idempotencyStorageKey },
        select: { value: true },
      });
      if (replay) {
        const stored = parseStoredCheckout(replay.value);
        if (stored) return replayResponse(stored, requestHash);
      }
    }

    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Checkout failed. No partial order was saved.' }, { status: 500 });
  }
}
