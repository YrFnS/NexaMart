'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
import { Textarea } from '@/components/ui/textarea';
import { formatPrice } from '@/lib/currency';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';

type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';

type TimelineEntry = { status: string; date: string; note?: string };

interface ReturnRecord {
  id: string;
  orderNumber: string;
  productName: string;
  productNameAr?: string | null;
  sku: string | null;
  attributes: Record<string, string>;
  quantity: number;
  referenceAmount: number;
  reasonLabel: string;
  details: string;
  status: ReturnStatus;
  resolution: 'return_only' | 'exchange' | 'offline_refund';
  resolutionLabel: string;
  offlineRefundStatus: 'not_required' | 'required' | 'confirmed';
  buyerName: string;
  sellerNote?: string;
  createdAt: string;
  timeline: TimelineEntry[];
}

const STATUS_STYLE: Record<ReturnStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  approved: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  processing: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
};

function Attributes({ values }: { values: Record<string, string> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(values).map(([key, value]) => (
        <Badge key={key} variant="outline" className="text-[10px]">
          {key}: {value}
        </Badge>
      ))}
    </div>
  );
}

export function SellerReturns() {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sellerNote, setSellerNote] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

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

  useEffect(() => {
    const timer = window.setTimeout(() => void loadReturns(), 0);
    return () => window.clearTimeout(timer);
  }, [loadReturns]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return returns;
    return returns.filter((record) =>
      [record.orderNumber, record.productName, record.buyerName, record.sku || '']
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [returns, search]);

  async function updateReturn(
    record: ReturnRecord,
    update: {
      targetStatus?: 'approved' | 'rejected' | 'processing' | 'completed';
      offlineRefundStatus?: 'confirmed';
    },
  ) {
    setSavingId(record.id);
    try {
      const response = await fetch('/api/returns', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnId: record.id,
          ...update,
          sellerNote: sellerNote || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to update return.');
      setReturns((current) =>
        current.map((item) => (item.id === record.id ? payload.return : item)),
      );
      setSellerNote('');
      toast.success(isRTL ? 'تم تحديث طلب الإرجاع.' : 'Return request updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update return.');
    } finally {
      setSavingId(null);
    }
  }

  const date = (value: string) =>
    new Date(value).toLocaleDateString(getLocale(isRTL), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  return (
    <div className="space-y-5 p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold">
          <RotateCcw className="size-5 text-amber-600" />
          {isRTL ? 'إدارة الإرجاعات والاستبدالات' : 'Returns & exchanges'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRTL
            ? 'طلبات حقيقية مرتبطة بعنصر الطلب وSKU المحدد.'
            : 'Real requests tied to the exact purchased order item and SKU.'}
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={isRTL ? 'بحث بالطلب أو المشتري أو SKU' : 'Search order, buyer, or SKU'}
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
        <div className="flex h-56 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-amber-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          <Package className="mx-auto mb-3 size-10 opacity-40" />
          {isRTL ? 'لا توجد طلبات إرجاع.' : 'No return requests found.'}
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((record) => {
            const expanded = expandedId === record.id;
            const busy = savingId === record.id;
            const needsRefundConfirmation =
              record.resolution === 'offline_refund' &&
              record.offlineRefundStatus !== 'confirmed';
            return (
              <Card key={record.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {isRTL && record.productNameAr ? record.productNameAr : record.productName}
                      </CardTitle>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {record.orderNumber} · {record.buyerName} · {date(record.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_STYLE[record.status]}>{record.status}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setExpandedId(expanded ? null : record.id);
                          setSellerNote(record.sellerNote || '');
                        }}
                      >
                        {expanded ? (isRTL ? 'إغلاق' : 'Close') : (isRTL ? 'مراجعة' : 'Review')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {record.sku && <Badge variant="outline">SKU: {record.sku}</Badge>}
                    <Badge variant="outline">{record.resolutionLabel}</Badge>
                    <span>{isRTL ? 'الكمية' : 'Qty'}: {record.quantity}</span>
                    <span className="font-semibold">{formatPrice(record.referenceAmount)}</span>
                  </div>
                  <Attributes values={record.attributes} />

                  {expanded && (
                    <div className="space-y-4 border-t pt-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground">{isRTL ? 'السبب' : 'Reason'}</p>
                          <p className="font-medium">{record.reasonLabel}</p>
                          {record.details && <p className="mt-1 text-sm text-muted-foreground">{record.details}</p>}
                        </div>
                        <div className="rounded-lg bg-muted/40 p-3">
                          <p className="text-xs text-muted-foreground">
                            {isRTL ? 'حالة الاسترداد خارج المنصة' : 'Offline refund status'}
                          </p>
                          <p className="font-medium">{record.offlineRefundStatus.replaceAll('_', ' ')}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>{isRTL ? 'ملاحظة للبائع' : 'Seller note'}</Label>
                        <Textarea
                          rows={3}
                          value={sellerNote}
                          onChange={(event) => setSellerNote(event.target.value)}
                          placeholder={isRTL ? 'أضف تعليمات أو سبب القرار' : 'Add instructions or decision reason'}
                        />
                      </div>

                      {record.resolution === 'offline_refund' && (
                        <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                          <Banknote className="mt-0.5 size-4 shrink-0" />
                          {isRTL
                            ? 'أكّد الاسترداد فقط بعد إتمامه فعلياً خارج NexaMart.'
                            : 'Confirm the refund only after it was actually completed outside NexaMart.'}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {record.status === 'pending' && (
                          <>
                            <Button
                              onClick={() => void updateReturn(record, { targetStatus: 'approved' })}
                              disabled={busy}
                              className="bg-emerald-600 text-white hover:bg-emerald-700"
                            >
                              {busy ? <Loader2 className="me-2 size-4 animate-spin" /> : <CheckCircle2 className="me-2 size-4" />}
                              {isRTL ? 'قبول' : 'Approve'}
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => void updateReturn(record, { targetStatus: 'rejected' })}
                              disabled={busy}
                            >
                              <XCircle className="me-2 size-4" />
                              {isRTL ? 'رفض' : 'Reject'}
                            </Button>
                          </>
                        )}
                        {record.status === 'approved' && (
                          <Button
                            onClick={() => void updateReturn(record, { targetStatus: 'processing' })}
                            disabled={busy}
                            className="bg-amber-600 text-white hover:bg-amber-700"
                          >
                            {busy ? <Loader2 className="me-2 size-4 animate-spin" /> : <Clock className="me-2 size-4" />}
                            {isRTL ? 'بدء المعالجة' : 'Start processing'}
                          </Button>
                        )}
                        {record.status === 'processing' && record.resolution === 'offline_refund' && needsRefundConfirmation && (
                          <Button
                            variant="outline"
                            onClick={() => void updateReturn(record, { offlineRefundStatus: 'confirmed' })}
                            disabled={busy}
                          >
                            <Banknote className="me-2 size-4" />
                            {isRTL ? 'تأكيد الاسترداد خارج المنصة' : 'Confirm offline refund'}
                          </Button>
                        )}
                        {record.status === 'processing' && (
                          <Button
                            onClick={() => void updateReturn(record, { targetStatus: 'completed' })}
                            disabled={busy || needsRefundConfirmation}
                            className="bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            {busy ? <Loader2 className="me-2 size-4 animate-spin" /> : <CheckCircle2 className="me-2 size-4" />}
                            {isRTL ? 'إكمال الطلب' : 'Complete request'}
                          </Button>
                        )}
                      </div>

                      {record.timeline.length > 0 && (
                        <div className="space-y-2 border-t pt-3">
                          {record.timeline.map((entry, index) => (
                            <div key={`${entry.date}-${index}`} className="flex gap-2 text-sm">
                              <CheckCircle2 className="mt-0.5 size-4 text-emerald-500" />
                              <div>
                                <p className="font-medium">{entry.status}</p>
                                <p className="text-xs text-muted-foreground">{date(entry.date)}</p>
                                {entry.note && <p className="text-xs text-muted-foreground">{entry.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
