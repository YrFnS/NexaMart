'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BarChart3,
  Boxes,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  Store,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminFetch } from '@/lib/admin-api';
import { formatPrice } from '@/lib/currency';
import { useI18n } from '@/lib/i18n';
import { CHART_COLORS } from '@/lib/theme';
import { getLocale } from '@/lib/utils';

interface DashboardData {
  kpi: {
    recordedOrderValue: number;
    totalUsers: number;
    activeSellers: number;
    totalOrders: number;
    totalProducts: number;
    totalStores: number;
    avgOrderValue: number;
    deliveredOrders: number;
  };
  orderValueChart: Array<{ month: string; value: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  categoryDist: Array<{ category: string; value: number }>;
  topStores: Array<{
    id: string;
    name: string;
    orderValue: number;
    orders: number;
    rating: number;
  }>;
  recentSignups: Array<{
    name: string;
    email: string;
    role: string;
    date: string;
  }>;
  recentDisputes: Array<{
    orderNum: string;
    buyer: string;
    seller: string;
    reason: string;
    status: string;
  }>;
}

const emptyData: DashboardData = {
  kpi: {
    recordedOrderValue: 0,
    totalUsers: 0,
    activeSellers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalStores: 0,
    avgOrderValue: 0,
    deliveredOrders: 0,
  },
  orderValueChart: [],
  ordersByStatus: [],
  categoryDist: [],
  topStores: [],
  recentSignups: [],
  recentDisputes: [],
};

const orderValueConfig: ChartConfig = {
  value: { label: 'Recorded order value', color: '#d97706' },
};

const statusConfig: ChartConfig = {
  count: { label: 'Orders', color: '#d97706' },
};

const statusTone: Record<string, string> = {
  pending:
    'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  confirmed:
    'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
  preparing:
    'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  shipped:
    'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300',
  delivered:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  cancelled:
    'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  rejected:
    'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  disputed:
    'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
};

function statusLabel(status: string): string {
  return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) =>
    letter.toUpperCase(),
  );
}

export function AdminDashboard() {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  const [data, setData] = useState<DashboardData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const response = await adminFetch('/api/admin/dashboard', {
        cache: 'no-store',
        signal,
      });
      const payload = (await response.json().catch(() => ({}))) as
        | DashboardData
        | { error?: string };
      if (!response.ok || !('kpi' in payload)) {
        throw new Error(
          'error' in payload && payload.error
            ? payload.error
            : 'Failed to load the administration dashboard.',
        );
      }
      setData(payload);
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === 'AbortError') return;
      setData(emptyData);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load the administration dashboard.',
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(
      () => void loadDashboard(controller.signal),
      0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadDashboard]);

  const categoryConfig = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        data.categoryDist.map((entry, index) => [
          entry.category,
          {
            label: entry.category,
            color: CHART_COLORS[index % CHART_COLORS.length],
          },
        ]),
      ),
    [data.categoryDist],
  );

  const monthData = useMemo(
    () =>
      data.orderValueChart.map((entry) => {
        const date = new Date(`${entry.month}-01T00:00:00`);
        return {
          ...entry,
          label: Number.isNaN(date.getTime())
            ? entry.month
            : new Intl.DateTimeFormat(getLocale(isRTL), {
                month: 'short',
                year: '2-digit',
              }).format(date),
        };
      }),
    [data.orderValueChart, isRTL],
  );

  const cards = [
    {
      label: isRTL ? 'قيمة الطلبات المسجلة' : 'Recorded order value',
      value: formatPrice(data.kpi.recordedOrderValue),
      icon: ClipboardList,
    },
    {
      label: isRTL ? 'إجمالي الطلبات' : 'Total orders',
      value: data.kpi.totalOrders.toLocaleString(getLocale(isRTL)),
      icon: ShoppingCart,
    },
    {
      label: isRTL ? 'طلبات مسلّمة' : 'Delivered orders',
      value: data.kpi.deliveredOrders.toLocaleString(getLocale(isRTL)),
      icon: CheckCircle2,
    },
    {
      label: isRTL ? 'متوسط قيمة الطلب' : 'Average order value',
      value: formatPrice(data.kpi.avgOrderValue),
      icon: BarChart3,
    },
    {
      label: isRTL ? 'المستخدمون' : 'Users',
      value: data.kpi.totalUsers.toLocaleString(getLocale(isRTL)),
      icon: Users,
    },
    {
      label: isRTL ? 'البائعون النشطون' : 'Active sellers',
      value: data.kpi.activeSellers.toLocaleString(getLocale(isRTL)),
      icon: Store,
    },
    {
      label: isRTL ? 'المنتجات النشطة' : 'Active products',
      value: data.kpi.totalProducts.toLocaleString(getLocale(isRTL)),
      icon: Package,
    },
    {
      label: isRTL ? 'المتاجر' : 'Stores',
      value: data.kpi.totalStores.toLocaleString(getLocale(isRTL)),
      icon: Boxes,
    },
  ];

  if (loading && data === emptyData) {
    return (
      <div className="space-y-4 p-4 md:p-6" aria-busy="true">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <main
      className="space-y-5 p-4 md:p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">
            {isRTL ? 'نظرة تشغيلية على المنصة' : 'Platform operations overview'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRTL
              ? 'الطلبات والمستخدمون والمتاجر والمخزون من قاعدة البيانات الحالية.'
              : 'Orders, users, stores, and catalog activity from the current database.'}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => void loadDashboard()}
          disabled={loading}
        >
          <RefreshCw
            className={`me-2 size-4 ${loading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          {isRTL ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <ShieldCheck className="me-2 inline size-4" aria-hidden="true" />
        {isRTL
          ? 'قيمة الطلبات ليست إيراداً محصلاً. NexaMart لا يجمع الدفعات أو العمولة ولا يحوّل أرباح البائعين في هذا الإصدار.'
          : 'Recorded order value is not collected revenue. NexaMart does not collect payments or commission and does not transfer seller earnings in this release.'}
      </div>

      {error && (
        <div
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="mt-1 truncate text-xl font-bold">{card.value}</p>
                </div>
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">
              {isRTL ? 'قيمة الطلبات حسب الشهر' : 'Recorded order value by month'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthData.every((entry) => entry.value === 0) ? (
              <div className="flex min-h-64 flex-col items-center justify-center text-center text-muted-foreground">
                <BarChart3 className="mb-3 size-10 opacity-40" aria-hidden="true" />
                {isRTL ? 'لا توجد قيم طلبات مسجلة.' : 'No recorded order value is available.'}
              </div>
            ) : (
              <ChartContainer
                config={orderValueConfig}
                className="h-64 w-full"
              >
                <AreaChart data={monthData} margin={{ left: 0, right: 8 }}>
                  <defs>
                    <linearGradient
                      id="admin-order-value-fill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                    tickFormatter={(value: number) =>
                      value >= 1_000
                        ? `${Math.round(value / 1_000)}k`
                        : String(value)
                    }
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatPrice(Number(value))}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#d97706"
                    strokeWidth={2}
                    fill="url(#admin-order-value-fill)"
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">
              {isRTL ? 'الطلبات حسب الحالة' : 'Orders by status'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.ordersByStatus.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center text-center text-muted-foreground">
                <ShoppingCart className="mb-3 size-10 opacity-40" aria-hidden="true" />
                {isRTL ? 'لا توجد طلبات.' : 'No orders are available.'}
              </div>
            ) : (
              <ChartContainer config={statusConfig} className="h-64 w-full">
                <BarChart
                  data={data.ordersByStatus.map((entry) => ({
                    ...entry,
                    label: statusLabel(entry.status),
                  }))}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={10}
                  />
                  <YAxis tickLine={false} axisLine={false} fontSize={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" radius={[5, 5, 0, 0]} fill="#d97706" />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">
              {isRTL ? 'المنتجات حسب الفئة' : 'Active products by category'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.categoryDist.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center text-center text-muted-foreground">
                <Package className="mb-3 size-10 opacity-40" aria-hidden="true" />
                {isRTL ? 'لا توجد منتجات نشطة.' : 'No active products are available.'}
              </div>
            ) : (
              <ChartContainer config={categoryConfig} className="h-64 w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={data.categoryDist}
                    dataKey="value"
                    nameKey="category"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {data.categoryDist.map((entry, index) => (
                      <Cell
                        key={entry.category}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="category" />}
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">
              {isRTL ? 'المتاجر حسب قيمة الطلبات' : 'Stores by recorded order value'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.topStores.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center text-center text-muted-foreground">
                <Store className="mb-3 size-10 opacity-40" aria-hidden="true" />
                {isRTL ? 'لا توجد متاجر.' : 'No stores are available.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? 'المتجر' : 'Store'}</TableHead>
                      <TableHead>{isRTL ? 'الطلبات' : 'Orders'}</TableHead>
                      <TableHead>{isRTL ? 'التقييم' : 'Rating'}</TableHead>
                      <TableHead className="text-end">
                        {isRTL ? 'قيمة الطلبات' : 'Order value'}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topStores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell className="font-medium">
                          {store.name}
                        </TableCell>
                        <TableCell>{store.orders}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1">
                            <span className="text-amber-500" aria-hidden="true">
                              ★
                            </span>
                            {store.rating.toFixed(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-end font-semibold">
                          {formatPrice(store.orderValue)}
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isRTL ? 'أحدث الحسابات' : 'Recent accounts'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentSignups.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {isRTL ? 'لا توجد حسابات.' : 'No recent accounts.'}
              </p>
            ) : (
              data.recentSignups.map((user) => (
                <div
                  key={`${user.email}-${user.date}`}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="shrink-0 text-end">
                    <Badge variant="outline">{user.role}</Badge>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(user.date).toLocaleDateString(
                        getLocale(isRTL),
                        { year: 'numeric', month: 'short', day: 'numeric' },
                      )}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isRTL ? 'أحدث النزاعات' : 'Recent disputes'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentDisputes.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {isRTL ? 'لا توجد نزاعات.' : 'No recent disputes.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{isRTL ? 'الطلب' : 'Order'}</TableHead>
                      <TableHead>{isRTL ? 'السبب' : 'Reason'}</TableHead>
                      <TableHead>{isRTL ? 'الحالة' : 'Status'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentDisputes.map((dispute) => (
                      <TableRow key={`${dispute.orderNum}-${dispute.reason}`}>
                        <TableCell>
                          <p className="font-mono text-xs font-semibold">
                            {dispute.orderNum}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {dispute.buyer} · {dispute.seller}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-48 truncate text-xs">
                          {dispute.reason}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              statusTone[dispute.status] ||
                              'bg-muted text-muted-foreground'
                            } border-0`}
                          >
                            {statusLabel(dispute.status)}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isRTL ? 'إجراءات الإدارة' : 'Administration'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/orders">
              <ShoppingCart className="me-2 size-4" aria-hidden="true" />
              {isRTL ? 'إدارة الطلبات' : 'Manage orders'}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/users">
              <Users className="me-2 size-4" aria-hidden="true" />
              {isRTL ? 'إدارة المستخدمين' : 'Manage users'}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/products">
              <Package className="me-2 size-4" aria-hidden="true" />
              {isRTL ? 'مراجعة المنتجات' : 'Review products'}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/stores">
              <Store className="me-2 size-4" aria-hidden="true" />
              {isRTL ? 'إدارة المتاجر' : 'Manage stores'}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
