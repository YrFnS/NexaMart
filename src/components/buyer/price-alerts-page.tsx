'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  TrendingDown,
  Star,
  Trash2,
  Edit3,
  Plus,
  Search,
  ArrowDown,
  Mail,
  Smartphone,
  Calendar,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Check,
  AlertCircle,
  Heart,
  ShoppingCart,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { formatPrice } from '@/lib/currency';

interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  productNameAr: string;
  productImage: string;
  currentPrice: number;
  targetPrice: number;
  alertType: 'below_price' | 'percentage_drop';
  percentageDrop?: number;
  status: 'active' | 'triggered' | 'expired';
  notificationMethod: 'email' | 'push' | 'both';
  createdAt: string;
  expiresAt: string;
  priceHistory: { date: string; price: number }[];
}

interface RecentPriceDrop {
  id: string;
  productId: string;
  productName: string;
  productNameAr: string;
  productImage: string;
  oldPrice: number;
  newPrice: number;
  dropPercentage: number;
  dropDate: string;
  storeName: string;
  storeNameAr: string;
  rating: number;
}

type Tab = 'my-alerts' | 'create-alert' | 'recent-drops';

export function PriceAlertsPage() {
  const { t, locale } = useI18n();
  const { currency } = useAppStore();
  const nav = useAppNavigation();
  const isRTL = locale === 'ar';

  const [activeTab, setActiveTab] = useState<Tab>('my-alerts');
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [recentDrops, setRecentDrops] = useState<RecentPriceDrop[]>([]);
  const [stats, setStats] = useState({ totalAlerts: 0, activeAlerts: 0, triggeredAlerts: 0, expiredAlerts: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  // Create alert form
  const [searchProduct, setSearchProduct] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [alertType, setAlertType] = useState<'below_price' | 'percentage_drop'>('below_price');
  const [percentageDrop, setPercentageDrop] = useState('15');
  const [notificationMethod, setNotificationMethod] = useState<'email' | 'push' | 'both'>('both');
  const [expiresAt, setExpiresAt] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/price-alerts');
      const data = await res.json();
      setAlerts(data.alerts || []);
      setRecentDrops(data.recentPriceDrops || []);
      setStats(data.stats || { totalAlerts: 0, activeAlerts: 0, triggeredAlerts: 0, expiredAlerts: 0 });
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await fetch(`/api/price-alerts?id=${alertId}`, { method: 'DELETE' });
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch {
      // error
    }
  };

  const handleCreateAlert = async () => {
    setCreating(true);
    try {
      await fetch('/api/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: 'p-new',
          productName: searchProduct,
          productNameAr: searchProduct,
          targetPrice: alertType === 'below_price' ? parseFloat(targetPrice) : 0,
          alertType,
          percentageDrop: alertType === 'percentage_drop' ? parseInt(percentageDrop) : undefined,
          notificationMethod,
          expiresAt: expiresAt || undefined,
        }),
      });
      setSearchProduct('');
      setTargetPrice('');
      setAlertType('below_price');
      setPercentageDrop('15');
      setNotificationMethod('both');
      setExpiresAt('');
      setActiveTab('my-alerts');
      fetchData();
    } catch {
      // error
    } finally {
      setCreating(false);
    }
  };

  const filteredAlerts = filterStatus === 'all'
    ? alerts
    : alerts.filter(a => a.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
      case 'triggered': return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
      case 'expired': return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
      default: return '';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return isRTL ? 'نشط' : t('alertStatusActive');
      case 'triggered': return isRTL ? 'تم التفعيل' : t('alertStatusTriggered');
      case 'expired': return isRTL ? 'منتهي' : t('alertStatusExpired');
      default: return status;
    }
  };

  const tabs: { key: Tab; label: string; labelAr: string; icon: React.ReactNode }[] = [
    { key: 'my-alerts', label: 'My Alerts', labelAr: 'تنبيهاتي', icon: <Bell className="size-4" /> },
    { key: 'create-alert', label: 'Create Alert', labelAr: 'إنشاء تنبيه', icon: <Plus className="size-4" /> },
    { key: 'recent-drops', label: 'Recent Price Drops', labelAr: 'انخفاضات حديثة', icon: <TrendingDown className="size-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-600 via-emerald-600 to-green-700 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-5 right-20 w-28 h-28 rounded-full bg-white/20 blur-xl" />
          <div className="absolute bottom-5 left-20 w-36 h-36 rounded-full bg-white/20 blur-xl" />
        </div>
        <div className="container mx-auto px-4 py-10 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <Bell className="size-7" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                {isRTL ? 'تنبيهات الأسعار' : t('priceAlerts')}
              </h1>
              <p className="text-white/80 mt-1">
                {isRTL ? 'لا تفوّت أي انخفاض في الأسعار' : t('priceAlertsDesc')}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.totalAlerts}</p>
              <p className="text-xs text-white/70">{isRTL ? 'إجمالي التنبيهات' : t('totalAlerts')}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.activeAlerts}</p>
              <p className="text-xs text-white/70">{isRTL ? 'نشطة' : t('alertStatusActive')}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.triggeredAlerts}</p>
              <p className="text-xs text-white/70">{isRTL ? 'مفعّلة' : t('alertStatusTriggered')}</p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{stats.expiredAlerts}</p>
              <p className="text-xs text-white/70">{isRTL ? 'منتهية' : t('alertStatusExpired')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              variant={activeTab === tab.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab.key)}
              className={`gap-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {tab.icon}
              {isRTL ? tab.labelAr : tab.label}
            </Button>
          ))}
        </div>

        {/* My Alerts Tab */}
        {activeTab === 'my-alerts' && (
          <div className="space-y-4">
            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              {['all', 'active', 'triggered', 'expired'].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                  className={filterStatus === status
                    ? 'bg-emerald-600 text-white'
                    : 'border-emerald-200 dark:border-emerald-800'
                  }
                >
                  {status === 'all'
                    ? (isRTL ? 'الكل' : 'All')
                    : getStatusLabel(status)
                  }
                </Button>
              ))}
            </div>

            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-20 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="text-center py-16">
                <Bell className="size-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground">
                  {isRTL ? 'لا توجد تنبيهات' : t('noAlertsFound')}
                </h3>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  {isRTL ? 'أنشئ تنبيه أسعار لتتبع المنتجات' : t('createAlertToTrack')}
                </p>
                <Button className="mt-4 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setActiveTab('create-alert')}>
                  <Plus className="size-4" />
                  {isRTL ? 'إنشاء تنبيه' : t('createAlert')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                  <Card
                    key={alert.id}
                    className="hover:shadow-md transition-shadow border-border/50 overflow-hidden"
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Product Image Placeholder */}
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shrink-0">
                          <span className="text-2xl opacity-30">📦</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-sm truncate">
                                {isRTL ? alert.productNameAr : alert.productName}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge className={`${getStatusColor(alert.status)} text-xs`}>
                                  {getStatusLabel(alert.status)}
                                </Badge>
                                {alert.alertType === 'below_price' ? (
                                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 dark:border-emerald-800">
                                    <ArrowDown className="size-3 me-1" />
                                    {isRTL ? `أقل من ${formatPrice(alert.targetPrice, currency)}` : `${t('targetBelow')} ${formatPrice(alert.targetPrice, currency)}`}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-200 dark:border-emerald-800">
                                    <TrendingDown className="size-3 me-1" />
                                    {isRTL ? `انخفاض ${alert.percentageDrop}%` : `${alert.percentageDrop}% ${t('priceDropLabel')}`}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-blue-500">
                                <Edit3 className="size-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-red-500" onClick={() => handleDeleteAlert(alert.id)}>
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Price Info */}
                          <div className="flex items-center gap-3 mt-2">
                            <div>
                              <span className="text-xs text-muted-foreground">{isRTL ? 'السعر الحالي' : t('currentPrice')}</span>
                              <p className="font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(alert.currentPrice, currency)}</p>
                            </div>
                            {alert.alertType === 'below_price' && (
                              <div>
                                <span className="text-xs text-muted-foreground">{isRTL ? 'السعر المستهدف' : t('targetPriceLabel')}</span>
                                <p className="font-bold text-blue-600 dark:text-blue-400">{formatPrice(alert.targetPrice, currency)}</p>
                              </div>
                            )}
                          </div>

                          {/* Expand/Collapse */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-xs text-muted-foreground gap-1 p-0 h-auto"
                            onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                          >
                            {expandedAlert === alert.id ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                            {expandedAlert === alert.id
                              ? (isRTL ? 'إخفاء' : 'Hide')
                              : (isRTL ? 'المزيد' : 'More')
                            }
                          </Button>

                          {/* Expanded Section: Price History + Details */}
                          {expandedAlert === alert.id && (
                            <div className="mt-3 pt-3 border-t border-border space-y-3">
                              {/* Price History Sparkline (CSS bars) */}
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-2">
                                  {isRTL ? 'سجل الأسعار' : t('priceHistory')}
                                </p>
                                <div className="flex items-end gap-1 h-12">
                                  {alert.priceHistory.map((entry, idx) => {
                                    const maxPrice = Math.max(...alert.priceHistory.map(e => e.price));
                                    const heightPct = (entry.price / maxPrice) * 100;
                                    const isCurrent = idx === alert.priceHistory.length - 1;
                                    return (
                                      <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                        <span className="text-[8px] text-muted-foreground">{formatPrice(entry.price, currency)}</span>
                                        <div
                                          className={`w-full rounded-t-sm ${isCurrent ? 'bg-emerald-500' : 'bg-emerald-300 dark:bg-emerald-700'}`}
                                          style={{ height: `${heightPct}%` }}
                                        />
                                        <span className="text-[8px] text-muted-foreground">{entry.date}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Notification Method */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  {alert.notificationMethod === 'email' || alert.notificationMethod === 'both' ? <Mail className="size-3" /> : null}
                                  {alert.notificationMethod === 'push' || alert.notificationMethod === 'both' ? <Smartphone className="size-3" /> : null}
                                  <span>
                                    {alert.notificationMethod === 'email' ? 'Email' :
                                     alert.notificationMethod === 'push' ? 'Push' :
                                     isRTL ? 'البريد والإشعارات' : 'Email & Push'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="size-3" />
                                  <span>{isRTL ? 'ينتهي: ' : 'Expires: '}{alert.expiresAt}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Alert Tab */}
        {activeTab === 'create-alert' && (
          <Card className="border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <Sparkles className="size-5" />
                {isRTL ? 'إنشاء تنبيه أسعار جديد' : t('createNewAlert')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Search Product */}
              <div>
                <Label className="text-sm font-medium mb-1.5 block">
                  {isRTL ? 'ابحث عن منتج' : t('searchForProduct')}
                </Label>
                <div className="relative">
                  <Search className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                  <Input
                    placeholder={isRTL ? 'ابحث عن منتج...' : 'Search for a product...'}
                    value={searchProduct}
                    onChange={(e) => setSearchProduct(e.target.value)}
                    className={isRTL ? 'pr-9' : 'pl-9'}
                  />
                </div>
              </div>

              {/* Alert Type */}
              <div>
                <Label className="text-sm font-medium mb-1.5 block">
                  {isRTL ? 'نوع التنبيه' : t('alertTypeLabel')}
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => setAlertType('below_price')}
                    className={`p-4 rounded-xl border-2 transition-all text-start ${
                      alertType === 'below_price'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50'
                        : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowDown className={`size-4 ${alertType === 'below_price' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                      <span className="font-medium text-sm">{isRTL ? 'أقل من سعر' : t('belowPrice')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? 'تنبيه عندما ينخفض السعر عن حد معين' : t('belowPriceDesc')}
                    </p>
                  </button>
                  <button
                    onClick={() => setAlertType('percentage_drop')}
                    className={`p-4 rounded-xl border-2 transition-all text-start ${
                      alertType === 'percentage_drop'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50'
                        : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingDown className={`size-4 ${alertType === 'percentage_drop' ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                      <span className="font-medium text-sm">{isRTL ? 'انخفاض بنسبة X%' : t('percentageDropLabel')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? 'تنبيه عند انخفاض السعر بنسبة مئوية' : t('percentageDropDesc')}
                    </p>
                  </button>
                </div>
              </div>

              {/* Target Price / Percentage */}
              {alertType === 'below_price' ? (
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">
                    {isRTL ? 'السعر المستهدف' : t('targetPriceLabel')}
                  </Label>
                  <div className="relative">
                    <span className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground text-sm ${isRTL ? 'right-3' : 'left-3'}`}>$</span>
                    <Input
                      type="number"
                      placeholder={isRTL ? 'أدخل السعر المستهدف' : 'Enter target price'}
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      className={isRTL ? 'pr-7' : 'pl-7'}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">
                    {isRTL ? 'نسبة الانخفاض' : t('dropPercentage')}
                  </Label>
                  <Select value={percentageDrop} onValueChange={setPercentageDrop}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="15">15%</SelectItem>
                      <SelectItem value="20">20%</SelectItem>
                      <SelectItem value="25">25%</SelectItem>
                      <SelectItem value="30">30%</SelectItem>
                      <SelectItem value="40">40%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Notification Method */}
              <div>
                <Label className="text-sm font-medium mb-1.5 block">
                  {isRTL ? 'طريقة الإشعار' : t('notificationMethod')}
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'email' as const, label: 'Email', labelAr: 'بريد', icon: <Mail className="size-4" /> },
                    { key: 'push' as const, label: 'Push', labelAr: 'إشعار', icon: <Smartphone className="size-4" /> },
                    { key: 'both' as const, label: 'Both', labelAr: 'كلاهما', icon: <Bell className="size-4" /> },
                  ].map((method) => (
                    <button
                      key={method.key}
                      onClick={() => setNotificationMethod(method.key)}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                        notificationMethod === method.key
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50'
                          : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                      }`}
                    >
                      {method.icon}
                      <span className="text-xs font-medium">{isRTL ? method.labelAr : method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <Label className="text-sm font-medium mb-1.5 block">
                  {isRTL ? 'تاريخ الانتهاء' : t('alertExpiry')}
                </Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Create Button */}
              <Button
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 gap-2"
                onClick={handleCreateAlert}
                disabled={creating || (!searchProduct && alertType === 'below_price' && !targetPrice)}
              >
                {creating ? (
                  <span className="animate-spin size-4 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Plus className="size-4" />
                )}
                {isRTL ? 'إنشاء تنبيه' : t('createAlert')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Price Drops Tab */}
        {activeTab === 'recent-drops' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="size-5 text-emerald-500" />
              <h2 className="text-lg font-semibold">
                {isRTL ? 'انخفاضات أسعار حديثة' : t('recentPriceDrops')}
              </h2>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-28 bg-muted rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentDrops.map((drop) => (
                  <Card
                    key={drop.id}
                    className="group hover:shadow-lg hover:shadow-emerald-500/5 transition-all border-border/50 cursor-pointer"
                    onClick={() => nav.selectProduct(drop.productId)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {/* Product Image */}
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shrink-0 relative overflow-hidden">
                          <span className="text-2xl opacity-30">🏷️</span>
                          <div className="absolute top-1 start-1">
                            <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0 gap-0.5">
                              <TrendingDown className="size-2.5" />
                              -{drop.dropPercentage}%
                            </Badge>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                            {isRTL ? drop.productNameAr : drop.productName}
                          </h3>

                          {/* Price Display */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                              {formatPrice(drop.newPrice, currency)}
                            </span>
                            <span className="text-xs text-muted-foreground line-through">
                              {formatPrice(drop.oldPrice, currency)}
                            </span>
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 text-[10px] px-1.5">
                              <ArrowDown className="size-2.5 me-0.5" />
                              {drop.dropPercentage}%
                            </Badge>
                          </div>

                          {/* Store & Time */}
                          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
                            <span>{isRTL ? drop.storeNameAr : drop.storeName}</span>
                            <span>•</span>
                            <span>{drop.dropDate}</span>
                            <div className="flex items-center gap-0.5 ms-auto">
                              <Star className="size-3 text-amber-400 fill-amber-400" />
                              <span>{drop.rating}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 mt-2.5">
                            <Button
                              size="sm"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1 h-7"
                              onClick={(e) => { e.stopPropagation(); }}
                            >
                              <ShoppingCart className="size-3" />
                              {isRTL ? 'اشتر الآن' : t('buyNow')}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs gap-1 h-7 border-emerald-200 dark:border-emerald-800"
                              onClick={(e) => { e.stopPropagation(); }}
                            >
                              <Heart className="size-3" />
                              {isRTL ? 'أضف للمفضلة' : t('addToWishlist')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
