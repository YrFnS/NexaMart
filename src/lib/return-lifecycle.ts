export const RETURN_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'processing',
  'completed',
] as const;

export const RETURN_RESOLUTIONS = [
  'return_only',
  'exchange',
  'offline_refund',
] as const;

export const OFFLINE_REFUND_STATUSES = [
  'not_required',
  'required',
  'confirmed',
] as const;

export type ReturnStatus = (typeof RETURN_STATUSES)[number];
export type ReturnResolution = (typeof RETURN_RESOLUTIONS)[number];
export type OfflineRefundStatus = (typeof OFFLINE_REFUND_STATUSES)[number];
export type ReturnActorRole = 'seller' | 'admin';

const TRANSITIONS: Record<
  ReturnStatus,
  Partial<Record<ReturnActorRole, readonly ReturnStatus[]>>
> = {
  pending: {
    seller: ['approved', 'rejected'],
    admin: ['approved', 'rejected'],
  },
  approved: {
    seller: ['processing'],
    admin: ['processing'],
  },
  rejected: {},
  processing: {
    seller: ['completed'],
    admin: ['completed'],
  },
  completed: {},
};

export function normalizeReturnStatus(value: string): ReturnStatus | null {
  return RETURN_STATUSES.includes(value as ReturnStatus)
    ? (value as ReturnStatus)
    : null;
}

export function canTransitionReturn(
  current: string,
  target: string,
  actorRole: ReturnActorRole,
): boolean {
  const normalized = normalizeReturnStatus(current);
  if (!normalized) return false;
  return (TRANSITIONS[normalized][actorRole] || []).includes(
    target as ReturnStatus,
  );
}

export function resolutionRequiresOfflineRefund(
  resolution: string,
): boolean {
  return resolution === 'offline_refund';
}

export function canCompleteReturn(
  resolution: string,
  offlineRefundStatus: string,
): boolean {
  return (
    !resolutionRequiresOfflineRefund(resolution) ||
    offlineRefundStatus === 'confirmed'
  );
}
