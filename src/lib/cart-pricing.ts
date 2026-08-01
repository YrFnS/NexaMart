import type { Prisma } from '@prisma/client';
import {
  validateVariationSelection,
  VariationValidationError,
  type VariationSelection,
} from './checkout-authority.ts';
import {
  assertBaseCurrency,
  BASE_CURRENCY,
  toCents,
} from './money.ts';

export interface CartLineInput {
  productId: string;
  variantId?: string;
  quantity: number;
  variation?: VariationSelection;
}

export class CartPricingError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(
    message: string,
    status = 400,
    code = 'CART_PRICING_ERROR',
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const cartProductSelect = {
  id: true,
  name: true,
  price: true,
  currency: true,
  tieredPricing: true,
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
      currency: true,
      stock: true,
    },
  },
} satisfies Prisma.ProductSelect;

export type CartProduct = Prisma.ProductGetPayload<{
  select: typeof cartProductSelect;
}>;
export type CartVariant = CartProduct['variantSkus'][number];

export interface PricedCartLine {
  productId: string;
  variantId: string | null;
  quantity: number;
  variation: string | null;
  product: CartProduct;
  variant: CartVariant | null;
  unitPriceCents: number;
  lineTotalCents: number;
  availableStock: number;
  currency: typeof BASE_CURRENCY;
}

export interface PricedCartGroup {
  storeId: string;
  items: PricedCartLine[];
  subtotalCents: number;
}

function tierPriceCents(
  raw: string,
  quantity: number,
  basePrice: unknown,
): number {
  let selected = toCents(basePrice as never);
  try {
    const parsed = JSON.parse(raw || '[]') as unknown;
    if (!Array.isArray(parsed)) return selected;
    const tiers = parsed
      .map((value) =>
        value && typeof value === 'object'
          ? (value as Record<string, unknown>)
          : null,
      )
      .filter((value): value is Record<string, unknown> => Boolean(value))
      .map((value) => ({
        minQty: Math.trunc(Number(value.minQty)),
        price: value.price,
      }))
      .filter(
        (value) =>
          Number.isFinite(value.minQty) &&
          value.minQty > 0 &&
          value.price !== null &&
          value.price !== undefined,
      )
      .sort((left, right) => left.minQty - right.minQty);
    for (const tier of tiers) {
      if (quantity >= tier.minQty) selected = toCents(tier.price as never);
    }
  } catch {
    // Invalid legacy tier JSON falls back to the authoritative base price.
  }
  return selected;
}

export async function priceCartLines(
  tx: Prisma.TransactionClient,
  input: CartLineInput[],
): Promise<PricedCartLine[]> {
  if (input.length === 0) {
    throw new CartPricingError('The cart is empty.');
  }

  const productIds = [...new Set(input.map((item) => item.productId))];
  const products = await tx.product.findMany({
    where: { id: { in: productIds }, status: 'active' },
    select: cartProductSelect,
  });
  if (products.length !== productIds.length) {
    throw new CartPricingError(
      'One or more products are no longer available.',
      409,
      'PRODUCT_UNAVAILABLE',
    );
  }
  const productsById = new Map(products.map((product) => [product.id, product]));

  const requested = new Map<
    string,
    {
      productId: string;
      variantId: string | null;
      quantity: number;
      variation: string | null;
    }
  >();

  for (const item of input) {
    const product = productsById.get(item.productId);
    if (!product) {
      throw new CartPricingError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
    }
    assertBaseCurrency(product.currency);

    let canonicalSelection: string | null = null;
    try {
      canonicalSelection = validateVariationSelection(
        product.variations,
        item.variation,
      ).canonical;
    } catch (error) {
      if (error instanceof VariationValidationError) {
        throw new CartPricingError(
          `${product.name}: ${error.message}`,
          409,
          'INVALID_VARIATION',
        );
      }
      throw error;
    }

    let variant: CartVariant | null = null;
    if (product.variantSkus.length > 0) {
      variant = item.variantId
        ? product.variantSkus.find((candidate) => candidate.id === item.variantId) || null
        : product.variantSkus.find(
            (candidate) => candidate.optionKey === canonicalSelection,
          ) || null;
      if (!variant) {
        throw new CartPricingError(
          `${product.name}: the selected SKU is no longer available.`,
          409,
          'SKU_UNAVAILABLE',
        );
      }
      assertBaseCurrency(variant.currency);
      if (canonicalSelection && variant.optionKey !== canonicalSelection) {
        throw new CartPricingError(
          `${product.name}: the submitted SKU does not match the selected options.`,
          409,
          'SKU_OPTION_MISMATCH',
        );
      }
      canonicalSelection = variant.attributes;
    } else if (item.variantId) {
      throw new CartPricingError(
        `${product.name}: invalid SKU selection.`,
        409,
        'INVALID_SKU',
      );
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

  return [...requested.values()].map((item) => {
    const product = productsById.get(item.productId);
    if (!product) {
      throw new CartPricingError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
    }
    const variant = item.variantId
      ? product.variantSkus.find((candidate) => candidate.id === item.variantId) || null
      : null;
    const unitPriceCents = variant
      ? toCents(variant.price)
      : tierPriceCents(product.tieredPricing, item.quantity, product.price);
    const availableStock = variant?.stock ?? product.stock;
    if (availableStock < item.quantity) {
      throw new CartPricingError(
        `${product.name} does not have enough stock for this SKU.`,
        409,
        'INSUFFICIENT_STOCK',
      );
    }
    return {
      ...item,
      product,
      variant,
      unitPriceCents,
      lineTotalCents: unitPriceCents * item.quantity,
      availableStock,
      currency: BASE_CURRENCY,
    };
  });
}

export function groupPricedCart(lines: PricedCartLine[]): PricedCartGroup[] {
  const groups = new Map<string, PricedCartGroup>();
  for (const line of lines) {
    const current = groups.get(line.product.storeId) || {
      storeId: line.product.storeId,
      items: [],
      subtotalCents: 0,
    };
    current.items.push(line);
    current.subtotalCents += line.lineTotalCents;
    groups.set(line.product.storeId, current);
  }
  return [...groups.values()];
}
