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
