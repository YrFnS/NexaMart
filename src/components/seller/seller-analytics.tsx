'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { STATUS_COLORS, CHART_COLORS } from '@/lib/theme';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, BarChart3 } from 'lucide-react';

type DateRange = '7D' | '30D' | '90D' | '12M';

const revenueData7D = [
  { date: 'Mon', revenue: 420, orders: 8 },
  { date: 'Tue', revenue: 580, orders: 12 },
  { date: 'Wed', revenue: 390, orders: 7 },
  { date: 'Thu', revenue: 720, orders: 15 },
  { date: 'Fri', revenue: 890, orders: 18 },
  { date: 'Sat', revenue: 1100, orders: 22 },
  { date: 'Sun', revenue: 650, orders: 13 },
];

const revenueData30D = [
  { date: 'Week 1', revenue: 3200, orders: 64 },
  { date: 'Week 2', revenue: 4100, orders: 82 },
  { date: 'Week 3', revenue: 3800, orders: 76 },
  { date: 'Week 4', revenue: 5200, orders: 104 },
];

const revenueData90D = [
  { date: 'Jan', revenue: 12400, orders: 248 },
  { date: 'Feb', revenue: 15800, orders: 316 },
  { date: 'Mar', revenue: 18200, orders: 364 },
];

const revenueData12M = [
  { date: 'Jan', revenue: 2400, orders: 48 },
  { date: 'Feb', revenue: 3200, orders: 64 },
  { date: 'Mar', revenue: 3800, orders: 76 },
  { date: 'Apr', revenue: 4100, orders: 82 },
  { date: 'May', revenue: 3500, orders: 70 },
  { date: 'Jun', revenue: 4800, orders: 96 },
  { date: 'Jul', revenue: 5200, orders: 104 },
  { date: 'Aug', revenue: 4600, orders: 92 },
  { date: 'Sep', revenue: 5100, orders: 102 },
  { date: 'Oct', revenue: 5800, orders: 116 },
  { date: 'Nov', revenue: 6200, orders: 124 },
  { date: 'Dec', revenue: 7100, orders: 142 },
];

const ordersByStatusData = [
  { name: 'Pending', value: 18, fill: STATUS_COLORS.Pending.chart },
  { name: 'Processing', value: 24, fill: STATUS_COLORS.Processing.chart },
  { name: 'Shipped', value: 32, fill: STATUS_COLORS.Shipped.chart },
  { name: 'Delivered', value: 68, fill: STATUS_COLORS.Delivered.chart },
  { name: 'Cancelled', value: 14, fill: STATUS_COLORS.Cancelled.chart },
];

const topProductsData = [
  { name: 'Wireless Earbuds Pro', sales: 342 },
  { name: 'Smart Watch Ultra', sales: 256 },
  { name: 'Fast Charger 65W', sales: 312 },
  { name: 'USB-C Hub 7-in-1', sales: 198 },
  { name: 'Wireless Mouse', sales: 201 },
  { name: 'Mechanical Keyboard', sales: 167 },
  { name: 'Phone Case Premium', sales: 154 },
];

const categoryData = [
  { name: 'Electronics', value: 45, fill: CHART_COLORS[0] },
  { name: 'Accessories', value: 28, fill: CHART_COLORS[1] },
  { name: 'Audio', value: 15, fill: CHART_COLORS[2] },
  { name: 'Phone Cases', value: 12, fill: CHART_COLORS[4] },
];

const visitorData = [
  { date: 'Mon', visitors: 420, pageViews: 1260 },
  { date: 'Tue', visitors: 580, pageViews: 1740 },
  { date: 'Wed', visitors: 390, pageViews: 1170 },
  { date: 'Thu', visitors: 720, pageViews: 2160 },
  { date: 'Fri', visitors: 890, pageViews: 2670 },
  { date: 'Sat', visitors: 1100, pageViews: 3300 },
  { date: 'Sun', visitors: 650, pageViews: 1950 },
];

const revenueChartConfig: ChartConfig = {
  revenue: { label: 'Revenue', color: '#10b981' },
  orders: { label: 'Orders', color: '#14b8a6' },
};

const visitorChartConfig: ChartConfig = {
  visitors: { label: 'Visitors', color: '#10b981' },
  pageViews: { label: 'Page Views', color: '#14b8a6' },
};

const categoryChartConfig: ChartConfig = {
  Electronics: { label: 'Electronics', color: CHART_COLORS[0] },
  Accessories: { label: 'Accessories', color: CHART_COLORS[1] },
  Audio: { label: 'Audio', color: CHART_COLORS[2] },
  'Phone Cases': { label: 'Phone Cases', color: CHART_COLORS[4] },
};

const topProductsChartConfig: ChartConfig = {
  sales: { label: 'Units Sold', color: '#10b981' },
};

// COLORS now sourced from CHART_COLORS via @/lib/theme

function getDataForRange(range: DateRange) {
  switch (range) {
    case '7D': return revenueData7D;
    case '30D': return revenueData30D;
    case '90D': return revenueData90D;
    case '12M': return revenueData12M;
    default: return revenueData12M;
  }
}

export function SellerAnalytics() {
  const { t } = useI18n();
  const [dateRange, setDateRange] = useState<DateRange>('12M');
  const revenueData = getDataForRange(dateRange);

  const kpis = [
    {
      title: t('sellerKpiRevenueChange'),
      value: '+18.2%',
      isUp: true,
      icon: DollarSign,
      description: 'vs last period',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      title: t('sellerKpiOrdersChange'),
      value: '+12.5%',
      isUp: true,
      icon: ShoppingCart,
      description: 'vs last period',
      color: 'text-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-950/50',
    },
    {
      title: t('sellerKpiAvgOrder'),
      value: formatPrice(57.8),
      isUp: false,
      icon: BarChart3,
      description: '-2.3% vs last period',
      color: 'text-cyan-600',
      bg: 'bg-cyan-50 dark:bg-cyan-950/50',
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{kpi.title}</span>
                  <div className={`p-1.5 rounded-lg ${kpi.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{kpi.value}</span>
                  {kpi.isUp ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{kpi.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2">
        {(['7D', '30D', '90D', '12M'] as DateRange[]).map((range) => (
          <Button
            key={range}
            variant={dateRange === range ? 'default' : 'outline'}
            size="sm"
            className={`h-8 text-xs ${
              dateRange === range
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'border-emerald-200 dark:border-emerald-800'
            }`}
            onClick={() => setDateRange(range)}
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Revenue Over Time */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{t('sellerRevenueOverTime')}</CardTitle>
          <CardDescription className="text-xs">{t('sellerRevenueOverTimeDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <ChartContainer config={revenueChartConfig} className="h-[300px] w-full">
            <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v) => `$${v}`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Orders by Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('sellerOrdersByStatusChart')}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer config={revenueChartConfig} className="h-[260px] w-full">
              <BarChart data={ordersByStatusData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {ordersByStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t('sellerCategoryDistribution')}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <ChartContainer config={categoryChartConfig} className="h-[260px] w-full">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
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
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Products */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{t('sellerTopSellingChart')}</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <ChartContainer config={topProductsChartConfig} className="h-[300px] w-full">
            <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={11} width={95} />
              <Tooltip content={<ChartTooltipContent />} />
              <Bar dataKey="sales" fill="var(--color-sales)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Visitor Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">{t('sellerVisitorStats')}</CardTitle>
          <CardDescription className="text-xs">{t('sellerVisitorStatsDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <ChartContainer config={visitorChartConfig} className="h-[260px] w-full">
            <LineChart data={visitorData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="visitors"
                stroke="var(--color-visitors)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-visitors)', r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="pageViews"
                stroke="var(--color-pageViews)"
                strokeWidth={2}
                dot={{ fill: 'var(--color-pageViews)', r: 3 }}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
