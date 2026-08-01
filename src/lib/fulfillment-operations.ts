export const RETURN_DISPOSITIONS = [
  'restock',
  'quarantine',
  'discard',
] as const;

export const REPLACEMENT_SHIPMENT_STATUSES = [
  'preparing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type ReturnDisposition = (typeof RETURN_DISPOSITIONS)[number];
export type ReplacementShipmentStatus =
  (typeof REPLACEMENT_SHIPMENT_STATUSES)[number];

const REPLACEMENT_TRANSITIONS: Record<
  ReplacementShipmentStatus,
  readonly ReplacementShipmentStatus[]
> = {
  preparing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: ['preparing'],
};

export function returnAllowsDisposition(status: string): boolean {
  return ['approved', 'processing', 'completed'].includes(status);
}

export function returnAllowsReplacement(status: string): boolean {
  return ['approved', 'processing'].includes(status);
}

export function canSetReturnDisposition(
  status: string,
  currentDisposition: string | null | undefined,
): boolean {
  return returnAllowsDisposition(status) && !currentDisposition;
}

export function dispositionRestoresInventory(
  disposition: ReturnDisposition,
): boolean {
  return disposition === 'restock';
}

export function canTransitionReplacement(
  current: string,
  target: string,
): boolean {
  if (
    !REPLACEMENT_SHIPMENT_STATUSES.includes(
      current as ReplacementShipmentStatus,
    ) ||
    !REPLACEMENT_SHIPMENT_STATUSES.includes(
      target as ReplacementShipmentStatus,
    )
  ) {
    return false;
  }

  return REPLACEMENT_TRANSITIONS[
    current as ReplacementShipmentStatus
  ].includes(target as ReplacementShipmentStatus);
}

export function replacementRequiresTracking(
  status: ReplacementShipmentStatus,
): boolean {
  return status === 'shipped' || status === 'delivered';
}

export function replacementTransitionRestoresInventory(
  current: ReplacementShipmentStatus,
  target: ReplacementShipmentStatus,
): boolean {
  return current === 'preparing' && target === 'cancelled';
}

export function replacementTransitionReservesInventory(
  current: ReplacementShipmentStatus,
  target: ReplacementShipmentStatus,
): boolean {
  return current === 'cancelled' && target === 'preparing';
}
