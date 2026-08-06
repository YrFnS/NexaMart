export const ORDER_STATUS_VALUES = [
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

export type OrderStatusValue = (typeof ORDER_STATUS_VALUES)[number];

export interface OrderAddressDto {
  id?: string;
  name?: string;
  fullName?: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  countryCode?: string;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  variantId?: string | null;
  sku?: string | null;
  name: string;
  nameAr?: string | null;
  productName: string;
  image: string;
  quantity: number;
  price: number;
  total: number;
  variation?: string | null;
  attributes?: Record<string, unknown>;
}

export interface OrderStatusEventDto {
  id: string;
  fromStatus?: string | null;
  status: string;
  toStatus: string;
  actorRole: string;
  note?: string | null;
  date: string;
  completed: boolean;
}

export interface LifecycleOrderDto {
  id: string;
  orderNumber: string;
  status: OrderStatusValue;
  subtotal: number;
  shipping: number;
  shippingCost: number;
  discount: number;
  tax: number;
  total: number;
  orderMethod: 'cash_on_delivery';
  shippingAddress: OrderAddressDto;
  trackingNumber?: string | null;
  carrier?: string | null;
  notes?: string | null;
  confirmationExpiresAt?: string | null;
  confirmedAt?: string | null;
  preparingAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  rejectedAt?: string | null;
  cancellationReason?: string | null;
  inventoryRestoredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name?: string | null;
    email: string;
    phone?: string | null;
  };
  customerName: string;
  customerEmail: string;
  store?: {
    id: string;
    name: string;
    nameAr?: string | null;
    ownerId: string;
  } | null;
  storeId: string;
  storeName: string;
  itemCount: number;
  items: OrderItemDto[];
  statusEvents: OrderStatusEventDto[];
  timeline: OrderStatusEventDto[];
  allowedTransitions: OrderStatusValue[];
  canCancel: boolean;
}

const EN_STATUS: Record<OrderStatusValue, string> = {
  pending: 'Waiting for seller',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  processing: 'Preparing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
  returned: 'Returned',
};

const AR_STATUS: Record<OrderStatusValue, string> = {
  pending: 'بانتظار البائع',
  confirmed: 'تم التأكيد',
  preparing: 'قيد التجهيز',
  processing: 'قيد التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التسليم',
  rejected: 'مرفوض',
  cancelled: 'ملغي',
  disputed: 'قيد النزاع',
  returned: 'مرتجع',
};

const EN_TRANSITION: Partial<Record<OrderStatusValue, string>> = {
  confirmed: 'Confirm order',
  preparing: 'Start preparing',
  shipped: 'Mark shipped',
  delivered: 'Mark delivered',
  rejected: 'Reject order',
  cancelled: 'Cancel order',
};

const AR_TRANSITION: Partial<Record<OrderStatusValue, string>> = {
  confirmed: 'تأكيد الطلب',
  preparing: 'بدء التجهيز',
  shipped: 'تحديد كمشحون',
  delivered: 'تحديد كمسلّم',
  rejected: 'رفض الطلب',
  cancelled: 'إلغاء الطلب',
};

export function statusLabel(status: string, isRTL = false): string {
  if (!ORDER_STATUS_VALUES.includes(status as OrderStatusValue)) return status;
  return (isRTL ? AR_STATUS : EN_STATUS)[status as OrderStatusValue];
}

export function transitionLabel(status: string, isRTL = false): string {
  if (!ORDER_STATUS_VALUES.includes(status as OrderStatusValue)) return status;
  const labels = isRTL ? AR_TRANSITION : EN_TRANSITION;
  return labels[status as OrderStatusValue] || statusLabel(status, isRTL);
}

export function statusBadgeClass(status: string): string {
  const classes: Partial<Record<OrderStatusValue, string>> = {
    pending:
      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    confirmed:
      'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
    preparing:
      'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    processing:
      'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    shipped:
      'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
    delivered:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    rejected:
      'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
    cancelled:
      'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    disputed:
      'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
    returned:
      'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300',
  };
  return (
    classes[status as OrderStatusValue] ||
    'bg-muted text-muted-foreground'
  );
}

export function formatOrderDate(
  value: string | null | undefined,
  isRTL = false,
  withTime = false,
): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(isRTL ? 'ar-IQ' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date);
}

export function formatOrderAttributes(
  attributes: Record<string, unknown> | undefined,
  variation?: string | null,
): string {
  let values = attributes || {};
  if (Object.keys(values).length === 0 && variation) {
    try {
      const parsed = JSON.parse(variation) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        values = parsed as Record<string, unknown>;
      }
    } catch {
      return variation;
    }
  }
  return Object.entries(values)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(' · ');
}

export function addressLines(address: OrderAddressDto): string[] {
  const name = address.name || address.fullName;
  const locality = [address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(', ');
  return [
    name,
    address.address1,
    address.address2,
    locality,
    address.country,
    address.phone,
  ].filter((value): value is string => Boolean(value?.trim()));
}
