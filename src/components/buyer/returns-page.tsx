'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  Banknote,
  CheckCircle2,
  Clock,
  Loader2,
  Package,
  RotateCcw,
  Search,
  XCircle,
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

type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
type ReturnResolution = 'return_only' | 'exchange' | 'offline_refund';

type TimelineEntry = { status: string; date: string; note?: string };

interface ReturnRecord {
  id: string;
  orderNumber: string;
  orderItemId: string | null;
  productName: string;
  productNameAr?: string | null;
  sku: string | null;
  attributes: Record<string, string>;
  quantity: number;
  unitPrice: number;
  referenceAmount: number;
  reasonLabel: string;
  details: string;
  status: ReturnStatus;
  resolution: ReturnResolution;
  resolutionLabel: string;
  offlineRefundStatus: 'not_required' | 'required' | 'confirmed';
  sellerName: string;
  sellerNote?: string;
  createdAt: string;
  timeline: TimelineEntry[];
}

interface EligibleItem {
  orderItemId: string;
  productId: string;
  variantId: string | null;
  sku: string | null;
  attributes: Record<string, string>;
  name: string;
  nameAr?: string | null;
  unitPrice: number;
  quantityPurchased: number;
  alreadyRequested: number;
  remainingQuantity: number;
}

interface EligibleOrder {
  id: string;
  orderNumber: string;
  storeName: string;
  deliveredAt: string;
  items: EligibleItem[];
}

const STATUS_STYLE: Record<ReturnStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
};

const REASONS = [
  ['wrong_item', 'Wrong item', 'منتج خاطئ'],
  ['defective', 'Defective', 'معيب'],
  ['not_as_described', 'Not as described', 'غير مطابق للوصف'],
  ['changed_mind', 'Changed mind', 'تغيير الرأي'],
  ['damaged_shipping', 'Damaged in shipping', 'تالف أثناء الشحن'],
  ['other', 'Other', 'أخرى'],
] as const;

const RESOLUTIONS = [
  ['return_only', 'Return only', 'إرجاع فقط'],
  ['exchange', 'Exchange', 'استبدال'],
  ['offline_refund', 'Offline refund', 'استرداد خارج المنصة'],
] as const;

function Attributes({ values }: { values: Record<string, string> }) {
  const entries = Object.entries(values);
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([key, value]) => (
        <Badge key={key} variant="outline" className="text-[10px]">
          {key}: {value}
        </Badge>
      ))}
    </div>
  );
}

export function ReturnsPage() {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  const [view, setView] = useState<'history' | 'request'>('history');
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [eligibleOrders, setEligibleOrders] = useState<EligibleOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [eligibleLoading, setEligibleLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [orderItemId, setOrderItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [resolution, setResolution] = useState<ReturnResolution>('return_only');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReturns = useCallback(async () => {
    setLoading(true);
    try {
      const query = statusFilter === 'all' ? '' : `?status=${statusFilter}`;
      const response = await fetch(`/api/returns${query}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to load returns.');
      setReturns(payload.returns || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load returns.');
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadEligible = useCallback(async () => {
    setEligibleLoading(true);
    try {
      const response = await fetch('/api/returns?action=eligible-orders', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to load eligible items.');
      setEligibleOrders(payload.orders || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load eligible items.');
      setEligibleOrders([]);
    } finally {
      setEligibleLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReturns(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReturns]);

  useEffect(() => {
    if (view !== 'request') return;
    const timer = window.setTimeout(() => void loadEligible(), 0);
    return () => window.clearTimeout(timer);
  }, [loadEligible, view]);

  const selectedItem = (() => {
    for (const order of eligibleOrders) {
      const item = order.items.find((current) => current.orderItemId === orderItemId);
      if (item) return { order, item };
    }
    return null;
  })();

  const filteredReturns = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return returns;
    return returns.filter((record) =>
      [record.orderNumber, record.productName, record.sellerName, record.sku || '']
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [returns, search]);

  async function submitReturn() {
    if (!selectedItem || !reason) {
      toast.error(isRTL ? 'اختر عنصر الطلب والسبب.' : 'Choose an order item and reason.');
      return;
    }
    if (quantity < 1 || quantity > selectedItem.item.remainingQuantity) {
      toast.error(isRTL ? 'الكمية غير صالحة.' : 'The return quantity is invalid.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/returns', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderItemId: selectedItem.item.orderItemId,
          quantity,
          reason,
          resolution,
          details: details || undefined,
          evidencePhotos: [],
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to submit return.');
      toast.success(isRTL ? 'تم إرسال طلب الإرجاع.' : 'Return request submitted.');
      setOrderItemId('');
      setQuantity(1);
      setReason('');
      setResolution('return_only');
      setDetails('');
      setView('history');
      await loadReturns();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit return.');
    } finally {
      setSubmitting(false);
    }
  }

  const date = (value: string) =>
    new Date(value).toLocaleDateString(getLocale(isRTL), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="container mx-auto space-y-5 px-4 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <RotateCcw className="size-6 text-amber-600" />
            {isRTL ? 'الإرجاعات والاستبدالات' : 'Returns & exchanges'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRTL
              ? 'كل طلب مرتبط بعنصر وSKU محدد من الطلب الأصلي.'
              : 'Every request is tied to one exact order line and SKU.'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={view === 'history' ? 'default' : 'outline'}
            className={view === 'history' ? 'bg-amber-600 text-white hover:bg-amber-700' : ''}
            onClick={() => setView('history')}
          >
            <Clock className="me-2 size-4" />
            {isRTL ? 'طلباتي' : 'My requests'}
          </Button>
          <Button
            variant={view === 'request' ? 'default' : 'outline'}
            className={view === 'request' ? 'bg-amber-600 text-white hover:bg-amber-700' : ''}
            onClick={() => setView('request')}
          >
            <RotateCcw className="me-2 size-4" />
            {isRTL ? 'طلب جديد' : 'New request'}
          </Button>
        </div>
      </div>

      {view === 'history' ? (
        <>
          <Card>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={isRTL ? 'بحث بالطلب أو المنتج أو SKU' : 'Search order, product, or SKU'}
                  className="ps-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? 'كل الحالات' : 'All statuses'}</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex h-52 items-center justify-center">
              <Loader2 className="size-8 animate-spin text-amber-600" />
            </div>
          ) : filteredReturns.length === 0 ? (
            <Card><CardContent className="py-16 text-center text-muted-foreground">
              <Package className="mx-auto mb-3 size-10 opacity-40" />
              {isRTL ? 'لا توجد طلبات إرجاع.' : 'No return requests found.'}
            </CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filteredReturns.map((record) => (
                <Card key={record.id}>
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">
                          {isRTL && record.productNameAr ? record.productNameAr : record.productName}
                        </CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {record.orderNumber} · {record.sellerName} · {date(record.createdAt)}
                        </p>
                      </div>
                      <Badge className={STATUS_STYLE[record.status]}>{record.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      {record.sku && <Badge variant="outline">SKU: {record.sku}</Badge>}
                      <Badge variant="outline">{record.resolutionLabel}</Badge>
                      <span>{isRTL ? 'الكمية' : 'Qty'}: {record.quantity}</span>
                    </div>
                    <Attributes values={record.attributes} />
                    <div className="grid gap-3 rounded-xl bg-muted/40 p-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {isRTL ? 'المبلغ المرجعي' : 'Reference amount'}
                        </p>
                        <p className="font-semibold">{formatPrice(record.referenceAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {isRTL ? 'حالة الاسترداد خارج المنصة' : 'Offline refund status'}
                        </p>
                        <p className="font-medium">{record.offlineRefundStatus.replaceAll('_', ' ')}</p>
                      </div>
                    </div>
                    {record.resolution === 'offline_refund' && (
                      <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                        <Banknote className="mt-0.5 size-4 shrink-0" />
                        {isRTL
                          ? 'لا ينقل NexaMart الأموال. يؤكد البائع هنا فقط أن الاسترداد تم خارج المنصة.'
                          : 'NexaMart does not move money. The seller only records here when the refund was completed outside the platform.'}
                      </div>
                    )}
                    {record.sellerNote && (
                      <p className="rounded-lg border p-3 text-sm">{record.sellerNote}</p>
                    )}
                    {record.timeline.length > 0 && (
                      <div className="space-y-2 border-t pt-3">
                        {record.timeline.map((entry, index) => (
                          <div key={`${entry.date}-${index}`} className="flex gap-2 text-sm">
                            {record.status === 'rejected' && index === record.timeline.length - 1
                              ? <XCircle className="mt-0.5 size-4 text-red-500" />
                              : <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" />}
                            <div>
                              <p className="font-medium">{entry.status}</p>
                              <p className="text-xs text-muted-foreground">{date(entry.date)}</p>
                              {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? 'طلب إرجاع لعنصر محدد' : 'Request an exact order item return'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {eligibleLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="size-7 animate-spin text-amber-600" />
              </div>
            ) : eligibleOrders.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                {isRTL ? 'لا توجد عناصر مسلّمة قابلة للإرجاع.' : 'No delivered items are currently returnable.'}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>{isRTL ? 'عنصر الطلب' : 'Order item'}</Label>
                  <Select
                    value={orderItemId}
                    onValueChange={(value) => {
                      setOrderItemId(value);
                      setQuantity(1);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر عنصراً' : 'Select an item'} /></SelectTrigger>
                    <SelectContent>
                      {eligibleOrders.flatMap((order) =>
                        order.items.map((item) => (
                          <SelectItem key={item.orderItemId} value={item.orderItemId}>
                            {order.orderNumber} · {isRTL && item.nameAr ? item.nameAr : item.name}
                            {item.sku ? ` · ${item.sku}` : ''} · {item.remainingQuantity} left
                          </SelectItem>
                        )),
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {selectedItem && (
                  <div className="space-y-3 rounded-xl border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          {isRTL && selectedItem.item.nameAr
                            ? selectedItem.item.nameAr
                            : selectedItem.item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedItem.order.orderNumber} · {selectedItem.order.storeName}
                        </p>
                      </div>
                      {selectedItem.item.sku && (
                        <Badge variant="outline">SKU: {selectedItem.item.sku}</Badge>
                      )}
                    </div>
                    <Attributes values={selectedItem.item.attributes} />
                    <p className="text-sm">
                      {isRTL ? 'المتاح للإرجاع' : 'Remaining returnable'}:{' '}
                      <strong>{selectedItem.item.remainingQuantity}</strong>
                    </p>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{isRTL ? 'الكمية' : 'Quantity'}</Label>
                    <Input
                      type="number"
                      min={1}
                      max={selectedItem?.item.remainingQuantity || 1}
                      value={quantity}
                      onChange={(event) => setQuantity(Number(event.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRTL ? 'السبب' : 'Reason'}</Label>
                    <Select value={reason} onValueChange={setReason}>
                      <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر السبب' : 'Select reason'} /></SelectTrigger>
                      <SelectContent>
                        {REASONS.map(([value, en, ar]) => (
                          <SelectItem key={value} value={value}>{isRTL ? ar : en}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{isRTL ? 'الحل المطلوب' : 'Requested resolution'}</Label>
                  <Select value={resolution} onValueChange={(value) => setResolution(value as ReturnResolution)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {RESOLUTIONS.map(([value, en, ar]) => (
                        <SelectItem key={value} value={value}>{isRTL ? ar : en}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{isRTL ? 'تفاصيل إضافية' : 'Additional details'}</Label>
                  <Textarea rows={4} value={details} onChange={(event) => setDetails(event.target.value)} />
                </div>

                {selectedItem && (
                  <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {resolution === 'offline_refund'
                          ? (isRTL ? 'مبلغ الاسترداد المرجعي' : 'Reference offline-refund amount')
                          : (isRTL ? 'قيمة العنصر المرجعية' : 'Reference item value')}
                      </p>
                      <p className="text-lg font-bold">
                        {formatPrice(selectedItem.item.unitPrice * quantity)}
                      </p>
                    </div>
                    <Button
                      onClick={() => void submitReturn()}
                      disabled={submitting || !reason || !orderItemId}
                      className="bg-amber-600 text-white hover:bg-amber-700"
                    >
                      {submitting ? <Loader2 className="me-2 size-4 animate-spin" /> : <ArrowRightLeft className="me-2 size-4" />}
                      {isRTL ? 'إرسال الطلب' : 'Submit request'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
