'use client';

import React, { useState, useEffect } from 'react';
import {
  Grid3X3, Search, Star, Download, ExternalLink, ChevronRight,
  LayoutDashboard, Megaphone, BarChart3, Truck, CreditCard,
  Sparkles, Check, MessageSquare, Shield, Zap, X,
  Code, Palette, Globe, Bot, LineChart, Mail,
  Package, Tag, Users, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';

// --- Types ---
interface AppReview {
  user: string;
  userAr: string;
  rating: number;
  comment: string;
  commentAr: string;
  date: string;
  dateAr: string;
}

interface MarketplaceApp {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  longDescription: string;
  longDescriptionAr: string;
  category: string;
  icon: React.ElementType;
  iconGradient: string;
  rating: number;
  reviewCount: number;
  installCount: number;
  isFree: boolean;
  price?: number;
  priceAr?: string;
  developer: string;
  developerAr: string;
  isFeatured?: boolean;
  isInstalled?: boolean;
  features: string[];
  featuresAr: string[];
  screenshots: number;
  reviews: AppReview[];
}

// --- Category Config ---
const appCategories = [
  { id: 'all', label: 'All', labelAr: 'الكل', icon: Grid3X3 },
  { id: 'productivity', label: 'Productivity', labelAr: 'الإنتاجية', icon: LayoutDashboard },
  { id: 'marketing', label: 'Marketing', labelAr: 'التسويق', icon: Megaphone },
  { id: 'analytics', label: 'Analytics', labelAr: 'التحليلات', icon: BarChart3 },
  { id: 'shipping', label: 'Shipping', labelAr: 'الشحن', icon: Truck },
  { id: 'payment', label: 'Payment', labelAr: 'الدفع', icon: CreditCard },
  { id: 'ai-tools', label: 'AI Tools', labelAr: 'أدوات الذكاء', icon: Sparkles },
];



// --- Helper: format install count ---
function formatInstalls(count: number, isRTL: boolean): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k+ ${isRTL ? 'تثبيت' : 'installs'}`;
  }
  return `${count}+ ${isRTL ? 'تثبيت' : 'installs'}`;
}

// --- Main Component ---
export function AppMarketplacePage() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const [apps, setApps] = useState<MarketplaceApp[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<MarketplaceApp | null>(null);
  const [installedApps, setInstalledApps] = useState<Set<string>>(new Set(['app4'])); // ShipFast pre-installed

  // Fetch apps from API
  useEffect(() => {
    fetch('/api/apps')
      .then((r) => r.json())
      .then((result) => {
        setApps(result.apps || result.data || result || []);
        setAppsLoading(false);
      })
      .catch(() => {
        setApps([]);
        setAppsLoading(false);
      });
  }, []);

  const toggleInstall = (appId: string) => {
    setInstalledApps((prev) => {
      const next = new Set(prev);
      if (next.has(appId)) next.delete(appId);
      else next.add(appId);
      return next;
    });
  };

  const filteredApps = apps.filter((app) => {
    const catMatch = activeCategory === 'all' || app.category === activeCategory;
    const searchMatch = !searchQuery ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.nameAr.includes(searchQuery) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.descriptionAr.includes(searchQuery);
    return catMatch && searchMatch;
  });

  const featuredApps = apps.filter((a) => a.isFeatured);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Grid3X3 className="size-7 text-emerald-600" />
            {isRTL ? 'سوق التطبيقات' : 'App Marketplace'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isRTL ? 'عزز متجرك مع تطبيقات وربطات قوية' : 'Supercharge your store with powerful apps & integrations'}
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={isRTL ? 'ابحث عن تطبيقات...' : 'Search apps...'}
            className="ps-9 h-10 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Featured Apps */}
        {!searchQuery && activeCategory === 'all' && (
          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Sparkles className="size-5 text-emerald-600" />
              {isRTL ? 'تطبيقات مميزة' : 'Featured Apps'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredApps.slice(0, 3).map((app) => {
                const Icon = app.icon;
                const isInstalled = installedApps.has(app.id);

                return (
                  <Card
                    key={app.id}
                    className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer overflow-hidden group"
                    onClick={() => setSelectedApp(app)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={`size-12 rounded-xl bg-gradient-to-br ${app.iconGradient} flex items-center justify-center shrink-0`}>
                          <Icon className="size-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                              {isRTL ? app.nameAr : app.name}
                            </h3>
                            <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-0 text-[9px] shrink-0">
                              {isRTL ? 'مميز' : 'Featured'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {isRTL ? app.descriptionAr : app.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
                            {app.rating}
                          </span>
                          <span>{formatInstalls(app.installCount, isRTL)}</span>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {app.isFree ? (isRTL ? 'مجاني' : 'Free') : (isRTL ? app.priceAr : `$${app.price}/mo`)}
                        </Badge>
                      </div>

                      <Button
                        size="sm"
                        className={`w-full text-xs h-8 rounded-lg gap-1 ${
                          isInstalled
                            ? 'bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                        onClick={(e) => { e.stopPropagation(); toggleInstall(app.id); }}
                      >
                        {isInstalled ? (
                          <><Check className="size-3" /> {isRTL ? 'مثبت' : 'Installed'}</>
                        ) : (
                          <><Download className="size-3" /> {isRTL ? 'تثبيت' : 'Install'}</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {appCategories.map((cat) => {
            const CatIcon = cat.icon;
            return (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                className={`rounded-full text-xs gap-1.5 ${activeCategory === cat.id ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <CatIcon className="size-3.5" />
                {isRTL ? cat.labelAr : cat.label}
              </Button>
            );
          })}
        </div>

        {/* App Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => {
            const Icon = app.icon;
            const isInstalled = installedApps.has(app.id);

            return (
              <Card
                key={app.id}
                className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer overflow-hidden group"
                onClick={() => setSelectedApp(app)}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`size-12 rounded-xl bg-gradient-to-br ${app.iconGradient} flex items-center justify-center shrink-0`}>
                      <Icon className="size-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {isRTL ? app.nameAr : app.name}
                      </h3>
                      <p className="text-[10px] text-muted-foreground">{isRTL ? app.developerAr : app.developer}</p>
                    </div>
                    {isInstalled && (
                      <Badge variant="secondary" className="text-[9px] shrink-0 bg-emerald-50 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 border-0">
                        <Check className="size-2.5 me-0.5" />
                        {isRTL ? 'مثبت' : 'Installed'}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {isRTL ? app.descriptionAr : app.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        {app.rating}
                        <span className="text-[10px]">({app.reviewCount})</span>
                      </span>
                    </div>
                    <span className="text-xs font-semibold">
                      {app.isFree ? (isRTL ? 'مجاني' : 'Free') : (isRTL ? app.priceAr : `$${app.price}/mo`)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className={`flex-1 text-xs h-8 rounded-lg gap-1 ${
                        isInstalled
                          ? 'bg-muted text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                      onClick={(e) => { e.stopPropagation(); toggleInstall(app.id); }}
                    >
                      {isInstalled ? (
                        <><X className="size-3" /> {isRTL ? 'إلغاء التثبيت' : 'Uninstall'}</>
                      ) : (
                        <><Download className="size-3" /> {isRTL ? 'تثبيت' : 'Install'}</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="size-8 p-0 rounded-lg"
                      onClick={(e) => { e.stopPropagation(); setSelectedApp(app); }}
                    >
                      <ExternalLink className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredApps.length === 0 && (
          <div className="text-center py-16">
            <Grid3X3 className="size-16 mx-auto text-muted-foreground/20" />
            <h3 className="text-lg font-medium mt-4">{t('noResults')}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {isRTL ? 'لا توجد تطبيقات تطابق بحثك' : 'No apps match your search'}
            </p>
          </div>
        )}
      </div>

      {/* App Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedApp && (() => {
            const Icon = selectedApp.icon;
            const isInstalled = installedApps.has(selectedApp.id);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className={`size-10 rounded-xl bg-gradient-to-br ${selectedApp.iconGradient} flex items-center justify-center`}>
                      <Icon className="size-5 text-white" />
                    </div>
                    <div>
                      <span>{isRTL ? selectedApp.nameAr : selectedApp.name}</span>
                      <p className="text-xs font-normal text-muted-foreground">{isRTL ? selectedApp.developerAr : selectedApp.developer}</p>
                    </div>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="size-4 fill-amber-400 text-amber-400" />
                        <span className="font-bold">{selectedApp.rating}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">{selectedApp.reviewCount} {isRTL ? 'تقييم' : 'reviews'}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="font-bold">{formatInstalls(selectedApp.installCount, isRTL).split(' ')[0]}</p>
                      <p className="text-[10px] text-muted-foreground">{isRTL ? 'تثبيت' : 'installs'}</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-muted/50">
                      <p className="font-bold">{selectedApp.isFree ? (isRTL ? 'مجاني' : 'Free') : `$${selectedApp.price}`}</p>
                      <p className="text-[10px] text-muted-foreground">{selectedApp.isFree ? '' : (isRTL ? '/شهر' : '/month')}</p>
                    </div>
                  </div>

                  {/* Screenshots Placeholder */}
                  <div>
                    <p className="text-sm font-medium mb-2">{isRTL ? 'لقطات الشاشة' : 'Screenshots'}</p>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                      {Array.from({ length: selectedApp.screenshots }).map((_, idx) => (
                        <div
                          key={idx}
                          className="size-24 rounded-lg bg-gradient-to-br from-muted to-muted/50 shrink-0 flex items-center justify-center"
                        >
                          <Icon className="size-8 text-muted-foreground/30" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <p className="text-sm font-medium mb-1">{isRTL ? 'الوصف' : 'Description'}</p>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? selectedApp.longDescriptionAr : selectedApp.longDescription}
                    </p>
                  </div>

                  <Separator />

                  {/* Features */}
                  <div>
                    <p className="text-sm font-medium mb-2">{isRTL ? 'الميزات' : 'Features'}</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {(isRTL ? selectedApp.featuresAr : selectedApp.features).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Reviews */}
                  <div>
                    <p className="text-sm font-medium mb-2">{isRTL ? 'التقييمات' : 'Reviews'}</p>
                    <div className="space-y-3">
                      {selectedApp.reviews.map((review, idx) => (
                        <div key={idx} className="bg-muted/50 rounded-lg p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="size-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold">
                                {(isRTL ? review.userAr : review.user).charAt(0)}
                              </div>
                              <span className="text-xs font-medium">{isRTL ? review.userAr : review.user}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`size-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">{isRTL ? review.commentAr : review.comment}</p>
                          <p className="text-[10px] text-muted-foreground/60">{isRTL ? review.dateAr : review.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Install/Uninstall */}
                  <Button
                    className={`w-full h-11 rounded-xl gap-2 text-sm font-semibold ${
                      isInstalled
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-400 dark:hover:bg-red-900'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                    onClick={() => toggleInstall(selectedApp.id)}
                  >
                    {isInstalled ? (
                      <><X className="size-4" /> {isRTL ? 'إلغاء تثبيت التطبيق' : 'Uninstall App'}</>
                    ) : (
                      <><Download className="size-4" /> {isRTL ? 'تثبيت التطبيق' : 'Install App'}</>
                    )}
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
