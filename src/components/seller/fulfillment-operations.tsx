'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ClipboardList,
  FileText,
  Loader2,
  PackageCheck,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { formatPrice } from '@/lib/currency';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';

type ReturnDisposition = 'restock' | 'quarantine' | 'discard';
type ReplacementStatus = 'preparing' | 'shipped' | 'delivered' | 'cancelled';

interface FulfillmentOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  currency: string;
  shippingAddress: Record<string, string>;
  sellerFulfillmentNote: string;
  packingSlipGeneratedAt: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  store: {
    id: string;
    name: string;
    nameAr?: string | null;
  } | null;
  items: Array<{
    id: string;
    productId: string;
    variantId: string | null;
    name: string;
    nameAr?: string | null;
    sku: string | null;
    attributes: Record<string, string>;
    quantity: number;
  }>;
}

interface ReplacementShipment {
  id: string;
  status: ReplacementStatus;
  carrier: string;
  trackingNumber: string;
  notes: string;
  quantity: number;
  sku: string | null;
  inventoryReservedAt: string;
  inventoryRestoredAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FulfillmentReturn {
  id: string;
  orderId: string;
  orderItemId: string | null;
  orderNumber: string;
  storeId: string | null;
  storeName: string;
  productId: string;
  productName: string;
  productNameAr?: string | null;
  variantId: string | null;
  sku: string | null;
  attributes: Record<string, string>;
  quantity: number;
  status: string;
  resolution: string;
  buyerName: string;
  buyerEmail: string;
  inventoryDisposition: ReturnDisposition | null;
  inventoryDispositionAt: string | null;
  inventoryRestoredAt: string | null;
  createdAt: string;
  replacementShipment: ReplacementShipment | null;
}

interface WorkspacePayload {
  orders?: FulfillmentOrder[];
  returns?: FulfillmentReturn[];
  error?: string;
}

interface ReplacementDraft {
  carrier: string;
  trackingNumber: string;
  notes: string;
}

const DISPOSITION_LABELS: Record<
  ReturnDisposition,
  { en: string; ar: string }
> = {
  restock: { en: 'Restock as sellable', ar: 'إعادة إلى المخزون القابل للبيع' },
  quarantine: { en: 'Quarantine for inspection', ar: 'عزل للفحص' },
  discard: { en: 'Discard as damaged', ar: 'إتلاف كمنتج تالف' },
};

const REPLACEMENT_STYLE: Record<ReplacementStatus, string> = {
  preparing:
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  shipped:
    'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  delivered:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  cancelled:
    'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};

function attributesText(values: Record<string, string>): string {
  return Object.entries(values)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ');
}

function addressText(address: Record<string, string>): string {
  return [
    address.name || address.fullName,
    address.address1,
    address.address2,
    [address.city, address.state, address.postalCode].filter(Boolean).join(', '),
    address.country,
    address.phone,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function FulfillmentOperations() {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  const [orders, setOrders] = useState<FulfillmentOrder[]>([]);
  const [returns, setReturns] = useState<FulfillmentReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAction, setActiveAction] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [dispositions, setDispositions] = useState<
    Record<string, ReturnDisposition | ''>
  >({});
  const [replacementDrafts, setReplacementDrafts] = useState<
    Record<string, ReplacementDraft>
  >({});

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/seller/fulfillment', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const payload = (await response.json()) as WorkspacePayload;
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load fulfillment operations.');
      }

      const nextOrders = payload.orders || [];
      const nextReturns = payload.returns || [];
      setOrders(nextOrders);
      setReturns(nextReturns);
      setNotes(
        Object.fromEntries(
          nextOrders.map((order) => [order.id, order.sellerFulfillmentNote]),
        ),
      );
      setDispositions(
        Object.fromEntries(
          nextReturns.map((record) => [
            record.id,
            record.inventoryDisposition || '',
          ]),
        ),
      );
      setReplacementDrafts(
        Object.fromEntries(
          nextReturns.map((record) => [
            record.id,
            {
              carrier: record.replacementShipment?.carrier || '',
              trackingNumber:
                record.replacementShipment?.trackingNumber || '',
              notes: record.replacementShipment?.notes || '',
            },
          ]),
        ),
      );
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load fulfillment operations.';
      setError(message);
      setOrders([]);
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadWorkspace(), 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkspace]);

  async function runAction(
    key: string,
    body: Record<string, unknown>,
    successEn: string,
    successAr: string,
  ) {
    setActiveAction(key);
    setError('');
    try {
      const response = await fetch('/api/seller/fulfillment', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || 'The operation could not be completed.');
      }
      toast.success(isRTL ? successAr : successEn);
      await loadWorkspace();
    } catch (actionError) {
      const message =
        actionError instanceof Error
          ? actionError.message
          : 'The operation could not be completed.';
      setError(message);
      toast.error(message);
    } finally {
      setActiveAction('');
    }
  }

  function openDocument(
    order: FulfillmentOrder,
    type: 'order' | 'packing-slip',
  ) {
    const query = new URLSearchParams({
      type,
      lang: isRTL ? 'ar' : 'en',
      print: '1',
    });
    const opened = window.open(
      `/api/orders/${encodeURIComponent(order.id)}/document?${query.toString()}`,
      '_blank',
      'noopener,noreferrer',
    );
    if (!opened) {
      toast.error(
        isRTL
          ? 'تعذر فتح المستند. تحقق من حظر النوافذ المنبثقة.'
          : 'The document could not open. Check the popup blocker.',
      );
      return;
    }

    if (type === 'packing-slip') {
      void runAction(
        `packing-${order.id}`,
        { action: 'mark_packing_slip', orderId: order.id },
        'Packing slip opened.',
        'تم فتح قائمة التجهيز.',
      );
    }
  }

  const activeOrders = useMemo(
    () => orders.filter((order) => order.status !== 'delivered').length,
    [orders],
  );
  const waitingDisposition = useMemo(
    () => returns.filter((record) => !record.inventoryDisposition).length,
    [returns],
  );
  const openReplacements = useMemo(
    () =>
      returns.filter(
        (record) =>
          record.replacementShipment &&
          !['delivered', 'cancelled'].includes(
            record.replacementShipment.status,
          ),
      ).length,
    [returns],
  );

  const date = (value: string | null) => {
    if (!value) return '—';
    return new Date(value).toLocaleString(getLocale(isRTL), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && orders.length === 0 && returns.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <section
      className="space-y-5 border-t border-border/70 p-4 pt-8 md:p-6 md:pt-10"
      dir={isRTL ? 'rtl' : 'ltr'}
      aria-labelledby="fulfillment-workspace-title"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2
            id="fulfillment-workspace-title"
            className="flex items-center gap-2 text-xl font-bold"
          >
            <PackageCheck className="size-5 text-amber-600" />
            {isRTL ? 'مساحة عمليات التجهيز والاستبدال' : 'Fulfillment & exchange workspace'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRTL
              ? 'ملاحظات داخلية، مستندات قابلة للطباعة، معالجة المرتجعات، وشحن البدائل بمخزون SKU فعلي.'
              : 'Private notes, printable documents, returned-item disposition, and exact-SKU replacement shipments.'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void loadWorkspace()}
          disabled={loading || Boolean(activeAction)}
        >
          <RefreshCw className={`me-2 size-4 ${loading ? 'animate-spin' : ''}`} />
          {isRTL ? 'تحديث العمليات' : 'Refresh operations'}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'طلبات قيد التجهيز' : 'Orders in fulfillment'}
            </p>
            <p className="mt-1 text-2xl font-bold">{activeOrders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'مرتجعات تنتظر قرار المخزون' : 'Returns awaiting disposition'}
            </p>
            <p className="mt-1 text-2xl font-bold">{waitingDisposition}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'شحنات بديلة مفتوحة' : 'Open replacement shipments'}
            </p>
            <p className="mt-1 text-2xl font-bold">{openReplacements}</p>
          </CardContent>
        </Card>
      </div>

      {error && (
        <div
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <ShieldCheck className="me-2 inline size-4" />
        {isRTL
          ? 'ملاحظات التجهيز خاصة بالبائع ولا تظهر للمشتري. فتح قائمة التجهيز يسجل وقت إنشاء المستند فقط، وليس تأكيداً بأن الطباعة تمت.'
          : 'Fulfillment notes are seller-private. Opening a packing slip records document generation, not a claim that physical printing succeeded.'}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4 text-amber-600" />
            {isRTL ? 'مستندات الطلب وملاحظات التجهيز' : 'Order documents & private fulfillment notes'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              {isRTL ? 'لا توجد طلبات تشغيلية حالياً.' : 'No operational orders are available.'}
            </div>
          ) : (
            orders.map((order) => (
              <article key={order.id} className="space-y-4 rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.customer.name} · {order.customer.email} · {date(order.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{order.status}</Badge>
                    <span className="font-semibold">{formatPrice(order.total)}</span>
                  </div>
                </div>

                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      {isRTL ? 'عنوان الشحن' : 'Shipping address'}
                    </p>
                    <p className="mt-1">{addressText(order.shippingAddress) || '—'}</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      {isRTL ? 'عناصر التجهيز' : 'Items to fulfill'}
                    </p>
                    <div className="mt-1 space-y-1">
                      {order.items.map((item) => (
                        <p key={item.id}>
                          {item.quantity} ×{' '}
                          {isRTL && item.nameAr ? item.nameAr : item.name}
                          {item.sku ? ` · SKU ${item.sku}` : ''}
                          {attributesText(item.attributes)
                            ? ` · ${attributesText(item.attributes)}`
                            : ''}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`fulfillment-note-${order.id}`}>
                    {isRTL ? 'ملاحظة تجهيز خاصة' : 'Private fulfillment note'}
                  </Label>
                  <Textarea
                    id={`fulfillment-note-${order.id}`}
                    rows={3}
                    value={notes[order.id] || ''}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [order.id]: event.target.value,
                      }))
                    }
                    placeholder={
                      isRTL
                        ? 'مثال: فحص التغليف وإضافة ملحق معين. لا تظهر للمشتري.'
                        : 'Example: inspect packaging and include a specific accessory. Hidden from the buyer.'
                    }
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openDocument(order, 'packing-slip')}
                    disabled={Boolean(activeAction)}
                  >
                    {activeAction === `packing-${order.id}` ? (
                      <Loader2 className="me-2 size-4 animate-spin" />
                    ) : (
                      <Printer className="me-2 size-4" />
                    )}
                    {isRTL ? 'فتح قائمة التجهيز' : 'Open packing slip'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openDocument(order, 'order')}
                    disabled={Boolean(activeAction)}
                  >
                    <FileText className="me-2 size-4" />
                    {isRTL ? 'فتح مستند الطلب' : 'Open order document'}
                  </Button>
                  <Button
                    className="bg-amber-600 text-white hover:bg-amber-700"
                    disabled={Boolean(activeAction)}
                    onClick={() =>
                      void runAction(
                        `note-${order.id}`,
                        {
                          action: 'save_order_note',
                          orderId: order.id,
                          note: notes[order.id] || '',
                        },
                        'Private fulfillment note saved.',
                        'تم حفظ ملاحظة التجهيز الخاصة.',
                      )
                    }
                  >
                    {activeAction === `note-${order.id}` ? (
                      <Loader2 className="me-2 size-4 animate-spin" />
                    ) : (
                      <Save className="me-2 size-4" />
                    )}
                    {isRTL ? 'حفظ الملاحظة' : 'Save note'}
                  </Button>
                </div>
                {order.packingSlipGeneratedAt && (
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'آخر إنشاء لقائمة التجهيز' : 'Packing slip last generated'}:{' '}
                    {date(order.packingSlipGeneratedAt)}
                  </p>
                )}
              </article>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <RotateCcw className="size-4 text-amber-600" />
            {isRTL ? 'استلام المرتجعات وشحن البدائل' : 'Returned-item intake & replacement shipments'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {returns.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              {isRTL ? 'لا توجد مرتجعات جاهزة للمعالجة.' : 'No approved returns are ready for operations.'}
            </div>
          ) : (
            returns.map((record) => {
              const draft = replacementDrafts[record.id] || {
                carrier: '',
                trackingNumber: '',
                notes: '',
              };
              const replacement = record.replacementShipment;
              const selectedDisposition = dispositions[record.id] || '';
              const productName =
                isRTL && record.productNameAr
                  ? record.productNameAr
                  : record.productName;

              return (
                <article key={record.id} className="space-y-4 rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {record.orderNumber} · {record.buyerName} · {date(record.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{record.status}</Badge>
                      <Badge variant="outline">{record.resolution.replaceAll('_', ' ')}</Badge>
                      {record.sku && <Badge variant="outline">SKU {record.sku}</Badge>}
                    </div>
                  </div>

                  <div className="text-sm">
                    <span>{isRTL ? 'الكمية' : 'Quantity'}: {record.quantity}</span>
                    {attributesText(record.attributes) && (
                      <span> · {attributesText(record.attributes)}</span>
                    )}
                  </div>

                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <div className="space-y-2">
                      <Label htmlFor={`disposition-${record.id}`}>
                        {isRTL ? 'قرار حالة المخزون' : 'Inventory disposition'}
                      </Label>
                      <Select
                        value={selectedDisposition}
                        disabled={Boolean(record.inventoryDisposition)}
                        onValueChange={(value) =>
                          setDispositions((current) => ({
                            ...current,
                            [record.id]: value as ReturnDisposition,
                          }))
                        }
                      >
                        <SelectTrigger id={`disposition-${record.id}`}>
                          <SelectValue
                            placeholder={
                              isRTL ? 'اختر حالة المنتج المرتجع' : 'Choose returned-item condition'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(DISPOSITION_LABELS) as ReturnDisposition[]).map(
                            (value) => (
                              <SelectItem key={value} value={value}>
                                {isRTL
                                  ? DISPOSITION_LABELS[value].ar
                                  : DISPOSITION_LABELS[value].en}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      variant="outline"
                      disabled={
                        Boolean(record.inventoryDisposition) ||
                        !selectedDisposition ||
                        Boolean(activeAction)
                      }
                      onClick={() =>
                        void runAction(
                          `disposition-${record.id}`,
                          {
                            action: 'set_return_disposition',
                            returnId: record.id,
                            disposition: selectedDisposition,
                          },
                          'Returned-item disposition recorded.',
                          'تم تسجيل حالة المنتج المرتجع.',
                        )
                      }
                    >
                      {activeAction === `disposition-${record.id}` ? (
                        <Loader2 className="me-2 size-4 animate-spin" />
                      ) : (
                        <PackageCheck className="me-2 size-4" />
                      )}
                      {record.inventoryDisposition
                        ? isRTL
                          ? 'تم التسجيل'
                          : 'Recorded'
                        : isRTL
                          ? 'تسجيل الحالة'
                          : 'Record disposition'}
                    </Button>
                  </div>

                  {record.inventoryDisposition && (
                    <div className="rounded-lg bg-muted/40 p-3 text-sm">
                      <strong>
                        {isRTL
                          ? DISPOSITION_LABELS[record.inventoryDisposition].ar
                          : DISPOSITION_LABELS[record.inventoryDisposition].en}
                      </strong>
                      <span className="text-muted-foreground">
                        {' '}· {date(record.inventoryDispositionAt)}
                        {record.inventoryRestoredAt
                          ? isRTL
                            ? ' · تمت إعادة الكمية إلى المخزون مرة واحدة.'
                            : ' · Quantity was restored to stock exactly once.'
                          : ''}
                      </span>
                    </div>
                  )}

                  {record.resolution === 'exchange' && (
                    <>
                      <Separator />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold">
                            {isRTL ? 'شحنة المنتج البديل' : 'Replacement shipment'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isRTL
                              ? 'إنشاء الشحنة يحجز نفس المنتج وSKU والكمية من المخزون.'
                              : 'Creating the shipment reserves the same product, SKU, and quantity.'}
                          </p>
                        </div>
                        {replacement && (
                          <Badge className={REPLACEMENT_STYLE[replacement.status]}>
                            {replacement.status}
                          </Badge>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`carrier-${record.id}`}>
                            {isRTL ? 'شركة الشحن' : 'Carrier'}
                          </Label>
                          <Input
                            id={`carrier-${record.id}`}
                            value={draft.carrier}
                            disabled={
                              Boolean(replacement) && replacement.status !== 'preparing'
                            }
                            onChange={(event) =>
                              setReplacementDrafts((current) => ({
                                ...current,
                                [record.id]: {
                                  ...draft,
                                  carrier: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`tracking-${record.id}`}>
                            {isRTL ? 'رقم التتبع' : 'Tracking number'}
                          </Label>
                          <Input
                            id={`tracking-${record.id}`}
                            value={draft.trackingNumber}
                            disabled={
                              Boolean(replacement) && replacement.status !== 'preparing'
                            }
                            onChange={(event) =>
                              setReplacementDrafts((current) => ({
                                ...current,
                                [record.id]: {
                                  ...draft,
                                  trackingNumber: event.target.value,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`replacement-notes-${record.id}`}>
                          {isRTL ? 'ملاحظات الشحنة' : 'Shipment notes'}
                        </Label>
                        <Textarea
                          id={`replacement-notes-${record.id}`}
                          rows={2}
                          value={draft.notes}
                          disabled={
                            Boolean(replacement) && replacement.status !== 'preparing'
                          }
                          onChange={(event) =>
                            setReplacementDrafts((current) => ({
                              ...current,
                              [record.id]: {
                                ...draft,
                                notes: event.target.value,
                              },
                            }))
                          }
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {(!replacement || replacement.status === 'preparing') && (
                          <Button
                            variant="outline"
                            disabled={Boolean(activeAction)}
                            onClick={() =>
                              void runAction(
                                `replacement-save-${record.id}`,
                                {
                                  action: 'upsert_replacement',
                                  returnId: record.id,
                                  carrier: draft.carrier || undefined,
                                  trackingNumber:
                                    draft.trackingNumber || undefined,
                                  notes: draft.notes || undefined,
                                },
                                replacement
                                  ? 'Replacement shipment details saved.'
                                  : 'Exact replacement inventory reserved.',
                                replacement
                                  ? 'تم حفظ تفاصيل شحنة البديل.'
                                  : 'تم حجز مخزون المنتج البديل المحدد.',
                              )
                            }
                          >
                            {activeAction === `replacement-save-${record.id}` ? (
                              <Loader2 className="me-2 size-4 animate-spin" />
                            ) : (
                              <Save className="me-2 size-4" />
                            )}
                            {replacement
                              ? isRTL
                                ? 'حفظ تفاصيل الشحنة'
                                : 'Save shipment details'
                              : isRTL
                                ? 'حجز وإنشاء البديل'
                                : 'Reserve & create replacement'}
                          </Button>
                        )}

                        {replacement?.status === 'preparing' && (
                          <>
                            <Button
                              className="bg-amber-600 text-white hover:bg-amber-700"
                              disabled={
                                Boolean(activeAction) ||
                                !record.inventoryDisposition ||
                                !draft.carrier.trim() ||
                                !draft.trackingNumber.trim()
                              }
                              onClick={() =>
                                void runAction(
                                  `replacement-ship-${record.id}`,
                                  {
                                    action: 'transition_replacement',
                                    shipmentId: replacement.id,
                                    targetStatus: 'shipped',
                                    carrier: draft.carrier,
                                    trackingNumber: draft.trackingNumber,
                                    notes: draft.notes || undefined,
                                  },
                                  'Replacement marked as shipped.',
                                  'تم تحديد البديل كمشحون.',
                                )
                              }
                            >
                              {activeAction === `replacement-ship-${record.id}` ? (
                                <Loader2 className="me-2 size-4 animate-spin" />
                              ) : (
                                <Truck className="me-2 size-4" />
                              )}
                              {isRTL ? 'شحن البديل' : 'Ship replacement'}
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={Boolean(activeAction)}
                              onClick={() =>
                                void runAction(
                                  `replacement-cancel-${record.id}`,
                                  {
                                    action: 'transition_replacement',
                                    shipmentId: replacement.id,
                                    targetStatus: 'cancelled',
                                    notes: draft.notes || undefined,
                                  },
                                  'Replacement cancelled and reserved stock restored.',
                                  'تم إلغاء البديل وإعادة المخزون المحجوز.',
                                )
                              }
                            >
                              {isRTL ? 'إلغاء البديل' : 'Cancel replacement'}
                            </Button>
                          </>
                        )}

                        {replacement?.status === 'shipped' && (
                          <Button
                            className="bg-amber-600 text-white hover:bg-amber-700"
                            disabled={Boolean(activeAction)}
                            onClick={() =>
                              void runAction(
                                `replacement-deliver-${record.id}`,
                                {
                                  action: 'transition_replacement',
                                  shipmentId: replacement.id,
                                  targetStatus: 'delivered',
                                },
                                'Replacement delivered and exchange completed.',
                                'تم تسليم البديل وإكمال الاستبدال.',
                              )
                            }
                          >
                            {activeAction === `replacement-deliver-${record.id}` ? (
                              <Loader2 className="me-2 size-4 animate-spin" />
                            ) : (
                              <PackageCheck className="me-2 size-4" />
                            )}
                            {isRTL ? 'تأكيد تسليم البديل' : 'Confirm replacement delivery'}
                          </Button>
                        )}

                        {replacement?.status === 'cancelled' && (
                          <Button
                            className="bg-amber-600 text-white hover:bg-amber-700"
                            disabled={Boolean(activeAction)}
                            onClick={() =>
                              void runAction(
                                `replacement-rereserve-${record.id}`,
                                {
                                  action: 'transition_replacement',
                                  shipmentId: replacement.id,
                                  targetStatus: 'preparing',
                                  carrier: draft.carrier || undefined,
                                  trackingNumber:
                                    draft.trackingNumber || undefined,
                                  notes: draft.notes || undefined,
                                },
                                'Replacement inventory reserved again.',
                                'تم حجز مخزون البديل مرة أخرى.',
                              )
                            }
                          >
                            <RotateCcw className="me-2 size-4" />
                            {isRTL ? 'إعادة حجز البديل' : 'Reserve replacement again'}
                          </Button>
                        )}
                      </div>

                      {replacement && (
                        <div className="grid gap-2 rounded-lg bg-muted/40 p-3 text-xs sm:grid-cols-2">
                          <p>
                            <strong>{isRTL ? 'SKU البديل' : 'Replacement SKU'}:</strong>{' '}
                            {replacement.sku || '—'}
                          </p>
                          <p>
                            <strong>{isRTL ? 'الكمية' : 'Quantity'}:</strong>{' '}
                            {replacement.quantity}
                          </p>
                          <p>
                            <strong>{isRTL ? 'حُجز في' : 'Reserved'}:</strong>{' '}
                            {date(replacement.inventoryReservedAt)}
                          </p>
                          <p>
                            <strong>{isRTL ? 'التتبع' : 'Tracking'}:</strong>{' '}
                            {replacement.trackingNumber || '—'}
                          </p>
                          {replacement.shippedAt && (
                            <p>
                              <strong>{isRTL ? 'شُحن في' : 'Shipped'}:</strong>{' '}
                              {date(replacement.shippedAt)}
                            </p>
                          )}
                          {replacement.deliveredAt && (
                            <p>
                              <strong>{isRTL ? 'سُلّم في' : 'Delivered'}:</strong>{' '}
                              {date(replacement.deliveredAt)}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </article>
              );
            })
          )}
        </CardContent>
      </Card>
    </section>
  );
}
