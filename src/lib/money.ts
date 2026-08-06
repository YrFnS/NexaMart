export const BASE_CURRENCY = 'USD' as const;
export type BaseCurrency = typeof BASE_CURRENCY;

export const MONEY_SCALE = 2;
export const MONEY_FACTOR = 100;

export type MoneyLike =
  | number
  | string
  | { toString(): string }
  | null
  | undefined;

function decimalText(value: MoneyLike): string {
  if (value === null || value === undefined) return '0';
  const raw = typeof value === 'number' ? String(value) : value.toString();
  const trimmed = raw.trim();
  if (!trimmed) return '0';
  if (!/[eE]/.test(trimmed)) return trimmed;

  const numeric = Number(trimmed);
  if (!Number.isFinite(numeric)) {
    throw new RangeError('Money value must be finite.');
  }
  return numeric.toFixed(MONEY_SCALE + 6);
}

export function toCents(value: MoneyLike): number {
  const text = decimalText(value);
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(text);
  if (!match) throw new RangeError(`Invalid money value: ${text}`);

  const whole = Number(match[2]);
  if (!Number.isSafeInteger(whole)) {
    throw new RangeError('Money value exceeds the supported range.');
  }

  const fraction = (match[3] || '').padEnd(MONEY_SCALE + 1, '0');
  let cents =
    whole * MONEY_FACTOR + Number(fraction.slice(0, MONEY_SCALE) || '0');
  if (Number(fraction[MONEY_SCALE] || '0') >= 5) cents += 1;
  if (match[1] === '-') cents *= -1;

  if (!Number.isSafeInteger(cents)) {
    throw new RangeError('Money value exceeds the supported range.');
  }
  return cents;
}

export function centsToDecimal(cents: number): string {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError('Minor-unit value must be a safe integer.');
  }
  const sign = cents < 0 ? '-' : '';
  const absolute = Math.abs(cents);
  const whole = Math.floor(absolute / MONEY_FACTOR);
  const fraction = String(absolute % MONEY_FACTOR).padStart(MONEY_SCALE, '0');
  return `${sign}${whole}.${fraction}`;
}

export function fromCents(cents: number): number {
  return Number(centsToDecimal(cents));
}

export function moneyNumber(value: MoneyLike): number {
  return fromCents(toCents(value));
}

export function percentageToBasisPoints(value: MoneyLike): number {
  const basisPoints = toCents(value);
  if (basisPoints < 0 || basisPoints > 10_000) {
    throw new RangeError('Percentage must be between 0 and 100.');
  }
  return basisPoints;
}

export function assertBaseCurrency(value: unknown): BaseCurrency {
  const normalized = String(value || BASE_CURRENCY).trim().toUpperCase();
  if (normalized !== BASE_CURRENCY) {
    throw new RangeError(
      `Unsupported currency ${normalized}. This release uses ${BASE_CURRENCY}.`,
    );
  }
  return BASE_CURRENCY;
}
