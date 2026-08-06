export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'processing',
  'shipped',
  'delivered',
  'rejected',
  'cancelled',
  'disputed',
  'returned',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type OrderActorRole = 'buyer' | 'seller' | 'admin' | 'system';

const TRANSITIONS: Record<
  OrderStatus,
  Partial<Record<OrderActorRole, readonly OrderStatus[]>>
> = {
  pending: {
    buyer: ['cancelled'],
    seller: ['confirmed', 'rejected'],
    admin: ['confirmed', 'rejected', 'cancelled'],
    system: ['cancelled'],
  },
  confirmed: {
    seller: ['preparing', 'cancelled'],
    admin: ['preparing', 'cancelled'],
  },
  preparing: {
    seller: ['shipped', 'cancelled'],
    admin: ['shipped', 'cancelled'],
  },
  processing: {
    seller: ['shipped', 'cancelled'],
    admin: ['shipped', 'cancelled'],
  },
  shipped: {
    seller: ['delivered'],
    admin: ['delivered'],
  },
  delivered: {},
  rejected: {},
  cancelled: {},
  disputed: {},
  returned: {},
};

export function normalizeOrderStatus(value: string): OrderStatus | null {
  return ORDER_STATUSES.includes(value as OrderStatus)
    ? (value as OrderStatus)
    : null;
}

export function allowedOrderTransitions(
  status: string,
  actorRole: OrderActorRole,
): readonly OrderStatus[] {
  const normalized = normalizeOrderStatus(status);
  if (!normalized) return [];
  return TRANSITIONS[normalized][actorRole] || [];
}

export function canTransitionOrder(
  status: string,
  targetStatus: string,
  actorRole: OrderActorRole,
): boolean {
  return allowedOrderTransitions(status, actorRole).includes(
    targetStatus as OrderStatus,
  );
}

export function transitionRestoresInventory(targetStatus: string): boolean {
  return targetStatus === 'cancelled' || targetStatus === 'rejected';
}

export function transitionRequiresTracking(targetStatus: string): boolean {
  return targetStatus === 'shipped';
}

export function confirmationTtlHours(
  rawValue = process.env.ORDER_CONFIRMATION_TTL_HOURS,
): number {
  const parsed = Number.parseInt(rawValue || '', 10);
  if (!Number.isFinite(parsed)) return 24;
  return Math.min(168, Math.max(1, parsed));
}

export function confirmationDeadline(
  now = new Date(),
  hours = confirmationTtlHours(),
): Date {
  return new Date(now.getTime() + hours * 60 * 60 * 1000);
}
