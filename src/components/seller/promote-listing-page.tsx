'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowUp, Star, Crown, AlertTriangle, Zap, Check, ChevronRight,
  ChevronLeft, TrendingUp, Eye, MousePointer, Clock, Package,
  Sparkles, ArrowLeft, BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { formatPrice } from '@/lib/currency';

// Icon map for ad products
const iconMap: Record<string, React.ElementType> = {
  ArrowUp,
  Star,
  Crown,
  AlertTriangle,
  Zap,
};

// Color config for ad products
const colorConfig: Record<string, { border: string; bg: string; text: string; badge: string; iconBg: string; selectedBg: string }> = {
  blue: {
    border: 'border-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-600 dark:text-blue-400',
    badge: 'bg-blue-500',
    iconBg: 'bg-gradient-to-br from-blue-500 to-cyan-500',
    selectedBg: 'ring-2 ring-blue-400 shadow-blue-200 dark:shadow-blue-900',
  },
  amber: {
    border: 'border-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500',
    iconBg: 'bg-gradient-to-br from-amber-500 to-yellow-500',
    selectedBg: 'ring-2 ring-amber-400 shadow-amber-200 dark:shadow-amber-900',
  },
  purple: {
    border: 'border-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/40',
    text: 'text-purple-600 dark:text-purple-400',
    badge: 'bg-purple-500',
    iconBg: 'bg-gradient-to-br from-purple-500 to-fuchsia-500',
    selectedBg: 'ring-2 ring-purple-400 shadow-purple-200 dark:shadow-purple-900',
  },
  red: {
    border: 'border-red-400',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-600 dark:text-red-400',
    badge: 'bg-red-500',
    iconBg: 'bg-gradient-to-br from-red-500 to-orange-500',
    selectedBg: 'ring-2 ring-red-400 shadow-red-200 dark:shadow-red-900',
  },
  emerald: {
    border: 'border-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    text: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    selectedBg: 'ring-2 ring-emerald-400 shadow-emerald-200 dark:shadow-emerald-900',
  },
};

interface AdProduct {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  duration: string;
  durationAr: string;
  durationDays: number;
  icon: string;
  description: string;
  descriptionAr: string;
  features: string[];
  featuresAr: string[];
  avgViewsIncrease: string;
  color: string;
  gradient: string;
}

interface SellerProduct {
  id: string;
  name: string;
  price: number;
  image: string;
}

export function PromoteListingPage() {
  const { t, locale, dir } = useI18n();
  const nav = useAppNavigation();
  const isRTL = dir() === 'rtl';

  const [adProducts, setAdProducts] = useState<AdProduct[]>([]);
  const [sellerProducts, setSellerProducts] = useState<SellerProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedAds, setSelectedAds] = useState<string[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/ad-products');
        if (res.ok) {
          const data = await res.json();
          setAdProducts(data.adProducts || []);
          setSellerProducts(data.sellerProducts || []);
        }
      } catch {
        // Use fallback data
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleAd = (adId: string) => {
    setSelectedAds((prev) =>
      prev.includes(adId) ? prev.filter((id) => id !== adId) : [...prev, adId]
    );
  };

  const totalCost = adProducts
    .filter((p) => selectedAds.includes(p.id))
    .reduce((sum, p) => sum + p.price, 0);

  const handlePromote = async () => {
    if (!selectedProduct || selectedAds.length === 0) return;
    setIsPurchasing(true);
    try {
      for (const adType of selectedAds) {
        await fetch('/api/ad-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: selectedProduct, adType }),
        });
      }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedAds([]);
        setSelectedProduct('');
      }, 4000);
    } catch {
      // Handle error silently
    } finally {
      setIsPurchasing(false);
    }
  };

  const selectedProductName = sellerProducts.find((p) => p.id === selectedProduct)?.name || '';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-200 dark:bg-emerald-800" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Success overlay
  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Check className="h-10 w-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {locale === 'ar' ? 'تم الترويج بنجاح!' : 'Promotion Successful!'}
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {locale === 'ar'
              ? `تم ترويج "${selectedProductName}" بنجاح. ستلاحظ زيادة في المشاهدات قريباً!`
              : `"${selectedProductName}" has been promoted. You'll notice increased views soon!`}
          </p>
          <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingUp className="h-5 w-5" />
            <span>{locale === 'ar' ? 'الزيادة المتوقعة في المشاهدات' : 'Expected views increase'}: +{Math.round(totalCost / 3.33 * 100)}%</span>
          </div>
          <Button
            onClick={() => { setShowSuccess(false); setSelectedAds([]); setSelectedProduct(''); }}
            className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
          >
            {locale === 'ar' ? 'ترويج إعلان آخر' : 'Promote Another Listing'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir()}>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white/20 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white/20 translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-white/10 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10"
              onClick={() => nav.setView('seller-dashboard')}
            >
              {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              <Sparkles className="h-3 w-3 me-1" />
              Ad Center
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            {locale === 'ar' ? 'عزز مبيعاتك' : 'Boost Your Sales'}
          </h1>
          <p className="text-white/80 text-lg max-w-2xl">
            {locale === 'ar'
              ? 'زيّن ظهور إعلاناتك واجذب المزيد من المشترين. احصل على مشاهدات أكثر وبيوع أسرع مع منتجاتنا الإعلانية.'
              : 'Increase your listing visibility and attract more buyers. Get more views and faster sales with our ad products.'}
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-4 mt-8">
            {[
              { icon: ArrowUp, label: locale === 'ar' ? 'رفع للأعلى' : 'Bump Up', stat: '+300%', desc: locale === 'ar' ? 'مشاهدات' : 'views' },
              { icon: Star, label: locale === 'ar' ? 'إعلان مميز' : 'Featured', stat: '+500%', desc: locale === 'ar' ? 'مشاهدات' : 'views' },
              { icon: Crown, label: locale === 'ar' ? 'بريميوم' : 'Premium', stat: '+800%', desc: locale === 'ar' ? 'مشاهدات' : 'views' },
              { icon: Zap, label: locale === 'ar' ? 'سبوتلايت' : 'Spotlight', stat: '+1200%', desc: locale === 'ar' ? 'مشاهدات' : 'views' },
            ].map((item, i) => (
              <div key={i} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className="h-4 w-4 text-white/80" />
                  <span className="text-white/80 text-xs font-medium">{item.label}</span>
                </div>
                <div className="text-white font-bold text-xl">{item.stat}</div>
                <div className="text-white/60 text-xs">{locale === 'ar' ? 'متوسط الزيادة في' : 'avg increase in'} {item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2 cols */}
          <div className="lg:col-span-2 space-y-8">
            {/* Select Listing */}
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  {locale === 'ar' ? 'اختر إعلانك للترويج' : 'Select Your Listing to Promote'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="w-full h-12">
                    <SelectValue placeholder={locale === 'ar' ? 'اختر منتجاً من قائمتك...' : 'Select a product from your listings...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {sellerProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-muted-foreground text-sm">{formatPrice(product.price)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Ad Products Grid */}
            <div>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                {locale === 'ar' ? 'منتجات الترويج' : 'Promotion Products'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {adProducts.map((product) => {
                  const Icon = iconMap[product.icon] || Zap;
                  const colors = colorConfig[product.color] || colorConfig.emerald;
                  const isSelected = selectedAds.includes(product.id);
                  const featureList = locale === 'ar' ? product.featuresAr : product.features;

                  return (
                    <Card
                      key={product.id}
                      className={`relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg ${
                        isSelected
                          ? `${colors.selectedBg} ${colors.border} shadow-lg`
                          : 'border-border hover:border-emerald-200 dark:hover:border-emerald-800'
                      }`}
                      onClick={() => toggleAd(product.id)}
                    >
                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-3 end-3 z-10">
                          <div className={`${colors.iconBg} rounded-full p-1 shadow-md`}>
                            <Check className="h-3.5 w-3.5 text-white" />
                          </div>
                        </div>
                      )}

                      {/* Gradient top accent */}
                      <div className={`h-1.5 bg-gradient-to-r ${product.gradient}`} />

                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`${colors.iconBg} p-2.5 rounded-xl shadow-md`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base">{locale === 'ar' ? product.nameAr : product.name}</h3>
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {locale === 'ar' ? product.descriptionAr : product.description}
                            </p>
                          </div>
                        </div>

                        {/* Price and Duration */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{locale === 'ar' ? product.durationAr : product.duration}</span>
                          </div>
                        </div>

                        {/* Features List */}
                        <ul className="space-y-1.5 mb-4">
                          {featureList.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-sm">
                              <BadgeCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-muted-foreground">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Avg Views Badge */}
                        <div className={`${colors.bg} rounded-lg px-3 py-2 flex items-center justify-between`}>
                          <span className="text-xs font-medium text-muted-foreground">
                            {locale === 'ar' ? 'متوسط الزيادة في المشاهدات' : 'Average views increase'}
                          </span>
                          <Badge className={`${colors.badge} text-white text-xs font-bold`}>
                            <Eye className="h-3 w-3 me-1" />
                            {product.avgViewsIncrease}
                          </Badge>
                        </div>

                        {/* Select Button */}
                        <Button
                          className={`w-full mt-4 transition-all duration-300 ${
                            isSelected
                              ? `${colors.iconBg} text-white shadow-md`
                              : 'bg-muted text-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-300'
                          }`}
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); toggleAd(product.id); }}
                        >
                          {isSelected ? (
                            <>
                              <Check className="h-4 w-4 me-1.5" />
                              {locale === 'ar' ? 'تم الاختيار' : 'Selected'}
                            </>
                          ) : (
                            locale === 'ar' ? 'اختر' : 'Select'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Stats Section */}
            <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  {locale === 'ar' ? 'متوسط النتائج' : 'Average Results'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { name: locale === 'ar' ? 'رفع للأعلى' : 'Bump Up', stat: '+300%', icon: ArrowUp, color: 'text-blue-500' },
                    { name: locale === 'ar' ? 'إعلان مميز' : 'Featured Ad', stat: '+500%', icon: Star, color: 'text-amber-500' },
                    { name: locale === 'ar' ? 'بريميوم' : 'Premium Ad', stat: '+800%', icon: Crown, color: 'text-purple-500' },
                  ].map((item, i) => (
                    <div key={i} className="bg-white/60 dark:bg-background/60 rounded-xl p-4 text-center backdrop-blur-sm border border-emerald-100 dark:border-emerald-900">
                      <item.icon className={`h-8 w-8 mx-auto mb-2 ${item.color}`} />
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{item.stat}</div>
                      <div className="text-sm text-muted-foreground mt-1">{locale === 'ar' ? 'مشاهدات أكثر' : 'more views'} - {item.name}</div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {locale === 'ar'
                    ? '* النتائج متوسطة وقد تختلف حسب الفئة والمنتج'
                    : '* Results are averaged and may vary by category and product'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary Sidebar - 1 col */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <Card className="border-emerald-200 dark:border-emerald-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    {locale === 'ar' ? 'ملخص الطلب' : 'Order Summary'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Selected Product */}
                  {selectedProduct && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        {locale === 'ar' ? 'المنتج المختار' : 'Selected Listing'}
                      </p>
                      <p className="font-medium text-sm truncate">{selectedProductName}</p>
                    </div>
                  )}

                  {/* Selected Promotions */}
                  {selectedAds.length === 0 ? (
                    <div className="text-center py-6">
                      <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {locale === 'ar' ? 'اختر منتجاً ترويجياً للبدء' : 'Select a promotion product to get started'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedAds.map((adId) => {
                        const ad = adProducts.find((p) => p.id === adId);
                        if (!ad) return null;
                        const Icon = iconMap[ad.icon] || Zap;
                        const colors = colorConfig[ad.color] || colorConfig.emerald;
                        return (
                          <div
                            key={adId}
                            className={`flex items-center justify-between p-2.5 rounded-lg ${colors.bg} border ${colors.border}`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon className={`h-4 w-4 ${colors.text} shrink-0`} />
                              <span className="text-sm font-medium truncate">
                                {locale === 'ar' ? ad.nameAr : ad.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-sm font-bold">{formatPrice(ad.price)}</span>
                              <button
                                onClick={() => toggleAd(adId)}
                                className="text-muted-foreground hover:text-red-500 transition-colors"
                                aria-label={locale === 'ar' ? 'إزالة' : 'Remove'}
                              >
                                <AlertTriangle className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {selectedAds.length > 0 && (
                    <>
                      <Separator />

                      {/* Total */}
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{locale === 'ar' ? 'المجموع' : 'Total'}</span>
                        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {formatPrice(totalCost)}
                        </span>
                      </div>

                      {/* Views estimate */}
                      <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-3 text-center">
                        <Eye className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">
                          {locale === 'ar' ? 'الزيادة المتوقعة في المشاهدات' : 'Estimated views increase'}
                        </p>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedAds.length === 1
                            ? adProducts.find((p) => p.id === selectedAds[0])?.avgViewsIncrease
                            : `+${Math.round(totalCost / 3.33 * 100)}%`}
                        </p>
                      </div>

                      {/* Duration info */}
                      <div className="text-xs text-muted-foreground space-y-1">
                        {selectedAds.map((adId) => {
                          const ad = adProducts.find((p) => p.id === adId);
                          if (!ad) return null;
                          return (
                            <div key={adId} className="flex items-center gap-1.5">
                              <Clock className="h-3 w-3" />
                              <span>{locale === 'ar' ? ad.nameAr : ad.name}: {locale === 'ar' ? ad.durationAr : ad.duration}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Promote Now Button */}
                      <Button
                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 h-12 text-base font-bold"
                        onClick={handlePromote}
                        disabled={!selectedProduct || isPurchasing}
                      >
                        {isPurchasing ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {locale === 'ar' ? 'جاري المعالجة...' : 'Processing...'}
                          </div>
                        ) : (
                          <>
                            <Zap className="h-5 w-5 me-1.5" />
                            {locale === 'ar' ? 'روّج الآن' : 'Promote Now'}
                          </>
                        )}
                      </Button>

                      {!selectedProduct && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                          {locale === 'ar' ? 'يرجى اختيار إعلان أولاً' : 'Please select a listing first'}
                        </p>
                      )}
                    </>
                  )}

                  {/* Security note */}
                  <div className="flex items-start gap-2 pt-2">
                    <BadgeCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      {locale === 'ar'
                        ? 'دفعتك آمنة ومحمية. يتم احتجاز المبلغ في حساب ضمان حتى تفعيل الترويج.'
                        : 'Your payment is secure and protected. Funds are held in escrow until promotion is activated.'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ Section */}
              <Card className="mt-4 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {locale === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      q: locale === 'ar' ? 'كم تستمر الترويجات؟' : 'How long do promotions last?',
                      a: locale === 'ar' ? 'تختلف المدة حسب المنتج: من 24 ساعة إلى 14 يوماً.' : 'Duration varies by product: from 24 hours to 14 days.',
                    },
                    {
                      q: locale === 'ar' ? 'هل يمكنني الجمع بين عدة ترويجات؟' : 'Can I combine multiple promotions?',
                      a: locale === 'ar' ? 'نعم! يمكنك شراء عدة منتجات ترويجية لنفس الإعلان.' : 'Yes! You can purchase multiple ad products for the same listing.',
                    },
                    {
                      q: locale === 'ar' ? 'متى أرى النتائج؟' : 'When will I see results?',
                      a: locale === 'ar' ? 'عادة خلال ساعات قليلة من التفعيل.' : 'Usually within a few hours of activation.',
                    },
                  ].map((faq, i) => (
                    <div key={i}>
                      <p className="text-xs font-medium">{faq.q}</p>
                      <p className="text-xs text-muted-foreground">{faq.a}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
