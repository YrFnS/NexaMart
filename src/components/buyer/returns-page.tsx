'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  RotateCcw,
  Package,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Upload,
  X,
  Camera,
  FileText,
  ArrowLeft,
  ArrowRight,
  Filter,
  Search,
  Calendar,
  MessageCircle,
  CreditCard,
  RefreshCcw,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useUserStore } from '@/stores/user-store';
import { toast } from 'sonner';
import { getPlaceholderImage } from '@/lib/placeholder-image';

type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';

interface ReturnEntry {
  id: string;
  orderId: string;
  orderNumber: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  refundAmount: number;
  reason: string;
  reasonLabel: string;
  details: string;
  status: ReturnStatus;
  resolution: 'refund' | 'exchange' | 'store_credit';
  resolutionLabel: string;
  createdAt: string;
  updatedAt: string;
  sellerName: string;
  sellerId: string;
  timeline: { status: string; date: string; note?: string }[];
  sellerNote?: string;
  evidencePhotos: string[];
}

interface OrderForReturn {
  id: string;
  orderNumber: string;
  storeName: string;
  storeId: string;
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    selected?: boolean;
  }[];
}

const STATUS_CONFIG: Record<ReturnStatus, { color: string; bgColor: string; icon: React.ElementType; iconColor: string }> = {
  pending: { color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-900/40', icon: Clock, iconColor: 'text-amber-500' },
  approved: { color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-900/40', icon: CheckCircle2, iconColor: 'text-emerald-500' },
  rejected: { color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/40', icon: XCircle, iconColor: 'text-red-500' },
  processing: { color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/40', icon: Loader2, iconColor: 'text-blue-500' },
  completed: { color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/40', icon: CheckCircle2, iconColor: 'text-green-500' },
};

const RETURN_REASONS = [
  { value: 'wrong_item', labelEn: 'Wrong item', labelAr: 'عنصر خاطئ' },
  { value: 'defective', labelEn: 'Defective', labelAr: 'معيب' },
  { value: 'not_as_described', labelEn: 'Not as described', labelAr: 'غير مطابق للوصف' },
  { value: 'changed_mind', labelEn: 'Changed mind', labelAr: 'تغيير الرأي' },
  { value: 'damaged_shipping', labelEn: 'Damaged in shipping', labelAr: 'تالف أثناء الشحن' },
  { value: 'other', labelEn: 'Other', labelAr: 'أخرى' },
];

const RESOLUTION_OPTIONS = [
  { value: 'refund', labelEn: 'Refund', labelAr: 'استرداد' },
  { value: 'exchange', labelEn: 'Exchange', labelAr: 'استبدال' },
  { value: 'store_credit', labelEn: 'Store Credit', labelAr: 'رصيد المتجر' },
];



export function ReturnsPage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const { user } = useUserStore();
  const isRTL = locale === 'ar';

  const [returns, setReturns] = useState<ReturnEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-returns' | 'request-return'>('my-returns');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedReturn, setExpandedReturn] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Request Return form state
  const [selectedOrder, setSelectedOrder] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [returnReason, setReturnReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [evidenceCount, setEvidenceCount] = useState(0);
  const [resolution, setResolution] = useState('refund');
  const [submitting, setSubmitting] = useState(false);

  // Orders eligible for return (fetched from API)
  const [ordersForReturn, setOrdersForReturn] = useState<OrderForReturn[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const selectedOrderData = ordersForReturn.find((o) => o.id === selectedOrder);

  // Fetch orders eligible for return
  useEffect(() => {
    const fetchOrdersForReturn = async () => {
      setOrdersLoading(true);
      try {
        const userId = user?.id;
        if (!userId) {
          setOrdersForReturn([]);
          setOrdersLoading(false);
          return;
        }
        const res = await fetch(`/api/returns?buyerId=${userId}&action=eligible-orders`);
        if (res.ok) {
          const data = await res.json();
          setOrdersForReturn(Array.isArray(data) ? data : data.orders || data.items || []);
        } else {
          setOrdersForReturn([]);
        }
      } catch {
        setOrdersForReturn([]);
      } finally {
        setOrdersLoading(false);
      }
    };
    if (activeTab === 'request-return') {
      fetchOrdersForReturn();
    }
  }, [user?.id, activeTab]);

  useEffect(() => {
    const fetchReturns = async () => {
      setLoading(true);
      try {
        const userId = user?.id;
        if (!userId) {
          setReturns([]);
          setLoading(false);
          return;
        }
        const res = await fetch(`/api/returns?buyerId=${userId}${statusFilter !== 'all' ? `&status=${statusFilter}` : ''}`);
        if (res.ok) {
          const data = await res.json();
          setReturns(data.returns || []);
        } else {
          setReturns([]);
        }
      } catch {
        setReturns([]);
      } finally {
        setLoading(false);
      }
    };
    if (activeTab === 'my-returns') {
      fetchReturns();
    }
  }, [user?.id, statusFilter, activeTab]);

  const filteredReturns = useMemo(() => {
    let filtered = returns;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.orderNumber.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q) ||
          r.sellerName.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [returns, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: returns.length };
    returns.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return counts;
  }, [returns]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(getLocale(isRTL), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleItemSelection = (productId: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const calculateRefundAmount = () => {
    if (!selectedOrderData) return 0;
    return selectedOrderData.items
      .filter((item) => selectedItems.has(item.productId))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSubmitReturn = async () => {
    if (!selectedOrder || selectedItems.size === 0 || !returnReason) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const items = selectedOrderData?.items.filter((item) => selectedItems.has(item.productId)) || [];
      for (const item of items) {
        await fetch('/api/returns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: selectedOrder,
            orderNumber: selectedOrderData?.orderNumber,
            productId: item.productId,
            productName: item.name,
            productImage: item.image,
            quantity: item.quantity,
            refundAmount: item.price * item.quantity,
            reason: returnReason,
            reasonLabel: RETURN_REASONS.find((r) => r.value === returnReason)?.[isRTL ? 'labelAr' : 'labelEn'] || returnReason,
            details: additionalDetails,
            resolution,
            resolutionLabel: RESOLUTION_OPTIONS.find((r) => r.value === resolution)?.[isRTL ? 'labelAr' : 'labelEn'] || resolution,
            sellerName: selectedOrderData?.storeName,
            sellerId: selectedOrderData?.storeId,
            buyerName: user?.name || 'User',
            buyerId: user?.id || '',
          }),
        });
      }

      toast.success(isRTL ? 'تم تقديم طلب الإرجاع بنجاح!' : 'Return request submitted successfully!');
      // Reset form
      setSelectedOrder('');
      setSelectedItems(new Set());
      setReturnReason('');
      setAdditionalDetails('');
      setEvidenceCount(0);
      setResolution('refund');
      setActiveTab('my-returns');
    } catch {
      toast.error(isRTL ? 'حدث خطأ، يرجى المحاولة مرة أخرى' : 'An error occurred, please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTimeline = (timeline: ReturnEntry['timeline']) => (
    <div className="space-y-3">
      {timeline.map((step, idx) => (
        <div key={idx} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
              idx === timeline.length - 1
                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            }`}>
              {idx === timeline.length - 1 ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                <CheckCircle2 className="size-3.5" />
              )}
            </div>
            {idx < timeline.length - 1 && (
              <div className="w-0.5 h-5 bg-emerald-300 dark:bg-emerald-700" />
            )}
          </div>
          <div className="flex-1 pt-0.5">
            <p className="text-sm font-medium">{step.status}</p>
            <p className="text-xs text-muted-foreground">{formatDate(step.date)}</p>
            {step.note && (
              <p className="text-xs text-muted-foreground mt-0.5">{step.note}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderReturnCard = (ret: ReturnEntry) => {
    const config = STATUS_CONFIG[ret.status];
    const StatusIcon = config.icon;
    const isExpanded = expandedReturn === ret.id;

    return (
      <Card key={ret.id} className="overflow-hidden hover:shadow-md transition-shadow">
        <div
          className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
          onClick={() => setExpandedReturn(isExpanded ? null : ret.id)}
        >
          <div className="flex items-start gap-3">
            {/* Product Image */}
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <Image
                src={ret.productImage}
                alt={ret.productName}
                fill
                className="object-cover"
                sizes="64px"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  if (!img.dataset.retried) {
                    img.dataset.retried = 'true';
                    img.src = getPlaceholderImage('electronics', ret.productName, 64, 64);
                  }
                }}
              />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge className={`${config.bgColor} ${config.color} text-[10px] font-medium border-0`}>
                  <StatusIcon className={`size-3 me-1 ${ret.status === 'processing' ? 'animate-spin' : ''}`} />
                  {t(`returnStatus_${ret.status}` as string)}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {ret.resolutionLabel}
                </Badge>
              </div>
              <p className="text-sm font-medium line-clamp-1">{ret.productName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="font-mono">{ret.orderNumber}</span>
                <span>·</span>
                <span>{ret.sellerName}</span>
                <span>·</span>
                <span>{formatDate(ret.createdAt)}</span>
              </div>
            </div>

            {/* Amount & Expand */}
            <div className="text-end flex-shrink-0 flex flex-col items-end gap-1">
              <p className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatPrice(ret.refundAmount)}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {isRTL ? 'مبلغ الاسترداد' : 'Refund amount'}
              </p>
              {isExpanded ? (
                <ChevronUp className="size-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t">
            {/* Reason & Details */}
            <div className="p-4 space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  {isRTL ? 'سبب الإرجاع' : 'Return Reason'}
                </h4>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-amber-500" />
                  <span className="text-sm font-medium">{ret.reasonLabel}</span>
                </div>
                {ret.details && (
                  <p className="text-sm text-muted-foreground mt-1 ms-6">{ret.details}</p>
                )}
              </div>

              {/* Seller Note */}
              {ret.sellerNote && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {isRTL ? 'ملاحظة البائع' : 'Seller Note'}
                  </h4>
                  <p className="text-sm">{ret.sellerNote}</p>
                </div>
              )}

              {/* Evidence Photos */}
              {ret.evidencePhotos.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {isRTL ? 'صور الأدلة' : 'Evidence Photos'}
                  </h4>
                  <div className="flex gap-2">
                    {ret.evidencePhotos.map((photo, idx) => (
                      <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden bg-muted relative">
                        <Image
                          src={photo}
                          alt={`Evidence ${idx + 1}`}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Timeline */}
            <div className="p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {isRTL ? 'حالة الإرجاع' : 'Return Status'}
              </h4>
              {renderTimeline(ret.timeline)}
            </div>

            <Separator />

            {/* Actions */}
            <div className="p-4 flex flex-wrap gap-2">
              {ret.status === 'pending' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-red-600 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => {
                    setReturns(returns.filter((r) => r.id !== ret.id));
                    toast.success(isRTL ? 'تم إلغاء طلب الإرجاع' : 'Return request cancelled');
                  }}
                >
                  <XCircle className="size-3.5 me-1" />
                  {isRTL ? 'إلغاء الطلب' : 'Cancel Request'}
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => nav.setView('orders')}
              >
                <Package className="size-3.5 me-1" />
                {isRTL ? 'عرض الطلب' : 'View Order'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => nav.setView('chat')}
              >
                <MessageCircle className="size-3.5 me-1" />
                {isRTL ? 'محادثة البائع' : 'Chat Seller'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  const renderRequestReturn = () => {
    if (ordersLoading) {
      return (
        <div className="space-y-4 max-w-2xl mx-auto">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-muted rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (ordersForReturn.length === 0) {
      return (
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-12 text-muted-foreground">
          <RotateCcw className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">{isRTL ? 'لا توجد طلبات للإرجاع' : 'No orders available for return'}</p>
          <p className="text-sm">{isRTL ? 'لا توجد طلبات مؤهلة للإرجاع حالياً' : 'There are no orders eligible for return at this time'}</p>
        </div>
      );
    }

    return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Select Order */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Package className="size-4 text-emerald-600" />
            {isRTL ? 'اختر الطلب' : 'Select Order'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedOrder} onValueChange={(v) => { setSelectedOrder(v); setSelectedItems(new Set()); }}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder={isRTL ? 'اختر طلباً للإرجاع...' : 'Select an order to return...'} />
            </SelectTrigger>
            <SelectContent>
              {ordersForReturn.map((order) => (
                <SelectItem key={order.id} value={order.id}>
                  <span className="font-mono">{order.orderNumber}</span> — {order.storeName} ({order.items.length} {isRTL ? 'عناصر' : 'items'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Select Items */}
      {selectedOrderData && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShoppingBag className="size-4 text-emerald-600" />
              {isRTL ? 'اختر العناصر للإرجاع' : 'Select Items to Return'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedOrderData.items.map((item) => (
              <div
                key={item.productId}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedItems.has(item.productId)
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-border hover:border-emerald-200 dark:hover:border-emerald-800'
                }`}
                onClick={() => toggleItemSelection(item.productId)}
              >
                <Checkbox
                  checked={selectedItems.has(item.productId)}
                  onCheckedChange={() => toggleItemSelection(item.productId)}
                />
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (!img.dataset.retried) {
                        img.dataset.retried = 'true';
                        img.src = getPlaceholderImage('electronics', item.name, 48, 48);
                      }
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? 'الكمية' : 'Qty'}: {item.quantity} × {formatPrice(item.price)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Return Reason */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-500" />
            {isRTL ? 'سبب الإرجاع' : 'Return Reason'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs mb-1.5 block">{isRTL ? 'السبب' : 'Reason'} *</Label>
            <Select value={returnReason} onValueChange={setReturnReason}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={isRTL ? 'اختر سبب الإرجاع...' : 'Select return reason...'} />
              </SelectTrigger>
              <SelectContent>
                {RETURN_REASONS.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {isRTL ? reason.labelAr : reason.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs mb-1.5 block">{isRTL ? 'تفاصيل إضافية' : 'Additional Details'}</Label>
            <Textarea
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder={isRTL ? 'اشرح سبب الإرجاع بمزيد من التفاصيل...' : 'Explain the reason for return in more detail...'}
              className="min-h-[100px] text-sm resize-none"
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground text-end mt-1">
              {additionalDetails.length}/500
            </p>
          </div>

          {/* Evidence Upload (UI only) */}
          <div>
            <Label className="text-xs mb-1.5 block">{isRTL ? 'صور الأدلة' : 'Evidence Photos'}</Label>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: evidenceCount }).map((_, idx) => (
                <div key={idx} className="w-20 h-20 rounded-lg border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-center relative group">
                  <Camera className="size-6 text-emerald-400" />
                  <button
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setEvidenceCount(Math.max(0, evidenceCount - 1))}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {evidenceCount < 5 && (
                <button
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-emerald-400 dark:hover:border-emerald-600 flex flex-col items-center justify-center gap-1 transition-colors"
                  onClick={() => setEvidenceCount(evidenceCount + 1)}
                >
                  <Upload className="size-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{isRTL ? 'رفع' : 'Upload'}</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              {isRTL ? 'يمكنك رفع حتى 5 صور (للعرض فقط)' : 'You can upload up to 5 photos (UI only)'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Preferred Resolution */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <CreditCard className="size-4 text-emerald-600" />
            {isRTL ? 'الحل المفضل' : 'Preferred Resolution'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {RESOLUTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  resolution === opt.value
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm'
                    : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
                onClick={() => setResolution(opt.value)}
              >
                <div className="flex justify-center mb-1.5">
                  {opt.value === 'refund' && <RefreshCcw className={`size-5 ${resolution === opt.value ? 'text-emerald-600' : 'text-muted-foreground'}`} />}
                  {opt.value === 'exchange' && <ShoppingBag className={`size-5 ${resolution === opt.value ? 'text-emerald-600' : 'text-muted-foreground'}`} />}
                  {opt.value === 'store_credit' && <CreditCard className={`size-5 ${resolution === opt.value ? 'text-emerald-600' : 'text-muted-foreground'}`} />}
                </div>
                <p className={`text-xs font-medium ${resolution === opt.value ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                  {isRTL ? opt.labelAr : opt.labelEn}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary & Submit */}
      {selectedItems.size > 0 && (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{isRTL ? 'ملخص الاسترداد' : 'Refund Summary'}</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {formatPrice(calculateRefundAmount())}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {selectedItems.size} {isRTL ? 'عنصر' : 'item(s)'} {isRTL ? 'محدد' : 'selected'} · {isRTL ? 'الحل:' : 'Resolution:'} {RESOLUTION_OPTIONS.find((r) => r.value === resolution)?.[isRTL ? 'labelAr' : 'labelEn']}
            </div>
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              size="lg"
              onClick={handleSubmitReturn}
              disabled={submitting || !returnReason}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 me-2 animate-spin" />
                  {isRTL ? 'جاري التقديم...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <RotateCcw className="size-4 me-2" />
                  {isRTL ? 'تقديم طلب الإرجاع' : 'Submit Return Request'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
    );
  };

  const statusFilterOptions = [
    { key: 'all', label: isRTL ? 'الكل' : 'All' },
    { key: 'pending', label: isRTL ? 'قيد الانتظار' : 'Pending' },
    { key: 'approved', label: isRTL ? 'تم القبول' : 'Approved' },
    { key: 'rejected', label: isRTL ? 'مرفوض' : 'Rejected' },
    { key: 'processing', label: isRTL ? 'قيد المعالجة' : 'Processing' },
    { key: 'completed', label: isRTL ? 'مكتمل' : 'Completed' },
  ];

  // Loading state
  if (loading && activeTab === 'my-returns') {
    return (
      <div className="container mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 animate-pulse" />
          <div className="h-8 w-40 bg-muted rounded animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-muted rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900">
          <RotateCcw className="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{t('returnsAndRefunds')}</h1>
          <p className="text-sm text-muted-foreground">{t('returnsDesc')}</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'my-returns' | 'request-return')} className="space-y-4">
        <TabsList className="bg-muted/50 h-10">
          <TabsTrigger value="my-returns" className="text-sm gap-1.5">
            <FileText className="size-3.5" />
            {isRTL ? 'إرجاعاتي' : 'My Returns'}
            {returns.length > 0 && (
              <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-emerald-500 text-white border-0">
                {returns.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="request-return" className="text-sm gap-1.5">
            <RotateCcw className="size-3.5" />
            {isRTL ? 'طلب إرجاع' : 'Request Return'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-returns" className="space-y-4">
          {/* Status Filter Pills */}
          <div className="flex gap-2 flex-wrap">
            {statusFilterOptions.map((opt) => (
              <Button
                key={opt.key}
                variant={statusFilter === opt.key ? 'default' : 'outline'}
                size="sm"
                className={`text-xs h-8 ${
                  statusFilter === opt.key
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
                onClick={() => setStatusFilter(opt.key)}
              >
                {opt.label}
                {opt.key !== 'all' && statusCounts[opt.key] !== undefined && (
                  <span className="ms-1 text-[10px] opacity-70">({statusCounts[opt.key] || 0})</span>
                )}
              </Button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRTL ? 'بحث برقم الطلب أو المنتج...' : 'Search by order #, product...'}
              className={`h-9 text-sm ${isRTL ? 'pr-9' : 'pl-9'}`}
            />
          </div>

          {/* Returns List */}
          {filteredReturns.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mb-4">
                <RotateCcw className="size-10 text-emerald-300 dark:text-emerald-700" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {isRTL ? 'لا توجد إرجاعات' : 'No Returns Found'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {statusFilter !== 'all'
                  ? isRTL ? 'لا توجد إرجاعات بهذه الحالة' : 'No returns match the selected status'
                  : isRTL ? 'لم تقم بأي طلبات إرجاع بعد' : "You haven't made any return requests yet"}
              </p>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setActiveTab('request-return')}
              >
                <RotateCcw className="size-3.5 me-1" />
                {isRTL ? 'طلب إرجاع جديد' : 'Request a Return'}
              </Button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-380px)] overflow-y-auto scrollbar-thin">
              {filteredReturns.map((ret) => renderReturnCard(ret))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="request-return">
          {renderRequestReturn()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
