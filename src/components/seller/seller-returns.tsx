'use client';

import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  CreditCard,
  RefreshCcw,
  ShoppingBag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';

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
  buyerName: string;
  buyerId: string;
  sellerNote?: string;
  timeline: { status: string; date: string; note?: string }[];
  evidencePhotos: string[];
}

const STATUS_CONFIG: Record<ReturnStatus, { color: string; bgColor: string; icon: React.ElementType }> = {
  pending: { color: 'text-amber-700 dark:text-amber-300', bgColor: 'bg-amber-100 dark:bg-amber-900/40', icon: Clock },
  approved: { color: 'text-emerald-700 dark:text-emerald-300', bgColor: 'bg-emerald-100 dark:bg-emerald-900/40', icon: CheckCircle2 },
  rejected: { color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/40', icon: XCircle },
  processing: { color: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-100 dark:bg-blue-900/40', icon: Loader2 },
  completed: { color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/40', icon: CheckCircle2 },
};

export function SellerReturns() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const [returns, setReturns] = useState<ReturnEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<ReturnEntry | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [sellerNote, setSellerNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchReturns = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/returns?sellerId=store1${activeTab !== 'all' ? `&status=${activeTab}` : ''}`);
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
    fetchReturns();
  }, [activeTab]);

  const filtered = returns.filter((r) => {
    const matchesSearch =
      r.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.productName.toLowerCase().includes(search.toLowerCase()) ||
      r.buyerName.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const pendingCount = returns.filter((r) => r.status === 'pending').length;

  const handleApprove = (ret: ReturnEntry) => {
    setActionLoading(true);
    setTimeout(() => {
      setReturns(returns.map((r) =>
        r.id === ret.id
          ? {
              ...r,
              status: 'approved' as ReturnStatus,
              sellerNote: sellerNote || undefined,
              updatedAt: new Date().toISOString(),
              timeline: [
                ...r.timeline,
                { status: 'Approved', date: new Date().toISOString(), note: sellerNote || 'Seller approved the return' },
              ],
            }
          : r
      ));
      if (selectedReturn?.id === ret.id) {
        setSelectedReturn({
          ...ret,
          status: 'approved',
          sellerNote: sellerNote || undefined,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...ret.timeline,
            { status: 'Approved', date: new Date().toISOString(), note: sellerNote || 'Seller approved the return' },
          ],
        });
      }
      setSellerNote('');
      setActionLoading(false);
      toast.success(isRTL ? 'تم قبول طلب الإرجاع' : 'Return request approved');
    }, 800);
  };

  const handleReject = (ret: ReturnEntry) => {
    setActionLoading(true);
    setTimeout(() => {
      setReturns(returns.map((r) =>
        r.id === ret.id
          ? {
              ...r,
              status: 'rejected' as ReturnStatus,
              sellerNote: sellerNote || undefined,
              updatedAt: new Date().toISOString(),
              timeline: [
                ...r.timeline,
                { status: 'Rejected', date: new Date().toISOString(), note: sellerNote || 'Seller rejected the return' },
              ],
            }
          : r
      ));
      if (selectedReturn?.id === ret.id) {
        setSelectedReturn({
          ...ret,
          status: 'rejected',
          sellerNote: sellerNote || undefined,
          updatedAt: new Date().toISOString(),
          timeline: [
            ...ret.timeline,
            { status: 'Rejected', date: new Date().toISOString(), note: sellerNote || 'Seller rejected the return' },
          ],
        });
      }
      setSellerNote('');
      setActionLoading(false);
      toast.success(isRTL ? 'تم رفض طلب الإرجاع' : 'Return request rejected');
    }, 800);
  };

  const openDetail = (ret: ReturnEntry) => {
    setSelectedReturn(ret);
    setSellerNote(ret.sellerNote || '');
    setShowDetail(true);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(getLocale(isRTL), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <RotateCcw className="size-5 text-emerald-600" />
            {isRTL ? 'إدارة الإرجاعات' : 'Returns Management'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {returns.length} {isRTL ? 'طلب إرجاع' : 'return requests'} · {pendingCount} {isRTL ? 'قيد الانتظار' : 'pending'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <Clock className="size-5 mx-auto text-amber-500 mb-1" />
            <p className="text-lg font-bold">{returns.filter((r) => r.status === 'pending').length}</p>
            <p className="text-[10px] text-muted-foreground">{isRTL ? 'قيد الانتظار' : 'Pending'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="size-5 mx-auto text-emerald-500 mb-1" />
            <p className="text-lg font-bold">{returns.filter((r) => r.status === 'approved').length}</p>
            <p className="text-[10px] text-muted-foreground">{isRTL ? 'تم القبول' : 'Approved'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <Loader2 className="size-5 mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold">{returns.filter((r) => r.status === 'processing').length}</p>
            <p className="text-[10px] text-muted-foreground">{isRTL ? 'قيد المعالجة' : 'Processing'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="size-5 mx-auto text-green-500 mb-1" />
            <p className="text-lg font-bold">{returns.filter((r) => r.status === 'completed').length}</p>
            <p className="text-[10px] text-muted-foreground">{isRTL ? 'مكتمل' : 'Completed'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs & Search */}
      <Card>
        <CardContent className="p-3 space-y-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="h-9 bg-muted/50 flex-wrap">
              <TabsTrigger value="all" className="text-xs h-7">All ({returns.length})</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs h-7">Pending ({returns.filter((r) => r.status === 'pending').length})</TabsTrigger>
              <TabsTrigger value="approved" className="text-xs h-7">Approved ({returns.filter((r) => r.status === 'approved').length})</TabsTrigger>
              <TabsTrigger value="processing" className="text-xs h-7">Processing ({returns.filter((r) => r.status === 'processing').length})</TabsTrigger>
              <TabsTrigger value="completed" className="text-xs h-7">Completed ({returns.filter((r) => r.status === 'completed').length})</TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs h-7">Rejected ({returns.filter((r) => r.status === 'rejected').length})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
            <Input
              placeholder={isRTL ? 'بحث برقم الطلب، المنتج، المشتري...' : 'Search by order #, product, buyer...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9 h-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Returns List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <RotateCcw className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">{isRTL ? 'لا توجد طلبات إرجاع' : 'No return requests found'}</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((ret) => {
            const config = STATUS_CONFIG[ret.status];
            const StatusIcon = config.icon;
            return (
              <Card key={ret.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Product Icon */}
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="size-5 text-muted-foreground" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge className={`${config.bgColor} ${config.color} text-[10px] font-medium border-0`}>
                          <StatusIcon className={`size-3 me-1 ${ret.status === 'processing' ? 'animate-spin' : ''}`} />
                          {ret.status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {ret.resolutionLabel}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate">{ret.productName}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="font-mono">{ret.orderNumber}</span>
                        <span>·</span>
                        <span>{isRTL ? 'المشتري' : 'Buyer'}: {ret.buyerName}</span>
                        <span>·</span>
                        <span>{formatDate(ret.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1">
                        <AlertTriangle className="size-3" />
                        <span>{ret.reasonLabel}</span>
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatPrice(ret.refundAmount)}
                      </p>
                      {ret.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2"
                            onClick={() => { openDetail(ret); }}
                          >
                            <CheckCircle2 className="size-3 me-0.5" />
                            {isRTL ? 'قبول' : 'Approve'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] text-red-600 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950 px-2"
                            onClick={() => { openDetail(ret); }}
                          >
                            <XCircle className="size-3 me-0.5" />
                            {isRTL ? 'رفض' : 'Reject'}
                          </Button>
                        </div>
                      )}
                      {ret.status !== 'pending' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] px-2"
                          onClick={() => openDetail(ret)}
                        >
                          <Eye className="size-3 me-0.5" />
                          {isRTL ? 'عرض' : 'View'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedReturn && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <RotateCcw className="size-4 text-emerald-600" />
                  <span>{isRTL ? 'طلب إرجاع' : 'Return Request'} — {selectedReturn.orderNumber}</span>
                  <Badge className={`${STATUS_CONFIG[selectedReturn.status].bgColor} ${STATUS_CONFIG[selectedReturn.status].color} text-xs border-0`}>
                    {selectedReturn.status}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {selectedReturn.productName} · {formatPrice(selectedReturn.refundAmount)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Product & Buyer Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {isRTL ? 'المنتج' : 'Product'}
                    </h4>
                    <p className="text-sm font-medium">{selectedReturn.productName}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? 'الكمية' : 'Qty'}: {selectedReturn.quantity}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      {isRTL ? 'المشتري' : 'Buyer'}
                    </h4>
                    <p className="text-sm font-medium">{selectedReturn.buyerName}</p>
                    <p className="text-xs text-muted-foreground">ID: {selectedReturn.buyerId}</p>
                  </div>
                </div>

                <Separator />

                {/* Reason */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {isRTL ? 'سبب الإرجاع' : 'Return Reason'}
                  </h4>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-500" />
                    <span className="text-sm font-medium">{selectedReturn.reasonLabel}</span>
                  </div>
                  {selectedReturn.details && (
                    <p className="text-sm text-muted-foreground mt-1 ms-6">{selectedReturn.details}</p>
                  )}
                </div>

                {/* Resolution */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {isRTL ? 'الحل المطلوب' : 'Requested Resolution'}
                  </h4>
                  <div className="flex items-center gap-2">
                    {selectedReturn.resolution === 'refund' && <RefreshCcw className="size-4 text-emerald-600" />}
                    {selectedReturn.resolution === 'exchange' && <ShoppingBag className="size-4 text-emerald-600" />}
                    {selectedReturn.resolution === 'store_credit' && <CreditCard className="size-4 text-emerald-600" />}
                    <span className="text-sm font-medium">{selectedReturn.resolutionLabel}</span>
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatPrice(selectedReturn.refundAmount)}
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    {isRTL ? 'حالة الإرجاع' : 'Return Timeline'}
                  </h4>
                  <div className="space-y-3">
                    {selectedReturn.timeline.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="size-3.5" />
                          </div>
                          {idx < selectedReturn.timeline.length - 1 && (
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
                </div>

                {/* Approve/Reject Actions (only for pending) */}
                {selectedReturn.status === 'pending' && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        {isRTL ? 'ملاحظة البائع' : 'Seller Note'} ({isRTL ? 'اختياري' : 'optional'})
                      </h4>
                      <Textarea
                        value={sellerNote}
                        onChange={(e) => setSellerNote(e.target.value)}
                        placeholder={isRTL ? 'أضف ملاحظة للمشتري...' : 'Add a note for the buyer...'}
                        className="min-h-[80px] text-sm resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleApprove(selectedReturn)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <Loader2 className="size-4 me-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="size-4 me-2" />
                        )}
                        {isRTL ? 'قبول الإرجاع' : 'Approve Return'}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-red-600 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        onClick={() => handleReject(selectedReturn)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <Loader2 className="size-4 me-2 animate-spin" />
                        ) : (
                          <XCircle className="size-4 me-2" />
                        )}
                        {isRTL ? 'رفض الإرجاع' : 'Reject Return'}
                      </Button>
                    </div>
                  </>
                )}

                {/* Move to Processing (only for approved) */}
                {selectedReturn.status === 'approved' && (
                  <>
                    <Separator />
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        setReturns(returns.map((r) =>
                          r.id === selectedReturn.id
                            ? {
                                ...r,
                                status: 'processing' as ReturnStatus,
                                updatedAt: new Date().toISOString(),
                                timeline: [
                                  ...r.timeline,
                                  { status: 'Processing', date: new Date().toISOString(), note: 'Seller is processing the return' },
                                ],
                              }
                            : r
                        ));
                        setSelectedReturn({
                          ...selectedReturn,
                          status: 'processing',
                          updatedAt: new Date().toISOString(),
                          timeline: [
                            ...selectedReturn.timeline,
                            { status: 'Processing', date: new Date().toISOString(), note: 'Seller is processing the return' },
                          ],
                        });
                        toast.success(isRTL ? 'تم تحديث الحالة إلى قيد المعالجة' : 'Status updated to Processing');
                      }}
                    >
                      <Loader2 className="size-4 me-2" />
                      {isRTL ? 'بدء المعالجة' : 'Start Processing'}
                    </Button>
                  </>
                )}

                {/* Complete (only for processing) */}
                {selectedReturn.status === 'processing' && (
                  <>
                    <Separator />
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        setReturns(returns.map((r) =>
                          r.id === selectedReturn.id
                            ? {
                                ...r,
                                status: 'completed' as ReturnStatus,
                                updatedAt: new Date().toISOString(),
                                timeline: [
                                  ...r.timeline,
                                  { status: 'Completed', date: new Date().toISOString(), note: 'Return completed successfully' },
                                ],
                              }
                            : r
                        ));
                        setSelectedReturn({
                          ...selectedReturn,
                          status: 'completed',
                          updatedAt: new Date().toISOString(),
                          timeline: [
                            ...selectedReturn.timeline,
                            { status: 'Completed', date: new Date().toISOString(), note: 'Return completed successfully' },
                          ],
                        });
                        toast.success(isRTL ? 'تم إكمال الإرجاع بنجاح' : 'Return completed successfully');
                      }}
                    >
                      <CheckCircle2 className="size-4 me-2" />
                      {isRTL ? 'إكمال الإرجاع' : 'Complete Return'}
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
