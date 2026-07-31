from __future__ import annotations

import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(textwrap.dedent(content).lstrip().rstrip() + "\n", encoding="utf-8")


write(
    "src/lib/order-client.ts",
    r'''
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
    ''',
)

write(
    "src/components/common/order-management-panel.tsx",
    r'''
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
    ''',
)

write(
    "src/components/seller/order-management.tsx",
    r'''
    'use client';

    import { OrderManagementPanel } from '@/components/common/order-management-panel';

    export function OrderManagement() {
      return <OrderManagementPanel mode="seller" />;
    }
    ''',
)

write(
    "src/components/admin/order-management.tsx",
    r'''
    'use client';

    import { OrderManagementPanel } from '@/components/common/order-management-panel';

    export function OrderManagement() {
      return <OrderManagementPanel mode="admin" />;
    }
    ''',
)

write(
    "src/app/api/admin/orders/route.ts",
    r'''
    import { Prisma } from '@prisma/client';
    import { NextResponse } from 'next/server';
    import { z } from 'zod';
    import { db } from '@/lib/db';
    import { normalizeOrderStatus } from '@/lib/order-lifecycle';
    import {
      applyOrderTransition,
      lifecycleOrderInclude,
      OrderLifecycleError,
      serializeLifecycleOrder,
    } from '@/lib/order-lifecycle-server';
    import {
      checkApiRateLimit,
      getAdminActorId,
      RATE_LIMITS,
      validateAdminRequest,
      validatePagination,
      validateSearchParam,
    } from '@/lib/security';

    const transitionTargets = [
      'confirmed',
      'preparing',
      'shipped',
      'delivered',
      'rejected',
      'cancelled',
    ] as const;

    const transitionSchema = z
      .object({
        orderId: z.string().min(1).max(64),
        targetStatus: z.enum(transitionTargets),
        carrier: z.string().trim().max(120).optional(),
        trackingNumber: z.string().trim().max(160).optional(),
        note: z.string().trim().max(500).optional(),
      })
      .strict();

    export async function GET(request: Request) {
      const denied = validateAdminRequest(request);
      if (denied) return denied;
      const rateLimit = checkApiRateLimit(request, RATE_LIMITS.admin);
      if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

      try {
        const { searchParams } = new URL(request.url);
        const search = validateSearchParam(searchParams.get('search') || '', 180);
        const statusRaw = searchParams.get('status');
        const status = statusRaw ? normalizeOrderStatus(statusRaw) : null;
        if (statusRaw && !status) {
          return NextResponse.json({ error: 'Invalid order status.' }, { status: 400 });
        }
        const { page, limit } = validatePagination(
          searchParams.get('page'),
          searchParams.get('limit'),
          100,
        );
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const createdAt: Prisma.DateTimeFilter | undefined =
          startDate || endDate
            ? {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(`${endDate}T23:59:59.999Z`) } : {}),
              }
            : undefined;
        const where: Prisma.OrderWhereInput = {
          ...(status ? { status } : {}),
          ...(createdAt ? { createdAt } : {}),
          ...(search
            ? {
                OR: [
                  { orderNumber: { contains: search, mode: 'insensitive' } },
                  { user: { name: { contains: search, mode: 'insensitive' } } },
                  { user: { email: { contains: search, mode: 'insensitive' } } },
                  { store: { name: { contains: search, mode: 'insensitive' } } },
                  { items: { some: { variant: { sku: { contains: search, mode: 'insensitive' } } } } },
                ],
              }
            : {}),
        };

        const [orders, total] = await db.$transaction([
          db.order.findMany({
            where,
            include: lifecycleOrderInclude,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: limit,
          }),
          db.order.count({ where }),
        ]);

        return NextResponse.json({
          orders: orders.map((order) => serializeLifecycleOrder(order, 'admin')),
          total,
          page,
          limit,
        });
      } catch (error) {
        console.error('Admin orders GET error:', error);
        return NextResponse.json({ error: 'Failed to load platform orders.' }, { status: 500 });
      }
    }

    export async function PUT(request: Request) {
      const denied = validateAdminRequest(request);
      if (denied) return denied;
      const rateLimit = checkApiRateLimit(request, RATE_LIMITS.admin);
      if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;
      const actorId = getAdminActorId(request);
      if (!actorId) {
        return NextResponse.json(
          { error: 'An administrator identity is required.' },
          { status: 401 },
        );
      }

      const parsed = transitionSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid order transition.' }, { status: 400 });
      }

      try {
        const updated = await db.$transaction(
          async (tx) => {
            const order = await tx.order.findUnique({
              where: { id: parsed.data.orderId },
              include: lifecycleOrderInclude,
            });
            if (!order) throw new OrderLifecycleError('Order not found.', 404);
            const result = await applyOrderTransition(tx, order, {
              targetStatus: parsed.data.targetStatus,
              actorId,
              actorRole: 'admin',
              carrier: parsed.data.carrier,
              trackingNumber: parsed.data.trackingNumber,
              note: parsed.data.note,
            });
            await tx.auditLog.create({
              data: {
                adminId: actorId,
                action: `order_status_${parsed.data.targetStatus}`,
                targetType: 'order',
                targetId: order.id,
                details: JSON.stringify({
                  orderNumber: order.orderNumber,
                  previousStatus: order.status,
                  newStatus: parsed.data.targetStatus,
                  note: parsed.data.note || null,
                }),
              },
            });
            return result;
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            maxWait: 5_000,
            timeout: 15_000,
          },
        );

        return NextResponse.json({
          success: true,
          order: serializeLifecycleOrder(updated, 'admin'),
        });
      } catch (error) {
        if (error instanceof OrderLifecycleError) {
          return NextResponse.json(
            { error: error.message, code: error.code },
            { status: error.status },
          );
        }
        console.error('Admin orders PUT error:', error);
        return NextResponse.json({ error: 'The order could not be updated.' }, { status: 500 });
      }
    }
    ''',
)

write(
    "src/app/api/orders/route.ts",
    r'''
    import { Prisma } from '@prisma/client';
    import { requireAuthenticatedUser } from '@/lib/auth';
    import { db } from '@/lib/db';
    import { normalizeOrderStatus } from '@/lib/order-lifecycle';
    import {
      lifecycleOrderInclude,
      serializeLifecycleOrder,
    } from '@/lib/order-lifecycle-server';
    import { validatePagination } from '@/lib/security';

    export async function GET(request: Request) {
      const auth = await requireAuthenticatedUser(request);
      if (auth.response) return auth.response;

      try {
        const { searchParams } = new URL(request.url);
        const requestedUserId = searchParams.get('userId');
        const requestedOrderId = searchParams.get('id');
        const statusRaw = searchParams.get('status');
        const status = statusRaw ? normalizeOrderStatus(statusRaw) : null;
        const { page, limit } = validatePagination(
          searchParams.get('page'),
          searchParams.get('limit'),
          100,
        );

        if (statusRaw && !status) {
          return Response.json({ error: 'Invalid order status.' }, { status: 400 });
        }

        const userId =
          auth.user.role === 'admin' && requestedUserId
            ? requestedUserId
            : auth.user.id;
        const where: Prisma.OrderWhereInput = {
          userId,
          ...(requestedOrderId ? { id: requestedOrderId } : {}),
          ...(status ? { status } : {}),
        };

        const [orders, total] = await db.$transaction([
          db.order.findMany({
            where,
            include: lifecycleOrderInclude,
            orderBy: { createdAt: 'desc' },
            skip: (page - 1) * limit,
            take: requestedOrderId ? 1 : limit,
          }),
          db.order.count({ where }),
        ]);

        return Response.json({
          orders: orders.map((order) =>
            serializeLifecycleOrder(
              order,
              auth.user.role === 'admin' ? 'admin' : 'buyer',
            ),
          ),
          total,
          page,
          limit,
        });
      } catch (error) {
        console.error('Orders API error:', error);
        return Response.json({ error: 'Failed to fetch orders.' }, { status: 500 });
      }
    }
    ''',
)

write(
    "src/components/buyer/orders-page.tsx",
    r'''
    'use client';

    import React, { useCallback, useEffect, useMemo, useState } from 'react';
    import Image from 'next/image';
    import Link from 'next/link';
    import {
      AlertCircle,
      CheckCircle2,
      ChevronDown,
      ChevronUp,
      Clock3,
      Loader2,
      Package,
      RefreshCw,
      Search,
      ShoppingBag,
      Truck,
      XCircle,
    } from 'lucide-react';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent } from '@/components/ui/card';
    import {
      Dialog,
      DialogContent,
      DialogDescription,
      DialogFooter,
      DialogHeader,
      DialogTitle,
    } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
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
    import {
      addressLines,
      formatOrderAttributes,
      formatOrderDate,
      type LifecycleOrderDto,
      ORDER_STATUS_VALUES,
      statusBadgeClass,
      statusLabel,
    } from '@/lib/order-client';
    import { useAppNavigation } from '@/lib/use-app-navigation';
    import { useCartStore } from '@/stores/cart-store';
    import { useUserStore } from '@/stores/user-store';

    function statusIcon(status: string) {
      if (status === 'delivered') return CheckCircle2;
      if (status === 'shipped') return Truck;
      if (status === 'cancelled' || status === 'rejected') return XCircle;
      if (status === 'pending') return Clock3;
      return Package;
    }

    export function OrdersPage() {
      const { locale } = useI18n();
      const isRTL = locale === 'ar';
      const nav = useAppNavigation();
      const addItem = useCartStore((state) => state.addItem);
      const user = useUserStore((state) => state.user);
      const isHydrated = useUserStore((state) => state.isHydrated);
      const [orders, setOrders] = useState<LifecycleOrderDto[]>([]);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState('');
      const [search, setSearch] = useState('');
      const [statusFilter, setStatusFilter] = useState('all');
      const [expandedId, setExpandedId] = useState<string | null>(null);
      const [cancelOrder, setCancelOrder] = useState<LifecycleOrderDto | null>(null);
      const [cancelReason, setCancelReason] = useState('');
      const [cancelling, setCancelling] = useState(false);

      const loadOrders = useCallback(async () => {
        if (!isHydrated) return;
        setLoading(true);
        setError('');
        if (!user) {
          setOrders([]);
          setLoading(false);
          return;
        }
        try {
          const response = await fetch('/api/orders?limit=100', {
            credentials: 'same-origin',
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
      }, [isHydrated, user]);

      useEffect(() => {
        const timer = window.setTimeout(() => {
          void loadOrders();
        }, 0);
        return () => window.clearTimeout(timer);
      }, [loadOrders]);

      const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return orders.filter((order) => {
          const matchesStatus =
            statusFilter === 'all' || order.status === statusFilter;
          const matchesSearch =
            !query ||
            order.orderNumber.toLowerCase().includes(query) ||
            order.storeName.toLowerCase().includes(query) ||
            order.items.some(
              (item) =>
                item.name.toLowerCase().includes(query) ||
                item.sku?.toLowerCase().includes(query),
            );
          return matchesStatus && matchesSearch;
        });
      }, [orders, search, statusFilter]);

      function buyAgain(order: LifecycleOrderDto) {
        for (const item of order.items) {
          addItem({
            productId: item.productId,
            variantId: item.variantId || undefined,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: 1,
            storeId: order.storeId,
            storeName: order.storeName,
            variation: item.variation || undefined,
          });
        }
        nav.setView('cart');
      }

      async function submitCancellation() {
        if (!cancelOrder) return;
        setCancelling(true);
        setError('');
        try {
          const response = await fetch(
            `/api/orders/${encodeURIComponent(cancelOrder.id)}/transition`,
            {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                targetStatus: 'cancelled',
                reason: cancelReason.trim() || undefined,
              }),
            },
          );
          const payload = (await response.json()) as {
            order?: LifecycleOrderDto;
            error?: string;
          };
          if (!response.ok || !payload.order) {
            throw new Error(payload.error || 'The order could not be cancelled.');
          }
          setOrders((current) =>
            current.map((order) =>
              order.id === payload.order!.id ? payload.order! : order,
            ),
          );
          setCancelOrder(null);
          setCancelReason('');
        } catch (cancelError) {
          setError(
            cancelError instanceof Error
              ? cancelError.message
              : 'The order could not be cancelled.',
          );
        } finally {
          setCancelling(false);
        }
      }

      if (loading && orders.length === 0) {
        return (
          <div className="container mx-auto flex min-h-64 items-center justify-center px-4 py-8">
            <Loader2 className="size-8 animate-spin text-amber-600" />
          </div>
        );
      }

      return (
        <div className="container mx-auto space-y-5 px-4 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">{isRTL ? 'طلباتي' : 'My orders'}</h1>
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? 'تابع تأكيد البائع والتجهيز والشحن والتسليم.'
                  : 'Follow seller confirmation, preparation, shipping, and delivery.'}
              </p>
            </div>
            <Button variant="outline" onClick={() => void loadOrders()} disabled={loading}>
              <RefreshCw className={`me-2 size-4 ${loading ? 'animate-spin' : ''}`} />
              {isRTL ? 'تحديث' : 'Refresh'}
            </Button>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {isRTL
              ? 'لا توجد دفعة داخل NexaMart. ادفع للبائع عند استلام الطلب.'
              : 'No payment is taken inside NexaMart. Pay the seller when your order is delivered.'}
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" role="alert">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <Card>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={isRTL ? 'بحث في الطلبات أو SKU' : 'Search orders, products, or SKU'}
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

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
                <ShoppingBag className="mb-3 size-12 text-muted-foreground/40" />
                <p className="font-medium">{isRTL ? 'لا توجد طلبات' : 'No orders found'}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isRTL ? 'ابدأ التسوق لإنشاء أول طلب.' : 'Start shopping to place your first order.'}
                </p>
                <Button asChild className="mt-4 bg-amber-600 text-white hover:bg-amber-700">
                  <Link href="/shop">{isRTL ? 'تصفح المنتجات' : 'Browse products'}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((order) => {
                const expanded = expandedId === order.id;
                const StatusIcon = statusIcon(order.status);
                return (
                  <Card key={order.id} className="overflow-hidden">
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 p-4 text-start hover:bg-muted/30"
                      onClick={() => setExpandedId(expanded ? null : order.id)}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-bold text-amber-700 dark:text-amber-300">
                            {order.orderNumber}
                          </span>
                          <Badge className={`${statusBadgeClass(order.status)} border-0`}>
                            <StatusIcon className="me-1 size-3" />
                            {statusLabel(order.status, isRTL)}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatOrderDate(order.createdAt, isRTL)} · {order.storeName} ·{' '}
                          {order.itemCount} {isRTL ? 'عنصر' : 'items'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-bold">{formatPrice(order.total)}</span>
                        {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </div>
                    </button>

                    {expanded && (
                      <div className="border-t">
                        <div className="space-y-3 p-4">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">
                                  {isRTL && item.nameAr ? item.nameAr : item.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {item.sku ? `SKU: ${item.sku}` : ''}
                                </p>
                                {formatOrderAttributes(item.attributes, item.variation) && (
                                  <p className="text-xs text-muted-foreground">
                                    {formatOrderAttributes(item.attributes, item.variation)}
                                  </p>
                                )}
                              </div>
                              <div className="text-end text-sm">
                                <p>{item.quantity} × {formatPrice(item.price)}</p>
                                <p className="font-semibold">{formatPrice(item.total)}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Separator />

                        <div className="grid gap-5 p-4 md:grid-cols-2">
                          <div>
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {isRTL ? 'حالة الطلب' : 'Order history'}
                            </h3>
                            <div className="space-y-3">
                              {order.timeline.map((event) => (
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
                            </div>
                          </div>

                          <div>
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {isRTL ? 'عنوان التوصيل' : 'Delivery address'}
                            </h3>
                            <div className="space-y-1 text-sm">
                              {addressLines(order.shippingAddress).map((line) => (
                                <p key={line}>{line}</p>
                              ))}
                            </div>
                            {(order.carrier || order.trackingNumber) && (
                              <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
                                <p>{isRTL ? 'الناقل' : 'Carrier'}: {order.carrier || '—'}</p>
                                <p>{isRTL ? 'التتبع' : 'Tracking'}: {order.trackingNumber || '—'}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <Separator />

                        <div className="flex flex-wrap justify-end gap-2 p-4">
                          <Button variant="outline" onClick={() => buyAgain(order)}>
                            <RefreshCw className="me-2 size-4" />
                            {isRTL ? 'إعادة الطلب' : 'Buy again'}
                          </Button>
                          {(order.status === 'shipped' || order.trackingNumber) && (
                            <Button asChild variant="outline">
                              <Link href={`/order-tracking?orderId=${encodeURIComponent(order.id)}`}>
                                <Truck className="me-2 size-4" />
                                {isRTL ? 'تتبع الطلب' : 'Track order'}
                              </Link>
                            </Button>
                          )}
                          {order.status === 'delivered' && (
                            <Button asChild variant="outline">
                              <Link href="/returns">{isRTL ? 'طلب إرجاع' : 'Request return'}</Link>
                            </Button>
                          )}
                          {order.canCancel && (
                            <Button
                              variant="outline"
                              className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
                              onClick={() => {
                                setCancelOrder(order);
                                setCancelReason('');
                              }}
                            >
                              <XCircle className="me-2 size-4" />
                              {isRTL ? 'إلغاء الطلب' : 'Cancel order'}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          <Dialog open={Boolean(cancelOrder)} onOpenChange={(open) => !open && setCancelOrder(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{isRTL ? 'إلغاء الطلب' : 'Cancel order'}</DialogTitle>
                <DialogDescription>
                  {isRTL
                    ? 'يمكنك الإلغاء قبل تأكيد البائع فقط. سيعاد المخزون تلقائياً.'
                    : 'You can cancel only before seller confirmation. Reserved SKU inventory will be restored automatically.'}
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                placeholder={isRTL ? 'سبب الإلغاء (اختياري)' : 'Cancellation reason (optional)'}
              />
              <DialogFooter>
                <Button variant="ghost" onClick={() => setCancelOrder(null)}>
                  {isRTL ? 'احتفاظ بالطلب' : 'Keep order'}
                </Button>
                <Button
                  className="bg-red-600 text-white hover:bg-red-700"
                  onClick={() => void submitCancellation()}
                  disabled={cancelling}
                >
                  {cancelling && <Loader2 className="me-2 size-4 animate-spin" />}
                  {isRTL ? 'تأكيد الإلغاء' : 'Confirm cancellation'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    }
    ''',
)

write(
    "src/app/(buyer)/order-tracking/page.tsx",
    r'''
    import { OrderTrackingPage } from '@/components/buyer/order-tracking-page';

    export default async function OrderTrackingRoute({
      searchParams,
    }: {
      searchParams: Promise<{ orderId?: string }>;
    }) {
      const params = await searchParams;
      return <OrderTrackingPage orderId={params.orderId} />;
    }
    ''',
)

write(
    "src/components/buyer/order-tracking-page.tsx",
    r'''
    'use client';

    import React, { useCallback, useEffect, useState } from 'react';
    import Image from 'next/image';
    import Link from 'next/link';
    import {
      AlertCircle,
      CheckCircle2,
      Clock3,
      Loader2,
      MapPin,
      Package,
      Truck,
    } from 'lucide-react';
    import { Badge } from '@/components/ui/badge';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
    import { Separator } from '@/components/ui/separator';
    import { useI18n } from '@/lib/i18n';
    import {
      addressLines,
      formatOrderAttributes,
      formatOrderDate,
      type LifecycleOrderDto,
      statusBadgeClass,
      statusLabel,
    } from '@/lib/order-client';

    export function OrderTrackingPage({ orderId }: { orderId?: string }) {
      const { locale } = useI18n();
      const isRTL = locale === 'ar';
      const [order, setOrder] = useState<LifecycleOrderDto | null>(null);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState('');

      const loadOrder = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
          const query = orderId
            ? `?id=${encodeURIComponent(orderId)}&limit=1`
            : '?status=shipped&limit=1';
          const response = await fetch(`/api/orders${query}`, {
            credentials: 'same-origin',
            cache: 'no-store',
          });
          const payload = (await response.json()) as {
            orders?: LifecycleOrderDto[];
            error?: string;
          };
          if (!response.ok) {
            throw new Error(payload.error || 'Failed to load tracking information.');
          }
          setOrder(payload.orders?.[0] || null);
        } catch (loadError) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Failed to load tracking information.',
          );
        } finally {
          setLoading(false);
        }
      }, [orderId]);

      useEffect(() => {
        const timer = window.setTimeout(() => {
          void loadOrder();
        }, 0);
        return () => window.clearTimeout(timer);
      }, [loadOrder]);

      if (loading) {
        return (
          <div className="container mx-auto flex min-h-64 max-w-3xl items-center justify-center px-4 py-8">
            <Loader2 className="size-8 animate-spin text-amber-600" />
          </div>
        );
      }

      if (!order) {
        return (
          <div className="container mx-auto max-w-3xl px-4 py-8">
            <Card>
              <CardContent className="flex min-h-64 flex-col items-center justify-center text-center">
                <Truck className="mb-3 size-12 text-muted-foreground/40" />
                <p className="font-medium">
                  {isRTL ? 'لا توجد بيانات تتبع لهذا الطلب.' : 'No tracking information is available for this order.'}
                </p>
                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                <Button asChild className="mt-4">
                  <Link href="/orders">{isRTL ? 'العودة للطلبات' : 'Back to orders'}</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      }

      return (
        <div className="container mx-auto max-w-3xl space-y-5 px-4 py-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{isRTL ? 'تتبع الطلب' : 'Order tracking'}</h1>
              <p className="font-mono text-sm text-muted-foreground">{order.orderNumber}</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/orders">{isRTL ? 'طلباتي' : 'My orders'}</Link>
            </Button>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              {error}
            </div>
          )}

          <Card>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{order.storeName}</p>
                  <p className="mt-1 font-semibold">
                    {isRTL ? 'تاريخ الطلب' : 'Order date'}: {formatOrderDate(order.createdAt, isRTL)}
                  </p>
                </div>
                <Badge className={`${statusBadgeClass(order.status)} border-0 text-sm`}>
                  {statusLabel(order.status, isRTL)}
                </Badge>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {isRTL
                  ? 'يعرض NexaMart الحالات المسجلة من البائع فقط. لا يوجد تتبع GPS مباشر في هذا الإصدار.'
                  : 'NexaMart shows only status updates recorded by the seller. Live GPS tracking is not available in this release.'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="size-4 text-amber-600" />
                {isRTL ? 'سجل الشحنة' : 'Shipment history'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.timeline.map((event, index) => (
                <div key={event.id} className="relative flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      {event.toStatus === 'delivered' ? (
                        <CheckCircle2 className="size-4" />
                      ) : event.toStatus === 'shipped' ? (
                        <Truck className="size-4" />
                      ) : (
                        <Clock3 className="size-4" />
                      )}
                    </div>
                    {index < order.timeline.length - 1 && <div className="h-8 w-px bg-border" />}
                  </div>
                  <div className="pb-3">
                    <p className="font-medium">{statusLabel(event.toStatus, isRTL)}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatOrderDate(event.date, isRTL, true)}
                    </p>
                    {event.note && <p className="mt-1 text-sm text-muted-foreground">{event.note}</p>}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="size-4 text-amber-600" />
                  {isRTL ? 'بيانات الناقل' : 'Carrier details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>{isRTL ? 'الناقل' : 'Carrier'}: {order.carrier || '—'}</p>
                <p>{isRTL ? 'رقم التتبع' : 'Tracking number'}: {order.trackingNumber || '—'}</p>
                {!order.trackingNumber && (
                  <p className="text-xs text-muted-foreground">
                    {isRTL
                      ? 'سيضيف البائع رقم التتبع عند شحن الطلب.'
                      : 'The seller will add a tracking number when the order ships.'}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="size-4 text-amber-600" />
                  {isRTL ? 'عنوان التوصيل' : 'Delivery address'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {addressLines(order.shippingAddress).map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="size-4 text-amber-600" />
                {isRTL ? 'عناصر الطلب' : 'Order items'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{isRTL && item.nameAr ? item.nameAr : item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.sku ? `SKU: ${item.sku}` : ''}</p>
                    {formatOrderAttributes(item.attributes, item.variation) && (
                      <p className="text-xs text-muted-foreground">
                        {formatOrderAttributes(item.attributes, item.variation)}
                      </p>
                    )}
                  </div>
                  <p className="text-sm">× {item.quantity}</p>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold">
                <span>{isRTL ? 'الإجمالي' : 'Total'}</span>
                <span>{new Intl.NumberFormat(isRTL ? 'ar-IQ' : 'en-US', { style: 'currency', currency: 'USD' }).format(order.total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    ''',
)

write(
    "src/app/api/installments/route.ts",
    r'''
    import { NextResponse } from 'next/server';

    function disabled() {
      return NextResponse.json(
        {
          error: 'Installment and payment services are not available in this release.',
          code: 'PAYMENTS_DISABLED',
        },
        { status: 410 },
      );
    }

    export async function GET() {
      return disabled();
    }

    export async function POST() {
      return disabled();
    }

    export async function PUT() {
      return disabled();
    }

    export async function DELETE() {
      return disabled();
    }
    ''',
)

write(
    "src/app/(buyer)/installments/page.tsx",
    r'''
    'use client';

    import Link from 'next/link';
    import { Banknote, ShoppingBag } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent } from '@/components/ui/card';
    import { useI18n } from '@/lib/i18n';

    export default function InstallmentsRoute() {
      const { locale } = useI18n();
      const isRTL = locale === 'ar';
      return (
        <div className="container mx-auto max-w-2xl px-4 py-16" dir={isRTL ? 'rtl' : 'ltr'}>
          <Card>
            <CardContent className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <Banknote className="size-8" />
              </div>
              <h1 className="text-2xl font-bold">
                {isRTL ? 'الأقساط غير متاحة في هذا الإصدار' : 'Installments are not available in this release'}
              </h1>
              <p className="mt-3 max-w-lg text-muted-foreground">
                {isRTL
                  ? 'NexaMart لا يعالج المدفوعات أو الأقساط حالياً. يمكن إنشاء الطلب والدفع للبائع عند الاستلام.'
                  : 'NexaMart does not process payments or installment plans at this stage. You can place an order and pay the seller on delivery.'}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button asChild className="bg-amber-600 text-white hover:bg-amber-700">
                  <Link href="/shop">
                    <ShoppingBag className="me-2 size-4" />
                    {isRTL ? 'تصفح المنتجات' : 'Browse products'}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/orders">{isRTL ? 'طلباتي' : 'My orders'}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
    ''',
)

write(
    "src/app/admin/payouts/page.tsx",
    r'''
    'use client';

    import { Banknote, ShoppingCart } from 'lucide-react';
    import Link from 'next/link';
    import { Button } from '@/components/ui/button';
    import { Card, CardContent } from '@/components/ui/card';
    import { useI18n } from '@/lib/i18n';

    export default function AdminPayoutsRoute() {
      const { locale } = useI18n();
      const isRTL = locale === 'ar';
      return (
        <div className="p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
          <Card>
            <CardContent className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                <Banknote className="size-8" />
              </div>
              <h1 className="text-2xl font-bold">
                {isRTL ? 'معالجة الدفعات معطلة' : 'Payout processing is disabled'}
              </h1>
              <p className="mt-3 max-w-xl text-muted-foreground">
                {isRTL
                  ? 'هذا الإصدار لا يستلم أموال العملاء ولا يحوّل أرباحاً للبائعين. الطلبات هي دفع عند الاستلام مباشرة للبائع.'
                  : 'This release does not collect customer funds or transfer seller earnings. Orders are paid directly to sellers on delivery.'}
              </p>
              <Button asChild className="mt-6 bg-amber-600 text-white hover:bg-amber-700">
                <Link href="/admin/orders">
                  <ShoppingCart className="me-2 size-4" />
                  {isRTL ? 'إدارة الطلبات' : 'Manage orders'}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    ''',
)

print('Order lifecycle UI integration applied successfully.')
