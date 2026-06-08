'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  RefreshCw,
  MapPin,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
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
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { adminFetch } from '@/lib/admin-api';

interface OverviewData {
  totalUsers: number;
  totalSellers: number;
  totalStores: number;
  totalOrders: number;
  totalProducts: number;
  totalRevenue: number;
  avgOrderValue: number;
  pendingKYC: number;
  openDisputes: number;
  pendingPayouts: number;
}

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

interface UserGrowthData {
  date: string;
  total: number;
  buyers: number;
  sellers: number;
}

interface CategoryBreakdown {
  id: string;
  name: string;
  productCount: number;
  estimatedRevenue: number;
}

interface RevenueByStore {
  storeId: string;
  storeName: string;
  tier: string;
  revenue: number;
  orders: number;
}

interface OrderStatusBreakdown {
  status: string;
  count: number;
  revenue: number;
}

interface TopProduct {
  name: string;
  category: string;
  price: number;
  soldCount: number;
  revenue: number;
}

interface GeoData {
  city: string;
  orders: number;
  revenue: number;
}

const PIE_COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444'];
const statusColors: Record<string, string> = {
  Pending: '#f59e0b',
  Processing: '#3b82f6',
  Shipped: '#8b5cf6',
  Delivered: '#10b981',
  Cancelled: '#ef4444',
  Disputed: '#f97316',
};

const salesChartConfig: ChartConfig = {
  revenue: { label: 'Revenue', color: '#10b981' },
};

const userGrowthConfig: ChartConfig = {
  total: { label: 'Total Users', color: '#10b981' },
  buyers: { label: 'Buyers', color: '#14b8a6' },
  sellers: { label: 'Sellers', color: '#06b6d4' },
};

const storeChartConfig: ChartConfig = {
  revenue: { label: 'Revenue', color: '#10b981' },
};

function EmptyChartState({ noResults, isRTL }: { noResults: string; isRTL: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
      <p className="text-lg font-medium">{noResults}</p>
      <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
    </div>
  );
}

export function AdminAnalytics() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';

  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState('30');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Data states - initialized empty
  const [overview, setOverview] = useState<OverviewData>({
    totalUsers: 0, totalSellers: 0, totalStores: 0, totalOrders: 0,
    totalProducts: 0, totalRevenue: 0, avgOrderValue: 0,
    pendingKYC: 0, openDisputes: 0, pendingPayouts: 0,
  });
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [revenueByStore, setRevenueByStore] = useState<RevenueByStore[]>([]);
  const [orderStatus, setOrderStatus] = useState<OrderStatusBreakdown[]>([]);
  const [topProducts, _setTopProducts] = useState<TopProduct[]>([]);
  const [geoData, _setGeoData] = useState<GeoData[]>([]);

  const categoryChartConfig: ChartConfig = Object.fromEntries(
    categoryBreakdown.map((item, i) => [item.name, { label: item.name, color: PIE_COLORS[i % PIE_COLORS.length] }])
  );

  const orderStatusConfig: ChartConfig = Object.fromEntries(
    orderStatus.map((item) => [item.status, { label: item.status, color: statusColors[item.status] || '#6b7280' }])
  );

  const getDateRange = () => {
    const to = new Date();
    let from = new Date();
    if (datePreset === '7') from.setDate(from.getDate() - 7);
    else if (datePreset === '30') from.setDate(from.getDate() - 30);
    else if (datePreset === '90') from.setDate(from.getDate() - 90);
    else if (datePreset === 'year') from.setFullYear(from.getFullYear() - 1);
    else if (datePreset === 'custom') {
      if (customFrom) from = new Date(customFrom);
      if (customTo) to.setTime(new Date(customTo).getTime());
    }
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  };

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    const { from, to } = getDateRange();
    try {
      const [overviewRes, salesRes, userRes, categoryRes, storeRes, statusRes] = await Promise.all([
        adminFetch(`/api/admin/analytics?type=overview&startDate=${from}&endDate=${to}`),
        adminFetch(`/api/admin/analytics?type=sales_over_time&startDate=${from}&endDate=${to}`),
        adminFetch(`/api/admin/analytics?type=user_growth&startDate=${from}&endDate=${to}`),
        adminFetch(`/api/admin/analytics?type=category_breakdown&startDate=${from}&endDate=${to}`),
        adminFetch(`/api/admin/analytics?type=revenue_by_store&startDate=${from}&endDate=${to}`),
        adminFetch(`/api/admin/analytics?type=order_status_breakdown&startDate=${from}&endDate=${to}`),
      ]);

      if (overviewRes.ok) {
        const json = await overviewRes.json();
        if (json.overview) setOverview(prev => ({ ...prev, ...json.overview }));
      }
      if (salesRes.ok) {
        const json = await salesRes.json();
        if (json.salesOverTime && Array.isArray(json.salesOverTime)) setSalesData(json.salesOverTime);
      }
      if (userRes.ok) {
        const json = await userRes.json();
        if (json.userGrowth && Array.isArray(json.userGrowth)) setUserGrowth(json.userGrowth);
      }
      if (categoryRes.ok) {
        const json = await categoryRes.json();
        if (json.categoryBreakdown && Array.isArray(json.categoryBreakdown)) setCategoryBreakdown(json.categoryBreakdown);
      }
      if (storeRes.ok) {
        const json = await storeRes.json();
        if (json.revenueByStore && Array.isArray(json.revenueByStore)) setRevenueByStore(json.revenueByStore);
      }
      if (statusRes.ok) {
        const json = await statusRes.json();
        if (json.orderStatusBreakdown && Array.isArray(json.orderStatusBreakdown)) setOrderStatus(json.orderStatusBreakdown);
      }
    } catch {
      // keep empty data
    }
    setLoading(false);
  }, [getDateRange]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAllData();
  }, [datePreset, fetchAllData]);

  const kpiCards = [
    { title: t('adminKpiGMV'), value: formatPrice(overview.totalRevenue), change: 0, icon: DollarSign, color: 'emerald' },
    { title: t('adminKpiTotalOrders'), value: overview.totalOrders.toLocaleString(), change: 0, icon: ShoppingCart, color: 'teal' },
    { title: t('adminKpiAvgOrder'), value: formatPrice(overview.avgOrderValue), change: 0, icon: BarChart3, color: 'cyan' },
    { title: t('totalUsers'), value: overview.totalUsers.toLocaleString(), change: 0, icon: Users, color: 'violet' },
    { title: t('adminConversionRate'), value: '0%', change: 0, icon: TrendingUp, color: 'amber' },
    { title: t('adminTotalRefunds'), value: formatPrice(0), change: 0, icon: DollarSign, color: 'rose' },
  ];

  const colorMap: Record<string, { bg: string; icon: string; darkBg: string; darkIcon: string }> = {
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', darkBg: 'dark:bg-emerald-950/50', darkIcon: 'dark:text-emerald-400' },
    teal: { bg: 'bg-teal-50', icon: 'text-teal-600', darkBg: 'dark:bg-teal-950/50', darkIcon: 'dark:text-teal-400' },
    cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', darkBg: 'dark:bg-cyan-950/50', darkIcon: 'dark:text-cyan-400' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600', darkBg: 'dark:bg-violet-950/50', darkIcon: 'dark:text-violet-400' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', darkBg: 'dark:bg-amber-950/50', darkIcon: 'dark:text-amber-400' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', darkBg: 'dark:bg-rose-950/50', darkIcon: 'dark:text-rose-400' },
  };

  const EmptyChartStateEl = <EmptyChartState noResults={t('noResults')} isRTL={isRTL} />;

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[300px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header + Date Range */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-semibold">{t('adminAnalytics')}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t('adminLast7Days')}</SelectItem>
              <SelectItem value="30">{t('adminLast30Days')}</SelectItem>
              <SelectItem value="90">{t('adminLast90Days')}</SelectItem>
              <SelectItem value="year">{t('adminThisYear')}</SelectItem>
              <SelectItem value="custom">{t('adminCustom')}</SelectItem>
            </SelectContent>
          </Select>
          {datePreset === 'custom' && (
            <>
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="h-8 text-xs w-[130px]" />
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="h-8 text-xs w-[130px]" />
            </>
          )}
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={fetchAllData}>
            <RefreshCw className="h-3.5 w-3.5 me-1.5" />
            {t('adminRefresh')}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((kpi, i) => {
          const colors = colorMap[kpi.color];
          const Icon = kpi.icon;
          const isPositive = kpi.change >= 0;
          return (
            <Card key={i} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{kpi.title}</p>
                    <p className="text-xl font-bold">{kpi.value}</p>
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales Over Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('adminSalesOverTime')}</CardTitle>
            <CardDescription className="text-xs">{t('adminSalesOverTimeDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {salesData.length === 0 ? EmptyChartStateEl : (
              <ChartContainer config={salesChartConfig} className="h-[260px] w-full">
                <AreaChart data={salesData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="fillSalesRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tickLine={false} axisLine={false} fontSize={10} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#fillSalesRevenue)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('adminUserGrowth')}</CardTitle>
            <CardDescription className="text-xs">{t('adminUserGrowthDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {userGrowth.length === 0 ? EmptyChartStateEl : (
              <ChartContainer config={userGrowthConfig} className="h-[260px] w-full">
                <AreaChart data={userGrowth} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <defs>
                    <linearGradient id="fillTotalUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillBuyers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillSellers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={10} tickFormatter={(v: string) => v.slice(5)} />
                  <YAxis tickLine={false} axisLine={false} fontSize={10} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="total" stroke="#10b981" fill="url(#fillTotalUsers)" strokeWidth={2} />
                  <Area type="monotone" dataKey="buyers" stroke="#14b8a6" fill="url(#fillBuyers)" strokeWidth={1.5} />
                  <Area type="monotone" dataKey="sellers" stroke="#06b6d4" fill="url(#fillSellers)" strokeWidth={1.5} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Category - Horizontal Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('adminRevenueByCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length === 0 ? EmptyChartStateEl : (
              <ChartContainer config={categoryChartConfig} className="h-[300px] w-full">
                <BarChart data={categoryBreakdown} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={10} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={11} width={75} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="estimatedRevenue" radius={[0, 4, 4, 0]}>
                    {categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Store - Top 10 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('adminRevenueByStore')}</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByStore.length === 0 ? EmptyChartStateEl : (
              <ChartContainer config={storeChartConfig} className="h-[300px] w-full">
                <BarChart data={revenueByStore.slice(0, 10)} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="storeName" tickLine={false} axisLine={false} fontSize={9} angle={-20} textAnchor="end" height={60} />
                  <YAxis tickLine={false} axisLine={false} fontSize={10} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Order Status Breakdown - Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('adminOrderStatusBreakdown')}</CardTitle>
          </CardHeader>
          <CardContent>
            {orderStatus.length === 0 ? EmptyChartStateEl : (
              <ChartContainer config={orderStatusConfig} className="h-[280px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={orderStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    dataKey="count"
                    nameKey="status"
                    paddingAngle={2}
                  >
                    {orderStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#6b7280'} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="status" />} />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('sellerTopProducts')}</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">{t('noResults')}</p>
                <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">{t('adminProductName')}</TableHead>
                      <TableHead className="text-xs">{t('categories')}</TableHead>
                      <TableHead className="text-xs text-end">{t('price')}</TableHead>
                      <TableHead className="text-xs text-end">{t('adminSold')}</TableHead>
                      <TableHead className="text-xs text-end">{t('revenue')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topProducts.map((product, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                              <Package className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-xs font-medium">{product.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-end">{formatPrice(product.price)}</TableCell>
                        <TableCell className="text-xs text-end">{product.soldCount.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-end font-medium">{formatPrice(product.revenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Geographic Distribution */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{t('adminGeoDistribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          {geoData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MapPin className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">{t('noResults')}</p>
              <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t('adminCity')}</TableHead>
                    <TableHead className="text-xs text-end">{t('orders')}</TableHead>
                    <TableHead className="text-xs text-end">{t('revenue')}</TableHead>
                    <TableHead className="text-xs text-end">{t('adminShare')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {geoData.map((geo, i) => {
                    const totalOrders = geoData.reduce((s, g) => s + g.orders, 0);
                    const share = ((geo.orders / totalOrders) * 100).toFixed(1);
                    return (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-xs font-medium">{geo.city}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-end">{geo.orders.toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-end font-medium">{formatPrice(geo.revenue)}</TableCell>
                        <TableCell className="text-xs text-end">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${share}%` }}
                              />
                            </div>
                            <span className="text-muted-foreground">{share}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
