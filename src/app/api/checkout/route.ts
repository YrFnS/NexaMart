import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth';
import { SHIPPING_CONFIG } from '@/lib/config';
import { db } from '@/lib/db';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
} from '@/lib/security';
import { getTaxRate } from '@/lib/tax';

const checkoutSchema = z.object({
  idempotencyKey: z.string().uuid(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(64),
        quantity: z.number().int().min(1).max(100),
        variation: z.union([z.string(), z.record(z.string(), z.string())]).optional(),
      }),
    )
    .min(1)
    .max(100),
  shippingMethod: z.enum(['standard', 'express', 'next_day']),
  paymentMethod: z.enum(['cash_on_delivery', 'wallet']),
  countryCode: z.string().trim().min(2).max(3).default('iq'),
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

const toCents = (value: number) => Math.round((value + Number.EPSILON) * 100);
const fromCents = (value: number) => value / 100;

function allocateCents(total: number, weights: number[]): number[] {
  if (weights.length === 0) return [];
  const weightTotal = weights.reduce((sum, value) => sum + value, 0);
  if (weightTotal <= 0) return weights.map(() => 0);

  const allocations = weights.map((weight) => Math.floor((total * weight) / weightTotal));
  let remainder = total - allocations.reduce((sum, value) => sum + value, 0);

  for (let index = 0; remainder > 0; index = (index + 1) % allocations.length) {
    allocations[index] += 1;
    remainder -= 1;
  }

  return allocations;
}

function shippingCents(method: 'standard' | 'express' | 'next_day', subtotal: number) {
  if (method === 'express') return toCents(SHIPPING_CONFIG.methods.express.price);
  if (method === 'next_day') return toCents(SHIPPING_CONFIG.methods.nextDay.price);
  return subtotal >= toCents(SHIPPING_CONFIG.freeShippingThreshold) ? 0 : 999;
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
    select: { orderNumber: true, total: true, paymentStatus: true },
    orderBy: { createdAt: 'asc' },
  });

  if (orders.length === 0) return null;
  return {
    success: true,
    idempotentReplay: true,
    orderNumbers: orders.map((order) => order.orderNumber),
    total: orders.reduce((sum, order) => sum + Number(order.total), 0),
    paymentStatus: orders.every((order) => order.paymentStatus === 'paid')
      ? 'paid'
      : 'pending',
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
        const requested = new Map<
          string,
          { productId: string; quantity: number; variation?: string }
        >();

        for (const item of input.items) {
          const variation =
            typeof item.variation === 'string'
              ? item.variation
              : item.variation
                ? JSON.stringify(item.variation)
                : undefined;
          const key = `${item.productId}:${variation || ''}`;
          const existing = requested.get(key);
          requested.set(key, {
            productId: item.productId,
            variation,
            quantity: (existing?.quantity || 0) + item.quantity,
          });
        }

        const normalizedItems = [...requested.values()];
        const productIds = [...new Set(normalizedItems.map((item) => item.productId))];
        const products = await tx.product.findMany({
          where: { id: { in: productIds }, status: 'active' },
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            storeId: true,
            store: { select: { ownerId: true, name: true } },
          },
        });
        const productsById = new Map(products.map((product) => [product.id, product]));

        if (products.length !== productIds.length) {
          throw new CheckoutError('One or more products are no longer available.', 409);
        }

        const prepared = normalizedItems.map((item) => {
          const product = productsById.get(item.productId);
          if (!product) throw new CheckoutError('Product not found.', 404);
          if (product.stock < item.quantity) {
            throw new CheckoutError(
              `${product.name} does not have enough stock for this order.`,
              409,
            );
          }

          const unitPrice = toCents(Number(product.price));
          return {
            ...item,
            product,
            unitPrice,
            lineTotal: unitPrice * item.quantity,
          };
        });

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

          couponDiscount =
            coupon.type === 'fixed'
              ? toCents(Number(coupon.discount))
              : Math.round((eligibleSubtotal * Number(coupon.discount)) / 100);
          if (coupon.maxDiscount !== null) {
            couponDiscount = Math.min(
              couponDiscount,
              toCents(Number(coupon.maxDiscount)),
            );
          }
          couponDiscount = Math.min(couponDiscount, eligibleSubtotal);
          couponId = coupon.id;
        }

        const eligibleWeights = stores.map(([storeId], index) =>
          !eligibleStoreId || storeId === eligibleStoreId ? subtotals[index] : 0,
        );
        const discounts = allocateCents(couponDiscount, eligibleWeights);
        const shippingTotal = shippingCents(input.shippingMethod, checkoutSubtotal);
        const shippingAllocations = allocateCents(shippingTotal, subtotals);
        const taxRate = Math.max(0, getTaxRate(input.countryCode));
        const taxes = subtotals.map((subtotal, index) =>
          Math.round(((subtotal - discounts[index]) * taxRate) / 100),
        );
        const totals = subtotals.map(
          (subtotal, index) =>
            subtotal + shippingAllocations[index] - discounts[index] + taxes[index],
        );
        const checkoutTotal = totals.reduce((sum, value) => sum + value, 0);

        let shippingAddress: Record<string, unknown>;
        if (input.addressId) {
          const address = await tx.address.findFirst({
            where: { id: input.addressId, userId: auth.user.id },
          });
          if (!address) throw new CheckoutError('Shipping address was not found.', 404);
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
          shippingAddress = input.address;
        } else {
          throw new CheckoutError('A shipping address is required.');
        }

        if (input.paymentMethod === 'wallet') {
          const walletUpdate = await tx.user.updateMany({
            where: {
              id: auth.user.id,
              walletBalance: { gte: fromCents(checkoutTotal) },
            },
            data: { walletBalance: { decrement: fromCents(checkoutTotal) } },
          });
          if (walletUpdate.count !== 1) {
            throw new CheckoutError('Your wallet balance is insufficient.', 409);
          }
        }

        for (const item of prepared) {
          const stockUpdate = await tx.product.updateMany({
            where: {
              id: item.product.id,
              status: 'active',
              stock: { gte: item.quantity },
            },
            data: {
              stock: { decrement: item.quantity },
              soldCount: { increment: item.quantity },
            },
          });
          if (stockUpdate.count !== 1) {
            throw new CheckoutError(
              `${item.product.name} changed while the order was being placed.`,
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
          const paymentStatus = input.paymentMethod === 'wallet' ? 'paid' : 'pending';
          const order = await tx.order.create({
            data: {
              orderNumber,
              idempotencyKey: input.idempotencyKey,
              userId: auth.user.id,
              storeId,
              status: 'pending',
              subtotal: fromCents(subtotals[index]),
              shippingCost: fromCents(shippingAllocations[index]),
              discount: fromCents(discounts[index]),
              tax: fromCents(taxes[index]),
              total: fromCents(totals[index]),
              paymentMethod: input.paymentMethod,
              paymentStatus,
              shippingAddress: JSON.stringify(shippingAddress),
              notes: input.notes || null,
              items: {
                create: items.map((item) => ({
                  productId: item.product.id,
                  quantity: item.quantity,
                  price: fromCents(item.unitPrice),
                  total: fromCents(item.lineTotal),
                  variation: item.variation || null,
                })),
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
              paymentMethod: input.paymentMethod,
              status: paymentStatus === 'paid' ? 'paid' : 'unpaid',
            },
          });
          orderNumbers.push(orderNumber);
        }

        await tx.notification.create({
          data: {
            userId: auth.user.id,
            title: 'Order placed',
            titleAr: 'تم إنشاء الطلب',
            message: `Your order ${orderNumbers.join(', ')} was placed successfully.`,
            messageAr: `تم إنشاء طلبك ${orderNumbers.join('، ')} بنجاح.`,
            type: 'order',
          },
        });

        return {
          success: true,
          idempotentReplay: false,
          orderNumbers,
          total: fromCents(checkoutTotal),
          subtotal: fromCents(checkoutSubtotal),
          shipping: fromCents(shippingTotal),
          discount: fromCents(couponDiscount),
          tax: fromCents(taxes.reduce((sum, value) => sum + value, 0)),
          paymentStatus:
            input.paymentMethod === 'wallet' ? ('paid' as const) : ('pending' as const),
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
