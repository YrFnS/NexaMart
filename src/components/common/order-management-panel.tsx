'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Truck,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { adminFetch } from '@/lib/admin-api';
import { formatPrice } from '@/lib/currency';
import { useI18n } from '@/lib/i18n';
import {
  addressLines,
  formatOrderAttributes,
  formatOrderDate,
  type LifecycleOrderDto,
  ORDER_STATUS_VALUES,
  type OrderStatusValue,
  statusBadgeClass,
  statusLabel,
  transitionLabel,
} from '@/lib/order-client';

interface OrderManagementPanelProps {
  mode: 'seller' | 'admin';
}

function statusIcon(status: string) {
  if (status === 'delivered') return CheckCircle2;
  if (status === 'shipped') return Truck;
  if (status === 'cancelled' || status === 'rejected') return XCircle;
  if (status === 'pending') return Clock3;
  return Package;
}

function transitionTone(status: string) {
  if (status === 'rejected' || status === 'cancelled') {
    return 'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950';
  }
  if (status === 'delivered') {
    return 'bg-emerald-600 text-white hover:bg-emerald-700';
  }
  return 'bg-amber-600 text-white hover:bg-amber-700';
}

export function OrderManagementPanel({ mode }: OrderManagementPanelProps) {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  const [orders, setOrders] = useState<LifecycleOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<LifecycleOrderDto | null>(
    null,
  );
  const [targetStatus, setTargetStatus] = useState<OrderStatusValue | null>(
    null,
  );
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const endpoint = mode === 'admin' ? '/api/admin/orders' : '/api/seller/orders';

  const request = useCallback(
    (url: string, options?: RequestInit) =>
      mode === 'admin'
        ? adminFetch(url, options)
        : fetch(url, {
            ...options,
            credentials: 'same-origin',
          }),
    [mode],
  );

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await request(`${endpoint}?limit=100`, {
        cache: 'no-store',
      });
      const payload = (await response.json()) as {
        orders?: LifecycleOrderDto[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load orders.');
      }
      setOrders(payload.orders || []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load orders.',
      );
    } finally {
      setLoading(false);
    }
  }, [endpoint, request]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrders();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter;
      const matchesQuery =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerEmail.toLowerCase().includes(query) ||
        order.items.some(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.sku?.toLowerCase().includes(query),
        );
      return matchesStatus && matchesQuery;
    });
  }, [orders, search, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    for (const order of orders) {
      counts[order.status] = (counts[order.status] || 0) + 1;
    }
    return counts;
  }, [orders]);

  function openOrder(order: LifecycleOrderDto) {
    setSelectedOrder(order);
    setTargetStatus(null);
    setCarrier(order.carrier || '');
    setTrackingNumber(order.trackingNumber || '');
    setNote('');
    setError('');
  }

  function beginTransition(status: OrderStatusValue) {
    setTargetStatus(status);
    setNote('');
    if (status !== 'shipped') {
      setCarrier(selectedOrder?.carrier || '');
      setTrackingNumber(selectedOrder?.trackingNumber || '');
    }
  }

  async function submitTransition() {
    if (!selectedOrder || !targetStatus) return;
    setSaving(true);
    setError('');
    try {
      const response = await request(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          targetStatus,
          carrier: targetStatus === 'shipped' ? carrier : undefined,
          trackingNumber:
            targetStatus === 'shipped' ? trackingNumber : undefined,
          note: note || undefined,
        }),
      });
      const payload = (await response.json()) as {
        order?: LifecycleOrderDto;
        error?: string;
      };
      if (!response.ok || !payload.order) {
        throw new Error(payload.error || 'The order could not be updated.');
      }
      const updated = payload.order;
      setOrders((current) =>
        current.map((order) => (order.id === updated.id ? updated : order)),
      );
      setSelectedOrder(updated);
      setTargetStatus(null);
      setNote('');
    } catch (transitionError) {
      setError(
        transitionError instanceof Error
          ? transitionError.message
          : 'The order could not be updated.',
      );
    } finally {
      setSaving(false);
    }
  }

  const title =
    mode === 'admin'
      ? isRTL
        ? 'إدارة طلبات المنصة'
        : 'Platform order management'
      : isRTL
        ? 'طلبات المتجر'
        : 'Store orders';
  const subtitle =
    mode === 'admin'
      ? isRTL
        ? 'مراقبة دورة الطلب بدون معالجة أي مدفوعات.'
        : 'Monitor the paymentless order lifecycle across stores.'
      : isRTL
        ? 'أكّد الطلبات وجهّزها واشحنها وفق التسلسل المعتمد.'
        : 'Confirm, prepare, and ship orders through the controlled lifecycle.';

  if (loading && orders.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button variant="outline" onClick={() => void loadOrders()} disabled={loading}>
          <RefreshCw className={`me-2 size-4 ${loading ? 'animate-spin' : ''}`} />
          {isRTL ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        {isRTL
          ? 'NexaMart لا يعالج الدفعات. جميع الطلبات في هذا الإصدار هي دفع عند الاستلام.'
          : 'NexaMart does not process payments. Every order in this release is cash on delivery.'}
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

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['all', isRTL ? 'الكل' : 'All'],
          ['pending', statusLabel('pending', isRTL)],
          ['preparing', statusLabel('preparing', isRTL)],
          ['shipped', statusLabel('shipped', isRTL)],
        ].map(([key, label]) => (
          <Card key={key}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-2xl font-bold">{statusCounts[key] || 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                isRTL
                  ? 'بحث برقم الطلب أو العميل أو SKU'
                  : 'Search order, customer, product, or SKU'
              }
              className="ps-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? 'كل الحالات' : 'All statuses'}</SelectItem>
              {ORDER_STATUS_VALUES.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabel(status, isRTL)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? 'الطلب' : 'Order'}</TableHead>
                  <TableHead>{isRTL ? 'العميل' : 'Customer'}</TableHead>
                  <TableHead>{isRTL ? 'العناصر' : 'Items'}</TableHead>
                  <TableHead>{isRTL ? 'الإجمالي' : 'Total'}</TableHead>
                  <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                  <TableHead>{isRTL ? 'التاريخ' : 'Date'}</TableHead>
                  <TableHead className="text-end">
                    {isRTL ? 'التفاصيل' : 'Details'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                      <Package className="mx-auto mb-2 size-8 opacity-40" />
                      {isRTL ? 'لا توجد طلبات مطابقة.' : 'No matching orders.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const StatusIcon = statusIcon(order.status);
                    return (
                      <TableRow key={order.id}>
                        <TableCell>
                          <p className="font-mono text-xs font-semibold">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.storeName}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                        </TableCell>
                        <TableCell>{order.itemCount}</TableCell>
                        <TableCell className="font-semibold">
                          {formatPrice(order.total)}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusBadgeClass(order.status)} border-0`}>
                            <StatusIcon className="me-1 size-3" />
                            {statusLabel(order.status, isRTL)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatOrderDate(order.createdAt, isRTL)}
                        </TableCell>
                        <TableCell className="text-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={isRTL ? 'عرض الطلب' : 'View order'}
                            onClick={() => openOrder(order)}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
            setTargetStatus(null);
          }
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  <span>{selectedOrder.orderNumber}</span>
                  <Badge className={`${statusBadgeClass(selectedOrder.status)} border-0`}>
                    {statusLabel(selectedOrder.status, isRTL)}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedOrder.customerName} ·{' '}
                  {formatOrderDate(selectedOrder.createdAt, isRTL, true)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      {isRTL ? 'العناصر ووحدات SKU' : 'Items and SKUs'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                        <div className="min-w-0">
                          <p className="font-medium">{isRTL && item.nameAr ? item.nameAr : item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.sku ? `SKU: ${item.sku}` : isRTL ? 'منتج بسيط' : 'Simple product'}
                          </p>
                          {formatOrderAttributes(item.attributes, item.variation) && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {formatOrderAttributes(item.attributes, item.variation)}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 text-end text-sm">
                          <p>{item.quantity} × {formatPrice(item.price)}</p>
                          <p className="font-semibold">{formatPrice(item.total)}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {isRTL ? 'عنوان التوصيل' : 'Delivery address'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm">
                      {addressLines(selectedOrder.shippingAddress).map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {isRTL ? 'ملخص الطلب' : 'Order summary'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>{isRTL ? 'المجموع الفرعي' : 'Subtotal'}</span>
                        <span>{formatPrice(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{isRTL ? 'الشحن' : 'Shipping'}</span>
                        <span>{formatPrice(selectedOrder.shippingCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{isRTL ? 'الخصم' : 'Discount'}</span>
                        <span>-{formatPrice(selectedOrder.discount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{isRTL ? 'الضريبة' : 'Tax'}</span>
                        <span>{formatPrice(selectedOrder.tax)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between font-bold">
                        <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
                        <span>{formatPrice(selectedOrder.total)}</span>
                      </div>
                      <p className="pt-1 text-xs text-muted-foreground">
                        {isRTL
                          ? 'الدفع عند الاستلام — لا توجد دفعة داخل التطبيق.'
                          : 'Cash on delivery — no payment is processed in the app.'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {(selectedOrder.carrier || selectedOrder.trackingNumber) && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Truck className="size-4" />
                        {isRTL ? 'بيانات الشحن' : 'Shipping details'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
                      <p>{isRTL ? 'الناقل' : 'Carrier'}: {selectedOrder.carrier || '—'}</p>
                      <p>{isRTL ? 'رقم التتبع' : 'Tracking'}: {selectedOrder.trackingNumber || '—'}</p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      {isRTL ? 'سجل الحالة' : 'Status history'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedOrder.timeline.map((event) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="mt-1 size-2 shrink-0 rounded-full bg-amber-500" />
                        <div>
                          <p className="text-sm font-medium">
                            {statusLabel(event.toStatus, isRTL)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatOrderDate(event.date, isRTL, true)}
                            {event.note ? ` · ${event.note}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {selectedOrder.allowedTransitions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">
                        {isRTL ? 'الإجراء التالي' : 'Next action'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedOrder.allowedTransitions.map((status) => (
                          <Button
                            key={status}
                            type="button"
                            variant={status === 'cancelled' || status === 'rejected' ? 'outline' : 'default'}
                            className={transitionTone(status)}
                            onClick={() => beginTransition(status)}
                          >
                            {transitionLabel(status, isRTL)}
                          </Button>
                        ))}
                      </div>

                      {targetStatus && (
                        <div className="space-y-4 rounded-xl border p-4">
                          <div>
                            <p className="font-semibold">
                              {transitionLabel(targetStatus, isRTL)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {isRTL
                                ? 'سيتم تسجيل هذا التغيير في سجل الطلب.'
                                : 'This transition will be recorded in the order history.'}
                            </p>
                          </div>

                          {targetStatus === 'shipped' && (
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>{isRTL ? 'شركة الشحن' : 'Carrier'}</Label>
                                <Input value={carrier} onChange={(event) => setCarrier(event.target.value)} />
                              </div>
                              <div className="space-y-2">
                                <Label>{isRTL ? 'رقم التتبع' : 'Tracking number'}</Label>
                                <Input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} />
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label>{isRTL ? 'ملاحظة' : 'Note'}</Label>
                            <Textarea
                              value={note}
                              onChange={(event) => setNote(event.target.value)}
                              placeholder={
                                targetStatus === 'rejected' || targetStatus === 'cancelled'
                                  ? isRTL
                                    ? 'اكتب سبب الرفض أو الإلغاء'
                                    : 'Add the rejection or cancellation reason'
                                  : isRTL
                                    ? 'ملاحظة اختيارية'
                                    : 'Optional note'
                              }
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => setTargetStatus(null)}>
                              {isRTL ? 'تراجع' : 'Back'}
                            </Button>
                            <Button
                              className={transitionTone(targetStatus)}
                              onClick={() => void submitTransition()}
                              disabled={
                                saving ||
                                (targetStatus === 'shipped' &&
                                  (!carrier.trim() || !trackingNumber.trim()))
                              }
                            >
                              {saving && <Loader2 className="me-2 size-4 animate-spin" />}
                              {transitionLabel(targetStatus, isRTL)}
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
