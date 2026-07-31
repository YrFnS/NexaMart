import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth';
import {
  allocateCents,
  calculateStoreShippingCents,
  calculateStoreTaxCents,
  fromCents,
  resolveTaxCountryCode,
  toCents,
  validateVariationSelection,
  VariationValidationError,
} from '@/lib/checkout-authority';
import { db } from '@/lib/db';
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
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
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
    select: { orderNumber: true, total: true },
    orderBy: { createdAt: 'asc' },
  });

  if (orders.length === 0) return null;
  return {
    success: true,
    idempotentReplay: true,
    orderNumbers: orders.map((order) => order.orderNumber),
    total: orders.reduce((sum, order) => sum + Number(order.total), 0),
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

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
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
    const result = await db.$transaction(
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
            400,
          );
        }
        shippingAddress = { ...shippingAddress, countryCode: taxCountryCode };

        const productIds = [...new Set(input.items.map((item) => item.productId))];
        const products = await tx.product.findMany({
          where: { id: { in: productIds }, status: 'active' },
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            storeId: true,
            variations: true,
            hasFreeShipping: true,
            category: { select: { id: true, slug: true, name: true } },
            store: { select: { ownerId: true, name: true } },
            variantSkus: {
              where: { isActive: true },
              select: {
                id: true,
                sku: true,
                attributes: true,
                optionKey: true,
                price: true,
                stock: true,
              },
            },
          },
        });
        const productsById = new Map(products.map((product) => [product.id, product]));
        if (products.length !== productIds.length) {
          throw new CheckoutError('One or more products are no longer available.', 409);
        }

        const requested = new Map<string, {
          productId: string;
          variantId: string | null;
          quantity: number;
          variation: string | null;
        }>();

        for (const item of input.items) {
          const product = productsById.get(item.productId);
          if (!product) throw new CheckoutError('Product not found.', 404);

          let canonicalSelection: string | null = null;
          try {
            canonicalSelection = validateVariationSelection(
              product.variations,
              item.variation,
            ).canonical;
          } catch (error) {
            if (error instanceof VariationValidationError) {
              throw new CheckoutError(`${product.name}: ${error.message}`, 409);
            }
            throw error;
          }

          let variant: (typeof product.variantSkus)[number] | null = null;
          if (product.variantSkus.length > 0) {
            variant = item.variantId
              ? product.variantSkus.find((candidate) => candidate.id === item.variantId) || null
              : product.variantSkus.find((candidate) => candidate.optionKey === canonicalSelection) || null;
            if (!variant) {
              throw new CheckoutError(
                `${product.name}: the selected SKU is no longer available.`,
                409,
              );
            }
            if (canonicalSelection && variant.optionKey !== canonicalSelection) {
              throw new CheckoutError(
                `${product.name}: the submitted SKU does not match the selected options.`,
                409,
              );
            }
            canonicalSelection = variant.attributes;
          } else if (item.variantId) {
            throw new CheckoutError(`${product.name}: invalid SKU selection.`, 409);
          }

          const key = variant?.id || `${item.productId}:base`;
          const current = requested.get(key);
          requested.set(key, {
            productId: item.productId,
            variantId: variant?.id || null,
            variation: canonicalSelection,
            quantity: (current?.quantity || 0) + item.quantity,
          });
        }

        const prepared = [...requested.values()].map((item) => {
          const product = productsById.get(item.productId);
          if (!product) throw new CheckoutError('Product not found.', 404);
          const variant = item.variantId
            ? product.variantSkus.find((candidate) => candidate.id === item.variantId) || null
            : null;
          const unitPrice = toCents(Number(variant?.price ?? product.price));
          return {
            ...item,
            product,
            variant,
            unitPrice,
            availableStock: variant?.stock ?? product.stock,
            lineTotal: unitPrice * item.quantity,
          };
        });

        const quantitiesByProduct = new Map<string, number>();
        const quantitiesByVariant = new Map<string, { quantity: number; name: string }>();
        for (const item of prepared) {
          quantitiesByProduct.set(
            item.product.id,
            (quantitiesByProduct.get(item.product.id) || 0) + item.quantity,
          );
          if (item.variant) {
            const current = quantitiesByVariant.get(item.variant.id);
            quantitiesByVariant.set(item.variant.id, {
              quantity: (current?.quantity || 0) + item.quantity,
              name: `${item.product.name} (${item.variant.sku})`,
            });
          }
          if (item.availableStock < item.quantity) {
            throw new CheckoutError(
              `${item.product.name} does not have enough stock for this SKU.`,
              409,
            );
          }
        }

        const groups = new Map<string, typeof prepared>();
        for (const item of prepared) {
          const group = groups.get(item.product.storeId) || [];
          group.push(item);
          groups.set(item.product.storeId, group);
        }
        const stores = [...groups.entries()];
        const subtotals = stores.map(([, items]) =>
          items.reduce((sum, item) => sum + item.lineTotal, 0),
        );
        const checkoutSubtotal = subtotals.reduce((sum, value) => sum + value, 0);

        let couponDiscount = 0;
        let couponId: string | null = null;
        let eligibleStoreId: string | null = null;
        if (input.couponCode) {
          const coupon = await tx.coupon.findUnique({
            where: { code: input.couponCode.toUpperCase() },
          });
          const now = new Date();
          if (
            !coupon ||
            !coupon.isActive ||
            (coupon.expiresAt && coupon.expiresAt <= now) ||
            (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)
          ) {
            throw new CheckoutError('This coupon is invalid or has expired.');
          }
          eligibleStoreId = coupon.storeId;
          const eligibleSubtotal = coupon.storeId
            ? stores.reduce(
                (sum, [storeId], index) =>
                  storeId === coupon.storeId ? sum + subtotals[index] : sum,
                0,
              )
            : checkoutSubtotal;
          if (eligibleSubtotal < toCents(Number(coupon.minOrder))) {
            throw new CheckoutError('The order does not meet this coupon minimum.');
          }
          couponDiscount = coupon.type === 'fixed'
            ? toCents(Number(coupon.discount))
            : Math.round((eligibleSubtotal * Number(coupon.discount)) / 100);
          if (coupon.maxDiscount !== null) {
            couponDiscount = Math.min(couponDiscount, toCents(Number(coupon.maxDiscount)));
          }
          couponDiscount = Math.min(couponDiscount, eligibleSubtotal);
          couponId = coupon.id;
        }

        const eligibleWeights = stores.map(([storeId], index) =>
          !eligibleStoreId || storeId === eligibleStoreId ? subtotals[index] : 0,
        );
        const discounts = allocateCents(couponDiscount, eligibleWeights);
        const shippingAllocations = stores.map(([, items], index) =>
          calculateStoreShippingCents(
            input.shippingMethod,
            subtotals[index],
            items.map((item) => ({ hasFreeShipping: item.product.hasFreeShipping })),
          ),
        );
        const taxes = stores.map(([, items], index) =>
          calculateStoreTaxCents(
            taxCountryCode,
            items.map((item) => ({
              lineTotalCents: item.lineTotal,
              categoryId: item.product.category.id,
              categorySlug: item.product.category.slug,
              categoryName: item.product.category.name,
            })),
            discounts[index],
          ),
        );
        const totals = subtotals.map(
          (subtotal, index) =>
            subtotal + shippingAllocations[index] - discounts[index] + taxes[index],
        );
        const checkoutTotal = totals.reduce((sum, value) => sum + value, 0);


        for (const [variantId, reservation] of quantitiesByVariant) {
          const updated = await tx.productVariant.updateMany({
            where: { id: variantId, isActive: true, stock: { gte: reservation.quantity } },
            data: { stock: { decrement: reservation.quantity } },
          });
          if (updated.count !== 1) {
            throw new CheckoutError(`${reservation.name} changed while ordering.`, 409);
          }
        }
        for (const [productId, quantity] of quantitiesByProduct) {
          const product = productsById.get(productId);
          const updated = await tx.product.updateMany({
            where: { id: productId, status: 'active', stock: { gte: quantity } },
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

        if (couponId) {
          await tx.coupon.update({
            where: { id: couponId },
            data: { usedCount: { increment: 1 } },
          });
        }

        const orderNumbers: string[] = [];
        for (let index = 0; index < stores.length; index += 1) {
          const [storeId, items] = stores[index];
          const orderNumber = makeOrderNumber(index);
          const invoiceNumber = makeInvoiceNumber(index);
          const paymentStatus = 'not_applicable';
          const order = await tx.order.create({
            data: {
              orderNumber,
              idempotencyKey: input.idempotencyKey,
              userId: auth.user.id,
              storeId,
              status: 'pending',
              confirmationExpiresAt: confirmationDeadline(),
              subtotal: fromCents(subtotals[index]),
              shippingCost: fromCents(shippingAllocations[index]),
              discount: fromCents(discounts[index]),
              tax: fromCents(taxes[index]),
              total: fromCents(totals[index]),
              paymentMethod: 'cash_on_delivery',
              paymentStatus,
              shippingAddress: JSON.stringify(shippingAddress),
              notes: input.notes || null,
              items: {
                create: items.map((item) => ({
                  productId: item.product.id,
                  variantId: item.variant?.id || null,
                  quantity: item.quantity,
                  price: fromCents(item.unitPrice),
                  total: fromCents(item.lineTotal),
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
              sellerId: items[0].product.store.ownerId,
              buyerId: auth.user.id,
              subtotal: fromCents(subtotals[index]),
              shipping: fromCents(shippingAllocations[index]),
              discount: fromCents(discounts[index]),
              tax: fromCents(taxes[index]),
              total: fromCents(totals[index]),
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
          shipping: fromCents(shippingAllocations.reduce((sum, value) => sum + value, 0)),
          discount: fromCents(couponDiscount),
          tax: fromCents(taxes.reduce((sum, value) => sum + value, 0)),
          taxCountryCode,
          shipments: stores.map(([storeId], index) => ({
            storeId,
            subtotal: fromCents(subtotals[index]),
            shipping: fromCents(shippingAllocations[index]),
            discount: fromCents(discounts[index]),
            tax: fromCents(taxes[index]),
            total: fromCents(totals[index]),
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
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const replayAfterRace = await existingCheckout(auth.user.id, input.idempotencyKey);
      if (replayAfterRace) return NextResponse.json(replayAfterRace);
    }
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'The order could not be completed. No partial order was saved.' },
      { status: 500 },
    );
  }
}
