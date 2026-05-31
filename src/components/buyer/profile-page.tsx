'use client';

import React, { useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, CreditCard, Globe, Moon, Bell, Shield, Lock,
  LogOut, ChevronRight, Package, Heart, Star, Wallet, Edit2, Plus, Trash2,
  BadgeCheck, Crown, SwitchCamera, Sparkles, Settings, FileText, Zap,
  Camera, Eye, EyeOff, Check, ShoppingBag, Truck, PackageCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useUserStore } from '@/stores/user-store';
import { formatPrice } from '@/lib/currency';
import { CreditsPanel } from '@/components/ai/credits-panel';
import { toast } from 'sonner';

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

const COUNTRIES = [
  { code: 'IQ', name: 'Iraq', nameAr: 'العراق' },
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية' },
  { code: 'AE', name: 'UAE', nameAr: 'الإمارات' },
  { code: 'KW', name: 'Kuwait', nameAr: 'الكويت' },
  { code: 'BH', name: 'Bahrain', nameAr: 'البحرين' },
  { code: 'QA', name: 'Qatar', nameAr: 'قطر' },
  { code: 'OM', name: 'Oman', nameAr: 'عُمان' },
  { code: 'JO', name: 'Jordan', nameAr: 'الأردن' },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر' },
];

const defaultAddresses: Address[] = [];

const defaultRecentOrders: {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  total: number;
  itemCount: number;
}[] = [];

const defaultWishlistItems = [];

const tierConfig: Record<string, { gradient: string; icon: string; textColor: string; bgColor: string; borderColor: string; nextTier: string; pointsNeeded: number }> = {
  Bronze: { gradient: 'from-amber-500 to-amber-700', icon: '🥉', textColor: 'text-amber-600', bgColor: 'bg-amber-50 dark:bg-amber-950/30', borderColor: 'border-amber-200 dark:border-amber-800', nextTier: 'Silver', pointsNeeded: 500 },
  Silver: { gradient: 'from-gray-400 to-gray-600', icon: '🥈', textColor: 'text-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-950/30', borderColor: 'border-gray-200 dark:border-gray-800', nextTier: 'Gold', pointsNeeded: 1500 },
  Gold: { gradient: 'from-yellow-500 to-amber-600', icon: '🥇', textColor: 'text-yellow-600', bgColor: 'bg-yellow-50 dark:bg-yellow-950/30', borderColor: 'border-yellow-200 dark:border-yellow-800', nextTier: 'Platinum', pointsNeeded: 5000 },
  Platinum: { gradient: 'from-cyan-500 to-teal-600', icon: '💎', textColor: 'text-cyan-600', bgColor: 'bg-cyan-50 dark:bg-cyan-950/30', borderColor: 'border-cyan-200 dark:border-cyan-800', nextTier: 'Diamond', pointsNeeded: 10000 },
  Diamond: { gradient: 'from-purple-500 to-violet-600', icon: '💠', textColor: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/30', borderColor: 'border-purple-200 dark:border-purple-800', nextTier: 'Diamond', pointsNeeded: 0 },
};

type ProfileTab = 'overview' | 'orders' | 'wishlist' | 'addresses' | 'settings';

export function ProfilePage() {
  const { t, locale, setLocale } = useI18n();
  const nav = useAppNavigation();
  const { user, setUser } = useUserStore();
  const isRTL = locale === 'ar';

  const [activeTab, setActiveTab] = useState<ProfileTab>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');

  const [notifOrders, setNotifOrders] = useState(true);
  const [notifPromos, setNotifPromos] = useState(true);
  const [notifChat, setNotifChat] = useState(true);
  const [notifDeals, setNotifDeals] = useState(false);

  const [twoFA, setTwoFA] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Address management
  const [addresses, setAddresses] = useState<Address[]>(defaultAddresses);
  const [recentOrders, setRecentOrders] = useState(defaultRecentOrders);
  const [wishlistItems, setWishlistItems] = useState(defaultWishlistItems);
  const [profileLoading, setProfileLoading] = useState(true);
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: '', fullName: '', phone: '', address1: '', address2: '',
    city: '', state: '', postalCode: '', country: '',
  });

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      setProfileLoading(true);
      try {
        const [addrRes, ordersRes, wishRes] = await Promise.all([
          fetch('/api/addresses'),
          fetch('/api/orders'),
          fetch(`/api/wishlist${user?.id ? `?userId=${user.id}` : ''}`),
        ]);
        if (addrRes.ok) {
          const addrData = await addrRes.json();
          setAddresses(Array.isArray(addrData) ? addrData : addrData.items || []);
        }
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          const orders = Array.isArray(ordersData) ? ordersData : ordersData.orders || [];
          setRecentOrders(orders.slice(0, 5));
        }
        if (wishRes.ok) {
          const wishData = await wishRes.json();
          setWishlistItems(Array.isArray(wishData) ? wishData : wishData.items || []);
        }
      } catch {
        // Keep default empty state
      } finally {
        setProfileLoading(false);
      }
    };
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  // If not logged in, show auth prompt
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="max-w-sm border-0 shadow-lg">
          <CardContent className="p-8 text-center space-y-4">
            <User className="size-16 mx-auto text-muted-foreground/30" />
            <h2 className="text-xl font-semibold">{t('b_pleaseLogIn')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('b_logInToViewProfile')}
            </p>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white w-full" onClick={() => nav.setView('auth')}>
              {t('login')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSaveProfile = () => {
    setUser({ ...user, name: editName, email: editEmail, phone: editPhone });
    setIsEditing(false);
    toast.success(t('b_profileSaved'));
  };

  const handleLogout = () => {
    setUser(null);
    nav.setView('home');
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('b_pleaseFillAllFields'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('passwordsDoNotMatch'));
      return;
    }
    toast.success(t('passwordChanged'));
    setShowPasswordForm(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleOpenAddressDialog = (addr?: Address) => {
    if (addr) {
      setEditingAddress(addr);
      setAddressForm({
        label: addr.label, fullName: addr.fullName, phone: addr.phone,
        address1: addr.address1, address2: addr.address2 || '',
        city: addr.city, state: addr.state, postalCode: addr.postalCode, country: addr.country,
      });
    } else {
      setEditingAddress(null);
      setAddressForm({ label: '', fullName: '', phone: '', address1: '', address2: '', city: '', state: '', postalCode: '', country: '' });
    }
    setShowAddressDialog(true);
  };

  const handleSaveAddress = () => {
    if (editingAddress) {
      setAddresses((prev) => prev.map((a) => a.id === editingAddress.id ? { ...a, ...addressForm } : a));
    } else {
      const newAddr: Address = {
        id: Date.now().toString(),
        ...addressForm,
        isDefault: addresses.length === 0,
      };
      setAddresses((prev) => [...prev, newAddr]);
    }
    setShowAddressDialog(false);
    toast.success(t('b_addressSaved'));
  };

  const handleDeleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    toast.success(t('b_addressDeleted'));
  };

  const currentTierConfig = tierConfig[user.loyaltyTier] || tierConfig.Gold;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'shipped': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'delivered': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
      case 'processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Package, label: t('orders'), value: '24', color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30' },
          { icon: Heart, label: t('wishlist'), value: '12', color: 'text-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-950/30' },
          { icon: Sparkles, label: t('aiCredits'), value: String(user.aiCredits), color: 'text-purple-600', bgColor: 'bg-purple-50 dark:bg-purple-950/30' },
          { icon: Wallet, label: t('wallet'), value: formatPrice(user.walletBalance), color: 'text-teal-600', bgColor: 'bg-teal-50 dark:bg-teal-950/30' },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 text-center">
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center mx-auto mb-1`}>
                <stat.icon className={`size-4 ${stat.color}`} />
              </div>
              <div className="text-sm font-bold">{stat.value}</div>
              <div className="text-[10px] text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Loyalty Tier Progress */}
      <Card className={`border-0 shadow-md ${currentTierConfig.bgColor} ${currentTierConfig.borderColor} border`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Crown className={`size-5 ${currentTierConfig.textColor}`} />
              <span className="font-semibold text-sm">{t('tierProgress')}</span>
            </div>
            <Badge className={`bg-gradient-to-r ${currentTierConfig.gradient} text-white text-[10px]`}>
              {currentTierConfig.icon} {user.loyaltyTier}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>{user.loyaltyPoints} {t('b_pts')}</span>
            {currentTierConfig.pointsNeeded > 0 && (
              <span>{currentTierConfig.pointsNeeded - user.loyaltyPoints} {t('b_ptsToNextTier', { nextTier: currentTierConfig.nextTier })}</span>
            )}
          </div>
          <Progress value={Math.min((user.loyaltyPoints / currentTierConfig.pointsNeeded) * 100, 100)} className="h-2" />
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Package className="size-4 text-emerald-600" />
              {t('recentOrders')}
            </CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-emerald-600" onClick={() => setActiveTab('orders')}>
              {t('viewAll')} →
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentOrders.slice(0, 3).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <Package className="size-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-mono font-medium">{order.orderNumber}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(order.date).toLocaleDateString(getLocale(isRTL), { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
              <div className="text-end">
                <Badge className={`${getStatusColor(order.status)} text-[10px] border-0`}>{order.status}</Badge>
                <p className="text-xs font-semibold mt-0.5">{formatPrice(order.total)}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Package, label: t('myOrders'), color: 'text-emerald-600', bgColor: 'bg-emerald-50 dark:bg-emerald-950/30', onClick: () => setActiveTab('orders') },
          { icon: Heart, label: t('wishlist'), color: 'text-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-950/30', onClick: () => setActiveTab('wishlist') },
          { icon: MapPin, label: t('addresses'), color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-950/30', onClick: () => setActiveTab('addresses') },
          { icon: Settings, label: t('settings'), color: 'text-gray-500', bgColor: 'bg-gray-50 dark:bg-gray-900/30', onClick: () => setActiveTab('settings') },
        ].map((action) => (
          <Card
            key={action.label}
            className="border-0 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
            onClick={action.onClick}
          >
            <CardContent className="p-3 text-center">
              <div className={`w-10 h-10 rounded-xl ${action.bgColor} flex items-center justify-center mx-auto mb-2`}>
                <action.icon className={`size-5 ${action.color}`} />
              </div>
              <div className="text-[11px] font-medium text-muted-foreground">{action.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderOrdersTab = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{t('lastOrders')}</h3>
        <Button variant="outline" size="sm" className="text-xs" onClick={() => nav.setView('orders')}>
          {t('viewAll')}
        </Button>
      </div>
      {recentOrders.map((order) => (
        <Card key={order.id} className="border shadow-none">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  order.status === 'delivered' ? 'bg-emerald-100 dark:bg-emerald-900' :
                  order.status === 'shipped' ? 'bg-purple-100 dark:bg-purple-900' :
                  order.status === 'cancelled' ? 'bg-red-100 dark:bg-red-900' :
                  'bg-amber-100 dark:bg-amber-900'
                }`}>
                  {order.status === 'delivered' ? <PackageCheck className="size-5 text-emerald-600" /> :
                   order.status === 'shipped' ? <Truck className="size-5 text-purple-600" /> :
                   order.status === 'cancelled' ? <XCircle className="size-5 text-red-600" /> :
                   <Package className="size-5 text-amber-600" />}
                </div>
                <div>
                  <p className="text-sm font-mono font-medium">{order.orderNumber}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(order.date).toLocaleDateString(getLocale(isRTL), { year: 'numeric', month: 'short', day: 'numeric' })}
                    · {order.itemCount} {t('b_items')}
                  </p>
                </div>
              </div>
              <div className="text-end">
                <Badge className={`${getStatusColor(order.status)} text-[10px] border-0 mb-1`}>{order.status}</Badge>
                <p className="text-sm font-bold text-emerald-600">{formatPrice(order.total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderWishlistTab = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{t('lastWishlistItems')}</h3>
        <Button variant="outline" size="sm" className="text-xs" onClick={() => nav.setView('wishlist')}>
          {t('viewAll')}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {wishlistItems.length === 0 ? (
          <div className="col-span-2 text-center py-8">
            <Heart className="size-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">{t('emptyWishlist')}</p>
          </div>
        ) : (
          wishlistItems.map((item: any) => (
            <Card key={item.id} className="border shadow-none cursor-pointer hover:shadow-md transition-shadow" onClick={() => nav.setView('wishlist')}>
              <CardContent className="p-3">
                <div className="aspect-square rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 flex items-center justify-center mb-2">
                  <ShoppingBag className="size-8 text-emerald-300 dark:text-emerald-700" />
                </div>
                <p className="text-xs font-medium line-clamp-2">{item.name}</p>
                <p className="text-sm font-bold text-emerald-600 mt-1">{formatPrice(item.price)}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderAddressesTab = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{t('myAddresses')}</h3>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs" onClick={() => handleOpenAddressDialog()}>
          <Plus className="size-3 me-1" />
          {t('addAddress')}
        </Button>
      </div>
      {addresses.length === 0 ? (
        <div className="text-center py-8">
          <MapPin className="size-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">{t('b_noSavedAddresses')}</p>
        </div>
      ) : (
        addresses.map((addr) => (
          <Card key={addr.id} className="border shadow-none">
            <CardContent className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{addr.label}</span>
                    {addr.isDefault && (
                      <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px]">
                        {t('b_default')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{addr.fullName}</p>
                  <p className="text-xs text-muted-foreground">{addr.address1}{addr.address2 ? `, ${addr.address2}` : ''}</p>
                  <p className="text-xs text-muted-foreground">{addr.city}, {addr.state} {addr.postalCode}, {addr.country}</p>
                  <p className="text-xs text-muted-foreground">{addr.phone}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="size-7" onClick={() => handleOpenAddressDialog(addr)}>
                    <Edit2 className="size-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="size-7 text-red-500" onClick={() => handleDeleteAddress(addr.id)}>
                    <Trash2 className="size-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-4">
      {/* Language & Theme */}
      <Card className="border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Globe className="size-4 text-emerald-600" />
            {t('languageTheme')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">{t('b_language')}</Label>
            <div className="flex gap-2">
              <Button
                variant={locale === 'en' ? 'default' : 'outline'}
                size="sm"
                className={locale === 'en' ? 'bg-emerald-600 text-white' : ''}
                onClick={() => setLocale('en')}
              >
                English
              </Button>
              <Button
                variant={locale === 'ar' ? 'default' : 'outline'}
                size="sm"
                className={locale === 'ar' ? 'bg-emerald-600 text-white' : ''}
                onClick={() => setLocale('ar')}
              >
                العربية
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-2">
              <Moon className="size-4" />
              {t('darkMode')}
            </Label>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Bell className="size-4 text-emerald-600" />
            {t('notifications')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: t('b_orderUpdates'), value: notifOrders, setter: setNotifOrders },
            { label: t('b_promotionsDeals'), value: notifPromos, setter: setNotifPromos },
            { label: t('b_chatMessages'), value: notifChat, setter: setNotifChat },
            { label: t('b_dailyDeals'), value: notifDeals, setter: setNotifDeals },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <Label className="text-sm">{item.label}</Label>
              <Switch checked={item.value} onCheckedChange={item.setter} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="size-4 text-emerald-600" />
            {t('b_security')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!showPasswordForm ? (
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setShowPasswordForm(true)}>
              <Lock className="size-4" />
              {t('b_changePassword')}
              <ChevronRight className={`size-4 ms-auto ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
          ) : (
            <div className="space-y-3 p-3 rounded-lg bg-muted/30">
              <div className="space-y-1">
                <Label className="text-xs">{t('currentPassword')}</Label>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-9 text-sm pe-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-0 end-0 size-9"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('newPassword')}</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('confirmPassword')}</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handlePasswordChange}>
                  {t('b_update')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setShowPasswordForm(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }}>
                  {t('cancel')}
                </Button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <Label className="text-sm">{t('b_twoFactorAuth')}</Label>
              <p className="text-xs text-muted-foreground">{t('b_extraSecurityLayer')}</p>
            </div>
            <Switch checked={twoFA} onCheckedChange={setTwoFA} />
          </div>
        </CardContent>
      </Card>

      {/* AI Credits */}
      <Card className="border shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="size-4 text-emerald-600" />
            {t('aiCredits')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreditsPanel />
        </CardContent>
      </Card>
    </div>
  );

  const XCircle = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Profile Header */}
        <Card className="border-0 shadow-md overflow-hidden">
          <div className={`bg-gradient-to-r ${currentTierConfig.gradient} h-28 relative`}>
            <div className="absolute top-2 end-4 w-16 h-16 rounded-full bg-white/10" />
            <div className="absolute bottom-1 start-8 w-8 h-8 rounded-full bg-white/5" />
          </div>
          <CardContent className="p-6 -mt-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
              <div className="relative">
                <Avatar className="size-20 border-4 border-background shadow-lg">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 text-2xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {/* Avatar upload placeholder */}
                <button className="absolute bottom-0 end-0 w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md hover:bg-emerald-700 transition-colors">
                  <Camera className="size-3.5" />
                </button>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{user.name}</h1>
                  {user.isVerified && <BadgeCheck className="size-5 text-emerald-500" />}
                </div>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`bg-gradient-to-r ${currentTierConfig.gradient} text-white text-[10px] badge-glow`}>
                    <Crown className="size-3 me-1" />
                    {currentTierConfig.icon} {user.loyaltyTier}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {t('memberSince')} 2024
                  </span>
                </div>
              </div>
              {activeTab === 'overview' && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setIsEditing(!isEditing)}>
                  <Edit2 className="size-3.5" />
                  {t('editProfile')}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Form (when editing on overview) */}
        {isEditing && activeTab === 'overview' && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">{t('b_name')}</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('email')}</Label>
                  <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} type="email" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('phone')}</Label>
                  <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} type="tel" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveProfile}>
                  {t('save')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                  {t('cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ProfileTab)}>
          <TabsList className="w-full grid grid-cols-5 bg-muted/50 h-auto p-1 rounded-xl">
            <TabsTrigger value="overview" className="text-xs py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg">
              {t('b_overview')}
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg">
              {t('orders')}
            </TabsTrigger>
            <TabsTrigger value="wishlist" className="text-xs py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg">
              {t('wishlist')}
            </TabsTrigger>
            <TabsTrigger value="addresses" className="text-xs py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg">
              {t('addresses')}
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs py-2 data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg">
              {t('settings')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4">
            {renderOverviewTab()}
          </TabsContent>
          <TabsContent value="orders" className="mt-4">
            {renderOrdersTab()}
          </TabsContent>
          <TabsContent value="wishlist" className="mt-4">
            {renderWishlistTab()}
          </TabsContent>
          <TabsContent value="addresses" className="mt-4">
            {renderAddressesTab()}
          </TabsContent>
          <TabsContent value="settings" className="mt-4">
            {renderSettingsTab()}
          </TabsContent>
        </Tabs>

        {/* Switch Role & Logout */}
        <div className="space-y-3">
          {user.role === 'seller' || user.role === 'admin' ? (
            <Button
              variant="outline"
              className="w-full gap-2 h-11 rounded-xl"
              onClick={() => nav.setView(user.role === 'admin' ? 'admin' : 'seller-dashboard')}
            >
              <SwitchCamera className="size-4" />
              {user.role === 'admin' ? t('switchToAdmin') : t('switchToSeller')}
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="w-full gap-2 h-11 rounded-xl text-red-500 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/30"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            {t('logout')}
          </Button>
        </div>
      </div>

      {/* Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-emerald-600" />
              {editingAddress ? (t('editAddress')) : (t('b_addNewAddress'))}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t('addressLabel')}</Label>
                <Input value={addressForm.label} onChange={(e) => setAddressForm((p) => ({ ...p, label: e.target.value }))} placeholder={t('b_egHome')} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('b_fullName')}</Label>
                <Input value={addressForm.fullName} onChange={(e) => setAddressForm((p) => ({ ...p, fullName: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">{t('phone')}</Label>
                <Input value={addressForm.phone} onChange={(e) => setAddressForm((p) => ({ ...p, phone: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">{t('b_addressLine1')}</Label>
                <Input value={addressForm.address1} onChange={(e) => setAddressForm((p) => ({ ...p, address1: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">{t('b_addressLine2')}</Label>
                <Input value={addressForm.address2} onChange={(e) => setAddressForm((p) => ({ ...p, address2: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('b_city')}</Label>
                <Input value={addressForm.city} onChange={(e) => setAddressForm((p) => ({ ...p, city: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('b_stateProvince')}</Label>
                <Input value={addressForm.state} onChange={(e) => setAddressForm((p) => ({ ...p, state: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('b_postalCode')}</Label>
                <Input value={addressForm.postalCode} onChange={(e) => setAddressForm((p) => ({ ...p, postalCode: e.target.value }))} className="h-9 text-sm" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t('b_country')}</Label>
                <Select value={addressForm.country} onValueChange={(v) => setAddressForm((p) => ({ ...p, country: v }))}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder={t('b_selectCountry')} />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c.code} value={c.name}>
                        {isRTL ? c.nameAr : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddressDialog(false)}>
              {t('cancel')}
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveAddress}>
              {editingAddress ? (t('b_update')) : (t('add'))}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
