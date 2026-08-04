import { canonicalizeVariation } from './checkout-authority.ts';

export interface VariantShape {
  attributes: Record<string, string>;
  isActive?: boolean;
}

export class ProductVariantError extends Error {}

export function normalizeVariantAttributes(
  value: Record<string, string>,
): Record<string, string> {
  const normalized = Object.fromEntries(
    Object.entries(value)
      .map(([key, option]) => [key.trim(), String(option).trim()] as const)
      .filter(([key, option]) => Boolean(key && option))
      .sort(([left], [right]) => left.localeCompare(right)),
  );

  if (Object.keys(normalized).length === 0) {
    throw new ProductVariantError('Every variant needs at least one option.');
  }
  return normalized;
}

export function variantOptionKey(value: Record<string, string>): string {
  return canonicalizeVariation(normalizeVariantAttributes(value));
}

export function parseVariantAttributes(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return normalizeVariantAttributes(
      Object.fromEntries(
        Object.entries(parsed).map(([key, option]) => [key, String(option)]),
      ),
    );
  } catch {
    return {};
  }
}

export function buildVariationDefinition(variants: VariantShape[]): string {
  const options = new Map<string, Set<string>>();

  for (const variant of variants) {
    if (variant.isActive === false) continue;
    const attributes = normalizeVariantAttributes(variant.attributes);
    for (const [key, option] of Object.entries(attributes)) {
      const values = options.get(key) || new Set<string>();
      values.add(option);
      options.set(key, values);
    }
  }

  return JSON.stringify(
    Object.fromEntries(
      [...options.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, values]) => [key, [...values].sort()]),
    ),
  );
}

export function variantLabel(value: Record<string, string>): string {
  return Object.entries(normalizeVariantAttributes(value))
    .map(([key, option]) => `${key}: ${option}`)
    .join(' · ');
}
