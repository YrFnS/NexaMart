'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  Store,
  ShoppingCart,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  UserCheck,
  Wallet,
  LayoutDashboard,
} from 'lucide-react';
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { STATUS_COLORS, CHART_COLORS } from '@/lib/theme';
import { adminFetch } from '@/lib/admin-api';

interface DashboardData {
  kpi: {
    gmv: number;
    gmvChange: number;
    totalUsers: number;
    totalUsersChange: number;
    activeSellers: number;
    activeSellersChange: number;
    totalOrders: number;
    totalOrdersChange: number;
    platformRevenue: number;
    platformRevenueChange: number;
    avgOrderValue: number;
    avgOrderValueChange: number;
  };
  revenueChart: { month: string; revenue: number }[];
  ordersByStatus: { status: string; count: number }[];
  categoryDist: { category: string; value: number }[];
  topSellers: { name: string; revenue: number; orders: number; rating: number }[];
  recentSignups: { name: string; email: string; role: string; date: string }[];
  recentDisputes: { orderNum: string; buyer: string; seller: string; reason: string; status: string }[];
}

const emptyData: DashboardData = {
  kpi: {
    gmv: 0, gmvChange: 0,
    totalUsers: 0, totalUsersChange: 0,
    activeSellers: 0, activeSellersChange: 0,
    totalOrders: 0, totalOrdersChange: 0,
    platformRevenue: 0, platformRevenueChange: 0,
    avgOrderValue: 0, avgOrderValueChange: 0,
  },
  revenueChart: [],
  ordersByStatus: [],
  categoryDist: [],
  topSellers: [],
  recentSignups: [],
  recentDisputes: [],
};

const revenueChartConfig: ChartConfig = {
  revenue: { label: 'Revenue', color: '#10b981' },
};

const ordersChartConfig: ChartConfig = {
  count: { label: 'Orders', color: '#10b981' },
  Pending: { label: 'Pending', color: STATUS_COLORS.Pending.chart },
  Processing: { label: 'Processing', color: STATUS_COLORS.Processing.chart },
  Shipped: { label: 'Shipped', color: STATUS_COLORS.Shipped.chart },
  Delivered: { label: 'Delivered', color: STATUS_COLORS.Delivered.chart },
  Cancelled: { label: 'Cancelled', color: STATUS_COLORS.Cancelled.chart },
  Disputed: { label: 'Disputed', color: STATUS_COLORS.Disputed.chart },
};

export function AdminDashboard() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await adminFetch('/api/admin/dashboard');
        if (res.ok) {
          const json = await res.json();
          if (json && json.kpi) setData(json);
        }
      } catch {
        // keep empty data
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const categoryChartConfig: ChartConfig = Object.fromEntries(
    data.categoryDist.map((item, i) => [item.category, { label: item.category, color: CHART_COLORS[i] }])
  );

  const kpiCards = [
    { title: t('adminKpiGMV'), value: formatPrice(data.kpi.gmv), change: data.kpi.gmvChange, icon: DollarSign, color: 'emerald' },
    { title: t('totalUsers'), value: data.kpi.totalUsers.toLocaleString(), change: data.kpi.totalUsersChange, icon: Users, color: 'teal' },
    { title: t('activeSellers'), value: data.kpi.activeSellers.toLocaleString(), change: data.kpi.activeSellersChange, icon: Store, color: 'cyan' },
    { title: t('adminKpiTotalOrders'), value: data.kpi.totalOrders.toLocaleString(), change: data.kpi.totalOrdersChange, icon: ShoppingCart, color: 'violet' },
    { title: t('platformRevenue'), value: formatPrice(data.kpi.platformRevenue), change: data.kpi.platformRevenueChange, icon: TrendingUp, color: 'amber' },
    { title: t('adminKpiAvgOrder'), value: formatPrice(data.kpi.avgOrderValue), change: data.kpi.avgOrderValueChange, icon: BarChart3, color: 'rose' },
  ];

  const colorMap: Record<string, { bg: string; icon: string; darkBg: string; darkIcon: string }> = {
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', darkBg: 'dark:bg-emerald-950/50', darkIcon: 'dark:text-emerald-400' },
    teal: { bg: 'bg-teal-50', icon: 'text-teal-600', darkBg: 'dark:bg-teal-950/50', darkIcon: 'dark:text-teal-400' },
    cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', darkBg: 'dark:bg-cyan-950/50', darkIcon: 'dark:text-cyan-400' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600', darkBg: 'dark:bg-violet-950/50', darkIcon: 'dark:text-violet-400' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', darkBg: 'dark:bg-amber-950/50', darkIcon: 'dark:text-amber-400' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', darkBg: 'dark:bg-rose-950/50', darkIcon: 'dark:text-rose-400' },
  };

  const disputeStatusBadge = (status: string) => {
    const sc = STATUS_COLORS[status];
    return sc ? `${sc.bg} ${sc.text}` : '';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi, i) => {
          const colors = colorMap[kpi.color];
          const Icon = kpi.icon;
          const isPositive = kpi.change >= 0;
          return (
            <Card key={i} className="relative overflow-hidden">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground truncate">{kpi.title}</p>
                    <p className="text-lg md:text-xl font-bold truncate">{kpi.value}</p>
                    <div className="flex items-center gap-1">
                      {isPositive ? (
                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-rose-500" />
                      )}
                      <span className={`text-xs font-medium ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {Math.abs(kpi.change)}%
                      </span>
                    </div>
                  </div>
                  <div className={`h-10 w-10 rounded-lg ${colors.bg} ${colors.darkBg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${colors.icon} ${colors.darkIcon}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue Chart */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('adminRevenueChart')}</CardTitle>
            <CardDescription className="text-xs">{t('sellerRevenueChartDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {data.revenueChart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground min-h-[200px]">
                <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">{t('noResults')}</p>
                <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
              </div>
            ) : (
              <ChartContainer config={revenueChartConfig} className="min-h-[200px] h-[260px] w-full">
                <AreaChart data={data.revenueChart} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#fillRevenue)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('adminOrdersByStatus')}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.ordersByStatus.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground min-h-[200px]">
                <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">{t('noResults')}</p>
                <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
              </div>
            ) : (
              <ChartContainer config={ordersChartConfig} className="min-h-[200px] h-[260px] w-full">
                <BarChart data={data.ordersByStatus} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="status" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {data.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status]?.chart || '#6b7280'} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Distribution + Top Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Distribution */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('adminCategoryDist')}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.categoryDist.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground min-h-[200px]">
                <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">{t('noResults')}</p>
                <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
              </div>
            ) : (
              <ChartContainer config={categoryChartConfig} className="min-h-[200px] h-[260px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={data.categoryDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    dataKey="value"
                    nameKey="category"
                    paddingAngle={2}
                  >
                    {data.categoryDist.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="category" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Sellers */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('adminTopSellers')}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.topSellers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground min-h-[200px]">
                <Store className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">{t('noResults')}</p>
                <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t('adminStore')}</TableHead>
                    <TableHead className="text-xs text-end">{t('revenue')}</TableHead>
                    <TableHead className="text-xs text-end">{t('orders')}</TableHead>
                    <TableHead className="text-xs text-end">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topSellers.map((seller, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium py-2">{seller.name}</TableCell>
                      <TableCell className="text-xs text-end py-2">{formatPrice(seller.revenue)}</TableCell>
                      <TableCell className="text-xs text-end py-2">{seller.orders.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-end py-2">
                        <span className="inline-flex items-center gap-0.5">
                          <span className="text-amber-500">&#9733;</span>
                          {seller.rating}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Signups + Recent Disputes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Signups */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('adminRecentSignups')}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentSignups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">{t('noResults')}</p>
                <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentSignups.map((user, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-medium">{user.name}</p>
                        <p className="text-[11px] text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {user.role}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{user.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Disputes */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('adminRecentDisputes')}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentDisputes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground min-h-[200px]">
                <LayoutDashboard className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">{t('noResults')}</p>
                <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t('adminOrderNum')}</TableHead>
                    <TableHead className="text-xs">{t('adminBuyer')}</TableHead>
                    <TableHead className="text-xs">{t('adminReason')}</TableHead>
                    <TableHead className="text-xs">{t('adminStatus')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentDisputes.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium py-2">{d.orderNum}</TableCell>
                      <TableCell className="text-xs py-2">{d.buyer}</TableCell>
                      <TableCell className="text-xs py-2">{d.reason}</TableCell>
                      <TableCell className="py-2">
                        <Badge className={`text-[10px] px-1.5 py-0 border-0 ${disputeStatusBadge(d.status)}`}>
                          {d.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{t('adminQuickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="text-xs h-8 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950">
              <Eye className="h-3.5 w-3.5 me-1.5" />
              {t('adminViewAllOrders')}
            </Button>
            <Button variant="outline" className="text-xs h-8 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950">
              <UserCheck className="h-3.5 w-3.5 me-1.5" />
              {t('adminManageUsers')}
            </Button>
            <Button variant="outline" className="text-xs h-8 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950">
              <Wallet className="h-3.5 w-3.5 me-1.5" />
              {t('adminViewPayouts')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
