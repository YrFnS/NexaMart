'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Loader2,
  Package,
  Truck,
  MapPin,
  User,
  CreditCard,
  Calendar,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';

type OrderStatus = 'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  image?: string;
}

interface SellerOrder {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string | null;
  paymentStatus: string;
  shippingAddress: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  processing: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  shipped: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  delivered: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const paymentStyles: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  refunded: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function OrderManagement() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<OrderStatus>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [carrierInput, setCarrierInput] = useState('');

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/seller/orders?storeId=techstore-pro');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json.length) {
            const mapped: SellerOrder[] = json.map((o: Record<string, unknown>) => ({
              id: o.id as string,
              orderNumber: (o.orderNumber as string) || `NM-${o.id}`,
              status: (o.status as string) || 'pending',
              subtotal: (o.subtotal as number) || 0,
              shippingCost: (o.shippingCost as number) || 0,
              discount: (o.discount as number) || 0,
              tax: (o.tax as number) || 0,
              total: (o.total as number) || 0,
              paymentMethod: (o.paymentMethod as string) || null,
              paymentStatus: (o.paymentStatus as string) || 'pending',
              shippingAddress: (o.shippingAddress as string) || null,
              trackingNumber: (o.trackingNumber as string) || null,
              carrier: (o.carrier as string) || null,
              createdAt: (o.createdAt as string) || new Date().toISOString(),
              customerName: ((o.user as Record<string, string>)?.name) || 'Customer',
              customerEmail: ((o.user as Record<string, string>)?.email) || '',
              items: Array.isArray(o.items)
                ? (o.items as Record<string, unknown>[]).map((item: Record<string, unknown>) => ({
                    id: item.id as string,
                    productId: (item.productId as string) || '',
                    productName: ((item.product as Record<string, string>)?.name) || 'Product',
                    quantity: (item.quantity as number) || 1,
                    price: (item.price as number) || 0,
                    total: (item.total as number) || 0,
                  }))
                : [],
            }));
            setOrders(mapped);
          }
        }
      } catch {
        // API not available — leave empty
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const filtered = orders.filter((o) => {
    const matchesTab = activeTab === 'all' || o.status === activeTab;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const handleSaveTracking = () => {
    if (!selectedOrder) return;
    setOrders(orders.map(o =>
      o.id === selectedOrder.id
        ? { ...o, trackingNumber: trackingInput, carrier: carrierInput, status: trackingInput ? 'shipped' : o.status }
        : o
    ));
    setSelectedOrder({
      ...selectedOrder,
      trackingNumber: trackingInput,
      carrier: carrierInput,
      status: trackingInput ? 'shipped' : selectedOrder.status,
    });
  };

  const openDetail = (order: SellerOrder) => {
    setSelectedOrder(order);
    setTrackingInput(order.trackingNumber || '');
    setCarrierInput(order.carrier || '');
    setShowDetail(true);
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
          <h2 className="text-lg font-bold">{t('orderManagement')}</h2>
          <p className="text-sm text-muted-foreground">{orders.length} total orders</p>
        </div>
      </div>

      {/* Tabs & Search */}
      <Card>
        <CardContent className="p-3 space-y-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as OrderStatus)}>
            <TabsList className="h-9 bg-muted/50">
              <TabsTrigger value="all" className="text-xs h-7">All ({orders.length})</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs h-7">Pending ({statusCounts['pending'] || 0})</TabsTrigger>
              <TabsTrigger value="processing" className="text-xs h-7">Processing ({statusCounts['processing'] || 0})</TabsTrigger>
              <TabsTrigger value="shipped" className="text-xs h-7">Shipped ({statusCounts['shipped'] || 0})</TabsTrigger>
              <TabsTrigger value="delivered" className="text-xs h-7">Delivered ({statusCounts['delivered'] || 0})</TabsTrigger>
              <TabsTrigger value="cancelled" className="text-xs h-7">Cancelled ({statusCounts['cancelled'] || 0})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
            <Input
              placeholder="Search by order # or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9 h-9 text-sm"
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
                  <TableHead className="text-xs hidden md:table-cell">Items</TableHead>
                  <TableHead className="text-xs">{t('total')}</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-xs text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <Package className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">{t('noResults')}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(order)}>
                      <TableCell className="text-xs font-mono font-medium">{order.orderNumber}</TableCell>
                      <TableCell className="text-xs">{order.customerName}</TableCell>
                      <TableCell className="text-xs hidden md:table-cell">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</TableCell>
                      <TableCell className="text-xs font-semibold">{formatPrice(order.total)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-[11px] capitalize ${statusStyles[order.status] || ''}`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="text-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openDetail(order); }}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span>Order {selectedOrder.orderNumber}</span>
                  <Badge variant="secondary" className={`text-xs capitalize ${statusStyles[selectedOrder.status] || ''}`}>
                    {selectedOrder.status}
                  </Badge>
                  <Badge variant="secondary" className={`text-xs capitalize ${paymentStyles[selectedOrder.paymentStatus] || ''}`}>
                    {selectedOrder.paymentStatus}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  {t('orderDetails')} — {formatDate(selectedOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                {/* Update Status */}
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <span className="text-xs font-medium">Update Status:</span>
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(v) => handleStatusChange(selectedOrder.id, v)}
                  >
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Order Items */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-600" /> Items ({selectedOrder.items.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                        </div>
                        <span className="text-sm font-semibold">{formatPrice(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Order Summary */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-end">{formatPrice(selectedOrder.subtotal)}</span>
                  <span className="text-muted-foreground">{t('shipping')}</span>
                  <span className="text-end">{selectedOrder.shippingCost === 0 ? t('free') : formatPrice(selectedOrder.shippingCost)}</span>
                  <span className="text-muted-foreground">{t('discount')}</span>
                  <span className="text-end text-red-500">-{formatPrice(selectedOrder.discount)}</span>
                  <span className="text-muted-foreground">Tax</span>
                  <span className="text-end">{formatPrice(selectedOrder.tax)}</span>
                  <span className="font-bold">{t('total')}</span>
                  <span className="text-end font-bold">{formatPrice(selectedOrder.total)}</span>
                </div>

                <Separator />

                {/* Customer Info */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <User className="h-4 w-4 text-emerald-600" /> Customer
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Name</span>
                    <span>{selectedOrder.customerName}</span>
                    <span className="text-muted-foreground">Email</span>
                    <span>{selectedOrder.customerEmail}</span>
                  </div>
                </div>

                {/* Shipping Address */}
                {selectedOrder.shippingAddress && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-600" /> Shipping Address
                    </h4>
                    <p className="text-sm text-muted-foreground">{selectedOrder.shippingAddress}</p>
                  </div>
                )}

                {/* Tracking Info */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-emerald-600" /> Tracking Information
                  </h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Carrier</label>
                        <Input
                          value={carrierInput}
                          onChange={(e) => setCarrierInput(e.target.value)}
                          placeholder="e.g. Aramex, DHL"
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Tracking Number</label>
                        <Input
                          value={trackingInput}
                          onChange={(e) => setTrackingInput(e.target.value)}
                          placeholder="e.g. TRK-123456"
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                    </div>
                    <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveTracking}>
                      Save Tracking
                    </Button>
                  </div>
                </div>

                {/* Payment Info */}
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-600" /> Payment
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Method</span>
                    <span>{selectedOrder.paymentMethod || 'N/A'}</span>
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="secondary" className={`text-[11px] capitalize w-fit ${paymentStyles[selectedOrder.paymentStatus] || ''}`}>
                      {selectedOrder.paymentStatus}
                    </Badge>
                  </div>
                </div>

                {/* Order Date */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Order placed on {formatDate(selectedOrder.createdAt)}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
