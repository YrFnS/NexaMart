from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def path_for(path: str) -> Path:
    return ROOT / path


def read(path: str) -> str:
    return path_for(path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    file_path = path_for(path)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(content.rstrip() + "\n", encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    count = content.count(old)
    if count != 1:
        raise RuntimeError(
            f"Expected one match in {path}, found {count}: {old[:120]!r}"
        )
    write(path, content.replace(old, new, 1))


def regex_once(path: str, pattern: str, replacement: str, flags: int = 0) -> None:
    content = read(path)
    updated, count = re.subn(pattern, replacement, content, count=1, flags=flags)
    if count != 1:
        raise RuntimeError(
            f"Expected one regex match in {path}, found {count}: {pattern[:120]!r}"
        )
    write(path, updated)


def replace_all(path: str, old: str, new: str, minimum: int = 1) -> None:
    content = read(path)
    count = content.count(old)
    if count < minimum:
        raise RuntimeError(
            f"Expected at least {minimum} matches in {path}, found {count}"
        )
    write(path, content.replace(old, new))


write('src/lib/checkout-authority.ts', "import { SHIPPING_CONFIG } from './config.ts';\nimport { COUNTRY_TAX_RATES, isTaxExempt } from './tax.ts';\n\nexport type ShippingMethod = 'standard' | 'express' | 'next_day';\nexport type VariationSelection =\n  | string\n  | Record<string, string>\n  | null\n  | undefined;\n\nexport interface ShippingLineInput {\n  hasFreeShipping: boolean;\n}\n\nexport interface TaxLineInput {\n  lineTotalCents: number;\n  categoryId?: string | null;\n  categorySlug?: string | null;\n  categoryName?: string | null;\n}\n\nexport interface ValidatedVariation {\n  attributes: Record<string, string>;\n  canonical: string | null;\n}\n\ninterface TierPrice {\n  minQty: number;\n  price: number;\n}\n\nexport class VariationValidationError extends Error {}\n\nexport const toCents = (value: number): number =>\n  Math.round((value + Number.EPSILON) * 100);\n\nexport const fromCents = (value: number): number => value / 100;\n\nexport function allocateCents(total: number, weights: number[]): number[] {\n  if (weights.length === 0) return [];\n\n  const safeTotal = Math.max(0, Math.floor(total));\n  const safeWeights = weights.map((value) =>\n    Number.isFinite(value) && value > 0 ? Math.floor(value) : 0,\n  );\n  const weightTotal = safeWeights.reduce((sum, value) => sum + value, 0);\n  if (weightTotal <= 0) return safeWeights.map(() => 0);\n\n  const allocations = safeWeights.map((weight) =>\n    Math.floor((safeTotal * weight) / weightTotal),\n  );\n  let remainder =\n    safeTotal - allocations.reduce((sum, value) => sum + value, 0);\n\n  for (\n    let index = 0;\n    remainder > 0;\n    index = (index + 1) % allocations.length\n  ) {\n    allocations[index] += 1;\n    remainder -= 1;\n  }\n\n  return allocations;\n}\n\nfunction normalizeCountryAlias(value: string): string {\n  return value\n    .trim()\n    .toLowerCase()\n    .normalize('NFKD')\n    .replace(/[\\u0300-\\u036f]/g, '')\n    .replace(/[^a-z0-9\\u0600-\\u06ff]+/g, '');\n}\n\nconst COUNTRY_ALIASES = (() => {\n  const aliases = new Map<string, string>();\n\n  for (const [countryCode, info] of Object.entries(COUNTRY_TAX_RATES)) {\n    aliases.set(normalizeCountryAlias(countryCode), countryCode);\n    aliases.set(normalizeCountryAlias(info.countryName), countryCode);\n    aliases.set(normalizeCountryAlias(info.countryNameAr), countryCode);\n  }\n\n  const commonAliases: Record<string, string> = {\n    uae: 'ae',\n    unitedarabemirates: 'ae',\n    emirates: 'ae',\n    ksa: 'sa',\n    saudi: 'sa',\n    saudiarabia: 'sa',\n    kingdomofsaudiarabia: 'sa',\n    iraq: 'iq',\n    jordan: 'jo',\n    palestinianterritories: 'ps',\n    palestine: 'ps',\n  };\n\n  for (const [alias, countryCode] of Object.entries(commonAliases)) {\n    aliases.set(normalizeCountryAlias(alias), countryCode);\n  }\n\n  return aliases;\n})();\n\nexport function resolveTaxCountryCode(value: string): string | null {\n  const normalized = normalizeCountryAlias(value);\n  if (!normalized) return null;\n  return COUNTRY_ALIASES.get(normalized) || null;\n}\n\nexport function parseVariationOptions(\n  value: string | null | undefined,\n): Record<string, string[]> {\n  if (!value) return {};\n\n  try {\n    const parsed = JSON.parse(value) as unknown;\n    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};\n\n    const options: Record<string, string[]> = {};\n    for (const [rawKey, rawValues] of Object.entries(parsed)) {\n      const key = rawKey.trim();\n      if (!key || !Array.isArray(rawValues)) continue;\n\n      const values = [\n        ...new Set(\n          rawValues\n            .filter((item): item is string => typeof item === 'string')\n            .map((item) => item.trim())\n            .filter(Boolean),\n        ),\n      ];\n      if (values.length > 0) options[key] = values;\n    }\n    return options;\n  } catch {\n    return {};\n  }\n}\n\nfunction parseVariationSelection(\n  selection: VariationSelection,\n  optionKeys: string[],\n): Record<string, string> | null {\n  if (!selection) return null;\n\n  if (typeof selection === 'object') {\n    return Object.fromEntries(\n      Object.entries(selection).map(([key, value]) => [\n        key.trim(),\n        String(value).trim(),\n      ]),\n    );\n  }\n\n  const trimmed = selection.trim();\n  if (!trimmed) return null;\n\n  try {\n    const parsed = JSON.parse(trimmed) as unknown;\n    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {\n      return Object.fromEntries(\n        Object.entries(parsed).map(([key, value]) => [\n          key.trim(),\n          String(value).trim(),\n        ]),\n      );\n    }\n  } catch {\n    // A legacy plain-string selection is supported only for one-dimensional\n    // products, where its meaning is unambiguous.\n  }\n\n  if (optionKeys.length === 1) {\n    return { [optionKeys[0]]: trimmed };\n  }\n\n  return null;\n}\n\nexport function canonicalizeVariation(\n  attributes: Record<string, string>,\n): string {\n  return JSON.stringify(\n    Object.fromEntries(\n      Object.entries(attributes)\n        .map(([key, value]) => [key.trim(), value.trim()] as const)\n        .filter(([key, value]) => Boolean(key && value))\n        .sort(([left], [right]) => left.localeCompare(right)),\n    ),\n  );\n}\n\nexport function parseVariantAttributes(value: string): Record<string, string> {\n  try {\n    const parsed = JSON.parse(value) as unknown;\n    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {\n      throw new Error('Variant attributes must be an object.');\n    }\n\n    const normalized = Object.fromEntries(\n      Object.entries(parsed).map(([key, option]) => [\n        key.trim(),\n        typeof option === 'string' ? option.trim() : '',\n      ]),\n    );\n    const canonical = canonicalizeVariation(normalized);\n    if (canonical === '{}') {\n      throw new Error('Variant attributes cannot be empty.');\n    }\n    return JSON.parse(canonical) as Record<string, string>;\n  } catch (error) {\n    if (error instanceof VariationValidationError) throw error;\n    throw new VariationValidationError(\n      error instanceof Error\n        ? error.message\n        : 'Variant attributes are invalid.',\n    );\n  }\n}\n\nexport function canonicalizeStoredVariant(value: string): string {\n  return canonicalizeVariation(parseVariantAttributes(value));\n}\n\nexport function validateVariationSelection(\n  rawOptions: string | null | undefined,\n  selection: VariationSelection,\n): ValidatedVariation {\n  const options = parseVariationOptions(rawOptions);\n  const optionKeys = Object.keys(options).sort();\n  const attributes = parseVariationSelection(selection, optionKeys);\n\n  if (optionKeys.length === 0) {\n    if (attributes && Object.keys(attributes).length > 0) {\n      throw new VariationValidationError(\n        'This product does not accept variation selections.',\n      );\n    }\n    return { attributes: {}, canonical: null };\n  }\n\n  if (!attributes) {\n    throw new VariationValidationError(\n      'Please select every required product option.',\n    );\n  }\n\n  const selectedKeys = Object.keys(attributes).sort();\n  if (\n    selectedKeys.length !== optionKeys.length ||\n    selectedKeys.some((key, index) => key !== optionKeys[index])\n  ) {\n    throw new VariationValidationError(\n      'The selected product options are incomplete or invalid.',\n    );\n  }\n\n  for (const key of optionKeys) {\n    if (!options[key].includes(attributes[key])) {\n      throw new VariationValidationError(\n        `The selected ${key} option is no longer available.`,\n      );\n    }\n  }\n\n  const ordered = Object.fromEntries(\n    optionKeys.map((key) => [key, attributes[key]]),\n  );\n  return {\n    attributes: ordered,\n    canonical: canonicalizeVariation(ordered),\n  };\n}\n\nexport function parseTieredPricing(\n  value: string | null | undefined,\n): TierPrice[] {\n  if (!value) return [];\n\n  try {\n    const parsed = JSON.parse(value) as unknown;\n    if (!Array.isArray(parsed)) return [];\n\n    return parsed\n      .map((item) => {\n        if (!item || typeof item !== 'object') return null;\n        const record = item as Record<string, unknown>;\n        const minQty = Number(record.minQty);\n        const price = Number(record.price);\n        if (\n          !Number.isInteger(minQty) ||\n          minQty < 1 ||\n          !Number.isFinite(price) ||\n          price < 0\n        ) {\n          return null;\n        }\n        return { minQty, price };\n      })\n      .filter((item): item is TierPrice => Boolean(item))\n      .sort((left, right) => right.minQty - left.minQty);\n  } catch {\n    return [];\n  }\n}\n\nexport function resolveTierUnitPriceCents(\n  rawTieredPricing: string | null | undefined,\n  quantity: number,\n  basePriceCents: number,\n): number {\n  const tier = parseTieredPricing(rawTieredPricing).find(\n    (candidate) => quantity >= candidate.minQty,\n  );\n  return tier ? toCents(tier.price) : basePriceCents;\n}\n\nexport function calculateStoreShippingCents(\n  method: ShippingMethod,\n  subtotalCents: number,\n  lines: ShippingLineInput[],\n): number {\n  if (method === 'express') {\n    return toCents(SHIPPING_CONFIG.methods.express.price);\n  }\n  if (method === 'next_day') {\n    return toCents(SHIPPING_CONFIG.methods.nextDay.price);\n  }\n\n  const qualifiesBySubtotal =\n    subtotalCents >= toCents(SHIPPING_CONFIG.freeShippingThreshold);\n  const everyLineShipsFree =\n    lines.length > 0 && lines.every((line) => line.hasFreeShipping);\n\n  return qualifiesBySubtotal || everyLineShipsFree\n    ? 0\n    : toCents(SHIPPING_CONFIG.defaultShippingRate);\n}\n\nfunction lineIsTaxExempt(countryCode: string, line: TaxLineInput): boolean {\n  const candidates = [line.categorySlug, line.categoryId, line.categoryName]\n    .filter((value): value is string => Boolean(value?.trim()))\n    .map((value) => value.trim());\n\n  return candidates.some((candidate) => isTaxExempt(countryCode, candidate));\n}\n\nexport function calculateStoreTaxCents(\n  countryCode: string,\n  lines: TaxLineInput[],\n  storeDiscountCents: number,\n): number {\n  const taxInfo = COUNTRY_TAX_RATES[countryCode];\n  if (!taxInfo || taxInfo.vatRate <= 0 || lines.length === 0) return 0;\n\n  const lineDiscounts = allocateCents(\n    storeDiscountCents,\n    lines.map((line) => line.lineTotalCents),\n  );\n\n  return lines.reduce((total, line, index) => {\n    if (lineIsTaxExempt(countryCode, line)) return total;\n    const taxableCents = Math.max(\n      0,\n      line.lineTotalCents - lineDiscounts[index],\n    );\n    return total + Math.round((taxableCents * taxInfo.vatRate) / 100);\n  }, 0);\n}\n")

write('src/lib/checkout-authority.test.ts', "import assert from 'node:assert/strict';\nimport test from 'node:test';\nimport {\n  allocateCents,\n  calculateStoreShippingCents,\n  calculateStoreTaxCents,\n  canonicalizeStoredVariant,\n  canonicalizeVariation,\n  parseVariantAttributes,\n  resolveTaxCountryCode,\n  resolveTierUnitPriceCents,\n  validateVariationSelection,\n  VariationValidationError,\n} from './checkout-authority.ts';\n\ntest('shipping country aliases resolve to supported tax jurisdictions', () => {\n  assert.equal(resolveTaxCountryCode('IQ'), 'iq');\n  assert.equal(resolveTaxCountryCode('Iraq'), 'iq');\n  assert.equal(resolveTaxCountryCode('العراق'), 'iq');\n  assert.equal(resolveTaxCountryCode('UAE'), 'ae');\n  assert.equal(resolveTaxCountryCode('Kingdom of Saudi Arabia'), 'sa');\n  assert.equal(resolveTaxCountryCode('Unknown jurisdiction'), null);\n});\n\ntest('variation selections are canonical and require every configured option', () => {\n  const options = JSON.stringify({\n    size: ['M', 'L'],\n    color: ['Black', 'White'],\n  });\n  const validated = validateVariationSelection(options, {\n    size: 'L',\n    color: 'Black',\n  });\n\n  assert.deepEqual(validated.attributes, { color: 'Black', size: 'L' });\n  assert.equal(validated.canonical, '{\"color\":\"Black\",\"size\":\"L\"}');\n  assert.equal(\n    canonicalizeVariation({ size: 'L', color: 'Black' }),\n    validated.canonical,\n  );\n\n  assert.throws(\n    () => validateVariationSelection(options, { color: 'Black' }),\n    VariationValidationError,\n  );\n  assert.throws(\n    () =>\n      validateVariationSelection(options, {\n        color: 'Purple',\n        size: 'L',\n      }),\n    VariationValidationError,\n  );\n});\n\ntest('stored SKU attributes are normalized before checkout comparison', () => {\n  assert.deepEqual(parseVariantAttributes('{\"size\":\"L\",\"color\":\"Black\"}'), {\n    color: 'Black',\n    size: 'L',\n  });\n  assert.equal(\n    canonicalizeStoredVariant('{\"size\":\"L\",\"color\":\"Black\"}'),\n    '{\"color\":\"Black\",\"size\":\"L\"}',\n  );\n  assert.throws(\n    () => parseVariantAttributes('{\"size\":42}'),\n    VariationValidationError,\n  );\n});\n\ntest('legacy plain variation strings work only for one-dimensional products', () => {\n  assert.equal(\n    validateVariationSelection('{\"color\":[\"Black\",\"White\"]}', 'White')\n      .canonical,\n    '{\"color\":\"White\"}',\n  );\n\n  assert.throws(\n    () =>\n      validateVariationSelection(\n        '{\"color\":[\"Black\"],\"size\":[\"M\"]}',\n        'Black',\n      ),\n    VariationValidationError,\n  );\n});\n\ntest('the highest qualifying simple-product tier becomes authoritative', () => {\n  const tiers = JSON.stringify([\n    { minQty: 5, price: 82.99 },\n    { minQty: 10, price: 75.99 },\n  ]);\n\n  assert.equal(resolveTierUnitPriceCents(tiers, 1, 8_999), 8_999);\n  assert.equal(resolveTierUnitPriceCents(tiers, 5, 8_999), 8_299);\n  assert.equal(resolveTierUnitPriceCents(tiers, 12, 8_999), 7_599);\n});\n\ntest('standard shipping is calculated independently per seller shipment', () => {\n  assert.equal(\n    calculateStoreShippingCents('standard', 2_500, [\n      { hasFreeShipping: false },\n    ]),\n    599,\n  );\n  assert.equal(\n    calculateStoreShippingCents('standard', 2_500, [\n      { hasFreeShipping: true },\n    ]),\n    0,\n  );\n  assert.equal(\n    calculateStoreShippingCents('standard', 10_000, [\n      { hasFreeShipping: false },\n    ]),\n    0,\n  );\n  assert.equal(\n    calculateStoreShippingCents('express', 50_000, [\n      { hasFreeShipping: true },\n    ]),\n    999,\n  );\n});\n\ntest('tax applies after the allocated store discount', () => {\n  const allocated = allocateCents(101, [100, 100]);\n  assert.deepEqual(allocated, [51, 50]);\n\n  const tax = calculateStoreTaxCents(\n    'sa',\n    [\n      { lineTotalCents: 10_000, categorySlug: 'electronics' },\n      { lineTotalCents: 5_000, categorySlug: 'fashion' },\n    ],\n    1_500,\n  );\n  assert.equal(tax, 2_025);\n});\n")

write('src/app/api/checkout/route.ts', "import { Prisma } from '@prisma/client';\nimport { NextResponse } from 'next/server';\nimport { z } from 'zod';\nimport { requireAuthenticatedUser } from '@/lib/auth';\nimport {\n  allocateCents,\n  calculateStoreShippingCents,\n  calculateStoreTaxCents,\n  canonicalizeStoredVariant,\n  fromCents,\n  parseVariationOptions,\n  resolveTaxCountryCode,\n  resolveTierUnitPriceCents,\n  toCents,\n  validateVariationSelection,\n  VariationValidationError,\n} from '@/lib/checkout-authority';\nimport { db } from '@/lib/db';\nimport {\n  checkApiRateLimit,\n  RATE_LIMITS,\n  validateCsrf,\n} from '@/lib/security';\n\nconst checkoutSchema = z.object({\n  idempotencyKey: z.string().uuid(),\n  items: z\n    .array(\n      z.object({\n        productId: z.string().min(1).max(64),\n        variantId: z.string().min(1).max(64).optional(),\n        quantity: z.number().int().min(1).max(100),\n        variation: z\n          .union([z.string(), z.record(z.string(), z.string())])\n          .optional(),\n      }),\n    )\n    .min(1)\n    .max(100),\n  shippingMethod: z.enum(['standard', 'express', 'next_day']),\n  paymentMethod: z.enum(['cash_on_delivery', 'wallet']),\n  couponCode: z.string().trim().max(50).optional(),\n  addressId: z.string().min(1).max(64).optional(),\n  address: z\n    .object({\n      name: z.string().trim().min(2).max(100),\n      phone: z.string().trim().min(5).max(30),\n      address1: z.string().trim().min(3).max(200),\n      address2: z.string().trim().max(200).optional(),\n      city: z.string().trim().min(2).max(100),\n      state: z.string().trim().max(100).optional(),\n      postalCode: z.string().trim().max(30).optional(),\n      country: z.string().trim().min(2).max(100),\n    })\n    .optional(),\n  notes: z.string().trim().max(500).optional(),\n});\n\nclass CheckoutError extends Error {\n  constructor(\n    message: string,\n    readonly status = 400,\n  ) {\n    super(message);\n  }\n}\n\nfunction makeOrderNumber(index: number): string {\n  const entropy = crypto\n    .randomUUID()\n    .replaceAll('-', '')\n    .slice(0, 10)\n    .toUpperCase();\n  return `NXM-${Date.now().toString(36).toUpperCase()}-${index + 1}-${entropy}`;\n}\n\nfunction makeInvoiceNumber(index: number): string {\n  const entropy = crypto\n    .randomUUID()\n    .replaceAll('-', '')\n    .slice(0, 8)\n    .toUpperCase();\n  return `INV-${Date.now().toString(36).toUpperCase()}-${index + 1}-${entropy}`;\n}\n\nasync function existingCheckout(userId: string, idempotencyKey: string) {\n  const orders = await db.order.findMany({\n    where: { userId, idempotencyKey },\n    select: {\n      orderNumber: true,\n      total: true,\n      paymentStatus: true,\n      storeId: true,\n      subtotal: true,\n      shippingCost: true,\n      discount: true,\n      tax: true,\n    },\n    orderBy: { createdAt: 'asc' },\n  });\n\n  if (orders.length === 0) return null;\n  return {\n    success: true,\n    idempotentReplay: true,\n    orderNumbers: orders.map((order) => order.orderNumber),\n    total: orders.reduce((sum, order) => sum + Number(order.total), 0),\n    subtotal: orders.reduce(\n      (sum, order) => sum + Number(order.subtotal),\n      0,\n    ),\n    shipping: orders.reduce(\n      (sum, order) => sum + Number(order.shippingCost),\n      0,\n    ),\n    discount: orders.reduce(\n      (sum, order) => sum + Number(order.discount),\n      0,\n    ),\n    tax: orders.reduce((sum, order) => sum + Number(order.tax), 0),\n    shipments: orders.map((order) => ({\n      storeId: order.storeId,\n      subtotal: Number(order.subtotal),\n      shipping: Number(order.shippingCost),\n      discount: Number(order.discount),\n      tax: Number(order.tax),\n      total: Number(order.total),\n    })),\n    paymentStatus: orders.every((order) => order.paymentStatus === 'paid')\n      ? 'paid'\n      : 'pending',\n  };\n}\n\nfunction isRetryableSerializationFailure(error: unknown): boolean {\n  return (\n    error instanceof Prisma.PrismaClientKnownRequestError &&\n    error.code === 'P2034'\n  );\n}\n\nexport async function POST(request: Request) {\n  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);\n  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;\n\n  const csrf = validateCsrf(request);\n  if (!csrf.valid) {\n    return NextResponse.json(\n      { error: csrf.error || 'Invalid request origin.' },\n      { status: 403 },\n    );\n  }\n\n  const auth = await requireAuthenticatedUser(request);\n  if (auth.response) return auth.response;\n\n  const parsed = checkoutSchema.safeParse(\n    await request.json().catch(() => null),\n  );\n  if (!parsed.success) {\n    return NextResponse.json(\n      { error: 'The checkout information is incomplete or invalid.' },\n      { status: 400 },\n    );\n  }\n\n  const input = parsed.data;\n  const replay = await existingCheckout(auth.user.id, input.idempotencyKey);\n  if (replay) return NextResponse.json(replay);\n\n  const executeCheckout = () =>\n    db.$transaction(\n      async (tx) => {\n        let shippingAddress: Record<string, unknown>;\n        let taxCountryCode: string;\n\n        if (input.addressId) {\n          const address = await tx.address.findFirst({\n            where: { id: input.addressId, userId: auth.user.id },\n          });\n          if (!address) {\n            throw new CheckoutError('Shipping address was not found.', 404);\n          }\n\n          taxCountryCode =\n            address.countryCode || resolveTaxCountryCode(address.country) || '';\n          shippingAddress = {\n            id: address.id,\n            name: address.fullName,\n            phone: address.phone,\n            address1: address.address1,\n            address2: address.address2,\n            city: address.city,\n            state: address.state,\n            postalCode: address.postalCode,\n            country: address.country,\n          };\n        } else if (input.address) {\n          taxCountryCode = resolveTaxCountryCode(input.address.country) || '';\n          shippingAddress = input.address;\n        } else {\n          throw new CheckoutError('A shipping address is required.');\n        }\n\n        if (!taxCountryCode) {\n          throw new CheckoutError(\n            'The selected shipping country is not supported for checkout.',\n          );\n        }\n\n        shippingAddress = {\n          ...shippingAddress,\n          countryCode: taxCountryCode,\n        };\n\n        const productIds = [\n          ...new Set(input.items.map((item) => item.productId)),\n        ];\n        const products = await tx.product.findMany({\n          where: { id: { in: productIds }, status: 'active' },\n          select: {\n            id: true,\n            name: true,\n            price: true,\n            originalPrice: true,\n            stock: true,\n            sku: true,\n            storeId: true,\n            variations: true,\n            tieredPricing: true,\n            hasFreeShipping: true,\n            category: {\n              select: { id: true, slug: true, name: true },\n            },\n            store: { select: { ownerId: true, name: true } },\n            variants: {\n              where: { isActive: true },\n              select: {\n                id: true,\n                productId: true,\n                sku: true,\n                attributes: true,\n                price: true,\n                originalPrice: true,\n                stock: true,\n                soldCount: true,\n                image: true,\n                isActive: true,\n              },\n            },\n          },\n        });\n        const productsById = new Map(\n          products.map((product) => [product.id, product]),\n        );\n\n        if (products.length !== productIds.length) {\n          throw new CheckoutError(\n            'One or more products are no longer available.',\n            409,\n          );\n        }\n\n        const requested = new Map<\n          string,\n          {\n            productId: string;\n            variantId: string | null;\n            quantity: number;\n            variation: string | null;\n          }\n        >();\n\n        for (const item of input.items) {\n          const product = productsById.get(item.productId);\n          if (!product) throw new CheckoutError('Product not found.', 404);\n\n          const hasConfiguredOptions =\n            Object.keys(parseVariationOptions(product.variations)).length > 0;\n          let variantId: string | null = null;\n          let variation: string | null = null;\n\n          if (product.variants.length > 0) {\n            let selectedVariant = item.variantId\n              ? product.variants.find(\n                  (candidate) => candidate.id === item.variantId,\n                )\n              : undefined;\n\n            let selectedCanonical: string | null = null;\n            if (item.variation) {\n              try {\n                selectedCanonical = validateVariationSelection(\n                  product.variations,\n                  item.variation,\n                ).canonical;\n              } catch (error) {\n                if (error instanceof VariationValidationError) {\n                  throw new CheckoutError(\n                    `${product.name}: ${error.message}`,\n                    409,\n                  );\n                }\n                throw error;\n              }\n            }\n\n            if (!selectedVariant && selectedCanonical) {\n              selectedVariant = product.variants.find(\n                (candidate) =>\n                  canonicalizeStoredVariant(candidate.attributes) ===\n                  selectedCanonical,\n              );\n            }\n\n            if (!selectedVariant) {\n              throw new CheckoutError(\n                `${product.name}: select an available SKU before checkout.`,\n                409,\n              );\n            }\n\n            const authoritativeAttributes = canonicalizeStoredVariant(\n              selectedVariant.attributes,\n            );\n            if (\n              selectedCanonical &&\n              selectedCanonical !== authoritativeAttributes\n            ) {\n              throw new CheckoutError(\n                `${product.name}: the selected options do not match the requested SKU.`,\n                409,\n              );\n            }\n\n            variantId = selectedVariant.id;\n            variation = authoritativeAttributes;\n          } else {\n            if (item.variantId) {\n              throw new CheckoutError(\n                `${product.name}: the requested SKU is no longer available.`,\n                409,\n              );\n            }\n            if (hasConfiguredOptions) {\n              throw new CheckoutError(\n                `${product.name}: seller SKU inventory has not been configured.`,\n                409,\n              );\n            }\n\n            try {\n              variation = validateVariationSelection(\n                product.variations,\n                item.variation,\n              ).canonical;\n            } catch (error) {\n              if (error instanceof VariationValidationError) {\n                throw new CheckoutError(\n                  `${product.name}: ${error.message}`,\n                  409,\n                );\n              }\n              throw error;\n            }\n          }\n\n          const key = variantId\n            ? `variant:${variantId}`\n            : `product:${item.productId}`;\n          const existing = requested.get(key);\n          requested.set(key, {\n            productId: item.productId,\n            variantId,\n            variation,\n            quantity: (existing?.quantity || 0) + item.quantity,\n          });\n        }\n\n        const normalizedItems = [...requested.values()];\n        const prepared = normalizedItems.map((item) => {\n          const product = productsById.get(item.productId);\n          if (!product) throw new CheckoutError('Product not found.', 404);\n\n          const variant = item.variantId\n            ? product.variants.find(\n                (candidate) => candidate.id === item.variantId,\n              )\n            : null;\n          if (item.variantId && !variant) {\n            throw new CheckoutError(\n              `${product.name}: the requested SKU is no longer available.`,\n              409,\n            );\n          }\n\n          const baseUnitPrice = variant\n            ? toCents(Number(variant.price))\n            : toCents(Number(product.price));\n          const unitPrice = variant\n            ? baseUnitPrice\n            : resolveTierUnitPriceCents(\n                product.tieredPricing,\n                item.quantity,\n                baseUnitPrice,\n              );\n\n          return {\n            ...item,\n            product,\n            variant,\n            sku: variant?.sku || product.sku || null,\n            unitPrice,\n            lineTotal: unitPrice * item.quantity,\n          };\n        });\n\n        const quantitiesByProduct = new Map<\n          string,\n          {\n            product: (typeof prepared)[number]['product'];\n            quantity: number;\n          }\n        >();\n        const quantitiesByVariant = new Map<\n          string,\n          {\n            product: (typeof prepared)[number]['product'];\n            variant: NonNullable<(typeof prepared)[number]['variant']>;\n            quantity: number;\n          }\n        >();\n\n        for (const item of prepared) {\n          const productEntry = quantitiesByProduct.get(item.product.id);\n          quantitiesByProduct.set(item.product.id, {\n            product: item.product,\n            quantity: (productEntry?.quantity || 0) + item.quantity,\n          });\n\n          if (item.variant) {\n            const variantEntry = quantitiesByVariant.get(item.variant.id);\n            quantitiesByVariant.set(item.variant.id, {\n              product: item.product,\n              variant: item.variant,\n              quantity: (variantEntry?.quantity || 0) + item.quantity,\n            });\n          }\n        }\n\n        for (const { product, quantity } of quantitiesByProduct.values()) {\n          if (product.stock < quantity) {\n            throw new CheckoutError(\n              `${product.name} does not have enough stock for this order.`,\n              409,\n            );\n          }\n        }\n        for (const { product, variant, quantity } of quantitiesByVariant.values()) {\n          if (variant.stock < quantity) {\n            throw new CheckoutError(\n              `${product.name} (${variant.sku}) does not have enough stock.`,\n              409,\n            );\n          }\n        }\n\n        const groups = new Map<string, typeof prepared>();\n        for (const item of prepared) {\n          const group = groups.get(item.product.storeId) || [];\n          group.push(item);\n          groups.set(item.product.storeId, group);\n        }\n        const stores = [...groups.entries()];\n        const subtotals = stores.map(([, items]) =>\n          items.reduce((sum, item) => sum + item.lineTotal, 0),\n        );\n        const checkoutSubtotal = subtotals.reduce(\n          (sum, value) => sum + value,\n          0,\n        );\n\n        let couponDiscount = 0;\n        let couponId: string | null = null;\n        let couponUsageLimit: number | null = null;\n        let eligibleStoreId: string | null = null;\n        let freeShippingCoupon = false;\n\n        if (input.couponCode) {\n          const coupon = await tx.coupon.findUnique({\n            where: { code: input.couponCode.toUpperCase() },\n          });\n          const now = new Date();\n          if (\n            !coupon ||\n            !coupon.isActive ||\n            (coupon.expiresAt && coupon.expiresAt <= now) ||\n            (coupon.usageLimit !== null &&\n              coupon.usedCount >= coupon.usageLimit)\n          ) {\n            throw new CheckoutError('This coupon is invalid or has expired.');\n          }\n\n          eligibleStoreId = coupon.storeId;\n          const eligibleSubtotal = coupon.storeId\n            ? stores.reduce(\n                (sum, [storeId], index) =>\n                  storeId === coupon.storeId\n                    ? sum + subtotals[index]\n                    : sum,\n                0,\n              )\n            : checkoutSubtotal;\n\n          if (eligibleSubtotal < toCents(Number(coupon.minOrder))) {\n            throw new CheckoutError(\n              'The order does not meet this coupon minimum.',\n            );\n          }\n\n          if (coupon.type === 'free_shipping') {\n            freeShippingCoupon = true;\n          } else if (coupon.type === 'fixed') {\n            couponDiscount = toCents(Number(coupon.discount));\n          } else if (coupon.type === 'percentage') {\n            couponDiscount = Math.round(\n              (eligibleSubtotal * Number(coupon.discount)) / 100,\n            );\n          } else {\n            throw new CheckoutError('This coupon type is not supported.');\n          }\n\n          if (coupon.maxDiscount !== null) {\n            couponDiscount = Math.min(\n              couponDiscount,\n              toCents(Number(coupon.maxDiscount)),\n            );\n          }\n          couponDiscount = Math.min(couponDiscount, eligibleSubtotal);\n          couponId = coupon.id;\n          couponUsageLimit = coupon.usageLimit;\n        }\n\n        const eligibleWeights = stores.map(([storeId], index) =>\n          !eligibleStoreId || storeId === eligibleStoreId\n            ? subtotals[index]\n            : 0,\n        );\n        const discounts = allocateCents(couponDiscount, eligibleWeights);\n        const shippingAllocations = stores.map(\n          ([storeId, items], index) => {\n            if (\n              freeShippingCoupon &&\n              (!eligibleStoreId || storeId === eligibleStoreId)\n            ) {\n              return 0;\n            }\n\n            return calculateStoreShippingCents(\n              input.shippingMethod,\n              subtotals[index],\n              items.map((item) => ({\n                hasFreeShipping: item.product.hasFreeShipping,\n              })),\n            );\n          },\n        );\n        const shippingTotal = shippingAllocations.reduce(\n          (sum, value) => sum + value,\n          0,\n        );\n        const taxes = stores.map(([, items], index) =>\n          calculateStoreTaxCents(\n            taxCountryCode,\n            items.map((item) => ({\n              lineTotalCents: item.lineTotal,\n              categoryId: item.product.category.id,\n              categorySlug: item.product.category.slug,\n              categoryName: item.product.category.name,\n            })),\n            discounts[index],\n          ),\n        );\n        const totals = subtotals.map(\n          (subtotal, index) =>\n            subtotal +\n            shippingAllocations[index] -\n            discounts[index] +\n            taxes[index],\n        );\n        const checkoutTotal = totals.reduce(\n          (sum, value) => sum + value,\n          0,\n        );\n\n        if (input.paymentMethod === 'wallet') {\n          const walletUpdate = await tx.user.updateMany({\n            where: {\n              id: auth.user.id,\n              walletBalance: { gte: fromCents(checkoutTotal) },\n            },\n            data: {\n              walletBalance: { decrement: fromCents(checkoutTotal) },\n            },\n          });\n          if (walletUpdate.count !== 1) {\n            throw new CheckoutError(\n              'Your wallet balance is insufficient.',\n              409,\n            );\n          }\n        }\n\n        for (const { product, variant, quantity } of quantitiesByVariant.values()) {\n          const stockUpdate = await tx.productVariant.updateMany({\n            where: {\n              id: variant.id,\n              productId: product.id,\n              isActive: true,\n              stock: { gte: quantity },\n            },\n            data: {\n              stock: { decrement: quantity },\n              soldCount: { increment: quantity },\n            },\n          });\n          if (stockUpdate.count !== 1) {\n            throw new CheckoutError(\n              `${product.name} (${variant.sku}) changed while the order was being placed.`,\n              409,\n            );\n          }\n        }\n\n        for (const { product, quantity } of quantitiesByProduct.values()) {\n          const stockUpdate = await tx.product.updateMany({\n            where: {\n              id: product.id,\n              status: 'active',\n              stock: { gte: quantity },\n            },\n            data: {\n              stock: { decrement: quantity },\n              soldCount: { increment: quantity },\n            },\n          });\n          if (stockUpdate.count !== 1) {\n            throw new CheckoutError(\n              `${product.name} changed while the order was being placed.`,\n              409,\n            );\n          }\n        }\n\n        if (couponId) {\n          const couponUpdate = await tx.coupon.updateMany({\n            where: {\n              id: couponId,\n              isActive: true,\n              ...(couponUsageLimit === null\n                ? {}\n                : { usedCount: { lt: couponUsageLimit } }),\n            },\n            data: { usedCount: { increment: 1 } },\n          });\n          if (couponUpdate.count !== 1) {\n            throw new CheckoutError(\n              'This coupon reached its usage limit.',\n              409,\n            );\n          }\n        }\n\n        const orderNumbers: string[] = [];\n        for (let index = 0; index < stores.length; index += 1) {\n          const [storeId, items] = stores[index];\n          const orderNumber = makeOrderNumber(index);\n          const invoiceNumber = makeInvoiceNumber(index);\n          const paymentStatus =\n            input.paymentMethod === 'wallet' ? 'paid' : 'pending';\n          const order = await tx.order.create({\n            data: {\n              orderNumber,\n              idempotencyKey: input.idempotencyKey,\n              userId: auth.user.id,\n              storeId,\n              status: 'pending',\n              subtotal: fromCents(subtotals[index]),\n              shippingCost: fromCents(shippingAllocations[index]),\n              discount: fromCents(discounts[index]),\n              tax: fromCents(taxes[index]),\n              total: fromCents(totals[index]),\n              paymentMethod: input.paymentMethod,\n              paymentStatus,\n              shippingMethod: input.shippingMethod,\n              taxCountryCode,\n              shippingAddress: JSON.stringify(shippingAddress),\n              notes: input.notes || null,\n              items: {\n                create: items.map((item) => ({\n                  productId: item.product.id,\n                  variantId: item.variant?.id || null,\n                  sku: item.sku,\n                  quantity: item.quantity,\n                  price: fromCents(item.unitPrice),\n                  total: fromCents(item.lineTotal),\n                  variation: item.variation,\n                })),\n              },\n            },\n          });\n\n          await tx.invoice.create({\n            data: {\n              orderId: order.id,\n              invoiceNumber,\n              sellerId: items[0].product.store.ownerId,\n              buyerId: auth.user.id,\n              subtotal: fromCents(subtotals[index]),\n              shipping: fromCents(shippingAllocations[index]),\n              discount: fromCents(discounts[index]),\n              tax: fromCents(taxes[index]),\n              total: fromCents(totals[index]),\n              paymentMethod: input.paymentMethod,\n              status: paymentStatus === 'paid' ? 'paid' : 'unpaid',\n            },\n          });\n          orderNumbers.push(orderNumber);\n        }\n\n        await tx.notification.create({\n          data: {\n            userId: auth.user.id,\n            title: 'Order placed',\n            titleAr: 'تم إنشاء الطلب',\n            message: `Your order ${orderNumbers.join(', ')} was placed successfully.`,\n            messageAr: `تم إنشاء طلبك ${orderNumbers.join('، ')} بنجاح.`,\n            type: 'order',\n          },\n        });\n\n        return {\n          success: true,\n          idempotentReplay: false,\n          orderNumbers,\n          total: fromCents(checkoutTotal),\n          subtotal: fromCents(checkoutSubtotal),\n          shipping: fromCents(shippingTotal),\n          discount: fromCents(couponDiscount),\n          tax: fromCents(\n            taxes.reduce((sum, value) => sum + value, 0),\n          ),\n          taxCountryCode,\n          shipments: stores.map(([storeId], index) => ({\n            storeId,\n            subtotal: fromCents(subtotals[index]),\n            shipping: fromCents(shippingAllocations[index]),\n            discount: fromCents(discounts[index]),\n            tax: fromCents(taxes[index]),\n            total: fromCents(totals[index]),\n          })),\n          paymentStatus:\n            input.paymentMethod === 'wallet'\n              ? ('paid' as const)\n              : ('pending' as const),\n        };\n      },\n      {\n        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,\n        maxWait: 5_000,\n        timeout: 15_000,\n      },\n    );\n\n  try {\n    let result: Awaited<ReturnType<typeof executeCheckout>> | null = null;\n    let lastSerializationError: unknown = null;\n\n    for (let attempt = 0; attempt < 3; attempt += 1) {\n      try {\n        result = await executeCheckout();\n        break;\n      } catch (error) {\n        if (isRetryableSerializationFailure(error) && attempt < 2) {\n          lastSerializationError = error;\n          continue;\n        }\n        throw error;\n      }\n    }\n\n    if (!result) throw lastSerializationError || new Error('Checkout failed.');\n    return NextResponse.json(result, { status: 201 });\n  } catch (error) {\n    if (error instanceof CheckoutError) {\n      return NextResponse.json(\n        { error: error.message },\n        { status: error.status },\n      );\n    }\n\n    if (\n      error instanceof Prisma.PrismaClientKnownRequestError &&\n      error.code === 'P2002'\n    ) {\n      const replayAfterRace = await existingCheckout(\n        auth.user.id,\n        input.idempotencyKey,\n      );\n      if (replayAfterRace) return NextResponse.json(replayAfterRace);\n    }\n\n    console.error('Checkout error:', error);\n    return NextResponse.json(\n      {\n        error:\n          'The order could not be completed. No partial order was saved.',\n      },\n      { status: 500 },\n    );\n  }\n}\n")

write('src/app/api/products/route.ts', "import { Prisma } from '@prisma/client';\nimport { db } from '@/lib/db';\nimport {\n  validateEnum,\n  validatePagination,\n  validateSearchParam,\n} from '@/lib/security';\n\nconst VALID_SORTS = [\n  'newest',\n  'price-asc',\n  'price-desc',\n  'rating',\n  'popular',\n] as const;\n\nconst publicStoreSelect = {\n  id: true,\n  name: true,\n  nameAr: true,\n  slug: true,\n  logo: true,\n  rating: true,\n  reviewCount: true,\n  productCount: true,\n  isVerified: true,\n  location: true,\n} satisfies Prisma.StoreSelect;\n\nconst publicCategorySelect = {\n  id: true,\n  name: true,\n  nameAr: true,\n  slug: true,\n  icon: true,\n} satisfies Prisma.CategorySelect;\n\nconst publicProductSelect = {\n  id: true,\n  name: true,\n  nameAr: true,\n  description: true,\n  descriptionAr: true,\n  price: true,\n  originalPrice: true,\n  images: true,\n  categoryId: true,\n  storeId: true,\n  sku: true,\n  stock: true,\n  rating: true,\n  reviewCount: true,\n  soldCount: true,\n  views: true,\n  isFeatured: true,\n  isNew: true,\n  isSale: true,\n  isB2b: true,\n  hasFreeShipping: true,\n  variations: true,\n  tieredPricing: true,\n  tags: true,\n  status: true,\n  createdAt: true,\n  updatedAt: true,\n  category: { select: publicCategorySelect },\n  store: { select: publicStoreSelect },\n  _count: {\n    select: {\n      variants: { where: { isActive: true } },\n    },\n  },\n} satisfies Prisma.ProductSelect;\n\nfunction parsePrice(value: string | null, max: number): number | undefined {\n  if (!value) return undefined;\n  const parsed = Number(value);\n  if (!Number.isFinite(parsed)) return undefined;\n  return Math.min(max, Math.max(0, parsed));\n}\n\nfunction mapPublicProduct(\n  product: Prisma.ProductGetPayload<{ select: typeof publicProductSelect }>,\n) {\n  const { _count, ...publicProduct } = product;\n  return {\n    ...publicProduct,\n    variantCount: _count.variants,\n  };\n}\n\nexport async function GET(request: Request) {\n  try {\n    const { searchParams } = new URL(request.url);\n    const category = searchParams.get('category');\n    const store = searchParams.get('storeId');\n    const searchRaw = searchParams.get('search');\n    const search = searchRaw ? validateSearchParam(searchRaw) : undefined;\n    const sort =\n      validateEnum(searchParams.get('sort') || 'newest', VALID_SORTS) ||\n      'newest';\n    const ids = (searchParams.get('ids') || '')\n      .split(',')\n      .map((id) => id.trim())\n      .filter(Boolean)\n      .slice(0, 20);\n    const minPrice = parsePrice(searchParams.get('minPrice'), 10_000_000);\n    const maxPrice = parsePrice(searchParams.get('maxPrice'), 10_000_000);\n    const { page, limit } = validatePagination(\n      searchParams.get('page'),\n      searchParams.get('limit'),\n      100,\n    );\n\n    if (\n      minPrice !== undefined &&\n      maxPrice !== undefined &&\n      minPrice > maxPrice\n    ) {\n      return Response.json(\n        { error: 'Minimum price cannot exceed maximum price.' },\n        { status: 400 },\n      );\n    }\n\n    const where: Prisma.ProductWhereInput = {\n      status: 'active',\n      ...(ids.length > 0 ? { id: { in: ids } } : {}),\n      ...(category ? { categoryId: category } : {}),\n      ...(store\n        ? {\n            OR: [{ storeId: store }, { store: { slug: store } }],\n          }\n        : {}),\n      ...(searchParams.get('featured') === 'true'\n        ? { isFeatured: true }\n        : {}),\n      ...(searchParams.get('sale') === 'true' ? { isSale: true } : {}),\n      ...(searchParams.get('new') === 'true' ? { isNew: true } : {}),\n      ...(searchParams.get('b2b') === 'true' ? { isB2b: true } : {}),\n      ...(searchParams.get('freeShipping') === 'true'\n        ? { hasFreeShipping: true }\n        : {}),\n      ...(minPrice !== undefined || maxPrice !== undefined\n        ? {\n            price: {\n              ...(minPrice !== undefined ? { gte: minPrice } : {}),\n              ...(maxPrice !== undefined ? { lte: maxPrice } : {}),\n            },\n          }\n        : {}),\n      ...(search\n        ? {\n            AND: [\n              {\n                OR: [\n                  { name: { contains: search, mode: 'insensitive' } },\n                  { nameAr: { contains: search, mode: 'insensitive' } },\n                  {\n                    description: {\n                      contains: search,\n                      mode: 'insensitive',\n                    },\n                  },\n                  { tags: { contains: search, mode: 'insensitive' } },\n                  {\n                    variants: {\n                      some: {\n                        isActive: true,\n                        sku: { contains: search, mode: 'insensitive' },\n                      },\n                    },\n                  },\n                ],\n              },\n            ],\n          }\n        : {}),\n    };\n\n    const orderBy: Prisma.ProductOrderByWithRelationInput =\n      sort === 'price-asc'\n        ? { price: 'asc' }\n        : sort === 'price-desc'\n          ? { price: 'desc' }\n          : sort === 'rating'\n            ? { rating: 'desc' }\n            : sort === 'popular'\n              ? { soldCount: 'desc' }\n              : { createdAt: 'desc' };\n\n    const [products, total] = await db.$transaction([\n      db.product.findMany({\n        where,\n        orderBy,\n        skip: (page - 1) * limit,\n        take: limit,\n        select: publicProductSelect,\n      }),\n      db.product.count({ where }),\n    ]);\n\n    return Response.json({\n      products: products.map(mapPublicProduct),\n      total,\n      page,\n      pages: Math.ceil(total / limit),\n    });\n  } catch (error) {\n    console.error('Products API error:', error);\n    return Response.json(\n      { error: 'Failed to fetch products.' },\n      { status: 500 },\n    );\n  }\n}\n")

write('src/app/api/products/[id]/route.ts', "import { Prisma } from '@prisma/client';\nimport { db } from '@/lib/db';\n\nconst publicStoreSelect = {\n  id: true,\n  name: true,\n  nameAr: true,\n  slug: true,\n  logo: true,\n  rating: true,\n  reviewCount: true,\n  productCount: true,\n  isVerified: true,\n  location: true,\n} satisfies Prisma.StoreSelect;\n\nconst publicCategorySelect = {\n  id: true,\n  name: true,\n  nameAr: true,\n  slug: true,\n  icon: true,\n} satisfies Prisma.CategorySelect;\n\nconst listProductSelect = {\n  id: true,\n  name: true,\n  nameAr: true,\n  description: true,\n  descriptionAr: true,\n  price: true,\n  originalPrice: true,\n  images: true,\n  categoryId: true,\n  storeId: true,\n  sku: true,\n  stock: true,\n  rating: true,\n  reviewCount: true,\n  soldCount: true,\n  views: true,\n  isFeatured: true,\n  isNew: true,\n  isSale: true,\n  isB2b: true,\n  hasFreeShipping: true,\n  variations: true,\n  tieredPricing: true,\n  tags: true,\n  status: true,\n  createdAt: true,\n  updatedAt: true,\n  category: { select: publicCategorySelect },\n  store: { select: publicStoreSelect },\n  _count: {\n    select: {\n      variants: { where: { isActive: true } },\n    },\n  },\n} satisfies Prisma.ProductSelect;\n\nconst detailProductSelect = {\n  ...listProductSelect,\n  variants: {\n    where: { isActive: true },\n    orderBy: [{ position: 'asc' as const }, { sku: 'asc' as const }],\n    select: {\n      id: true,\n      sku: true,\n      attributes: true,\n      price: true,\n      originalPrice: true,\n      stock: true,\n      soldCount: true,\n      image: true,\n      position: true,\n      isActive: true,\n    },\n  },\n} satisfies Prisma.ProductSelect;\n\nfunction mapListProduct(\n  product: Prisma.ProductGetPayload<{ select: typeof listProductSelect }>,\n) {\n  const { _count, ...publicProduct } = product;\n  return {\n    ...publicProduct,\n    variantCount: _count.variants,\n  };\n}\n\nfunction mapDetailProduct(\n  product: Prisma.ProductGetPayload<{ select: typeof detailProductSelect }>,\n) {\n  const { _count, ...publicProduct } = product;\n  return {\n    ...publicProduct,\n    variantCount: _count.variants,\n  };\n}\n\nexport async function GET(\n  _request: Request,\n  { params }: { params: Promise<{ id: string }> },\n) {\n  try {\n    const { id } = await params;\n\n    const product = await db.product.findFirst({\n      where: { id, status: 'active' },\n      select: detailProductSelect,\n    });\n\n    if (!product) {\n      return Response.json({ error: 'Product not found' }, { status: 404 });\n    }\n\n    const [similarProducts, relatedProducts] = await Promise.all([\n      db.product.findMany({\n        where: {\n          categoryId: product.categoryId,\n          id: { not: product.id },\n          status: 'active',\n        },\n        take: 8,\n        select: listProductSelect,\n      }),\n      db.product.findMany({\n        where: {\n          categoryId: { not: product.categoryId },\n          id: { not: product.id },\n          status: 'active',\n        },\n        take: 4,\n        select: listProductSelect,\n      }),\n    ]);\n\n    return Response.json({\n      product: mapDetailProduct(product),\n      similarProducts: similarProducts.map(mapListProduct),\n      relatedProducts: relatedProducts.map(mapListProduct),\n    });\n  } catch (error) {\n    console.error('Product detail API error:', error);\n    return Response.json(\n      { error: 'Failed to fetch product' },\n      { status: 500 },\n    );\n  }\n}\n")

write('src/app/api/seller/product-variants/route.ts', "import { Prisma } from '@prisma/client';\nimport { NextResponse } from 'next/server';\nimport { z } from 'zod';\nimport { requireUserRole } from '@/lib/auth';\nimport {\n  canonicalizeVariation,\n  parseVariantAttributes,\n} from '@/lib/checkout-authority';\nimport { db } from '@/lib/db';\nimport {\n  checkApiRateLimit,\n  RATE_LIMITS,\n  validateCsrf,\n} from '@/lib/security';\n\nconst variantSchema = z\n  .object({\n    id: z.string().min(1).max(64).optional(),\n    sku: z.string().trim().min(2).max(100),\n    attributes: z.record(z.string(), z.string()),\n    price: z.number().finite().min(0).max(10_000_000),\n    originalPrice: z\n      .number()\n      .finite()\n      .min(0)\n      .max(10_000_000)\n      .nullable()\n      .optional(),\n    stock: z.number().int().min(0).max(10_000_000),\n    image: z.string().trim().max(2_000).nullable().optional(),\n    position: z.number().int().min(0).max(10_000).optional(),\n    isActive: z.boolean().default(true),\n  })\n  .strict();\n\nconst replaceVariantsSchema = z\n  .object({\n    productId: z.string().min(1).max(64),\n    variants: z.array(variantSchema).min(1).max(250),\n  })\n  .strict();\n\nfunction validateWriteRequest(request: Request): NextResponse | null {\n  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);\n  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;\n\n  const csrf = validateCsrf(request);\n  if (!csrf.valid) {\n    return NextResponse.json(\n      { error: csrf.error || 'Invalid request origin.' },\n      { status: 403 },\n    );\n  }\n  return null;\n}\n\nasync function authorizeProduct(request: Request, productId: string) {\n  const auth = await requireUserRole(request, ['seller', 'admin']);\n  if (auth.response) return { auth, product: null, response: auth.response };\n\n  const product = await db.product.findUnique({\n    where: { id: productId },\n    select: {\n      id: true,\n      name: true,\n      storeId: true,\n      store: { select: { ownerId: true } },\n    },\n  });\n  if (!product) {\n    return {\n      auth,\n      product: null,\n      response: NextResponse.json(\n        { error: 'Product not found.' },\n        { status: 404 },\n      ),\n    };\n  }\n  if (\n    auth.user.role !== 'admin' &&\n    product.store.ownerId !== auth.user.id\n  ) {\n    return {\n      auth,\n      product: null,\n      response: NextResponse.json({ error: 'Forbidden.' }, { status: 403 }),\n    };\n  }\n\n  return { auth, product, response: null };\n}\n\nfunction mapVariant(variant: {\n  id: string;\n  productId: string;\n  sku: string;\n  attributes: string;\n  price: number;\n  originalPrice: number | null;\n  stock: number;\n  soldCount: number;\n  image: string | null;\n  position: number;\n  isActive: boolean;\n  createdAt: Date;\n  updatedAt: Date;\n}) {\n  return {\n    ...variant,\n    attributes: parseVariantAttributes(variant.attributes),\n    createdAt: variant.createdAt.toISOString(),\n    updatedAt: variant.updatedAt.toISOString(),\n  };\n}\n\nexport async function GET(request: Request) {\n  const productId = new URL(request.url).searchParams.get('productId');\n  if (!productId) {\n    return NextResponse.json(\n      { error: 'productId is required.' },\n      { status: 400 },\n    );\n  }\n\n  const authorized = await authorizeProduct(request, productId);\n  if (authorized.response) return authorized.response;\n\n  const variants = await db.productVariant.findMany({\n    where: { productId },\n    orderBy: [{ position: 'asc' }, { sku: 'asc' }],\n  });\n\n  return NextResponse.json({\n    productId,\n    variants: variants.map(mapVariant),\n  });\n}\n\nexport async function PUT(request: Request) {\n  const denied = validateWriteRequest(request);\n  if (denied) return denied;\n\n  const parsed = replaceVariantsSchema.safeParse(\n    await request.json().catch(() => null),\n  );\n  if (!parsed.success) {\n    return NextResponse.json(\n      { error: 'Invalid variant inventory payload.' },\n      { status: 400 },\n    );\n  }\n\n  const authorized = await authorizeProduct(request, parsed.data.productId);\n  if (authorized.response) return authorized.response;\n  if (!authorized.product) {\n    return NextResponse.json(\n      { error: 'Product not found.' },\n      { status: 404 },\n    );\n  }\n\n  const normalized = parsed.data.variants.map((variant, index) => ({\n    ...variant,\n    sku: variant.sku.toUpperCase(),\n    attributes: canonicalizeVariation(variant.attributes),\n    originalPrice: variant.originalPrice ?? null,\n    image: variant.image || null,\n    position: variant.position ?? index,\n  }));\n\n  const activeVariants = normalized.filter((variant) => variant.isActive);\n  if (activeVariants.length === 0) {\n    return NextResponse.json(\n      { error: 'At least one active SKU is required.' },\n      { status: 400 },\n    );\n  }\n\n  let expectedKeys: string[] | null = null;\n  const seenSkus = new Set<string>();\n  const seenAttributes = new Set<string>();\n  for (const variant of normalized) {\n    let attributes: Record<string, string>;\n    try {\n      attributes = parseVariantAttributes(variant.attributes);\n    } catch {\n      return NextResponse.json(\n        { error: `SKU ${variant.sku} has invalid attributes.` },\n        { status: 400 },\n      );\n    }\n\n    const keys = Object.keys(attributes).sort();\n    if (!expectedKeys) expectedKeys = keys;\n    if (\n      keys.length === 0 ||\n      keys.length !== expectedKeys.length ||\n      keys.some((key, index) => key !== expectedKeys![index])\n    ) {\n      return NextResponse.json(\n        { error: 'Every SKU must use the same non-empty option keys.' },\n        { status: 400 },\n      );\n    }\n    if (seenSkus.has(variant.sku)) {\n      return NextResponse.json(\n        { error: `Duplicate SKU: ${variant.sku}.` },\n        { status: 409 },\n      );\n    }\n    if (seenAttributes.has(variant.attributes)) {\n      return NextResponse.json(\n        { error: 'Two SKUs cannot use the same option combination.' },\n        { status: 409 },\n      );\n    }\n    if (\n      variant.originalPrice !== null &&\n      variant.originalPrice < variant.price\n    ) {\n      return NextResponse.json(\n        {\n          error: `SKU ${variant.sku} has an original price below its sale price.`,\n        },\n        { status: 400 },\n      );\n    }\n\n    seenSkus.add(variant.sku);\n    seenAttributes.add(variant.attributes);\n  }\n\n  try {\n    const result = await db.$transaction(async (tx) => {\n      const existing = await tx.productVariant.findMany({\n        where: { productId: parsed.data.productId },\n        select: { id: true },\n      });\n      const existingIds = new Set(existing.map((variant) => variant.id));\n      const retainedIds: string[] = [];\n\n      for (const variant of normalized) {\n        if (variant.id) {\n          if (!existingIds.has(variant.id)) {\n            throw new Error('VARIANT_OWNERSHIP');\n          }\n          const updated = await tx.productVariant.update({\n            where: { id: variant.id },\n            data: {\n              sku: variant.sku,\n              attributes: variant.attributes,\n              price: variant.price,\n              originalPrice: variant.originalPrice,\n              stock: variant.stock,\n              image: variant.image,\n              position: variant.position,\n              isActive: variant.isActive,\n            },\n          });\n          retainedIds.push(updated.id);\n        } else {\n          const created = await tx.productVariant.create({\n            data: {\n              productId: parsed.data.productId,\n              sku: variant.sku,\n              attributes: variant.attributes,\n              price: variant.price,\n              originalPrice: variant.originalPrice,\n              stock: variant.stock,\n              image: variant.image,\n              position: variant.position,\n              isActive: variant.isActive,\n            },\n          });\n          retainedIds.push(created.id);\n        }\n      }\n\n      await tx.productVariant.updateMany({\n        where: {\n          productId: parsed.data.productId,\n          ...(retainedIds.length > 0 ? { id: { notIn: retainedIds } } : {}),\n        },\n        data: { isActive: false },\n      });\n\n      const authoritative = await tx.productVariant.findMany({\n        where: {\n          productId: parsed.data.productId,\n          isActive: true,\n        },\n        orderBy: [{ position: 'asc' }, { sku: 'asc' }],\n      });\n      if (authoritative.length === 0) {\n        throw new Error('NO_ACTIVE_VARIANTS');\n      }\n\n      const variationOptions: Record<string, string[]> = {};\n      for (const variant of authoritative) {\n        const attributes = parseVariantAttributes(variant.attributes);\n        for (const [key, value] of Object.entries(attributes)) {\n          const values = variationOptions[key] || [];\n          if (!values.includes(value)) values.push(value);\n          variationOptions[key] = values;\n        }\n      }\n      for (const values of Object.values(variationOptions)) values.sort();\n\n      const cheapestVariant = authoritative.reduce((cheapest, variant) =>\n        Number(variant.price) < Number(cheapest.price) ? variant : cheapest,\n      );\n      const product = await tx.product.update({\n        where: { id: parsed.data.productId },\n        data: {\n          variations: JSON.stringify(variationOptions),\n          tieredPricing: '[]',\n          price: Number(cheapestVariant.price),\n          originalPrice: cheapestVariant.originalPrice,\n          stock: authoritative.reduce(\n            (sum, variant) => sum + variant.stock,\n            0,\n          ),\n        },\n      });\n\n      return { product, variants: authoritative };\n    });\n\n    return NextResponse.json({\n      success: true,\n      product: {\n        id: result.product.id,\n        price: Number(result.product.price),\n        originalPrice:\n          result.product.originalPrice === null\n            ? null\n            : Number(result.product.originalPrice),\n        stock: result.product.stock,\n        variations: result.product.variations,\n      },\n      variants: result.variants.map(mapVariant),\n    });\n  } catch (error) {\n    if (error instanceof Error && error.message === 'VARIANT_OWNERSHIP') {\n      return NextResponse.json(\n        { error: 'A variant does not belong to this product.' },\n        { status: 409 },\n      );\n    }\n    if (\n      error instanceof Prisma.PrismaClientKnownRequestError &&\n      error.code === 'P2002'\n    ) {\n      return NextResponse.json(\n        { error: 'SKU codes and option combinations must be unique.' },\n        { status: 409 },\n      );\n    }\n\n    console.error('Seller variant PUT error:', error);\n    return NextResponse.json(\n      { error: 'Failed to save variant inventory.' },\n      { status: 500 },\n    );\n  }\n}\n")

write('src/app/api/addresses/route.ts', "import { NextResponse } from 'next/server';\nimport { z } from 'zod';\nimport { requireAuthenticatedUser } from '@/lib/auth';\nimport { resolveTaxCountryCode } from '@/lib/checkout-authority';\nimport { db } from '@/lib/db';\nimport {\n  checkApiRateLimit,\n  RATE_LIMITS,\n  validateCsrf,\n} from '@/lib/security';\n\nconst addressFields = z.object({\n  label: z.string().trim().max(50).optional(),\n  fullName: z.string().trim().min(2).max(100),\n  phone: z.string().trim().min(5).max(30),\n  address1: z.string().trim().min(3).max(200),\n  address2: z.string().trim().max(200).optional().nullable(),\n  city: z.string().trim().min(2).max(100),\n  state: z.string().trim().max(100).optional().nullable(),\n  postalCode: z.string().trim().max(30).optional().nullable(),\n  country: z.string().trim().min(2).max(100).default('Iraq'),\n  isDefault: z.boolean().default(false),\n});\n\nconst updateSchema = addressFields.partial().extend({\n  id: z.string().min(1).max(64),\n});\n\nfunction mapAddress(address: {\n  id: string;\n  label: string | null;\n  fullName: string;\n  phone: string;\n  address1: string;\n  address2: string | null;\n  city: string;\n  state: string | null;\n  postalCode: string | null;\n  country: string;\n  countryCode: string;\n  isDefault: boolean;\n}) {\n  return {\n    id: address.id,\n    label: address.label,\n    name: address.fullName,\n    fullName: address.fullName,\n    phone: address.phone,\n    address1: address.address1,\n    address2: address.address2 || undefined,\n    city: address.city,\n    state: address.state || '',\n    postalCode: address.postalCode || '',\n    country: address.country,\n    countryCode: address.countryCode,\n    isDefault: address.isDefault,\n  };\n}\n\nfunction validateWriteRequest(request: Request): NextResponse | null {\n  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);\n  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;\n\n  const csrf = validateCsrf(request);\n  if (!csrf.valid) {\n    return NextResponse.json(\n      { error: csrf.error || 'Invalid request origin.' },\n      { status: 403 },\n    );\n  }\n  return null;\n}\n\nfunction requireCountryCode(country: string): string | NextResponse {\n  const countryCode = resolveTaxCountryCode(country);\n  if (!countryCode) {\n    return NextResponse.json(\n      { error: 'This shipping country is not supported.' },\n      { status: 400 },\n    );\n  }\n  return countryCode;\n}\n\nexport async function GET(request: Request) {\n  const auth = await requireAuthenticatedUser(request);\n  if (auth.response) return auth.response;\n\n  try {\n    const addresses = await db.address.findMany({\n      where: { userId: auth.user.id },\n      orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],\n    });\n\n    return NextResponse.json({\n      addresses: addresses.map(mapAddress),\n      total: addresses.length,\n    });\n  } catch (error) {\n    console.error('Addresses GET error:', error);\n    return NextResponse.json(\n      { error: 'Failed to fetch addresses.' },\n      { status: 500 },\n    );\n  }\n}\n\nexport async function POST(request: Request) {\n  const validationError = validateWriteRequest(request);\n  if (validationError) return validationError;\n\n  const auth = await requireAuthenticatedUser(request);\n  if (auth.response) return auth.response;\n\n  const parsed = addressFields.safeParse(\n    await request.json().catch(() => null),\n  );\n  if (!parsed.success) {\n    return NextResponse.json(\n      { error: 'Invalid address details.' },\n      { status: 400 },\n    );\n  }\n\n  const countryCode = requireCountryCode(parsed.data.country);\n  if (countryCode instanceof NextResponse) return countryCode;\n\n  try {\n    const address = await db.$transaction(async (tx) => {\n      if (parsed.data.isDefault) {\n        await tx.address.updateMany({\n          where: { userId: auth.user.id, isDefault: true },\n          data: { isDefault: false },\n        });\n      }\n\n      return tx.address.create({\n        data: {\n          userId: auth.user.id,\n          label: parsed.data.label || 'Home',\n          fullName: parsed.data.fullName,\n          phone: parsed.data.phone,\n          address1: parsed.data.address1,\n          address2: parsed.data.address2 || null,\n          city: parsed.data.city,\n          state: parsed.data.state || null,\n          postalCode: parsed.data.postalCode || null,\n          country: parsed.data.country,\n          countryCode,\n          isDefault: parsed.data.isDefault,\n        },\n      });\n    });\n\n    return NextResponse.json(\n      { address: mapAddress(address) },\n      { status: 201 },\n    );\n  } catch (error) {\n    console.error('Addresses POST error:', error);\n    return NextResponse.json(\n      { error: 'Failed to create address.' },\n      { status: 500 },\n    );\n  }\n}\n\nexport async function PUT(request: Request) {\n  const validationError = validateWriteRequest(request);\n  if (validationError) return validationError;\n\n  const auth = await requireAuthenticatedUser(request);\n  if (auth.response) return auth.response;\n\n  const parsed = updateSchema.safeParse(\n    await request.json().catch(() => null),\n  );\n  if (!parsed.success) {\n    return NextResponse.json(\n      { error: 'Invalid address update.' },\n      { status: 400 },\n    );\n  }\n\n  try {\n    const existing = await db.address.findFirst({\n      where: { id: parsed.data.id, userId: auth.user.id },\n    });\n    if (!existing) {\n      return NextResponse.json(\n        { error: 'Address not found.' },\n        { status: 404 },\n      );\n    }\n\n    const { id, ...changes } = parsed.data;\n    const countryCode = changes.country\n      ? requireCountryCode(changes.country)\n      : existing.countryCode;\n    if (countryCode instanceof NextResponse) return countryCode;\n\n    const address = await db.$transaction(async (tx) => {\n      if (changes.isDefault) {\n        await tx.address.updateMany({\n          where: {\n            userId: auth.user.id,\n            isDefault: true,\n            id: { not: id },\n          },\n          data: { isDefault: false },\n        });\n      }\n\n      return tx.address.update({\n        where: { id },\n        data: {\n          ...changes,\n          countryCode,\n          label:\n            changes.label === undefined\n              ? undefined\n              : changes.label || 'Home',\n          address2:\n            changes.address2 === undefined\n              ? undefined\n              : changes.address2 || null,\n          state:\n            changes.state === undefined ? undefined : changes.state || null,\n          postalCode:\n            changes.postalCode === undefined\n              ? undefined\n              : changes.postalCode || null,\n        },\n      });\n    });\n\n    return NextResponse.json({ address: mapAddress(address) });\n  } catch (error) {\n    console.error('Addresses PUT error:', error);\n    return NextResponse.json(\n      { error: 'Failed to update address.' },\n      { status: 500 },\n    );\n  }\n}\n\nexport async function DELETE(request: Request) {\n  const validationError = validateWriteRequest(request);\n  if (validationError) return validationError;\n\n  const auth = await requireAuthenticatedUser(request);\n  if (auth.response) return auth.response;\n\n  const id = new URL(request.url).searchParams.get('id');\n  if (!id) {\n    return NextResponse.json(\n      { error: 'Address id is required.' },\n      { status: 400 },\n    );\n  }\n\n  try {\n    const deleted = await db.address.deleteMany({\n      where: { id, userId: auth.user.id },\n    });\n    if (deleted.count !== 1) {\n      return NextResponse.json(\n        { error: 'Address not found.' },\n        { status: 404 },\n      );\n    }\n    return NextResponse.json({ success: true, id });\n  } catch (error) {\n    console.error('Addresses DELETE error:', error);\n    return NextResponse.json(\n      { error: 'Failed to delete address.' },\n      { status: 500 },\n    );\n  }\n}\n")

write('src/stores/cart-store.ts', "'use client';\n\nimport { create } from 'zustand';\nimport { canonicalizeVariation } from '@/lib/checkout-authority';\nimport { LS_KEYS } from '@/lib/config';\n\nexport interface CartItem {\n  lineId: string;\n  productId: string;\n  variantId?: string;\n  sku?: string;\n  name: string;\n  price: number;\n  originalPrice?: number;\n  image: string;\n  quantity: number;\n  availableStock?: number;\n  storeId: string;\n  storeName: string;\n  hasFreeShipping?: boolean;\n  variation?: string | Record<string, string>;\n}\n\nexport type NewCartItem = Omit<CartItem, 'lineId'> & { lineId?: string };\n\ninterface CartState {\n  items: CartItem[];\n  addItem: (item: NewCartItem) => void;\n  removeItem: (lineId: string) => void;\n  updateQuantity: (lineId: string, quantity: number) => void;\n  clearCart: () => void;\n  getTotal: () => number;\n  getItemCount: () => number;\n}\n\nfunction serializeVariation(\n  variation: string | Record<string, string> | undefined,\n): string | undefined {\n  if (!variation) return undefined;\n\n  if (typeof variation === 'object') {\n    const canonical = canonicalizeVariation(variation);\n    return canonical === '{}' ? undefined : canonical;\n  }\n\n  const trimmed = variation.trim();\n  if (!trimmed) return undefined;\n\n  try {\n    const parsed = JSON.parse(trimmed) as unknown;\n    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {\n      const canonical = canonicalizeVariation(\n        Object.fromEntries(\n          Object.entries(parsed).map(([key, value]) => [\n            key,\n            String(value),\n          ]),\n        ),\n      );\n      return canonical === '{}' ? undefined : canonical;\n    }\n  } catch {\n    // Keep legacy one-dimensional string selections intact.\n  }\n\n  return trimmed;\n}\n\nexport function createCartLineId(\n  productId: string,\n  variation?: string | Record<string, string>,\n  variantId?: string,\n): string {\n  if (variantId?.trim()) return `${productId}:sku:${variantId.trim()}`;\n  const serializedVariation = serializeVariation(variation) || 'base';\n  return `${productId}:${encodeURIComponent(serializedVariation)}`;\n}\n\nfunction boundedQuantity(\n  quantity: number,\n  availableStock: number | undefined,\n): number {\n  const normalized = Math.max(1, Math.floor(quantity));\n  if (\n    availableStock === undefined ||\n    !Number.isFinite(availableStock) ||\n    availableStock < 0\n  ) {\n    return normalized;\n  }\n  return Math.min(normalized, Math.floor(availableStock));\n}\n\nfunction normalizeCartItem(item: NewCartItem): CartItem | null {\n  const variation = serializeVariation(item.variation);\n  const availableStock =\n    item.availableStock === undefined\n      ? undefined\n      : Math.max(0, Math.floor(item.availableStock));\n  if (availableStock === 0) return null;\n\n  return {\n    ...item,\n    variantId: item.variantId?.trim() || undefined,\n    sku: item.sku?.trim() || undefined,\n    variation,\n    availableStock,\n    quantity: boundedQuantity(item.quantity, availableStock),\n    lineId:\n      item.lineId ||\n      createCartLineId(item.productId, variation, item.variantId),\n  };\n}\n\nfunction loadCart(): CartItem[] {\n  if (typeof window === 'undefined') return [];\n  try {\n    const saved = localStorage.getItem(LS_KEYS.cart);\n    if (!saved) return [];\n\n    const parsed = JSON.parse(saved) as unknown;\n    if (!Array.isArray(parsed)) return [];\n\n    return parsed\n      .filter(\n        (item): item is NewCartItem =>\n          Boolean(\n            item &&\n              typeof item === 'object' &&\n              'productId' in item &&\n              'quantity' in item,\n          ),\n      )\n      .map(normalizeCartItem)\n      .filter((item): item is CartItem => Boolean(item));\n  } catch {\n    return [];\n  }\n}\n\nfunction saveCart(items: CartItem[]) {\n  if (typeof window === 'undefined') return;\n  try {\n    localStorage.setItem(LS_KEYS.cart, JSON.stringify(items));\n  } catch {\n    // localStorage may be unavailable.\n  }\n}\n\nexport const useCartStore = create<CartState>((set, get) => ({\n  items: loadCart(),\n\n  addItem: (item) =>\n    set((state) => {\n      const normalizedItem = normalizeCartItem(item);\n      if (!normalizedItem) return state;\n\n      const existing = state.items.find(\n        (current) => current.lineId === normalizedItem.lineId,\n      );\n      const newItems = existing\n        ? state.items.map((current) =>\n            current.lineId === normalizedItem.lineId\n              ? {\n                  ...current,\n                  price: normalizedItem.price,\n                  originalPrice: normalizedItem.originalPrice,\n                  availableStock: normalizedItem.availableStock,\n                  quantity: boundedQuantity(\n                    current.quantity + normalizedItem.quantity,\n                    normalizedItem.availableStock,\n                  ),\n                }\n              : current,\n          )\n        : [...state.items, normalizedItem];\n      saveCart(newItems);\n      return { items: newItems };\n    }),\n\n  removeItem: (lineId) =>\n    set((state) => {\n      const newItems = state.items.filter(\n        (item) => item.lineId !== lineId,\n      );\n      saveCart(newItems);\n      return { items: newItems };\n    }),\n\n  updateQuantity: (lineId, quantity) =>\n    set((state) => {\n      const newItems =\n        quantity <= 0\n          ? state.items.filter((item) => item.lineId !== lineId)\n          : state.items.map((item) =>\n              item.lineId === lineId\n                ? {\n                    ...item,\n                    quantity: boundedQuantity(\n                      quantity,\n                      item.availableStock,\n                    ),\n                  }\n                : item,\n            );\n      saveCart(newItems);\n      return { items: newItems };\n    }),\n\n  clearCart: () => {\n    saveCart([]);\n    set({ items: [] });\n  },\n\n  getTotal: () => {\n    const { items } = get();\n    return items.reduce(\n      (sum, item) => sum + item.price * item.quantity,\n      0,\n    );\n  },\n\n  getItemCount: () => {\n    const { items } = get();\n    return items.reduce((sum, item) => sum + item.quantity, 0);\n  },\n}));\n")

write('prisma/migrations/production_authoritative_checkout_20260731/migration.sql', '-- Authoritative checkout jurisdiction, shipment snapshots, and SKU inventory.\n\nALTER TABLE "Address"\n  ADD COLUMN "countryCode" TEXT NOT NULL DEFAULT \'iq\';\n\nALTER TABLE "Order"\n  ADD COLUMN "shippingMethod" TEXT NOT NULL DEFAULT \'standard\',\n  ADD COLUMN "taxCountryCode" TEXT;\n\nALTER TABLE "OrderItem"\n  ADD COLUMN "variantId" TEXT,\n  ADD COLUMN "sku" TEXT;\n\nCREATE TABLE "ProductVariant" (\n  "id" TEXT NOT NULL,\n  "productId" TEXT NOT NULL,\n  "sku" TEXT NOT NULL,\n  "attributes" TEXT NOT NULL DEFAULT \'{}\',\n  "price" DOUBLE PRECISION NOT NULL,\n  "originalPrice" DOUBLE PRECISION,\n  "stock" INTEGER NOT NULL DEFAULT 0,\n  "soldCount" INTEGER NOT NULL DEFAULT 0,\n  "image" TEXT,\n  "position" INTEGER NOT NULL DEFAULT 0,\n  "isActive" BOOLEAN NOT NULL DEFAULT true,\n  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n  "updatedAt" TIMESTAMP(3) NOT NULL,\n  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")\n);\n\nCREATE UNIQUE INDEX "ProductVariant_sku_key"\n  ON "ProductVariant"("sku");\nCREATE UNIQUE INDEX "ProductVariant_productId_attributes_key"\n  ON "ProductVariant"("productId", "attributes");\nCREATE INDEX "ProductVariant_productId_isActive_idx"\n  ON "ProductVariant"("productId", "isActive");\nCREATE INDEX "OrderItem_variantId_idx"\n  ON "OrderItem"("variantId");\nCREATE INDEX "Order_taxCountryCode_createdAt_idx"\n  ON "Order"("taxCountryCode", "createdAt");\n\nALTER TABLE "ProductVariant"\n  ADD CONSTRAINT "ProductVariant_productId_fkey"\n  FOREIGN KEY ("productId") REFERENCES "Product"("id")\n  ON DELETE CASCADE ON UPDATE CASCADE;\n\nALTER TABLE "OrderItem"\n  ADD CONSTRAINT "OrderItem_variantId_fkey"\n  FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id")\n  ON DELETE RESTRICT ON UPDATE CASCADE;\n\nCREATE OR REPLACE FUNCTION pg_temp.safe_jsonb(input TEXT)\nRETURNS JSONB\nLANGUAGE plpgsql\nIMMUTABLE\nAS $$\nBEGIN\n  RETURN input::jsonb;\nEXCEPTION WHEN OTHERS THEN\n  RETURN \'{}\'::jsonb;\nEND;\n$$;\n\nUPDATE "Address"\nSET "countryCode" = CASE lower(trim("country"))\n  WHEN \'ae\' THEN \'ae\'\n  WHEN \'uae\' THEN \'ae\'\n  WHEN \'united arab emirates\' THEN \'ae\'\n  WHEN \'الإمارات\' THEN \'ae\'\n  WHEN \'sa\' THEN \'sa\'\n  WHEN \'ksa\' THEN \'sa\'\n  WHEN \'saudi arabia\' THEN \'sa\'\n  WHEN \'السعودية\' THEN \'sa\'\n  WHEN \'kw\' THEN \'kw\'\n  WHEN \'kuwait\' THEN \'kw\'\n  WHEN \'الكويت\' THEN \'kw\'\n  WHEN \'jo\' THEN \'jo\'\n  WHEN \'jordan\' THEN \'jo\'\n  WHEN \'الأردن\' THEN \'jo\'\n  WHEN \'qa\' THEN \'qa\'\n  WHEN \'qatar\' THEN \'qa\'\n  WHEN \'قطر\' THEN \'qa\'\n  WHEN \'om\' THEN \'om\'\n  WHEN \'oman\' THEN \'om\'\n  WHEN \'عمان\' THEN \'om\'\n  WHEN \'eg\' THEN \'eg\'\n  WHEN \'egypt\' THEN \'eg\'\n  WHEN \'مصر\' THEN \'eg\'\n  WHEN \'bh\' THEN \'bh\'\n  WHEN \'bahrain\' THEN \'bh\'\n  WHEN \'البحرين\' THEN \'bh\'\n  WHEN \'lb\' THEN \'lb\'\n  WHEN \'lebanon\' THEN \'lb\'\n  WHEN \'لبنان\' THEN \'lb\'\n  WHEN \'ma\' THEN \'ma\'\n  WHEN \'morocco\' THEN \'ma\'\n  WHEN \'المغرب\' THEN \'ma\'\n  WHEN \'dz\' THEN \'dz\'\n  WHEN \'algeria\' THEN \'dz\'\n  WHEN \'الجزائر\' THEN \'dz\'\n  WHEN \'tn\' THEN \'tn\'\n  WHEN \'tunisia\' THEN \'tn\'\n  WHEN \'تونس\' THEN \'tn\'\n  WHEN \'ps\' THEN \'ps\'\n  WHEN \'palestine\' THEN \'ps\'\n  WHEN \'فلسطين\' THEN \'ps\'\n  WHEN \'sy\' THEN \'sy\'\n  WHEN \'syria\' THEN \'sy\'\n  WHEN \'سوريا\' THEN \'sy\'\n  ELSE \'iq\'\nEND;\n\nUPDATE "Order"\nSET "taxCountryCode" = CASE lower(trim(\n  COALESCE(\n    pg_temp.safe_jsonb("shippingAddress")->>\'countryCode\',\n    pg_temp.safe_jsonb("shippingAddress")->>\'country\',\n    \'\'\n  )\n))\n  WHEN \'ae\' THEN \'ae\'\n  WHEN \'uae\' THEN \'ae\'\n  WHEN \'united arab emirates\' THEN \'ae\'\n  WHEN \'sa\' THEN \'sa\'\n  WHEN \'ksa\' THEN \'sa\'\n  WHEN \'saudi arabia\' THEN \'sa\'\n  WHEN \'kw\' THEN \'kw\'\n  WHEN \'kuwait\' THEN \'kw\'\n  WHEN \'jo\' THEN \'jo\'\n  WHEN \'jordan\' THEN \'jo\'\n  WHEN \'qa\' THEN \'qa\'\n  WHEN \'qatar\' THEN \'qa\'\n  WHEN \'om\' THEN \'om\'\n  WHEN \'oman\' THEN \'om\'\n  WHEN \'eg\' THEN \'eg\'\n  WHEN \'egypt\' THEN \'eg\'\n  WHEN \'bh\' THEN \'bh\'\n  WHEN \'bahrain\' THEN \'bh\'\n  WHEN \'lb\' THEN \'lb\'\n  WHEN \'lebanon\' THEN \'lb\'\n  WHEN \'ma\' THEN \'ma\'\n  WHEN \'morocco\' THEN \'ma\'\n  WHEN \'dz\' THEN \'dz\'\n  WHEN \'algeria\' THEN \'dz\'\n  WHEN \'tn\' THEN \'tn\'\n  WHEN \'tunisia\' THEN \'tn\'\n  WHEN \'ps\' THEN \'ps\'\n  WHEN \'palestine\' THEN \'ps\'\n  WHEN \'sy\' THEN \'sy\'\n  WHEN \'syria\' THEN \'sy\'\n  WHEN \'iq\' THEN \'iq\'\n  WHEN \'iraq\' THEN \'iq\'\n  ELSE NULL\nEND;\n\nWITH RECURSIVE\nraw_options AS (\n  SELECT\n    product."id" AS product_id,\n    product."sku" AS parent_sku,\n    product."price" AS price,\n    product."originalPrice" AS original_price,\n    product."stock" AS stock,\n    option_entry.key AS option_key,\n    option_entry.value AS option_values\n  FROM "Product" AS product\n  CROSS JOIN LATERAL jsonb_each(\n    CASE\n      WHEN jsonb_typeof(pg_temp.safe_jsonb(product."variations")) = \'object\'\n        THEN pg_temp.safe_jsonb(product."variations")\n      ELSE \'{}\'::jsonb\n    END\n  ) AS option_entry\n  WHERE\n    jsonb_typeof(option_entry.value) = \'array\'\n    AND jsonb_array_length(option_entry.value) > 0\n),\nordered_options AS (\n  SELECT\n    raw_options.*,\n    row_number() OVER (\n      PARTITION BY product_id\n      ORDER BY option_key\n    ) AS option_index,\n    count(*) OVER (\n      PARTITION BY product_id\n    ) AS option_count\n  FROM raw_options\n),\ncombinations AS (\n  SELECT\n    option.product_id,\n    option.parent_sku,\n    option.price,\n    option.original_price,\n    option.stock,\n    option.option_index,\n    option.option_count,\n    jsonb_build_object(option.option_key, option_value.value) AS attributes\n  FROM ordered_options AS option\n  CROSS JOIN LATERAL jsonb_array_elements_text(\n    option.option_values\n  ) AS option_value(value)\n  WHERE option.option_index = 1\n\n  UNION ALL\n\n  SELECT\n    option.product_id,\n    option.parent_sku,\n    option.price,\n    option.original_price,\n    option.stock,\n    option.option_index,\n    option.option_count,\n    combination.attributes ||\n      jsonb_build_object(option.option_key, option_value.value)\n  FROM combinations AS combination\n  JOIN ordered_options AS option\n    ON option.product_id = combination.product_id\n    AND option.option_index = combination.option_index + 1\n  CROSS JOIN LATERAL jsonb_array_elements_text(\n    option.option_values\n  ) AS option_value(value)\n),\nfinal_combinations AS (\n  SELECT\n    combinations.*,\n    row_number() OVER (\n      PARTITION BY product_id\n      ORDER BY attributes::text\n    ) AS combination_index,\n    count(*) OVER (\n      PARTITION BY product_id\n    ) AS combination_count\n  FROM combinations\n  WHERE option_index = option_count\n)\nINSERT INTO "ProductVariant" (\n  "id",\n  "productId",\n  "sku",\n  "attributes",\n  "price",\n  "originalPrice",\n  "stock",\n  "soldCount",\n  "position",\n  "isActive",\n  "createdAt",\n  "updatedAt"\n)\nSELECT\n  \'pv_\' || substr(md5(product_id || attributes::text), 1, 24),\n  product_id,\n  upper(COALESCE(NULLIF(parent_sku, \'\'), product_id)) ||\n    \'-\' || upper(substr(md5(attributes::text), 1, 8)),\n  attributes::text,\n  price,\n  original_price,\n  (stock / combination_count::integer) +\n    CASE\n      WHEN combination_index <= (stock % combination_count::integer)\n        THEN 1\n      ELSE 0\n    END,\n  0,\n  combination_index::integer - 1,\n  true,\n  CURRENT_TIMESTAMP,\n  CURRENT_TIMESTAMP\nFROM final_combinations\nON CONFLICT ("productId", "attributes") DO NOTHING;\n\nUPDATE "OrderItem" AS order_item\nSET\n  "variantId" = variant."id",\n  "sku" = variant."sku"\nFROM "ProductVariant" AS variant\nWHERE\n  variant."productId" = order_item."productId"\n  AND order_item."variation" IS NOT NULL\n  AND pg_temp.safe_jsonb(order_item."variation")::text = variant."attributes";\n')


# Prisma model: explicit SKU rows, order snapshots, and normalized jurisdictions.
schema_path = "prisma/schema.prisma"
schema = read(schema_path)

if "model ProductVariant {" not in schema:
    schema = schema.replace(
        "  auctions     Auction[]\n\n  @@index([categoryId])",
        "  auctions     Auction[]\n  variants     ProductVariant[]\n\n  @@index([categoryId])",
        1,
    )
    product_variant_model = '''model ProductVariant {
  id            String   @id @default(cuid())
  productId     String
  sku           String   @unique
  attributes    String   @default("{}")
  price         Float
  originalPrice Float?
  stock         Int      @default(0)
  soldCount     Int      @default(0)
  image         String?
  position      Int      @default(0)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  product    Product     @relation(fields: [productId], references: [id], onDelete: Cascade)
  orderItems OrderItem[]

  @@unique([productId, attributes])
  @@index([productId, isActive])
}

'''
    schema = schema.replace("model Order {\n", product_variant_model + "model Order {\n", 1)

schema = schema.replace(
    "  paymentStatus    String    @default(\"pending\")\n  shippingAddress   String\n  trackingNumber",
    "  paymentStatus    String    @default(\"pending\")\n"
    "  shippingMethod   String    @default(\"standard\")\n"
    "  taxCountryCode   String?\n"
    "  shippingAddress  String\n"
    "  trackingNumber",
    1,
)

order_item_pattern = re.compile(
    r'''model OrderItem \{\n.*?\n\}\n\nmodel Review \{''',
    re.DOTALL,
)
order_item_replacement = '''model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  variantId String?
  sku       String?
  quantity  Int
  price     Float
  total     Float
  variation String?

  order   Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product         @relation(fields: [productId], references: [id])
  variant ProductVariant? @relation(fields: [variantId], references: [id], onDelete: Restrict)

  @@index([orderId])
  @@index([productId])
  @@index([variantId])
}

model Review {'''
schema, count = order_item_pattern.subn(order_item_replacement, schema, count=1)
if count != 1:
    raise RuntimeError("Could not replace OrderItem model.")

schema = schema.replace(
    "  country    String   @default(\"Iraq\")\n  isDefault",
    "  country     String   @default(\"Iraq\")\n"
    "  countryCode String   @default(\"iq\")\n"
    "  isDefault",
    1,
)

if "@@index([taxCountryCode, createdAt])" not in schema:
    schema = schema.replace(
        "  @@index([idempotencyKey])\n}\n\nmodel OrderItem",
        "  @@index([idempotencyKey])\n"
        "  @@index([taxCountryCode, createdAt])\n"
        "}\n\nmodel OrderItem",
        1,
    )

write(schema_path, schema)

# Seed explicit SKU combinations and keep parent stock equal to the SKU total.
seed_path = "prisma/seed.ts"
seed = read(seed_path)

seed_helpers = r'''
type SeedVariationMap = Record<string, string[]>;

function parseSeedVariationOptions(value: string): SeedVariationMap {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed)
        .map(([key, values]) => [
          key,
          Array.isArray(values)
            ? [...new Set(values.map((item) => String(item).trim()).filter(Boolean))]
            : [],
        ])
        .filter(([, values]) => (values as string[]).length > 0),
    ) as SeedVariationMap;
  } catch {
    return {};
  }
}

function seedVariationCombinations(
  options: SeedVariationMap,
): Record<string, string>[] {
  const entries = Object.entries(options).sort(([left], [right]) =>
    left.localeCompare(right),
  );
  if (entries.length === 0) return [];

  return entries.reduce<Record<string, string>[]>(
    (combinations, [key, values]) =>
      combinations.flatMap((combination) =>
        values.map((value) => ({ ...combination, [key]: value })),
      ),
    [{}],
  );
}

function canonicalSeedAttributes(attributes: Record<string, string>): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(attributes).sort(([left], [right]) =>
        left.localeCompare(right),
      ),
    ),
  );
}
'''.strip()

if "function seedVariationCombinations(" not in seed:
    seed = seed.replace(
        'const db = new PrismaClient();\n',
        'const db = new PrismaClient();\n\n' + seed_helpers + '\n',
        1,
    )

if "await db.productVariant.deleteMany({});" not in seed:
    seed = seed.replace(
        "\tawait db.orderItem.deleteMany({});\n",
        "\tawait db.orderItem.deleteMany({});\n"
        "\tawait db.productVariant.deleteMany({});\n",
        1,
    )

variant_seed = r'''
	const seededVariants = allProducts.flatMap((product) => {
		const combinations = seedVariationCombinations(
			parseSeedVariationOptions(product.variations),
		);
		if (combinations.length === 0) return [];

		const baseSku = (product.sku || product.id)
			.toUpperCase()
			.replace(/[^A-Z0-9_-]+/g, "-");
		const stockPerVariant = Math.floor(product.stock / combinations.length);
		const stockRemainder = product.stock % combinations.length;

		return combinations.map((attributes, index) => {
			const priceAdjustment =
				index === 0 ? 0 : Math.min(index, 4) * 2;
			return {
				productId: product.id,
				sku: `${baseSku}-${String(index + 1).padStart(3, "0")}`,
				attributes: canonicalSeedAttributes(attributes),
				price: Math.round((product.price + priceAdjustment) * 100) / 100,
				originalPrice:
					product.originalPrice === null
						? null
						: Math.round(
								(product.originalPrice + priceAdjustment) * 100,
							) / 100,
				stock: stockPerVariant + (index < stockRemainder ? 1 : 0),
				soldCount: 0,
				position: index,
				isActive: true,
			};
		});
	});

	if (seededVariants.length > 0) {
		await db.productVariant.createMany({ data: seededVariants });
	}
'''.rstrip()

if "const seededVariants = allProducts.flatMap" not in seed:
    marker = '''\tconst allProducts = await db.product.findMany({
\t\torderBy: { createdAt: "asc" },
\t});
'''
    if marker not in seed:
        raise RuntimeError("Could not locate allProducts seed marker.")
    seed = seed.replace(marker, marker + "\n" + variant_seed + "\n", 1)

write(seed_path, seed)
PRODUCT_INTERFACE_REPLACEMENT = 'export interface ProductVariant {\n\tid: string;\n\tsku: string;\n\tattributes: string;\n\tprice: number;\n\toriginalPrice?: number | null;\n\tstock: number;\n\tsoldCount?: number;\n\timage?: string | null;\n\tposition?: number;\n\tisActive?: boolean;\n}\n\nexport interface Product {\n\tid: string;\n\tname: string;\n\tnameAr?: string;\n\tdescription?: string;\n\tdescriptionAr?: string;\n\tprice: number;\n\toriginalPrice?: number | null;\n\timages: string;\n\tcategoryId: string;\n\tstoreId: string;\n\tsku?: string;\n\tstock: number;\n\trating: number;\n\treviewCount: number;\n\tsoldCount: number;\n\tviews?: number;\n\tisFeatured: boolean;\n\tisNew: boolean;\n\tisSale: boolean;\n\tisB2b: boolean;\n\thasFreeShipping: boolean;\n\tvariations: string;\n\ttieredPricing: string;\n\ttags: string;\n\tvariants?: ProductVariant[];\n\tvariantCount?: number;\n\tcategory?: {\n\t\tid: string;\n\t\tname: string;\n\t\tnameAr?: string;\n\t\tslug?: string;\n\t\ticon?: string;\n\t};\n\tstore?: {\n\t\tid: string;\n\t\tname: string;\n\t\tnameAr?: string;\n\t\tslug?: string;\n\t\tlogo?: string;\n\t\trating: number;\n\t\treviewCount?: number;\n\t\tisVerified: boolean;\n\t\tlocation?: string;\n\t\tproductCount?: number;\n\t};\n\tstatus?: string;\n\tcreatedAt: string;\n\tupdatedAt?: string;\n\texpiresAt?: string;\n\tpromotionType?:\n\t\t| "bump-up"\n\t\t| "featured-ad"\n\t\t| "premium-ad"\n\t\t| "urgent-badge"\n\t\t| "spotlight"\n\t\t| null;\n}\n\ninterface ProductCardProps'


# Public product types expose authoritative SKU data.
product_card_path = "src/components/buyer/product-card.tsx"
product_card = read(product_card_path)
if 'parseVariationOptions' not in product_card:
    product_card = product_card.replace(
        'import { useCartStore } from "@/stores/cart-store";\n',
        'import { useCartStore } from "@/stores/cart-store";\n'
        'import { parseVariationOptions } from "@/lib/checkout-authority";\n',
        1,
    )
product_card, count = re.subn(
    r'export interface Product \{.*?\n\}\n\ninterface ProductCardProps',
    PRODUCT_INTERFACE_REPLACEMENT,
    product_card,
    count=1,
    flags=re.DOTALL,
)
if count != 1:
    raise RuntimeError("Could not replace public Product interface.")

product_card, count = re.subn(
    r'''\tconst handleAddToCart = \(e: React\.MouseEvent\) => \{.*?\n\t\};\n\n\tconst handleWishlist''',
    r'''\tconst handleAddToCart = (e: React.MouseEvent) => {
\t\te.preventDefault();
\t\te.stopPropagation();

\t\tconst hasOptions =
\t\t\t(product.variantCount || 0) > 0 ||
\t\t\tObject.keys(parseVariationOptions(product.variations)).length > 0;
\t\tif (hasOptions) {
\t\t\taddToRecentlyViewed(product.id);
\t\t\tnav.selectProduct(product.id);
\t\t\treturn;
\t\t}

\t\tsetCartBounce(true);
\t\tsetTimeout(() => setCartBounce(false), 400);
\t\taddItem({
\t\t\tproductId: product.id,
\t\t\tname: product.name,
\t\t\tprice: product.price,
\t\t\toriginalPrice: product.originalPrice ?? undefined,
\t\t\timage: localImages[0] || imageSrc,
\t\t\tquantity: 1,
\t\t\tavailableStock: product.stock,
\t\t\tstoreId: product.storeId,
\t\t\tstoreName: product.store?.name || "",
\t\t\thasFreeShipping: product.hasFreeShipping,
\t\t});
\t};

\tconst handleWishlist''',
    product_card,
    count=1,
    flags=re.DOTALL,
)
if count != 1:
    raise RuntimeError("Could not replace product-card add-to-cart handler.")
write(product_card_path, product_card)

# Quick view is intentionally not an SKU selector.
quick_view_path = "src/components/buyer/product-quick-view.tsx"
quick_view = read(quick_view_path)
if "availableStock: product.stock" not in quick_view:
    quick_view = quick_view.replace(
        "        quantity: 1,\n        storeId: product.storeId,",
        "        quantity: 1,\n"
        "        availableStock: product.stock,\n"
        "        storeId: product.storeId,",
        1,
    )
quick_view = quick_view.replace(
    "    if (variationKeys.length > 0) {",
    "    if (variationKeys.length > 0 || (product.variantCount || 0) > 0) {",
    1,
)
write(quick_view_path, quick_view)

# Product details select a concrete active SKU and use its price/stock.
detail_path = "src/components/buyer/product-detail-page.tsx"
detail = read(detail_path)
if "canonicalizeVariation" not in detail:
    detail = detail.replace(
        "import { APP_NAME } from '@/lib/config';\n",
        "import { APP_NAME } from '@/lib/config';\n"
        "import {\n"
        "  canonicalizeVariation,\n"
        "  parseVariantAttributes,\n"
        "} from '@/lib/checkout-authority';\n",
        1,
    )

detail, count = re.subn(
    r'''          // Parse variations and set defaults\n          try \{.*?          \} catch \{\n            setSelectedVariations\(\{\}\);\n          \}''',
    r'''          const activeVariants =
            found.variants?.filter((variant) => variant.isActive !== false) || [];
          const defaultVariant =
            activeVariants.find((variant) => variant.stock > 0) ||
            activeVariants[0];
          if (defaultVariant) {
            try {
              setSelectedVariations(
                parseVariantAttributes(defaultVariant.attributes),
              );
            } catch {
              setSelectedVariations({});
            }
          } else {
            try {
              const vars = JSON.parse(found.variations || '{}');
              const defaults: Record<string, string> = {};
              Object.entries(vars).forEach(([key, values]) => {
                if (Array.isArray(values) && values.length > 0) {
                  defaults[key] = String(values[0]);
                }
              });
              setSelectedVariations(defaults);
            } catch {
              setSelectedVariations({});
            }
          }''',
    detail,
    count=1,
    flags=re.DOTALL,
)
if count != 1:
    raise RuntimeError("Could not replace product-detail SKU defaults.")

detail, count = re.subn(
    r'''  const handleAddToCart = \(\) => \{.*?\n  \};\n\n  const handleBuyNow''',
    r'''  const handleAddToCart = () => {
    if (!product) return;
    if (hasAuthoritativeVariants && !selectedVariant) return;
    if (effectiveStock < quantity || effectiveStock <= 0) return;

    const images: string[] = (() => {
      try {
        return JSON.parse(product.images);
      } catch {
        return [];
      }
    })();
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id,
      sku: selectedVariant?.sku || product.sku,
      name: product.name,
      price: effectivePrice,
      originalPrice: effectiveOriginalPrice,
      image:
        selectedVariant?.image ||
        images[0] ||
        '/placeholder-product.svg',
      quantity,
      availableStock: effectiveStock,
      storeId: product.storeId,
      storeName: product.store?.name || '',
      hasFreeShipping: product.hasFreeShipping,
      variation:
        selectedVariant?.attributes ||
        (Object.keys(selectedVariations).length > 0
          ? canonicalizeVariation(selectedVariations)
          : undefined),
    });
  };

  const handleBuyNow''',
    detail,
    count=1,
    flags=re.DOTALL,
)
if count != 1:
    raise RuntimeError("Could not replace product-detail add-to-cart handler.")

derived_block = r'''  const legacyVariations: Record<string, string[]> = (() => {
    try {
      return JSON.parse(product.variations || '{}');
    } catch {
      return {};
    }
  })();

  const activeVariants = (product.variants || []).filter(
    (variant) => variant.isActive !== false,
  );
  const variantRows = activeVariants.flatMap((variant) => {
    try {
      return [{ variant, attributes: parseVariantAttributes(variant.attributes) }];
    } catch {
      return [];
    }
  });
  const authoritativeOptions: Record<string, string[]> = {};
  for (const { attributes } of variantRows) {
    for (const [key, value] of Object.entries(attributes)) {
      const values = authoritativeOptions[key] || [];
      if (!values.includes(value)) values.push(value);
      authoritativeOptions[key] = values;
    }
  }
  for (const values of Object.values(authoritativeOptions)) values.sort();

  const variations =
    activeVariants.length > 0 ? authoritativeOptions : legacyVariations;
  const selectedCanonical =
    Object.keys(selectedVariations).length > 0
      ? canonicalizeVariation(selectedVariations)
      : null;
  const selectedVariant = selectedCanonical
    ? variantRows.find(
        ({ variant }) => variant.attributes === selectedCanonical,
      )?.variant || null
    : null;
  const hasAuthoritativeVariants = activeVariants.length > 0;

  const tieredPricing: TierPrice[] = (() => {
    try {
      return JSON.parse(product.tieredPricing || '[]');
    } catch {
      return [];
    }
  })();
  const applicableTieredPricing = hasAuthoritativeVariants
    ? []
    : tieredPricing;

  const effectivePrice = selectedVariant
    ? selectedVariant.price
    : (() => {
        const tier = [...tieredPricing]
          .sort((left, right) => right.minQty - left.minQty)
          .find((candidate) => quantity >= candidate.minQty);
        return tier?.price ?? product.price;
      })();
  const effectiveOriginalPrice = selectedVariant
    ? selectedVariant.originalPrice ?? undefined
    : product.originalPrice;
  const effectiveStock = hasAuthoritativeVariants
    ? selectedVariant?.stock ?? 0
    : product.stock;

  const displayProduct: Product = {
    ...product,
    price: effectivePrice,
    originalPrice: effectiveOriginalPrice,
    stock: effectiveStock,
    sku: selectedVariant?.sku || product.sku,
  };
  const discount =
    effectiveOriginalPrice && effectiveOriginalPrice > effectivePrice
      ? Math.round(
          ((effectiveOriginalPrice - effectivePrice) /
            effectiveOriginalPrice) *
            100,
        )
      : 0;

  const isOptionAvailable = (type: string, value: string): boolean => {
    if (!hasAuthoritativeVariants) return true;
    return variantRows.some(
      ({ variant, attributes }) =>
        variant.stock > 0 && attributes[type] === value,
    );
  };

  const stockStatus = (() => {
    if (effectiveStock === 0) return 'outOfStock';
    if (effectiveStock <= 10) return 'lowStock';
    return 'inStock';
  })();'''

detail, count = re.subn(
    r'''  const variations: Record<string, string\[]> = \(\(\) => \{.*?  const stockStatus = \(\(\) => \{.*?  \}\)\(\);''',
    derived_block,
    detail,
    count=1,
    flags=re.DOTALL,
)
if count != 1:
    raise RuntimeError("Could not replace product-detail pricing/stock block.")

detail = detail.replace(
    "            product={product}\n",
    "            product={displayProduct}\n",
    1,
)
detail = detail.replace(
    "            setSelectedVariations={setSelectedVariations}\n",
    "            setSelectedVariations={(next) => {\n"
    "              setSelectedVariations((previous) =>\n"
    "                typeof next === 'function' ? next(previous) : next,\n"
    "              );\n"
    "              setQuantity(1);\n"
    "            }}\n",
    1,
)
detail = detail.replace(
    "            tieredPricing={tieredPricing}\n",
    "            tieredPricing={applicableTieredPricing}\n",
    1,
)
detail = detail.replace(
    "            stockStatus={stockStatus}\n",
    "            stockStatus={stockStatus}\n"
    "            isOptionAvailable={isOptionAvailable}\n",
    1,
)
detail = detail.replace(
    "            stock={product.stock}\n",
    "            stock={effectiveStock}\n",
    1,
)
write(detail_path, detail)

# Option buttons reflect SKU combination availability.
info_path = "src/components/buyer/product-detail/product-info-section.tsx"
info = read(info_path)
info = info.replace(
    "  stockStatus: 'outOfStock' | 'lowStock' | 'inStock';\n",
    "  stockStatus: 'outOfStock' | 'lowStock' | 'inStock';\n"
    "  isOptionAvailable: (type: string, value: string) => boolean;\n",
    1,
)
info = info.replace(
    "    effectivePrice, stockStatus,\n",
    "    effectivePrice, stockStatus, isOptionAvailable,\n",
    1,
)
info = info.replace(
    "                inStock: true,\n",
    "                inStock: isOptionAvailable(key, val),\n",
    1,
)
info = info.replace(
    "          basePrice={product.price}\n",
    "          basePrice={effectivePrice}\n",
    1,
)
info = info.replace(
    "onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}",
    "onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}",
    1,
)
info = info.replace(
    "disabled={quantity >= (product.stock || 99)}",
    "disabled={product.stock <= 0 || quantity >= product.stock}",
    1,
)
write(info_path, info)

# Checkout preview mirrors address-derived tax and one shipment per seller.
checkout_path = "src/components/buyer/checkout-page.tsx"
checkout = read(checkout_path)
if "calculateStoreShippingCents" not in checkout:
    checkout = checkout.replace(
        "import { calculateTax } from '@/lib/tax';\n",
        "import { calculateTax } from '@/lib/tax';\n"
        "import {\n"
        "  calculateStoreShippingCents,\n"
        "  resolveTaxCountryCode,\n"
        "  toCents,\n"
        "} from '@/lib/checkout-authority';\n",
        1,
    )

checkout = checkout.replace(
    "  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);\n"
    "  const [countryCode, setCountryCode] = useState('iq');",
    "  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);",
    1,
)

checkout, _ = re.subn(
    r'''\n  useEffect\(\(\) => \{\n    let cancelled = false;\n    queueMicrotask\(\(\) => \{.*?  \}, \[\]\);\n''',
    "\n",
    checkout,
    count=1,
    flags=re.DOTALL,
)

calculation_block = r'''  const itemCount = getItemCount();
  const subtotal = getTotal();
  const selectedAddress = savedAddresses.find(
    (address) => address.id === selectedAddressId,
  );
  const selectedShipping =
    SHIPPING_METHODS.find((method) => method.id === selectedShippingId) ||
    SHIPPING_METHODS[0];
  const addressForTotals =
    selectedAddress || (showNewAddress ? newAddress : undefined);
  const taxCountryCode =
    addressForTotals?.countryCode ||
    resolveTaxCountryCode(addressForTotals?.country || '') ||
    'iq';

  const itemsByStore = new Map<string, typeof items>();
  for (const item of items) {
    const storeItems = itemsByStore.get(item.storeId) || [];
    storeItems.push(item);
    itemsByStore.set(item.storeId, storeItems);
  }
  const shippingCost = [...itemsByStore.values()].reduce(
    (sum, storeItems) => {
      const storeSubtotalCents = storeItems.reduce(
        (storeSum, item) =>
          storeSum + toCents(item.price) * item.quantity,
        0,
      );
      return (
        sum +
        calculateStoreShippingCents(
          selectedShippingId as 'standard' | 'express' | 'next_day',
          storeSubtotalCents,
          storeItems.map((item) => ({
            hasFreeShipping: Boolean(item.hasFreeShipping),
          })),
        ) /
          100
      );
    },
    0,
  );
  const taxableSubtotal = Math.max(0, subtotal - couponDiscount);
  const taxResult = calculateTax(taxableSubtotal, taxCountryCode);
  const tax = taxResult.taxAmount;
  const taxRate = taxResult.taxRate;
  const taxLabel = isRTL ? taxResult.taxLabelAr : taxResult.taxLabel;
  const isTaxExempt = taxResult.isTaxExempt;
  const total = taxableSubtotal + shippingCost + tax;

  const selectedPayment = PAYMENT_METHODS.find(
    (method) => method.id === selectedPaymentId,
  );
  const stepIndex = STEPS.findIndex((step) => step.key === currentStep);'''

checkout, count = re.subn(
    r'''  const itemCount = getItemCount\(\);.*?  const stepIndex = STEPS\.findIndex\(\(step\) => step\.key === currentStep\);''',
    calculation_block,
    checkout,
    count=1,
    flags=re.DOTALL,
)
if count != 1:
    raise RuntimeError("Could not replace checkout preview calculations.")

checkout = checkout.replace(
    "            productId: item.productId,\n"
    "            quantity: item.quantity,",
    "            productId: item.productId,\n"
    "            variantId: item.variantId,\n"
    "            quantity: item.quantity,",
    1,
)
checkout = checkout.replace(
    "          countryCode,\n          couponCode:",
    "          couponCode:",
    1,
)
write(checkout_path, checkout)

checkout_types_path = "src/components/buyer/checkout-types.ts"
checkout_types = read(checkout_types_path)
checkout_types = checkout_types.replace(
    "  country: string;\n  isDefault?: boolean;",
    "  country: string;\n  countryCode?: string;\n  isDefault?: boolean;",
    1,
)
write(checkout_types_path, checkout_types)

review_path = "src/components/buyer/checkout/components/checkout-review.tsx"
review = read(review_path)
if "variantId?: string;" not in review:
    review = review.replace(
        "  productId: string;\n",
        "  productId: string;\n"
        "  variantId?: string;\n"
        "  sku?: string;\n"
        "  variation?: string | Record<string, string>;\n",
        1,
    )
write(review_path, review)

# Quantity controls cannot exceed the cart line's authoritative stock snapshot.
cart_page_path = "src/components/buyer/cart-page.tsx"
cart_page = read(cart_page_path)
cart_page = cart_page.replace(
    "                              onClick={() => updateQuantity(item.lineId, item.quantity + 1)}\n"
    "                            >",
    "                              onClick={() => updateQuantity(item.lineId, item.quantity + 1)}\n"
    "                              disabled={\n"
    "                                item.availableStock !== undefined &&\n"
    "                                item.quantity >= item.availableStock\n"
    "                              }\n"
    "                            >",
    1,
)
write(cart_page_path, cart_page)
write('scripts/verify-authoritative-checkout.ts', "import assert from 'node:assert/strict';\nimport { PrismaClient } from '@prisma/client';\nimport {\n  canonicalizeStoredVariant,\n  parseVariationOptions,\n  resolveTaxCountryCode,\n} from '../src/lib/checkout-authority.ts';\n\nconst db = new PrismaClient();\n\ntry {\n  const products = await db.product.findMany({\n    include: {\n      variants: {\n        where: { isActive: true },\n        orderBy: { position: 'asc' },\n      },\n    },\n  });\n\n  let variantProductCount = 0;\n  for (const product of products) {\n    const configuredOptions = parseVariationOptions(product.variations);\n    if (Object.keys(configuredOptions).length === 0) continue;\n\n    variantProductCount += 1;\n    assert.ok(\n      product.variants.length > 0,\n      `${product.id} has options but no active SKU rows`,\n    );\n\n    const attributes = new Set<string>();\n    let stock = 0;\n    let minimumPrice = Number.POSITIVE_INFINITY;\n    for (const variant of product.variants) {\n      const canonical = canonicalizeStoredVariant(variant.attributes);\n      assert.equal(\n        canonical,\n        variant.attributes,\n        `${variant.sku} attributes are not canonical`,\n      );\n      assert.ok(!attributes.has(canonical), `${product.id} has duplicate SKUs`);\n      attributes.add(canonical);\n      stock += variant.stock;\n      minimumPrice = Math.min(minimumPrice, Number(variant.price));\n    }\n\n    assert.equal(\n      stock,\n      product.stock,\n      `${product.id} parent stock does not equal active SKU stock`,\n    );\n    assert.equal(\n      minimumPrice,\n      Number(product.price),\n      `${product.id} card price is not the minimum active SKU price`,\n    );\n  }\n\n  assert.ok(variantProductCount > 0, 'Seed did not create variant products.');\n\n  const addresses = await db.address.findMany({\n    select: { id: true, country: true, countryCode: true },\n  });\n  for (const address of addresses) {\n    assert.equal(\n      address.countryCode,\n      resolveTaxCountryCode(address.country),\n      `${address.id} has a stale tax jurisdiction`,\n    );\n  }\n\n  console.log(\n    `Verified ${variantProductCount} variant products and ${addresses.length} normalized addresses.`,\n  );\n} finally {\n  await db.$disconnect();\n}\n")


# Keep the permanent clean-database check aware of SKU and jurisdiction caches.
ci_path = ".github/workflows/ci.yml"
ci = read(ci_path)
if "Verify authoritative checkout catalog" not in ci:
    ci = ci.replace(
        "      - name: Exercise existing-user password bootstrap\n",
        "      - name: Verify authoritative checkout catalog\n"
        "        run: node --experimental-strip-types scripts/verify-authoritative-checkout.ts\n\n"
        "      - name: Exercise existing-user password bootstrap\n",
        1,
    )
write(ci_path, ci)

readme_path = "README.md"
readme = read(readme_path)
if "## Authoritative checkout catalog" not in readme:
    marker = "## Project structure\n"
    section = '''## Authoritative checkout catalog

Products with selectable options use explicit `ProductVariant` rows. Every active
SKU owns its canonical option combination, SKU code, price, and inventory. The
parent product keeps only aggregate stock and the lowest active SKU price for
catalog cards.

Seller and administrator tools can read or replace a product's SKU inventory
through `/api/seller/product-variants`. Omitted existing rows are deactivated
rather than deleted so completed order lines retain their foreign-key history.

Checkout derives the tax jurisdiction from the validated address, calculates
shipping separately for every seller shipment, reserves variant and parent
inventory in one serializable transaction, and stores the selected SKU,
shipping method, tax country, price, and option snapshot on the order.

'''
    if marker not in readme:
        raise RuntimeError("Could not locate README project structure marker.")
    readme = readme.replace(marker, section + marker, 1)
write(readme_path, readme)

# Native Node tests require explicit local TypeScript extensions.
tax_path = "src/lib/tax.ts"
tax = read(tax_path)
tax = tax.replace("from './currency';", "from './currency.ts';")
write(tax_path, tax)

# Mini-cart keys are SKU/variation-safe.
header_path = "src/components/layout/header.tsx"
header = read(header_path)
header = header.replace("<div key={item.productId}", "<div key={item.lineId}")
write(header_path, header)

# The generated checkout data model keeps shipment/jurisdiction snapshots.
print("P0D authoritative checkout patch applied successfully.")
