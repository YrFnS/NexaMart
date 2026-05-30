'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Eye,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Tag,
  List,
  Loader2,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { STATUS_COLORS, CHART_COLORS } from '@/lib/theme';
import { useUserStore } from '@/stores/user-store';

interface DashboardData {
  totalProducts: number;
  totalOrders: number;
  revenue: number;
  visitorCount: number | null;
  conversionRate: number | null;
  monthlySales: { month: string; sales: number }[];
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    user: { name: string | null };
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    price: number;
    soldCount: number;
    images: string;
    rating: number;
  }>;
}

// CHART_COLORS now sourced from @/lib/theme

const revenueChartConfig: ChartConfig = {
  sales: {
    label: 'Revenue',
    color: '#10b981',
  },
};

const orderStatusConfig: ChartConfig = {
  pending: { label: 'Pending', color: STATUS_COLORS.pending.chart },
  processing: { label: 'Processing', color: STATUS_COLORS.processing.chart },
  shipped: { label: 'Shipped', color: STATUS_COLORS.shipped.chart },
  delivered: { label: 'Delivered', color: STATUS_COLORS.delivered.chart },
  cancelled: { label: 'Cancelled', color: STATUS_COLORS.cancelled.chart },
};

const emptyDashboard: DashboardData = {
  totalProducts: 0,
  totalOrders: 0,
  revenue: 0,
  visitorCount: null,
  conversionRate: null,
  monthlySales: [],
  recentOrders: [],
  topProducts: [],
};

const emptyOrderStatusData = [
  { name: 'Pending', value: 0, status: 'pending' },
  { name: 'Processing', value: 0, status: 'processing' },
  { name: 'Shipped', value: 0, status: 'shipped' },
  { name: 'Delivered', value: 0, status: 'delivered' },
  { name: 'Cancelled', value: 0, status: 'cancelled' },
];

function StatusBadge({ status }: { status: string }) {
  const sc = STATUS_COLORS[status];
  return (
    <Badge variant="secondary" className={`text-[11px] capitalize ${sc ? `${sc.bg} ${sc.text}` : ''}`}>
      {status}
    </Badge>
  );
}

export function SellerOverview() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const { user } = useUserStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams();
        if (user?.id) params.set('userId', user.id);
        const res = await fetch(`/api/seller/dashboard?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setData(emptyDashboard);
        }
      } catch {
        setData(emptyDashboard);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const d = data || emptyDashboard;

  const kpis = [
    {
      title: t('sellerKpiRevenue'),
      value: formatPrice(d.revenue),
      change: '+12.5%',
      isUp: true,
      icon: DollarSign,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: t('sellerKpiOrders'),
      value: d.totalOrders.toString(),
      change: '+8.2%',
      isUp: true,
      icon: ShoppingCart,
      color: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/50',
    },
    {
      title: t('sellerKpiProducts'),
      value: d.totalProducts.toString(),
      change: '+3',
      isUp: true,
      icon: Package,
      color: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-50 dark:bg-cyan-950/50',
    },
    {
      title: t('sellerKpiVisitors'),
      value: d.visitorCount !== null ? d.visitorCount.toLocaleString() : '—',
      change: d.visitorCount !== null ? '+5.3%' : '',
      isUp: true,
      icon: Eye,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/50',
    },
    {
      title: t('sellerKpiConversion'),
      value: d.conversionRate !== null ? `${d.conversionRate}%` : '—',
      change: d.conversionRate !== null ? '-0.2%' : '',
      isUp: false,
      icon: TrendingUp,
      color: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-50 dark:bg-violet-950/50',
    },
  ];

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className="hover:shadow-md transition-shadow overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div className={`p-2 rounded-lg ${kpi.bg} shrink-0`}>
                    <Icon className={`h-4 w-4 ${kpi.color}`} />
                  </div>
                  <div className={`flex items-center gap-0.5 text-xs font-medium ${kpi.isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {kpi.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {kpi.change}
                  </div>
                </div>
                <div className="text-lg font-bold truncate">{kpi.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">{kpi.title}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('sellerRevenueChart')}</CardTitle>
            <CardDescription className="text-xs">{t('sellerRevenueChartDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer config={revenueChartConfig} className="min-h-[200px] h-[260px] w-full">
              <LineChart data={d.monthlySales} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `$${v}`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--color-sales)"
                  strokeWidth={2.5}
                  dot={{ fill: 'var(--color-sales)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('sellerOrdersByStatus')}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {d.totalOrders === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm font-medium">{t('noResults')}</p>
                <p className="text-xs">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
              </div>
            ) : (
              <ChartContainer config={orderStatusConfig} className="min-h-[200px] h-[260px] w-full">
                <PieChart>
                  <Pie
                    data={emptyOrderStatusData.map((item, i) => ({
                      ...item,
                      value: (d.recentOrders as Array<{status: string}>).filter(o => o.status === item.status).length || item.value,
                    }))}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {emptyOrderStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend
                    verticalAlign="bottom"
                    height={40}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => <span className="text-xs">{value}</span>}
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Orders */}
        <Card className="lg:col-span-2 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">{t('sellerRecentOrders')}</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-emerald-600 dark:text-emerald-400">
                {t('viewAll')} →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            {d.recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm font-medium">{t('noResults')}</p>
                <p className="text-xs">{isRTL ? 'لا توجد طلبات' : 'No orders yet'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Order #</TableHead>
                    <TableHead className="text-xs">{t('s_customer')}</TableHead>
                    <TableHead className="text-xs">{t('total')}</TableHead>
                    <TableHead className="text-xs">{t('s_status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {d.recentOrders.slice(0, 8).map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="text-xs font-mono">{order.orderNumber}</TableCell>
                      <TableCell className="text-xs">{order.user?.name || 'Customer'}</TableCell>
                      <TableCell className="text-xs font-semibold">{formatPrice(order.total)}</TableCell>
                      <TableCell><StatusBadge status={order.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products + Quick Actions */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t('sellerTopProducts')}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              {d.topProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Package className="h-10 w-10 mb-3 opacity-50" />
                  <p className="text-xs">{isRTL ? 'لا توجد منتجات' : 'No products yet'}</p>
                </div>
              ) : (
                d.topProducts.slice(0, 5).map((product, i) => (
                  <div key={product.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{product.name}</p>
                      <p className="text-[11px] text-muted-foreground">{product.soldCount} sold</p>
                    </div>
                    <span className="text-xs font-semibold">{formatPrice(product.price)}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t('sellerQuickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-2">
              <Button variant="outline" className="w-full justify-start h-9 text-xs border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950">
                <Plus className="h-3.5 w-3.5 me-2 text-emerald-600" />
                {t('addProduct')}
              </Button>
              <Button variant="outline" className="w-full justify-start h-9 text-xs border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950">
                <Tag className="h-3.5 w-3.5 me-2 text-emerald-600" />
                {t('sellerCreateCoupon')}
              </Button>
              <Button variant="outline" className="w-full justify-start h-9 text-xs border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950">
                <List className="h-3.5 w-3.5 me-2 text-emerald-600" />
                {t('viewAll')} {t('orders')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
