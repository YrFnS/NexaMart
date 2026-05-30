'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Megaphone,
  Sparkles,
  Users,
  Settings,
  Bell,
  Menu,
  X,
  Store,
  ArrowRightLeft,
  ChevronRight,
  ChevronLeft,
  Zap,
  Eye,
  TrendingUp,
  Clock,
  ArrowUp,
  Star,
  Crown,
  AlertTriangle,
  RotateCcw,
  Tag,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useUserStore } from '@/stores/user-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SellerOverview } from './seller-overview';
import { ProductManagement } from './product-management';
import { OrderManagement } from './order-management';
import { SellerAnalytics } from './seller-analytics';
import { MarketingTools } from './marketing-tools';
import { StoreSettings } from './store-settings';
import { SellerAITools } from './seller-ai-tools';
import { StaffManagement } from './staff-management';
import { SellerReturns } from './seller-returns';

type SellerTab = 'overview' | 'products' | 'orders' | 'returns' | 'analytics' | 'marketing' | 'ai-tools' | 'staff' | 'settings' | 'ad-center' | 'coupons';

interface NavItem {
  id: SellerTab;
  icon: React.ElementType;
  labelKey: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: 'overview', icon: LayoutDashboard, labelKey: 'sellerNavOverview' },
  { id: 'products', icon: Package, labelKey: 'sellerNavProducts' },
  { id: 'orders', icon: ShoppingCart, labelKey: 'sellerNavOrders' },
  { id: 'returns', icon: RotateCcw, labelKey: 'sellerReturns' },
  { id: 'analytics', icon: BarChart3, labelKey: 'sellerNavAnalytics' },
  { id: 'marketing', icon: Megaphone, labelKey: 'sellerNavMarketing' },
  { id: 'ad-center', icon: Zap, labelKey: 'sellerNavAdCenter' },
  { id: 'coupons', icon: Tag, labelKey: 'couponCode' },
  { id: 'ai-tools', icon: Sparkles, labelKey: 'sellerNavAITools' },
  { id: 'staff', icon: Users, labelKey: 'sellerNavStaff' },
  { id: 'settings', icon: Settings, labelKey: 'sellerNavSettings' },
];

function SidebarContent({
  activeTab,
  setActiveTab,
  isCollapsed,
  onClose,
}: {
  activeTab: SellerTab;
  setActiveTab: (tab: SellerTab) => void;
  isCollapsed: boolean;
  onClose?: () => void;
}) {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const { user } = useUserStore();
  const [storeName, setStoreName] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetch(`/api/stores?ownerId=${user.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          const stores = Array.isArray(data) ? data : [];
          if (stores.length > 0) setStoreName(stores[0].name);
        })
        .catch(() => {});
    }
  }, [user?.id]);

  return (
    <div className={`flex flex-col h-full bg-card ${isRTL ? 'border-l' : 'border-r'} border-border overflow-y-auto`}>
      {/* Logo / Store Name */}
      {!isCollapsed && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              N
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm truncate">{t('s_nexaMartSeller')}</h2>
              <p className="text-xs text-muted-foreground truncate">{storeName || t('s_nexaMartSeller')}</p>
            </div>
          </div>
        </div>
      )}
      {isCollapsed && (
        <div className="p-3 border-b border-border flex justify-center">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            N
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose?.();
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium h-10
                  transition-all duration-200 relative group
                  ${isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                  ${isCollapsed ? 'justify-center px-2 h-10' : ''}
                `}
                title={isCollapsed ? t(item.labelKey) : undefined}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-start truncate">{t(item.labelKey)}</span>
                    {item.badge && (
                      <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-emerald-500 text-white hover:bg-emerald-600">
                        {item.badge}
                      </Badge>
                    )}
                    {isActive && (
                      <div className={`absolute top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-emerald-500 ${isRTL ? 'right-0' : 'left-0'}`} />
                    )}
                  </>
                )}
                {isCollapsed && item.badge && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] bg-emerald-500 text-white hover:bg-emerald-600">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Section */}
      {!isCollapsed && (
        <div className="p-3 border-t border-border">
          <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{t('s_proPlan')}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2">{t('s_unlockAdvanced')}</p>
            <Button size="sm" className="w-full h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              {t('s_upgrade')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Ad Center Tab - shows active promotions and stats
const adTypeConfig: Record<string, { icon: React.ElementType; labelKey: string; color: string }> = {
  'bump-up': { icon: ArrowUp, labelKey: 's_adBumpUp', color: 'text-blue-500' },
  'featured-ad': { icon: Star, labelKey: 's_adFeatured', color: 'text-amber-500' },
  'premium-ad': { icon: Crown, labelKey: 's_adPremium', color: 'text-purple-500' },
  'urgent-badge': { icon: AlertTriangle, labelKey: 's_adUrgent', color: 'text-red-500' },
  'spotlight': { icon: Zap, labelKey: 's_adSpotlight', color: 'text-emerald-500' },
};

function AdCenterTab() {
  const { t, locale, dir } = useI18n();
  const nav = useAppNavigation();
  const isRTL = dir() === 'rtl';

  const [promotions, setPromotions] = useState<Array<{
    id: string;
    productId: string;
    productName: string;
    adType: string;
    purchasedAt: string;
    expiresAt: string;
    viewsBefore: number;
    viewsAfter: number;
    clicksBefore: number;
    clicksAfter: number;
    status: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPromotions() {
      try {
        const res = await fetch('/api/ad-products?type=active');
        if (res.ok) {
          const data = await res.json();
          setPromotions(data.promotions || []);
        }
      } catch {
        // Use empty fallback
      } finally {
        setLoading(false);
      }
    }
    fetchPromotions();
  }, []);

  const totalViewsIncrease = promotions.reduce((sum, p) => sum + (p.viewsAfter - p.viewsBefore), 0);
  const totalClicksIncrease = promotions.reduce((sum, p) => sum + (p.clicksAfter - p.clicksBefore), 0);
  const totalViews = promotions.reduce((sum, p) => sum + p.viewsAfter, 0);
  const totalClicks = promotions.reduce((sum, p) => sum + p.clicksAfter, 0);

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            {t('s_adCenter')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('s_managePromotions')}
          </p>
        </div>
        <Button
          onClick={() => nav.setView('promote-listing')}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
        >
          <Zap className="h-4 w-4 me-1.5" />
          {t('s_promoteListing')}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-emerald-200 dark:border-emerald-800 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <Eye className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t('s_totalViews')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+{totalViewsIncrease.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t('s_viewsIncrease')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{t('s_totalClicks')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{promotions.length}</p>
                <p className="text-xs text-muted-foreground">{t('s_activePromotions')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Promotions */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-emerald-500" />
            {t('s_activePromotions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {t('s_noActivePromotions')}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                onClick={() => nav.setView('promote-listing')}
              >
                <Zap className="h-3.5 w-3.5 me-1" />
                {t('s_startPromoting')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {promotions.map((promo) => {
                const config = adTypeConfig[promo.adType];
                if (!config) return null;
                const PromoIcon = config.icon;
                const viewsIncrease = promo.viewsAfter - promo.viewsBefore;
                const clicksIncrease = promo.clicksAfter - promo.clicksBefore;
                const viewsPercent = promo.viewsBefore > 0 ? Math.round((viewsIncrease / promo.viewsBefore) * 100) : 0;
                const expiresDate = new Date(promo.expiresAt);
                const now = new Date();
                const hoursLeft = Math.max(0, Math.round((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60)));
                const daysLeft = Math.floor(hoursLeft / 24);
                const remainingHours = hoursLeft % 24;

                return (
                  <div key={promo.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted/70 transition-colors">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${config.color} bg-muted`}>
                      <PromoIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium truncate">{promo.productName}</p>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {t(config.labelKey)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          +{viewsIncrease} ({viewsPercent}%)
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          +{clicksIncrease} {t('s_clicks')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {daysLeft > 0 ? `${daysLeft}d ${remainingHours}h` : `${remainingHours}h`} {t('s_left')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CouponManagementTab() {
  const { t, locale, dir } = useI18n();
  const isRTL = dir() === 'rtl';

  const [coupons, setCoupons] = useState<Array<{
    id: string;
    code: string;
    discount: number;
    type: string;
    minOrder: number;
    maxDiscount: number | null;
    usageLimit: number | null;
    usedCount: number;
    isActive: boolean;
    expiresAt: string | null;
    createdAt: string;
    description: string;
    descriptionAr: string;
    totalRevenue: number;
    totalDiscount: number;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Create form state
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [newType, setNewType] = useState('percentage');
  const [newMinOrder, setNewMinOrder] = useState('0');
  const [newMaxDiscount, setNewMaxDiscount] = useState('');
  const [newUsageLimit, setNewUsageLimit] = useState('');
  const [newExpiry, setNewExpiry] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function fetchCoupons() {
      try {
        const res = await fetch('/api/seller/coupons');
        if (res.ok) {
          const data = await res.json();
          setCoupons(data.coupons || []);
        }
      } catch {
        // Use empty fallback
      } finally {
        setLoading(false);
      }
    }
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async () => {
    if (!newCode || !newDiscount) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/seller/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode,
          discount: parseFloat(newDiscount),
          type: newType,
          minOrder: parseFloat(newMinOrder) || 0,
          maxDiscount: newMaxDiscount ? parseFloat(newMaxDiscount) : null,
          usageLimit: newUsageLimit ? parseInt(newUsageLimit) : null,
          expiresAt: newExpiry || null,
          description: newDescription || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(prev => [data.coupon, ...prev]);
        setShowCreateForm(false);
        setNewCode('');
        setNewDiscount('');
        setNewType('percentage');
        setNewMinOrder('0');
        setNewMaxDiscount('');
        setNewUsageLimit('');
        setNewExpiry('');
        setNewDescription('');
      }
    } catch {
      // ignore
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleCoupon = async (couponId: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/seller/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId, isActive: !currentActive }),
      });
      if (res.ok) {
        setCoupons(prev =>
          prev.map(c => c.id === couponId ? { ...c, isActive: !currentActive } : c)
        );
      }
    } catch {
      // ignore
    }
  };

  const activeCoupons = coupons.filter(c => c.isActive).length;
  const totalUsed = coupons.reduce((sum, c) => sum + c.usedCount, 0);
  const totalRevenue = coupons.reduce((sum, c) => sum + c.totalRevenue, 0);
  const totalDiscountGiven = coupons.reduce((sum, c) => sum + c.totalDiscount, 0);

  return (
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            {t('s_couponManagement')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('s_createManageCoupons')}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
        >
          <Tag className="h-4 w-4 me-1.5" />
          {t('s_createCoupon')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('s_totalCoupons')}</p>
            <p className="text-2xl font-bold text-emerald-600">{coupons.length}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('s_active')}</p>
            <p className="text-2xl font-bold text-emerald-600">{activeCoupons}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('s_totalUsed')}</p>
            <p className="text-2xl font-bold">{totalUsed}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{t('s_revenueImpact')}</p>
            <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Tag className="size-4 text-emerald-600" />
              {t('s_createNewCoupon')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('s_couponCode')} *</Label>
                <Input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g., SUMMER25"
                  className="h-9 text-sm uppercase rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('s_discountType')} *</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{t('s_percentage')}</SelectItem>
                    <SelectItem value="fixed">{t('s_fixedAmount')}</SelectItem>
                    <SelectItem value="free_shipping">{t('s_freeShippingCoupon')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('s_discountValue')} *</Label>
                <Input
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(e.target.value)}
                  type="number"
                  placeholder={newType === 'percentage' ? '25' : '50'}
                  className="h-9 text-sm rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('s_minOrder')}</Label>
                <Input
                  value={newMinOrder}
                  onChange={(e) => setNewMinOrder(e.target.value)}
                  type="number"
                  placeholder="0"
                  className="h-9 text-sm rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('s_maxDiscount')}</Label>
                <Input
                  value={newMaxDiscount}
                  onChange={(e) => setNewMaxDiscount(e.target.value)}
                  type="number"
                  placeholder={t('s_optional')}
                  className="h-9 text-sm rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('s_usageLimit')}</Label>
                <Input
                  value={newUsageLimit}
                  onChange={(e) => setNewUsageLimit(e.target.value)}
                  type="number"
                  placeholder={t('s_unlimited')}
                  className="h-9 text-sm rounded-xl"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">{t('s_expiryDate')}</Label>
                <Input
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  type="datetime-local"
                  className="h-9 text-sm rounded-xl"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">{t('s_couponDescription')}</Label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder={t('s_couponDescPh')}
                  className="h-9 text-sm rounded-xl"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowCreateForm(false)}>
                {t('cancel')}
              </Button>
              <Button
                size="sm"
                onClick={handleCreateCoupon}
                disabled={isCreating || !newCode || !newDiscount}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isCreating ? <Loader2 className="size-4 animate-spin me-1" /> : <Tag className="size-4 me-1" />}
                {t('s_create')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coupon List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 text-emerald-600 animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="size-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{t('s_noCouponsYet')}</p>
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowCreateForm(true)}>
              <Tag className="size-4 me-2" />
              {t('s_createCoupon')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className={`transition-all ${!coupon.isActive ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${coupon.isActive ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-muted'}`}>
                      <Tag className={`size-5 ${coupon.isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm font-mono">{coupon.code}</span>
                        <Badge className={`text-[10px] ${coupon.type === 'percentage' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : coupon.type === 'free_shipping' ? 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300' : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'}`}>
                          {coupon.type === 'percentage'
                            ? `${coupon.discount}% ${t('s_off')}`
                            : coupon.type === 'free_shipping'
                            ? (t('s_freeShip'))
                            : `$${coupon.discount} ${t('s_off')}`}
                        </Badge>
                        {!coupon.isActive && (
                          <Badge className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px]">
                            {t('s_inactive')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isRTL ? coupon.descriptionAr : coupon.description}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground flex-wrap">
                        <span>{t('s_minLabel')} ${coupon.minOrder}</span>
                        {coupon.maxDiscount && <span>{t('s_maxDisc')} ${coupon.maxDiscount}</span>}
                        <span>{t('s_usedLabel')} {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}</span>
                        {coupon.expiresAt && <span>{t('s_expires')} {new Date(coupon.expiresAt).toLocaleDateString(getLocale(isRTL))}</span>}
                        <span>{t('s_revenueLabel')} ${coupon.totalRevenue.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`text-xs shrink-0 ${coupon.isActive ? 'border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950' : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950'}`}
                    onClick={() => handleToggleCoupon(coupon.id, coupon.isActive)}
                  >
                    {coupon.isActive
                      ? (t('s_deactivate'))
                      : (t('s_activate'))}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export function SellerDashboard() {
  const [activeTab, setActiveTab] = useState<SellerTab>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, dir, locale } = useI18n();
  const nav = useAppNavigation();
  const { user } = useUserStore();
  const isRTL = dir() === 'rtl';

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <SellerOverview />;
      case 'products':
        return <ProductManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'returns':
        return <SellerReturns />;
      case 'analytics':
        return <SellerAnalytics />;
      case 'marketing':
        return <MarketingTools />;
      case 'ai-tools':
        return <SellerAITools />;
      case 'staff':
        return <StaffManagement />;
      case 'settings':
        return <StoreSettings />;
      case 'ad-center':
        return <AdCenterTab />;
      case 'coupons':
        return <CouponManagementTab />;
      default:
        return <SellerOverview />;
    }
  };

  return (
    <div dir={dir()} className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden md:flex flex-col border-border
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-[68px]' : 'w-60'}
          ${isRTL ? 'border-l' : 'border-r'}
        `}
      >
        <SidebarContent
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={sidebarCollapsed}
        />
        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex items-center justify-center h-8 border-t border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {sidebarCollapsed ? (
            isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side={isRTL ? 'right' : 'left'}
          className="w-64 p-0"
        >
          <SheetTitle className="sr-only">{t('sellerDashboard')}</SheetTitle>
          <SidebarContent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            isCollapsed={false}
            onClose={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card/95 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Page Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate">
              {t(navItems.find(n => n.id === activeTab)?.labelKey || 'sellerNavOverview')}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
            </Button>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs">
                      {user?.name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">
                    {user?.name || 'Seller'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48">
                <DropdownMenuItem>
                  <Store className="h-4 w-4 me-2" />
                  {t('myStore')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => nav.setView('home')}>
                  <ArrowRightLeft className="h-4 w-4 me-2" />
                  {t('switchToShopping')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Switch to Shopping */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => nav.setView('home')}
              className="hidden sm:flex h-8 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 me-1.5" />
              {t('switchToShopping')}
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-4 md:p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}


