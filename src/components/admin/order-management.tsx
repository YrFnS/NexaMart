'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ShoppingCart,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  Eye,
  RefreshCw,
  MessageSquarePlus,
  ChevronLeft,
  ChevronRight,
  Package,
  CreditCard,
  MapPin,
  CalendarDays,
  StickyNote,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { adminFetch } from '@/lib/admin-api';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  total: number;
}

interface AdminOrder {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  storeId: string;
  storeName: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;
  total: number;
  trackingNumber: string;
  carrier: string;
  notes: string;
  itemCount: number;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

const ITEMS_PER_PAGE = 10;

export function OrderManagement() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // Dialogs
  const [detailOrder, setDetailOrder] = useState<AdminOrder | null>(null);
  const [statusDialog, setStatusDialog] = useState<AdminOrder | null>(null);
  const [noteDialog, setNoteDialog] = useState<AdminOrder | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (paymentFilter !== 'all') params.set('paymentStatus', paymentFilter);
        if (dateFrom) params.set('startDate', dateFrom);
        if (dateTo) params.set('endDate', dateTo);
        params.set('page', String(page));
        params.set('limit', String(ITEMS_PER_PAGE));

        const res = await adminFetch(`/api/admin/orders?${params}`);
        if (res.ok && !cancelled) {
          const json = await res.json();
          setOrders(json.orders || []);
          setTotal(json.total || 0);
        }
      } catch {
        // fallback
      }
      if (!cancelled) setLoading(false);
    };
    fetchData();
    return () => { cancelled = true; };
  }, [search, statusFilter, paymentFilter, dateFrom, dateTo, page, refreshKey]);

  // Compute summary counts
  const summary = useMemo(() => {
    const counts: Record<string, number> = {
      total: total,
      pending: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      disputed: 0,
    };
    orders.forEach(o => {
      const s = o.status?.toLowerCase() || '';
      if (s in counts) counts[s]++;
    });
    return counts;
  }, [orders, total]);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const handleUpdateStatus = async () => {
    if (!statusDialog || !newStatus) return;
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: statusDialog.id,
          status: newStatus,
          notes: statusNote,
        }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o =>
          o.id === statusDialog.id ? { ...o, status: newStatus, notes: statusNote || o.notes } : o
        ));
        setStatusDialog(null);
        setNewStatus('');
        setStatusNote('');
      }
    } catch {
      // error
    }
    setSaving(false);
  };

  const handleAddNote = async () => {
    if (!noteDialog || !noteText) return;
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: noteDialog.id,
          notes: noteText,
        }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o =>
          o.id === noteDialog.id ? { ...o, notes: noteText } : o
        ));
        setNoteDialog(null);
        setNoteText('');
      }
    } catch {
      // error
    }
    setSaving(false);
  };

  const orderStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      shipped: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
      delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
      cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
      disputed: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    };
    return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  };

  const paymentStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      refunded: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
    };
    return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const summaryCards = [
    { label: 'Total Orders', value: summary.total, icon: ShoppingCart, color: 'emerald' },
    { label: 'Pending', value: summary.pending, icon: Clock, color: 'amber' },
    { label: 'Processing', value: summary.processing, icon: RefreshCw, color: 'blue' },
    { label: 'Shipped', value: summary.shipped, icon: Truck, color: 'violet' },
    { label: 'Delivered', value: summary.delivered, icon: CheckCircle, color: 'emerald' },
    { label: 'Cancelled', value: summary.cancelled, icon: XCircle, color: 'rose' },
    { label: 'Disputed', value: summary.disputed, icon: AlertTriangle, color: 'orange' },
  ];

  const colorMap: Record<string, { bg: string; icon: string; darkBg: string; darkIcon: string }> = {
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', darkBg: 'dark:bg-emerald-950/50', darkIcon: 'dark:text-emerald-400' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', darkBg: 'dark:bg-amber-950/50', darkIcon: 'dark:text-amber-400' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', darkBg: 'dark:bg-blue-950/50', darkIcon: 'dark:text-blue-400' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600', darkBg: 'dark:bg-violet-950/50', darkIcon: 'dark:text-violet-400' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', darkBg: 'dark:bg-rose-950/50', darkIcon: 'dark:text-rose-400' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', darkBg: 'dark:bg-orange-950/50', darkIcon: 'dark:text-orange-400' },
  };

  if (loading && orders.length === 0) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-16 rounded-xl bg-muted animate-pulse" />
        <div className="h-96 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Order Management</h2>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
          onClick={() => setRefreshKey(k => k + 1)}
        >
          <RefreshCw className="h-3.5 w-3.5 me-1.5" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {summaryCards.map((card, i) => {
          const colors = colorMap[card.color];
          const Icon = card.icon;
          return (
            <Card key={i} className="relative overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">{card.label}</p>
                    <p className="text-lg font-bold">{card.value}</p>
                  </div>
                  <div className={`h-8 w-8 rounded-lg ${colors.bg} ${colors.darkBg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${colors.icon} ${colors.darkIcon}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
              <Input
                placeholder="Search by order number..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="ps-9 h-9 text-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full sm:w-[140px] h-9 text-xs"
              placeholder="From"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full sm:w-[140px] h-9 text-xs"
              placeholder="To"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Order #</TableHead>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Store</TableHead>
                  <TableHead className="text-xs">Items</TableHead>
                  <TableHead className="text-xs text-end">{t('total')}</TableHead>
                  <TableHead className="text-xs">Payment</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs text-end">{t('adminActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-xs font-medium font-mono">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs font-medium">{order.customerName}</p>
                          <p className="text-[11px] text-muted-foreground">{order.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{order.storeName}</TableCell>
                      <TableCell className="text-xs text-center">{order.itemCount}</TableCell>
                      <TableCell className="text-xs text-end font-medium">{formatPrice(order.total)}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] px-1.5 py-0 border-0 capitalize ${paymentStatusBadge(order.paymentStatus)}`}>
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] px-1.5 py-0 border-0 capitalize ${orderStatusBadge(order.status)}`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(order.createdAt)}
                      </TableCell>
                      <TableCell className="text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-44">
                            <DropdownMenuItem onClick={() => setDetailOrder(order)}>
                              <Eye className="h-3.5 w-3.5 me-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setStatusDialog(order); setNewStatus(''); setStatusNote(''); }}>
                              <RefreshCw className="h-3.5 w-3.5 me-2 text-blue-500" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setNoteDialog(order); setNoteText(''); }}>
                              <MessageSquarePlus className="h-3.5 w-3.5 me-2 text-amber-500" />
                              Add Note
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {total} orders
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  {isRTL ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  if (p < 1 || p > totalPages) return null;
                  return (
                    <Button
                      key={p}
                      variant={p === page ? 'default' : 'outline'}
                      size="icon"
                      className={`h-7 w-7 text-xs ${p === page ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  {isRTL ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              Order {detailOrder?.orderNumber}
            </DialogTitle>
            <DialogDescription>Full order details and timeline</DialogDescription>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              {/* Status & Payment Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={`text-xs px-2 py-0.5 border-0 capitalize ${orderStatusBadge(detailOrder.status)}`}>
                  {detailOrder.status}
                </Badge>
                <Badge className={`text-xs px-2 py-0.5 border-0 capitalize ${paymentStatusBadge(detailOrder.paymentStatus)}`}>
                  {detailOrder.paymentStatus}
                </Badge>
              </div>

              <Separator />

              {/* Customer & Store */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="text-sm font-medium">{detailOrder.customerName}</p>
                  <p className="text-xs text-muted-foreground">{detailOrder.customerEmail}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Store</p>
                  <p className="text-sm font-medium">{detailOrder.storeName}</p>
                </div>
              </div>

              <Separator />

              {/* Order Items */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Items ({detailOrder.itemCount})
                </h4>
                {detailOrder.items && detailOrder.items.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {detailOrder.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-muted/50 rounded-lg px-3 py-2">
                        <span>Product #{item.productId?.slice(0, 8)}...</span>
                        <span className="text-muted-foreground">x{item.quantity}</span>
                        <span className="font-medium">{formatPrice(item.total)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{detailOrder.itemCount} items in this order</p>
                )}
              </div>

              <Separator />

              {/* Payment Summary */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  Payment Summary
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(detailOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatPrice(detailOrder.shippingCost)}</span>
                  </div>
                  {detailOrder.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-emerald-600">-{formatPrice(detailOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatPrice(detailOrder.tax)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(detailOrder.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="capitalize">{detailOrder.paymentMethod || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Shipping & Tracking */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    Shipping
                  </h4>
                  <p className="text-xs">
                    <span className="text-muted-foreground">Carrier: </span>
                    {detailOrder.carrier || 'N/A'}
                  </p>
                  <p className="text-xs">
                    <span className="text-muted-foreground">Tracking: </span>
                    {detailOrder.trackingNumber || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    Timeline
                  </h4>
                  <p className="text-xs">
                    <span className="text-muted-foreground">Created: </span>
                    {formatDate(detailOrder.createdAt)}
                  </p>
                  <p className="text-xs">
                    <span className="text-muted-foreground">Updated: </span>
                    {formatDate(detailOrder.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {detailOrder.notes && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
                      <StickyNote className="h-4 w-4 text-muted-foreground" />
                      Notes
                    </h4>
                    <p className="text-xs bg-muted/50 rounded-lg px-3 py-2">{detailOrder.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={!!statusDialog} onOpenChange={() => { setStatusDialog(null); setNewStatus(''); setStatusNote(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
            <DialogDescription>
              Order {statusDialog?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">New Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Note (optional)</label>
              <Textarea
                placeholder="Add a note about this status change..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setStatusDialog(null); setNewStatus(''); setStatusNote(''); }}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={!newStatus || saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? 'Updating...' : 'Update Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={!!noteDialog} onOpenChange={() => { setNoteDialog(null); setNoteText(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Note to Order</DialogTitle>
            <DialogDescription>
              Order {noteDialog?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter your note..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNoteDialog(null); setNoteText(''); }}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleAddNote}
              disabled={!noteText || saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? 'Saving...' : 'Save Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
