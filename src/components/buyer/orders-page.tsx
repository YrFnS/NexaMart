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
  FileText,
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
                      <Button
                        variant="outline"
                        onClick={() => {
                          const query = new URLSearchParams({
                            type: 'order',
                            lang: isRTL ? 'ar' : 'en',
                            print: '1',
                          });
                          const opened = window.open(
                            `/api/orders/${encodeURIComponent(order.id)}/document?${query.toString()}`,
                            '_blank',
                          );
                          if (!opened) {
                            setError(
                              isRTL
                                ? 'تعذر فتح مستند الطلب. تحقق من حظر النوافذ المنبثقة.'
                                : 'The order document could not open. Check the popup blocker.',
                            );
                          } else {
                            opened.opener = null;
                          }
                        }}
                      >
                        <FileText className="me-2 size-4" />
                        {isRTL ? 'فتح مستند الطلب' : 'Open order document'}
                      </Button>
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
