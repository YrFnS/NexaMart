import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth';
import {
  CartPricingError,
  groupPricedCart,
  priceCartLines,
} from '@/lib/cart-pricing';
import {
  allocateCents,
  calculateStoreShippingCents,
  calculateStoreTaxCents,
  resolveTaxCountryCode,
} from '@/lib/checkout-authority';
import {
  CouponValidationError,
  quoteCoupon,
} from '@/lib/coupon-authority';
import { db } from '@/lib/db';
import {
  BASE_CURRENCY,
  centsToDecimal,
  fromCents,
  toCents,
} from '@/lib/money';
import { confirmationDeadline } from '@/lib/order-lifecycle';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
} from '@/lib/security';

const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        variantId: z.string().min(1).max(64).optional(),
        quantity: z.number().int().min(1).max(100),
        variation: z
          .union([z.string(), z.record(z.string(), z.string())])
          .optional(),
      }),
    )
    .min(1)
    .max(100),
  shippingMethod: z.enum(['standard', 'express', 'next_day']),
  paymentMethod: z.literal('cash_on_delivery').default('cash_on_delivery'),
  couponCode: z.string().trim().max(50).optional(),
  addressId: z.string().min(1).max(64).optional(),
  address: z
    .object({
      name: z.string().trim().min(2).max(100),
      phone: z.string().trim().min(5).max(30),
      address1: z.string().trim().min(3).max(200),
      address2: z.string().trim().max(200).optional(),
      city: z.string().trim().min(2).max(100),
      state: z.string().trim().max(100).optional(),
      postalCode: z.string().trim().max(30).optional(),
      country: z.string().trim().min(2).max(100),
    })
    .optional(),
  notes: z.string().trim().max(500).optional(),
});

class CheckoutError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

const MAX_SERIALIZABLE_ATTEMPTS = 3;

function isSerializableConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2034'
  );
}

async function retrySerializableTransaction<T>(
  operation: () => Promise<T>,
): Promise<T> {
  for (let attempt = 1; attempt <= MAX_SERIALIZABLE_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (
        !isSerializableConflict(error) ||
        attempt === MAX_SERIALIZABLE_ATTEMPTS
      ) {
        throw error;
      }
    }
  }

  throw new Error('Serializable transaction retry loop exhausted unexpectedly.');
}

function makeOrderNumber(index: number): string {
  const entropy = crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase();
  return `NXM-${Date.now().toString(36).toUpperCase()}-${index + 1}-${entropy}`;
}

function makeInvoiceNumber(index: number): string {
  const entropy = crypto.randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
  return `INV-${Date.now().toString(36).toUpperCase()}-${index + 1}-${entropy}`;
}

async function existingCheckout(userId: string, idempotencyKey: string) {
  const orders = await db.order.findMany({
    where: { userId, idempotencyKey },
    select: { orderNumber: true, total: true, currency: true },
    orderBy: { createdAt: 'asc' },
  });
  if (orders.length === 0) return null;
  const totalCents = orders.reduce((sum, order) => sum + toCents(order.total), 0);
  return {
    success: true,
    idempotentReplay: true,
    orderNumbers: orders.map((order) => order.orderNumber),
    total: fromCents(totalCents),
    currency: BASE_CURRENCY,
    paymentStatus: 'not_applicable' as const,
    orderMethod: 'cash_on_delivery' as const,
  };
}

export async function POST(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;
  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Invalid request origin.' },
      { status: 403 },
    );
  }
  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  const parsed = checkoutSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'The checkout information is incomplete or invalid.' },
      { status: 400 },
    );
  }
  const input = parsed.data;
  const replay = await existingCheckout(auth.user.id, input.idempotencyKey);
  if (replay) return NextResponse.json(replay);

  try {
    const result = await retrySerializableTransaction(() =>
      db.$transaction(
        async (tx) => {
          let shippingAddress: Record<string, unknown>;
          let shippingCountry: string;
          if (input.addressId) {
            const address = await tx.address.findFirst({
              where: { id: input.addressId, userId: auth.user.id },
            });
            if (!address) {
              throw new CheckoutError('Shipping address was not found.', 404);
            }
            shippingCountry = address.country;
            shippingAddress = {
              id: address.id,
              name: address.fullName,
              phone: address.phone,
              address1: address.address1,
              address2: address.address2,
              city: address.city,
              state: address.state,
              postalCode: address.postalCode,
              country: address.country,
            };
          } else if (input.address) {
            shippingCountry = input.address.country;
            shippingAddress = input.address;
          } else {
            throw new CheckoutError('A shipping address is required.');
          }

          const taxCountryCode = resolveTaxCountryCode(shippingCountry);
          if (!taxCountryCode) {
            throw new CheckoutError(
              'The selected shipping country is not supported for checkout.',
            );
          }
          shippingAddress = { ...shippingAddress, countryCode: taxCountryCode };

          const lines = await priceCartLines(tx, input.items);
          const groups = groupPricedCart(lines);
          const checkoutSubtotal = groups.reduce(
            (sum, group) => sum + group.subtotalCents,
            0,
          );
          const couponQuote = await quoteCoupon(
            tx,
            input.couponCode,
            groups.map((group) => ({
              storeId: group.storeId,
              subtotalCents: group.subtotalCents,
            })),
          );
          const discounts =
            couponQuote?.allocations || groups.map(() => 0);
          const shippingAllocations = groups.map((group) =>
            calculateStoreShippingCents(
              input.shippingMethod,
              group.subtotalCents,
              group.items.map((item) => ({
                hasFreeShipping: item.product.hasFreeShipping,
              })),
            ),
          );
          const taxes = groups.map((group, index) =>
            calculateStoreTaxCents(
              taxCountryCode,
              group.items.map((item) => ({
                lineTotalCents: item.lineTotalCents,
                categoryId: item.product.category.id,
                categorySlug: item.product.category.slug,
                categoryName: item.product.category.name,
              })),
              discounts[index],
            ),
          );
          const totals = groups.map(
            (group, index) =>
              group.subtotalCents +
              shippingAllocations[index] -
              discounts[index] +
              taxes[index],
          );
          const checkoutTotal = totals.reduce((sum, value) => sum + value, 0);

          const quantitiesByProduct = new Map<string, number>();
          const quantitiesByVariant = new Map<
            string,
            { quantity: number; name: string }
          >();
          for (const line of lines) {
            quantitiesByProduct.set(
              line.product.id,
              (quantitiesByProduct.get(line.product.id) || 0) + line.quantity,
            );
            if (line.variant) {
              const current = quantitiesByVariant.get(line.variant.id);
              quantitiesByVariant.set(line.variant.id, {
                quantity: (current?.quantity || 0) + line.quantity,
                name: `${line.product.name} (${line.variant.sku})`,
              });
            }
          }

          for (const [variantId, reservation] of quantitiesByVariant) {
            const updated = await tx.productVariant.updateMany({
              where: {
                id: variantId,
                isActive: true,
                stock: { gte: reservation.quantity },
              },
              data: { stock: { decrement: reservation.quantity } },
            });
            if (updated.count !== 1) {
              throw new CheckoutError(
                `${reservation.name} changed while ordering.`,
                409,
              );
            }
          }
          for (const [productId, quantity] of quantitiesByProduct) {
            const product = lines.find(
              (line) => line.product.id === productId,
            )?.product;
            const updated = await tx.product.updateMany({
              where: {
                id: productId,
                status: 'active',
                stock: { gte: quantity },
              },
              data: {
                stock: { decrement: quantity },
                soldCount: { increment: quantity },
              },
            });
            if (updated.count !== 1) {
              throw new CheckoutError(
                `${product?.name || 'Product'} changed while the order was being placed.`,
                409,
              );
            }
          }

          if (couponQuote) {
            const updatedCoupon = await tx.coupon.updateMany({
              where: {
                id: couponQuote.couponId,
                isActive: true,
                ...(couponQuote.usageLimit !== null
                  ? { usedCount: { lt: couponQuote.usageLimit } }
                  : {}),
              },
              data: { usedCount: { increment: 1 } },
            });
            if (updatedCoupon.count !== 1) {
              throw new CouponValidationError(
                'This coupon reached its usage limit while the order was being placed.',
                409,
              );
            }
          }

          const orderNumbers: string[] = [];
          for (let index = 0; index < groups.length; index += 1) {
            const group = groups[index];
            const orderNumber = makeOrderNumber(index);
            const invoiceNumber = makeInvoiceNumber(index);
            const order = await tx.order.create({
              data: {
                orderNumber,
                idempotencyKey: input.idempotencyKey,
                userId: auth.user.id,
                storeId: group.storeId,
                status: 'pending',
                confirmationExpiresAt: confirmationDeadline(),
                subtotal: centsToDecimal(group.subtotalCents),
                shippingCost: centsToDecimal(shippingAllocations[index]),
                discount: centsToDecimal(discounts[index]),
                tax: centsToDecimal(taxes[index]),
                total: centsToDecimal(totals[index]),
                currency: BASE_CURRENCY,
                paymentMethod: 'cash_on_delivery',
                paymentStatus: 'not_applicable',
                shippingAddress: JSON.stringify(shippingAddress),
                notes: input.notes || null,
                items: {
                  create: group.items.map((item) => ({
                    productId: item.product.id,
                    variantId: item.variant?.id || null,
                    quantity: item.quantity,
                    price: centsToDecimal(item.unitPriceCents),
                    total: centsToDecimal(item.lineTotalCents),
                    currency: BASE_CURRENCY,
                    variation: item.variation,
                  })),
                },
                statusEvents: {
                  create: {
                    fromStatus: null,
                    toStatus: 'pending',
                    actorId: auth.user.id,
                    actorRole: 'buyer',
                    note: 'Order placed and waiting for seller confirmation',
                  },
                },
              },
            });
            await tx.invoice.create({
              data: {
                orderId: order.id,
                invoiceNumber,
                sellerId: group.items[0].product.store.ownerId,
                buyerId: auth.user.id,
                subtotal: centsToDecimal(group.subtotalCents),
                shipping: centsToDecimal(shippingAllocations[index]),
                discount: centsToDecimal(discounts[index]),
                tax: centsToDecimal(taxes[index]),
                total: centsToDecimal(totals[index]),
                currency: BASE_CURRENCY,
                paymentMethod: 'cash_on_delivery',
                status: 'issued',
              },
            });
            orderNumbers.push(orderNumber);
          }

          await tx.notification.create({
            data: {
              userId: auth.user.id,
              title: 'Order placed',
              titleAr: 'تم إنشاء الطلب',
              message: `Your order ${orderNumbers.join(', ')} is waiting for seller confirmation.`,
              messageAr: `طلبك ${orderNumbers.join('، ')} بانتظار تأكيد البائع.`,
              type: 'order',
            },
          });

          return {
            success: true,
            idempotentReplay: false,
            orderNumbers,
            total: fromCents(checkoutTotal),
            subtotal: fromCents(checkoutSubtotal),
            shipping: fromCents(
              shippingAllocations.reduce((sum, value) => sum + value, 0),
            ),
            discount: fromCents(couponQuote?.discountCents || 0),
            tax: fromCents(taxes.reduce((sum, value) => sum + value, 0)),
            taxCountryCode,
            currency: BASE_CURRENCY,
            shipments: groups.map((group, index) => ({
              storeId: group.storeId,
              subtotal: fromCents(group.subtotalCents),
              shipping: fromCents(shippingAllocations[index]),
              discount: fromCents(discounts[index]),
              tax: fromCents(taxes[index]),
              total: fromCents(totals[index]),
              currency: BASE_CURRENCY,
            })),
            paymentStatus: 'not_applicable' as const,
            orderMethod: 'cash_on_delivery' as const,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 5_000,
          timeout: 15_000,
        },
      ),
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (
      error instanceof CheckoutError ||
      error instanceof CartPricingError ||
      error instanceof CouponValidationError
    ) {
      return NextResponse.json(
        { error: error.message, code: 'code' in error ? error.code : undefined },
        { status: error.status },
      );
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const replayAfterRace = await existingCheckout(
        auth.user.id,
        input.idempotencyKey,
      );
      if (replayAfterRace) return NextResponse.json(replayAfterRace);
    }
    if (isSerializableConflict(error)) {
      return NextResponse.json(
        {
          error:
            'The cart changed while checkout was being completed. Review stock and try again.',
          code: 'CHECKOUT_CONFLICT',
        },
        { status: 409 },
      );
    }
    console.error('Checkout error:', error);
    return NextResponse.json(
      {
        error:
          'The order could not be completed. No partial order was saved.',
      },
      { status: 500 },
    );
  }
}
