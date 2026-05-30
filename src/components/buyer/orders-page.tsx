'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Package,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  RotateCcw,
  RefreshCcw,
  MessageSquareWarning,
  PackageCheck,
  PackageOpen,
  ArrowRight,
  ArrowLeft,
  Search,
  Download,
  Calendar,
  FileText,
  Zap,
  FileText as InvoiceIcon,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useCartStore } from '@/stores/cart-store';
import { useUserStore } from '@/stores/user-store';
import { toast } from 'sonner';
import { InvoiceViewer } from '@/components/common/invoice-viewer';
import { getPlaceholderImage } from '@/lib/placeholder-image';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'disputed';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variation?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  shipping: number;
  tax: number;
  itemCount: number;
  storeName: string;
  storeId: string;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    address1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  trackingNumber?: string;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  timeline: { status: string; date: string; completed: boolean; icon?: React.ElementType }[];
}

type DateRange = '30' | '90' | '180' | 'all';

const STATUS_CONFIG: Record<OrderStatus, { color: string; bgColor: string; icon: React.ElementType; iconColor: string }> = {
  pending: { color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-900', icon: Clock, iconColor: 'text-amber-500' },
  processing: { color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900', icon: PackageOpen, iconColor: 'text-blue-500' },
  shipped: { color: 'text-purple-700 dark:text-purple-300', bgColor: 'bg-purple-100 dark:bg-purple-900', icon: Truck, iconColor: 'text-purple-500' },
  delivered: { color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-900', icon: PackageCheck, iconColor: 'text-emerald-500' },
  cancelled: { color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900', icon: XCircle, iconColor: 'text-red-500' },
  disputed: { color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-100 dark:bg-orange-900', icon: AlertCircle, iconColor: 'text-orange-500' },
};

const DATE_RANGES: { id: DateRange; label: string; labelAr: string }[] = [
  { id: '30', label: 'Last 30 days', labelAr: 'آخر 30 يوم' },
  { id: '90', label: 'Last 3 months', labelAr: 'آخر 3 أشهر' },
  { id: '180', label: 'Last 6 months', labelAr: 'آخر 6 أشهر' },
  { id: 'all', label: 'All time', labelAr: 'كل الأوقات' },
];



export function OrdersPage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const addItem = useCartStore((s) => s.addItem);
  const user = useUserStore((s) => s.user);
  const isRTL = locale === 'ar';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoiceOrderId, setInvoiceOrderId] = useState<string | undefined>();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const userId = user?.id;
        if (!userId) {
          setOrders([]);
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/orders?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : data.orders || []);
        } else {
          setOrders([]);
        }
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user?.id]);

  // Status summary counts
  const statusSummary = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;
    // Filter by tab
    if (activeTab !== 'all') {
      filtered = filtered.filter((o) => o.status === activeTab);
    }
    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.storeName.toLowerCase().includes(q)
      );
    }
    // Filter by date range
    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter((o) => new Date(o.createdAt) >= cutoff);
    }
    return filtered;
  }, [orders, activeTab, searchQuery, dateRange]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleBuyAgain = (order: Order) => {
    order.items.forEach((item) => {
      addItem({
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
        storeId: order.storeId,
        storeName: order.storeName,
        variation: item.variation,
      });
    });
    nav.setView('cart');
  };

  const handleViewInvoice = (orderId: string) => {
    setInvoiceOrderId(orderId);
    setInvoiceOpen(true);
  };

  const handleDownloadInvoice = (orderId: string) => {
    setInvoiceOrderId(orderId);
    setInvoiceOpen(true);
  };

  const handleTrackOrder = () => {
    nav.setView('order-tracking');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(getLocale(isRTL), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const statusCards = [
    { key: 'all', label: t('allOrders'), icon: Package, color: 'text-foreground', bgColor: 'bg-muted/50' },
    { key: 'processing', label: t('b_processingStatus'), icon: PackageOpen, color: 'text-blue-600', bgColor: 'bg-blue-50 dark:bg-blue-950/30' },
    { key: 'shipped', label: t('b_shippedStatus'), icon: Truck, color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/30' },
    { key: 'delivered', label: t('b_deliveredStatus'), icon: PackageCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30' },
    { key: 'cancelled', label: t('b_cancelledStatus'), icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-950/30' },
  ];

  const renderTimeline = (timeline: Order['timeline']) => (
    <div className="relative mt-4">
      <div className="space-y-3">
        {timeline.map((step, idx) => {
          const StepIcon = step.icon || (step.completed ? CheckCircle2 : Clock);
          return (
            <div key={idx} className="flex items-start gap-3">
              {/* Icon + connector */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  step.completed
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <StepIcon className="size-4" />
                </div>
                {idx < timeline.length - 1 && (
                  <div className={`w-0.5 h-6 ${
                    step.completed && timeline[idx + 1]?.completed
                      ? 'bg-emerald-300 dark:bg-emerald-700'
                      : 'bg-muted'
                  }`} />
                )}
              </div>
              {/* Content */}
              <div className="flex-1 pt-1">
                <p className={`text-sm font-medium ${step.completed ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.status}
                </p>
                {step.date && (
                  <p className="text-xs text-muted-foreground">{formatDate(step.date)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderOrderCard = (order: Order) => {
    const config = STATUS_CONFIG[order.status];
    const StatusIcon = config.icon;
    const isExpanded = expandedOrder === order.id;

    return (
      <Card key={order.id} className="overflow-hidden">
        {/* Order Header */}
        <div
          className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => toggleExpand(order.id)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                  {order.orderNumber}
                </span>
                <Badge className={`${config.bgColor} ${config.color} text-[10px] font-medium border-0`}>
                  <StatusIcon className="size-3 me-1" />
                  {t(order.status)}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-6 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                  onClick={(e) => { e.stopPropagation(); handleViewInvoice(order.id); }}
                  title={t('viewInvoice')}
                >
                  <InvoiceIcon className="size-3.5" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{formatDate(order.createdAt)}</span>
                <span>·</span>
                <span>{order.storeName}</span>
                <span>·</span>
                <span>{order.itemCount} {t('b_items')}</span>
              </div>
            </div>
            <div className="text-end flex-shrink-0">
              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatPrice(order.total)}
              </p>
              <div className="mt-1">
                {isExpanded ? (
                  <ChevronUp className="size-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="size-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t">
            {/* Items */}
            <div className="p-4 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('b_itemsUpper')}
              </h4>
              {order.items.map((item) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
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
                    <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                    {item.variation && (
                      <p className="text-xs text-muted-foreground">{item.variation}</p>
                    )}
                  </div>
                  <div className="text-end flex-shrink-0">
                    <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {t('b_qty')}: {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Timeline with icons */}
            <div className="p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {t('b_orderStatus')}
              </h4>
              {renderTimeline(order.timeline)}
            </div>

            <Separator />

            {/* Shipping & Tracking */}
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {t('b_shippingAddress')}
                </h4>
                <p className="text-sm">{order.shippingAddress.name}</p>
                <p className="text-xs text-muted-foreground">{order.shippingAddress.address1}</p>
                <p className="text-xs text-muted-foreground">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
              </div>
              {order.trackingNumber && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {t('b_trackingInfo')}
                  </h4>
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t('trackingNumber')}: </span>
                    <span className="font-mono font-medium">{order.trackingNumber}</span>
                  </p>
                  {order.carrier && (
                    <p className="text-xs text-muted-foreground">
                      {t('b_carrier')}: {order.carrier}
                    </p>
                  )}
                  {order.estimatedDelivery && (
                    <p className="text-xs text-muted-foreground">
                      {t('b_estDeliveryShort')}: {formatDate(order.estimatedDelivery)}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="p-4 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('subtotal')}</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('shipping')}</span>
                <span>{order.shipping === 0 ? t('free') : formatPrice(order.shipping)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t('b_tax')}</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between text-sm font-bold">
                <span>{t('total')}</span>
                <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(order.total)}</span>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="p-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => handleBuyAgain(order)}
              >
                <RefreshCcw className="size-3.5 me-1" />
                {t('reorder')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-emerald-300 dark:border-emerald-700 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                onClick={() => handleViewInvoice(order.id)}
              >
                <Eye className="size-3.5 me-1" />
                {t('viewInvoice')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => handleDownloadInvoice(order.id)}
              >
                <Download className="size-3.5 me-1" />
                {t('downloadInvoice')}
              </Button>
              {order.status === 'shipped' && (
                <>
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                    onClick={() => {}}
                  >
                    <CheckCircle2 className="size-3.5 me-1" />
                    {t('confirmDelivery')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-emerald-300 dark:border-emerald-700"
                    onClick={() => handleTrackOrder()}
                  >
                    <Truck className="size-3.5 me-1" />
                    {t('b_trackOrder')}
                  </Button>
                </>
              )}
              {(order.status === 'delivered' || order.status === 'shipped') && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-orange-600 border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                >
                  <MessageSquareWarning className="size-3.5 me-1" />
                  {t('b_disputeRefund')}
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 animate-pulse" />
          <div className="h-8 w-40 bg-muted rounded animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-48 bg-muted rounded animate-pulse" />
                </div>
                <div className="h-6 w-20 bg-muted rounded animate-pulse" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <div className="w-32 h-32 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
            <Package className="size-16 text-emerald-300 dark:text-emerald-700" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {t('b_noOrdersYet')}
          </h1>
          <p className="text-muted-foreground">
            {isRTL
              ? 'ابدأ التسوق وستظهر طلباتك هنا!'
              : 'Start shopping and your orders will appear here!'}
          </p>
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => nav.setView('shop')}
          >
            <ShoppingBag className="size-4 me-2" />
            {t('b_startShopping')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900">
          <Package className="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('orders')}</h1>
          <p className="text-sm text-muted-foreground">
            {orders.length} {t('b_ordersLower')}
          </p>
        </div>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {statusCards.map((card) => {
          const isActive = activeTab === card.key;
          return (
            <Card
              key={card.key}
              className={`cursor-pointer transition-all ${
                isActive
                  ? 'border-emerald-500 shadow-sm shadow-emerald-500/10'
                  : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
              }`}
              onClick={() => setActiveTab(card.key)}
            >
              <CardContent className={`p-3 text-center ${card.bgColor} rounded-lg`}>
                <card.icon className={`size-5 mx-auto mb-1 ${card.color}`} />
                <p className="text-lg font-bold">{statusSummary[card.key] || 0}</p>
                <p className="text-[10px] text-muted-foreground truncate">{card.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search + Date Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchByOrder')}
            className={`h-9 text-sm ${isRTL ? 'pr-9' : 'pl-9'}`}
          />
        </div>
        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-40 h-9 text-xs">
            <Calendar className="size-3.5 me-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((range) => (
              <SelectItem key={range.id} value={range.id}>
                {isRTL ? range.labelAr : range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="size-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">{t('noResults')}</p>
          {(searchQuery || dateRange !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => { setSearchQuery(''); setDateRange('all'); setActiveTab('all'); }}
            >
              {t('clearFilters')}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto scrollbar-thin pr-1">
          {filteredOrders.map((order) => renderOrderCard(order))}
        </div>
      )}

      {/* Invoice Viewer Dialog */}
      <InvoiceViewer
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        orderId={invoiceOrderId}
      />
    </div>
  );
}
