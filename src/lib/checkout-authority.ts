import { SHIPPING_CONFIG } from './config.ts';
import { COUNTRY_TAX_RATES, isTaxExempt } from './tax.ts';

export type ShippingMethod = 'standard' | 'express' | 'next_day';
export type VariationSelection = string | Record<string, string> | null | undefined;

export interface ShippingLineInput {
  hasFreeShipping: boolean;
}

export interface TaxLineInput {
  lineTotalCents: number;
  categoryId?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
}

export interface ValidatedVariation {
  attributes: Record<string, string>;
  canonical: string | null;
}

export class VariationValidationError extends Error {}

export const toCents = (value: number): number =>
  Math.round((value + Number.EPSILON) * 100);

export const fromCents = (value: number): number => value / 100;

export function allocateCents(total: number, weights: number[]): number[] {
  if (weights.length === 0) return [];

  const safeTotal = Math.max(0, Math.floor(total));
  const safeWeights = weights.map((value) =>
    Number.isFinite(value) && value > 0 ? Math.floor(value) : 0,
  );
  const weightTotal = safeWeights.reduce((sum, value) => sum + value, 0);
  if (weightTotal <= 0) return safeWeights.map(() => 0);

  const allocations = safeWeights.map((weight) =>
    Math.floor((safeTotal * weight) / weightTotal),
  );
  let remainder =
    safeTotal - allocations.reduce((sum, value) => sum + value, 0);

  for (
    let index = 0;
    remainder > 0;
    index = (index + 1) % allocations.length
  ) {
    allocations[index] += 1;
    remainder -= 1;
  }

  return allocations;
}

function normalizeCountryAlias(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, '');
}

const COUNTRY_ALIASES = (() => {
  const aliases = new Map<string, string>();

  for (const [countryCode, info] of Object.entries(COUNTRY_TAX_RATES)) {
    aliases.set(normalizeCountryAlias(countryCode), countryCode);
    aliases.set(normalizeCountryAlias(info.countryName), countryCode);
    aliases.set(normalizeCountryAlias(info.countryNameAr), countryCode);
  }

  const commonAliases: Record<string, string> = {
    uae: 'ae',
    unitedarabemirates: 'ae',
    emirates: 'ae',
    ksa: 'sa',
    saudi: 'sa',
    saudiarabia: 'sa',
    kingdomofsaudiarabia: 'sa',
    iraq: 'iq',
    jordan: 'jo',
    palestinianterritories: 'ps',
    palestine: 'ps',
  };

  for (const [alias, countryCode] of Object.entries(commonAliases)) {
    aliases.set(normalizeCountryAlias(alias), countryCode);
  }

  return aliases;
})();

export function resolveTaxCountryCode(value: string): string | null {
  const normalized = normalizeCountryAlias(value);
  if (!normalized) return null;
  return COUNTRY_ALIASES.get(normalized) || null;
}

export function parseVariationOptions(
  value: string | null | undefined,
): Record<string, string[]> {
  if (!value) return {};

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    const options: Record<string, string[]> = {};
    for (const [rawKey, rawValues] of Object.entries(parsed)) {
      const key = rawKey.trim();
      if (!key || !Array.isArray(rawValues)) continue;

      const values = [
        ...new Set(
          rawValues
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ];
      if (values.length > 0) options[key] = values;
    }
    return options;
  } catch {
    return {};
  }
}

function parseVariationSelection(
  selection: VariationSelection,
  optionKeys: string[],
): Record<string, string> | null {
  if (!selection) return null;

  if (typeof selection === 'object') {
    return Object.fromEntries(
      Object.entries(selection).map(([key, value]) => [
        key.trim(),
        String(value).trim(),
      ]),
    );
  }

  const trimmed = selection.trim();
  if (!trimmed) return null;

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [
          key.trim(),
          String(value).trim(),
        ]),
      );
    }
  } catch {
    // A legacy plain-string selection is supported only for one-dimensional
    // products, where its meaning is unambiguous.
  }

  if (optionKeys.length === 1) {
    return { [optionKeys[0]]: trimmed };
  }

  return null;
}

export function canonicalizeVariation(
  attributes: Record<string, string>,
): string {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(attributes)
        .map(([key, value]) => [key.trim(), value.trim()] as const)
        .filter(([key, value]) => Boolean(key && value))
        .sort(([left], [right]) => left.localeCompare(right)),
    ),
  );
}

export function validateVariationSelection(
  rawOptions: string | null | undefined,
  selection: VariationSelection,
): ValidatedVariation {
  const options = parseVariationOptions(rawOptions);
  const optionKeys = Object.keys(options).sort();
  const attributes = parseVariationSelection(selection, optionKeys);

  if (optionKeys.length === 0) {
    if (attributes && Object.keys(attributes).length > 0) {
      throw new VariationValidationError(
        'This product does not accept variation selections.',
      );
    }
    return { attributes: {}, canonical: null };
  }

  if (!attributes) {
    throw new VariationValidationError(
      'Please select every required product option.',
    );
  }

  const selectedKeys = Object.keys(attributes).sort();
  if (
    selectedKeys.length !== optionKeys.length ||
    selectedKeys.some((key, index) => key !== optionKeys[index])
  ) {
    throw new VariationValidationError(
      'The selected product options are incomplete or invalid.',
    );
  }

  for (const key of optionKeys) {
    if (!options[key].includes(attributes[key])) {
      throw new VariationValidationError(
        `The selected ${key} option is no longer available.`,
      );
    }
  }

  const ordered = Object.fromEntries(
    optionKeys.map((key) => [key, attributes[key]]),
  );
  return {
    attributes: ordered,
    canonical: canonicalizeVariation(ordered),
  };
}

export function calculateStoreShippingCents(
  method: ShippingMethod,
  subtotalCents: number,
  lines: ShippingLineInput[],
): number {
  if (method === 'express') {
    return toCents(SHIPPING_CONFIG.methods.express.price);
  }
  if (method === 'next_day') {
    return toCents(SHIPPING_CONFIG.methods.nextDay.price);
  }

  const qualifiesBySubtotal =
    subtotalCents >= toCents(SHIPPING_CONFIG.freeShippingThreshold);
  const everyLineShipsFree =
    lines.length > 0 && lines.every((line) => line.hasFreeShipping);

  return qualifiesBySubtotal || everyLineShipsFree
    ? 0
    : toCents(SHIPPING_CONFIG.defaultShippingRate);
}

function lineIsTaxExempt(countryCode: string, line: TaxLineInput): boolean {
  const candidates = [line.categorySlug, line.categoryId, line.categoryName]
    .filter((value): value is string => Boolean(value?.trim()))
    .map((value) => value.trim());

  return candidates.some((candidate) => isTaxExempt(countryCode, candidate));
}

export function calculateStoreTaxCents(
  countryCode: string,
  lines: TaxLineInput[],
  storeDiscountCents: number,
): number {
  const taxInfo = COUNTRY_TAX_RATES[countryCode];
  if (!taxInfo || taxInfo.vatRate <= 0 || lines.length === 0) return 0;

  const lineDiscounts = allocateCents(
    storeDiscountCents,
    lines.map((line) => line.lineTotalCents),
  );

  return lines.reduce((total, line, index) => {
    if (lineIsTaxExempt(countryCode, line)) return total;
    const taxableCents = Math.max(
      0,
      line.lineTotalCents - lineDiscounts[index],
    );
    return total + Math.round((taxableCents * taxInfo.vatRate) / 100);
  }, 0);
}
