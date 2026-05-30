'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Phone,
  Calendar,
  Navigation,
  Flag,
  Timer,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { getPlaceholderImage } from '@/lib/placeholder-image';

interface TrackingStep {
  key: string;
  label: string;
  labelAr: string;
  date?: string;
  completed: boolean;
  active: boolean;
}

interface OrderTrackingData {
  orderNumber: string;
  orderDate: string;
  status: string;
  carrier: string;
  trackingNumber: string;
  estimatedDelivery: string;
  currentStep: number;
  steps: TrackingStep[];
  items: {
    productId: string;
    name: string;
    nameAr?: string;
    price: number;
    quantity: number;
    image: string;
    variation?: string;
  }[];
  storeName: string;
  storePhone: string;
}

// Mock tracking data removed - fetched from API

export function OrderTrackingPage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const isRTL = locale === 'ar';

  const [tracking, setTracking] = useState<OrderTrackingData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 });

  // Fetch tracking data from API
  useEffect(() => {
    const fetchTracking = async () => {
      setTrackingLoading(true);
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          const orders = Array.isArray(data) ? data : data.orders || [];
          // Find a shipped order for tracking
          const shippedOrder = orders.find((o: Record<string, unknown>) => o.status === 'shipped');
          if (shippedOrder) {
            setTracking(shippedOrder as unknown as OrderTrackingData);
          } else {
            setTracking(null);
          }
        } else {
          setTracking(null);
        }
      } catch {
        setTracking(null);
      } finally {
        setTrackingLoading(false);
      }
    };
    fetchTracking();
  }, []);

  // Calculate time remaining until delivery
  useEffect(() => {
    const calculateRemaining = () => {
      const now = new Date().getTime();
      const delivery = new Date(tracking?.estimatedDelivery || '').getTime();
      const diff = Math.max(0, delivery - now);

      setTimeRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
      });
    };

    calculateRemaining();
    const timer = setInterval(calculateRemaining, 60000);
    return () => clearInterval(timer);
  }, [tracking?.estimatedDelivery]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(getLocale(isRTL), {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(getLocale(isRTL), {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (trackingLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Card className="mb-6 overflow-hidden">
          <div className="h-32 bg-muted animate-pulse" />
          <CardContent className="pt-4">
            <div className="h-8 bg-muted rounded animate-pulse mb-4" />
            <div className="h-48 bg-muted rounded animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tracking) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Button
          variant="ghost"
          className="text-emerald-600 dark:text-emerald-400 mb-4 -ms-2"
          onClick={() => nav.setView('orders')}
        >
          {isRTL ? <ArrowRight className="size-4 me-1" /> : <ArrowLeft className="size-4 me-1" />}
          {isRTL ? 'العودة للطلبات' : 'Back to Orders'}
        </Button>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Truck className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">{isRTL ? 'لا توجد بيانات تتبع' : 'No tracking data available'}</p>
          <p className="text-sm">{isRTL ? 'لم يتم العثور على طلبات مشحونة لتتبعها' : 'No shipped orders found to track'}</p>
        </div>
      </div>
    );
  }

  const activeStepIndex = tracking.steps?.findIndex((s) => s.active) ?? -1;
  const completedCount = tracking.steps?.filter((s) => s.completed).length ?? 0;

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Back to Orders */}
      <Button
        variant="ghost"
        className="text-emerald-600 dark:text-emerald-400 mb-4 -ms-2"
        onClick={() => nav.setView('orders')}
      >
        {isRTL ? <ArrowRight className="size-4 me-1" /> : <ArrowLeft className="size-4 me-1" />}
        {isRTL ? 'العودة للطلبات' : 'Back to Orders'}
      </Button>

      {/* Tracking Header */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Truck className="size-5" />
                <h1 className="text-xl font-bold">{isRTL ? 'تتبع الطلب' : 'Track Order'}</h1>
              </div>
              <p className="font-mono text-sm text-white/80">{tracking.orderNumber}</p>
            </div>
            <div className="text-end">
              <p className="text-sm text-white/70">{isRTL ? 'تاريخ الطلب' : 'Order Date'}</p>
              <p className="text-sm font-medium">{formatDate(tracking.orderDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <Badge className="bg-white/20 text-white border-0">
              <Package className="size-3 me-1" />
              {t(tracking.status)}
            </Badge>
            <span className="text-sm text-white/70">{tracking.storeName}</span>
          </div>
        </div>

        {/* Delivery Countdown */}
        <CardContent className="pt-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Timer className="size-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs text-muted-foreground">
                  {isRTL ? 'الوقت المتبقي للتسليم' : 'Estimated Delivery Time'}
                </p>
                <p className="text-sm font-semibold">
                  {timeRemaining.days > 0 && (
                    <span>
                      {timeRemaining.days} {isRTL ? 'يوم' : 'days'}{' '}
                    </span>
                  )}
                  {timeRemaining.hours} {isRTL ? 'ساعة' : 'hrs'} {timeRemaining.minutes}{' '}
                  {isRTL ? 'دقيقة' : 'min'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {formatDate(tracking.estimatedDelivery)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual Timeline */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Navigation className="size-4 text-emerald-600 dark:text-emerald-400" />
            {isRTL ? 'حالة الشحن' : 'Shipment Status'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {tracking.steps.map((step, idx) => {
              const isActive = step.active;
              const isCompleted = step.completed;
              const isPending = !step.completed && !step.active;

              return (
                <div key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Vertical Line */}
                  {idx < tracking.steps.length - 1 && (
                    <div
                      className={`absolute top-6 ${
                        isRTL ? 'right-[11px]' : 'left-[11px]'
                      } w-0.5 h-full ${
                        isCompleted ? 'bg-emerald-500' : 'bg-muted'
                      }`}
                    />
                  )}

                  {/* Step Dot */}
                  <div className="relative z-10 flex-shrink-0">
                    {isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="size-4 text-white" />
                      </div>
                    ) : isActive ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center animate-pulse shadow-lg shadow-emerald-500/30">
                        <Truck className="size-3 text-white" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                        <Circle className="size-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 min-w-0 -mt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-sm font-medium ${
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isCompleted
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {isRTL ? step.labelAr : step.label}
                      </p>
                      {step.date && (
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatDate(step.date)} · {formatTime(step.date)}
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {isRTL ? 'الخطوة الحالية' : 'Current step'}
                      </p>
                    )}
                    {isPending && (
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        {isRTL ? 'في انتظار' : 'Pending'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Tracking Details */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="size-4 text-emerald-600 dark:text-emerald-400" />
            {isRTL ? 'تفاصيل التتبع' : 'Tracking Details'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{isRTL ? 'الناقل' : 'Carrier'}</span>
            <span className="font-medium">{tracking.carrier}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{t('trackingNumber')}</span>
            <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
              {tracking.trackingNumber}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{isRTL ? 'التسليم المتوقع' : 'Estimated Delivery'}</span>
            <span className="font-medium">{formatDate(tracking.estimatedDelivery)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Map Placeholder */}
      <Card className="mb-6 overflow-hidden">
        <div className="relative h-48 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/50 dark:via-teal-950/50 dark:to-cyan-950/50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-2">
              <MapPin className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {isRTL ? 'التتبع المباشر سيظهر هنا' : 'Live tracking will appear here'}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {isRTL ? 'سيتم توفير التتبع المباشر عند اقتراب التوصيلة' : 'Live tracking will be available when delivery is nearby'}
            </p>
          </div>

          {/* Decorative dots */}
          <div className="absolute top-4 start-4 w-3 h-3 rounded-full bg-emerald-400/30" />
          <div className="absolute top-8 start-12 w-2 h-2 rounded-full bg-teal-400/30" />
          <div className="absolute bottom-6 end-8 w-4 h-4 rounded-full bg-cyan-400/20" />
          <div className="absolute bottom-12 end-16 w-2 h-2 rounded-full bg-emerald-400/30" />
        </div>
      </Card>

      {/* Order Items */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="size-4 text-emerald-600 dark:text-emerald-400" />
            {isRTL ? 'منتجات الطلب' : 'Order Items'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tracking.items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <Image
                  src={item.image}
                  alt={isRTL && item.nameAr ? item.nameAr : item.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (!img.dataset.retried) {
                      img.dataset.retried = 'true';
                      img.src = getPlaceholderImage('electronics', item.name, 56, 56);
                    }
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">
                  {isRTL && item.nameAr ? item.nameAr : item.name}
                </p>
                {item.variation && (
                  <p className="text-xs text-muted-foreground">{item.variation}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {isRTL ? 'الكمية' : 'Qty'}: {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Button
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => {
            /* contact seller */
          }}
        >
          <MessageSquare className="size-4 me-2" />
          {isRTL ? 'تواصل مع البائع' : 'Contact Seller'}
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950"
          onClick={() => {
            /* report issue */
          }}
        >
          <AlertTriangle className="size-4 me-2" />
          {isRTL ? 'الإبلاغ عن مشكلة' : 'Report Issue'}
        </Button>
      </div>
    </div>
  );
}
