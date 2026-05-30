'use client';

import React, { useState, useEffect } from 'react';
import {
  Flame, Clock, ArrowDownUp, Tag, ShoppingCart, Star, Truck,
  Headphones, Watch, Gamepad2, Camera, Sparkles, Zap, Bell,
  Mail, Loader2, Gift, Check,
  Monitor, Shirt, Home as HomeIcon, Flower2, Dumbbell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useCartStore } from '@/stores/cart-store';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import { DEAL_CATEGORIES, DEAL_CATEGORY_ICONS, DEAL_CATEGORY_GRADIENTS } from '@/lib/reference-data';

interface DealItem {
  id: string;
  name: string;
  nameAr?: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  image: string;
  rating: number;
  reviewCount: number;
  storeName: string;
  isFeatured: boolean;
  endsAt: number; // hours remaining
  hasFreeShipping: boolean;
  stock: number;
  category: string;
}

interface LightningDeal extends DealItem {
  type: 'lightning';
  minutesLeft: number; // 15-30 minutes
}

interface ComingSoonDeal {
  id: string;
  name: string;
  nameAr?: string;
  originalPrice: number;
  salePrice: number;
  discount: number;
  category: string;
  startsAt: string; // date string
  notifyEmail: boolean;
}

const dealCategories = DEAL_CATEGORIES;


const categoryIconMap: Record<string, React.ElementType> = {
  Monitor,
  Shirt,
  Home: HomeIcon,
  Flower2,
  Dumbbell,
};

const categoryIcons: Record<string, React.ElementType> = Object.fromEntries(
  Object.entries(DEAL_CATEGORY_ICONS).map(([k, v]) => [k, categoryIconMap[v] || Sparkles])
);

const categoryGradients = DEAL_CATEGORY_GRADIENTS;



// Deal card placeholder component
function DealPlaceholder({ category, name, nameAr, locale }: { category: string; name: string; nameAr?: string; locale: string }) {
  const config = categoryGradients[category] || categoryGradients.electronics;
  const Icon = categoryIcons[category] || Sparkles;
  const displayName = locale === 'ar' && nameAr ? nameAr : name;

  return (
    <div className={`flex flex-col items-center justify-center h-full bg-gradient-to-br ${config.light} ${config.dark} relative overflow-hidden`}>
      <div className="absolute top-3 end-3 w-12 h-12 rounded-full bg-white/10" />
      <div className="absolute bottom-4 start-3 w-8 h-8 rounded-full bg-white/10" />
      <Icon className={`size-10 ${config.iconColor} mb-2 opacity-60`} />
      <p className="text-xs font-medium text-center px-3 leading-tight max-w-[85%] text-muted-foreground/80 line-clamp-2">
        {displayName}
      </p>
    </div>
  );
}

function CountdownTimer({ hours, animated }: { hours: number; animated?: boolean }) {
  const [timeLeft, setTimeLeft] = useState(hours * 3600);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const h = Math.floor(timeLeft / 3600);
  const m = Math.floor((timeLeft % 3600) / 60);
  const s = timeLeft % 60;

  if (animated) {
    return (
      <div className="flex items-center gap-1.5">
        {[
          { val: h, label: 'H' },
          { val: m, label: 'M' },
          { val: s, label: 'S' },
        ].map((unit, i) => (
          <div key={i} className="bg-white/20 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-center min-w-[44px] border border-white/10 shadow-lg shadow-black/10">
            <span className="text-lg font-bold block leading-none tabular-nums">
              {String(unit.val).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-white/70">{unit.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs font-mono">
      <span className="bg-red-600 text-white px-2 py-0.5 rounded min-w-[28px] text-center inline-block shadow-sm shadow-red-500/30 tabular-nums">{String(h).padStart(2, '0')}</span>
      <span className="text-red-500 animate-pulse">:</span>
      <span className="bg-red-600 text-white px-2 py-0.5 rounded min-w-[28px] text-center inline-block shadow-sm shadow-red-500/30 tabular-nums">{String(m).padStart(2, '0')}</span>
      <span className="text-red-500 animate-pulse">:</span>
      <span className="bg-red-600 text-white px-2 py-0.5 rounded min-w-[28px] text-center inline-block shadow-sm shadow-red-500/30 tabular-nums">{String(s).padStart(2, '0')}</span>
    </div>
  );
}

function LightningCountdown({ minutes }: { minutes: number }) {
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;

  return (
    <div className="flex items-center gap-1 text-xs font-mono">
      <span className="bg-amber-600 text-white px-2 py-0.5 rounded min-w-[28px] text-center inline-block">{String(m).padStart(2, '0')}</span>
      <span className="text-amber-500 animate-pulse">:</span>
      <span className="bg-amber-600 text-white px-2 py-0.5 rounded min-w-[28px] text-center inline-block">{String(s).padStart(2, '0')}</span>
    </div>
  );
}

export function DealsPage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const addItem = useCartStore((s) => s.addItem);
  const isRTL = locale === 'ar';

  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('discount');
  const [deals, setDeals] = useState<DealItem[]>([]);
  const [dealOfDay, setDealOfDay] = useState<DealItem | null>(null);
  const [lightningDeals, setLightningDeals] = useState<LightningDeal[]>([]);
  const [comingSoonDeals, setComingSoonDeals] = useState<ComingSoonDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitted, setNotifySubmitted] = useState(false);
  const [notifiedDeals, setNotifiedDeals] = useState<Set<string>>(new Set());

  // Fetch deals from API
  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/deals?limit=12');
        if (res.ok) {
          const data = await res.json();
          if (data.deals && data.deals.length > 0) {
            const mapped: DealItem[] = data.deals.map((d: Record<string, unknown>) => ({
              id: d.id as string,
              name: d.name as string,
              nameAr: (d.nameAr as string) || '',
              originalPrice: (d.originalPrice as number) ?? 0,
              salePrice: (d.price as number) ?? 0,
              discount: (d.discountPercent as number) ?? 0,
              image: (d.image as string) || '',
              rating: (d.rating as number) ?? 0,
              reviewCount: (d.reviewCount as number) ?? 0,
              storeName: (d.storeName as string) || '',
              isFeatured: false,
              endsAt: (d.endsAt as number) || 6,
              hasFreeShipping: (d.freeShipping as boolean) || false,
              stock: (d.stock as number) || 20,
              category: ((d.category as string) || 'electronics').toLowerCase(),
            }));
            setDeals(mapped);

            if (data.dealOfDay) {
              const dod = data.dealOfDay as Record<string, unknown>;
              setDealOfDay({
                id: dod.id as string,
                name: dod.name as string,
                nameAr: (dod.nameAr as string) || '',
                originalPrice: (dod.originalPrice as number) ?? 0,
                salePrice: (dod.price as number) ?? 0,
                discount: (dod.discountPercent as number) ?? 0,
                image: (dod.image as string) || '',
                rating: (dod.rating as number) ?? 0,
                reviewCount: (dod.reviewCount as number) ?? 0,
                storeName: (dod.storeName as string) || '',
                isFeatured: true,
                endsAt: 5,
                hasFreeShipping: (dod.freeShipping as boolean) || false,
                stock: (dod.stock as number) || 20,
                category: ((dod.category as string) || 'electronics').toLowerCase(),
              });
            } else {
              const best = [...mapped].sort((a, b) => b.discount - a.discount)[0];
              if (best) setDealOfDay({ ...best, isFeatured: true });
            }
          } else {
            setDeals([]);
          }
        } else {
          setDeals([]);
        }
      } catch {
        setDeals([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDeals();

    // Fetch lightning and coming soon deals
    // The API returns the same shape regardless of `type` param:
    // { deals: [...], total, dealOfDay } where each deal has:
    //   price (not salePrice), discountPercent (not discount), no minutesLeft/startsAt
    // We must map raw API deals to the LightningDeal / ComingSoonDeal interfaces.
    const fetchOtherDeals = async () => {
      try {
        const [lightningRes, comingRes] = await Promise.all([
          fetch('/api/deals?type=lightning&limit=3'),
          fetch('/api/deals?type=coming-soon&limit=3'),
        ]);
        if (lightningRes.ok) {
          const lData = await lightningRes.json();
          const rawLightning = Array.isArray(lData) ? lData : lData.items || lData.deals || [];
          const mappedLightning: LightningDeal[] = rawLightning.map((d: Record<string, unknown>) => ({
            id: d.id as string,
            name: d.name as string,
            nameAr: (d.nameAr as string) || '',
            originalPrice: (d.originalPrice as number) ?? 0,
            salePrice: (d.price as number) ?? 0,
            discount: (d.discountPercent as number) ?? 0,
            image: (d.image as string) || '',
            rating: (d.rating as number) ?? 0,
            reviewCount: (d.reviewCount as number) ?? 0,
            storeName: (d.storeName as string) || '',
            isFeatured: false,
            endsAt: (d.endsAt as number) || 6,
            hasFreeShipping: (d.freeShipping as boolean) || false,
            stock: (d.stock as number) || 20,
            category: ((d.category as string) || 'electronics').toLowerCase(),
            type: 'lightning' as const,
            minutesLeft: (d.minutesLeft as number) || 20,
          }));
          setLightningDeals(mappedLightning);
        }
        if (comingRes.ok) {
          const cData = await comingRes.json();
          const rawComing = Array.isArray(cData) ? cData : cData.items || cData.deals || [];
          const mappedComing: ComingSoonDeal[] = rawComing.map((d: Record<string, unknown>) => ({
            id: d.id as string,
            name: d.name as string,
            nameAr: (d.nameAr as string) || '',
            originalPrice: (d.originalPrice as number) ?? 0,
            salePrice: (d.price as number) ?? 0,
            discount: (d.discountPercent as number) ?? 0,
            category: ((d.category as string) || 'electronics').toLowerCase(),
            startsAt: (d.startsAt as string) || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            notifyEmail: false,
          }));
          setComingSoonDeals(mappedComing);
        }
      } catch {
        // Lightning and coming soon are optional
      }
    };
    fetchOtherDeals();
  }, []);

  const filteredDeals = deals
    .filter((d) => activeCategory === 'all' || d.category === activeCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'discount': return b.discount - a.discount;
        case 'price-low': return a.salePrice - b.salePrice;
        case 'price-high': return b.salePrice - a.salePrice;
        case 'ending': return a.endsAt - b.endsAt;
        default: return b.discount - a.discount;
      }
    });

  const handleNotifyEmail = () => {
    if (!notifyEmail.trim()) return;
    setNotifySubmitted(true);
    toast.success(t('b_signedUpForNotifications'));
    setTimeout(() => setNotifySubmitted(false), 3000);
  };

  const handleNotifyDeal = (dealId: string) => {
    setNotifiedDeals((prev) => {
      const next = new Set(prev);
      next.add(dealId);
      return next;
    });
    toast.success(t('b_willNotifyWhenStarts'));
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-64 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 animate-pulse" />
          </Card>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-square bg-muted animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state — no deals at all
  if (deals.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Tag className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">{t('noResults')}</p>
            <p className="text-sm">{t('deals_noDealsAvailable')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-8">
        {/* Deal of the Day Hero */}
        {dealOfDay && (
          <Card className="deal-hero-gradient-border border-0 shadow-lg overflow-hidden pulse-glow">
            <div className="relative bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white">
              <div className="absolute inset-0 bg-black/10" />
              {/* Decorative mesh gradient */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 end-0 w-64 h-64 rounded-full bg-white/10 blur-3xl -translate-y-1/3" />
                <div className="absolute bottom-0 start-0 w-48 h-48 rounded-full bg-white/10 blur-3xl translate-y-1/3" />
              </div>
              <div className="relative grid md:grid-cols-2 gap-6 p-6 md:p-8 items-center">
                <div className="space-y-4">
                  <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 text-xs font-bold animate-hot-fire">
                    <Flame className="size-3 me-1" />
                    {t('dealOfTheDay')}
                  </Badge>
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {isRTL && dealOfDay.nameAr ? dealOfDay.nameAr : dealOfDay.name}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Badge className="discount-sparkle text-white text-lg font-bold px-3 py-1">
                      -{dealOfDay.discount}%
                    </Badge>
                    <span className="text-xl line-through text-red-200">{formatPrice(dealOfDay.originalPrice)}</span>
                  </div>
                  <div className="text-4xl font-bold">{formatPrice(dealOfDay.salePrice)}</div>
                  {/* Large countdown */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-red-100">
                      <Clock className="size-4" />
                      <span>{t('endsIn')}</span>
                    </div>
                    <CountdownTimer hours={dealOfDay.endsAt} animated />
                  </div>
                  <Button className="bg-white text-red-600 hover:bg-red-50 font-semibold h-11 rounded-xl gap-2">
                    <ShoppingCart className="size-4" />
                    {t('buyNow')}
                  </Button>
                  {/* Stock progress bar with % claimed */}
                  {dealOfDay.stock > 0 && dealOfDay.stock <= 100 && (
                    <div className="space-y-1 w-full max-w-xs">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-red-100">
                          {dealOfDay.stock <= 10 ? (t('deals_sellingFast')) : dealOfDay.stock <= 30 ? (t('deals_limitedStock')) : (t('deals_inStock'))} · {dealOfDay.stock} {t('deals_left')}
                        </p>
                        <span className="text-[10px] font-bold text-emerald-300">
                          {100 - dealOfDay.stock}% {t('deals_claimed') || 'claimed'}
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-white/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${dealOfDay.stock <= 10 ? 'bg-gradient-to-r from-red-400 to-rose-400' : dealOfDay.stock <= 30 ? 'bg-gradient-to-r from-amber-400 to-orange-400' : 'bg-gradient-to-r from-emerald-400 to-teal-400'}`}
                          style={{ width: `${Math.min(100, (100 - dealOfDay.stock))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="relative aspect-square max-h-64 mx-auto">
                  <DealPlaceholder
                    category={dealOfDay.category}
                    name={dealOfDay.name}
                    nameAr={dealOfDay.nameAr}
                    locale={locale}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Lightning Deals Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="size-5 text-amber-500" />
            <h2 className="text-xl font-bold">{t('lightningDeals')}</h2>
            <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-[10px] animate-pulse">
              <Zap className="size-2.5 me-0.5" />
              {t('veryLimited')}
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {lightningDeals.map((deal) => {
              const displayName = isRTL && deal.nameAr ? deal.nameAr : deal.name;
              return (
                <Card key={deal.id} className="border-2 border-amber-200 dark:border-amber-800 shadow-sm hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden lightning-deal-pulse-border">
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    <DealPlaceholder category={deal.category} name={deal.name} nameAr={deal.nameAr} locale={locale} />
                    <Badge className="absolute top-2 start-2 discount-sparkle text-white text-[10px] font-bold px-2">
                      <Zap className="size-2.5 me-0.5 animate-lightning-flash" />
                      -{deal.discount}%
                    </Badge>
                    {deal.stock <= 5 && (
                      <Badge className="absolute top-2 end-2 bg-red-600 text-white text-[10px]">
                        {t('b_onlyLeft', { stock: deal.stock })}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <h3 className="text-sm font-medium line-clamp-1">{displayName}</h3>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-amber-600">{formatPrice(deal.salePrice)}</span>
                      <span className="text-xs text-muted-foreground line-through">{formatPrice(deal.originalPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <LightningCountdown minutes={deal.minutesLeft} />
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          addItem({
                            productId: deal.id,
                            name: deal.name,
                            price: deal.salePrice,
                            originalPrice: deal.originalPrice,
                            image: deal.image,
                            quantity: 1,
                            storeId: '',
                            storeName: deal.storeName,
                          });
                        }}
                      >
                        <ShoppingCart className="size-3 me-1" />
                        {t('buyNow')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Category Tabs + Sort */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList>
              {dealCategories.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value} className="text-xs">
                  {isRTL ? cat.labelAr : cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <ArrowDownUp className="size-4 me-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="discount">{t('b_highestDiscount')}</SelectItem>
              <SelectItem value="price-low">{t('b_priceLowFirst')}</SelectItem>
              <SelectItem value="price-high">{t('b_priceHighFirst')}</SelectItem>
              <SelectItem value="ending">{t('endingSoon')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Deals Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDeals.map((deal) => {
            return (
              <Card
                key={deal.id}
                className="group deal-card-hover border border-border/60 shadow-sm hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] cursor-pointer overflow-hidden backdrop-blur-md bg-card/80"
                onClick={() => nav.selectProduct(deal.id)}
              >
                <div className="relative aspect-square bg-muted overflow-hidden">
                  <DealPlaceholder
                    category={deal.category}
                    name={deal.name}
                    nameAr={deal.nameAr}
                    locale={locale}
                  />
                  <div className="absolute top-2 start-2 flex flex-col gap-1">
                    <Badge className="discount-sparkle text-white text-[10px] font-bold px-2">
                      -{deal.discount}%
                    </Badge>
                    {deal.discount > 30 && (
                      <Badge className="bg-orange-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 animate-hot-fire shadow-sm shadow-orange-500/30">
                        <Flame className="size-2.5 me-0.5" />
                        {t('deals_hot')}
                      </Badge>
                    )}
                    {deal.endsAt <= 2 && (
                      <Badge className="bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 animate-pulse shadow-sm shadow-red-500/30">
                        <Clock className="size-2.5 me-0.5" />
                        {t('endingSoon')}
                      </Badge>
                    )}
                    {deal.stock <= 5 && deal.stock > 0 && (
                      <Badge className="bg-amber-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 shadow-sm shadow-amber-500/30">
                        {t('deals_limitedStock')}
                      </Badge>
                    )}
                  </div>
                  {deal.hasFreeShipping && (
                    <Badge variant="secondary" className="absolute top-2 end-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px]">
                      <Truck className="size-2.5 me-0.5" />
                      {t('freeShipping')}
                    </Badge>
                  )}
                </div>
                <CardContent className="p-3 space-y-1.5">
                  <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {isRTL && deal.nameAr ? deal.nameAr : deal.name}
                  </h3>
                  <div className="flex items-center gap-1">
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium">{deal.rating}</span>
                    <span className="text-[10px] text-muted-foreground">({deal.reviewCount})</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPrice(deal.salePrice)}
                    </span>
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(deal.originalPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <CountdownTimer hours={deal.endsAt} />
                    <span className="text-[10px] text-muted-foreground">{deal.storeName}</span>
                  </div>
                  {/* Stock progress bar with % claimed */}
                  {deal.stock > 0 && deal.stock <= 100 && (
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-muted-foreground font-medium">
                          {deal.stock <= 10 ? (t('deals_sellingFast')) : (t('deals_stockLeft', { stock: deal.stock }))}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                          {100 - deal.stock}% {t('deals_claimed') || 'claimed'}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${deal.stock <= 10 ? 'bg-gradient-to-r from-red-500 to-rose-500' : deal.stock <= 30 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}
                          style={{ width: `${Math.min(100, (100 - deal.stock))}%` }}
                        />
                      </div>
                    </div>
                  )}
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs h-8 rounded-xl mt-1 shadow-md shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      addItem({
                        productId: deal.id,
                        name: deal.name,
                        price: deal.salePrice,
                        originalPrice: deal.originalPrice,
                        image: deal.image,
                        quantity: 1,
                        storeId: '',
                        storeName: deal.storeName,
                      });
                    }}
                  >
                    <ShoppingCart className="size-3 me-1" />
                    {t('addToCart')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredDeals.length === 0 && (
          <div className="text-center py-16">
            <Tag className="size-16 mx-auto text-muted-foreground/20" />
            <h3 className="text-lg font-medium mt-4">{t('noResults')}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t('b_noDealsInCategory')}
            </p>
          </div>
        )}

        {/* Coming Soon Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Gift className="size-5 text-emerald-500" />
            <h2 className="text-xl font-bold">{t('comingSoon')}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {comingSoonDeals.map((deal) => {
              const displayName = isRTL && deal.nameAr ? deal.nameAr : deal.name;
              const startDate = new Date(deal.startsAt);
              const isNotified = notifiedDeals.has(deal.id);
              return (
                <Card key={deal.id} className="border-dashed border-2 border-emerald-200 dark:border-emerald-800 overflow-hidden">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px]">
                        <Clock className="size-2.5 me-0.5" />
                        {t('comingSoon')}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        -{deal.discount}%
                      </Badge>
                    </div>
                    <h3 className="text-sm font-medium">{displayName}</h3>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-emerald-600">{formatPrice(deal.salePrice)}</span>
                      <span className="text-xs text-muted-foreground line-through">{formatPrice(deal.originalPrice)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('startsAt')} {startDate.toLocaleDateString(getLocale(isRTL), { month: 'short', day: 'numeric', hour: '2-digit' })}
                    </p>
                    <Button
                      size="sm"
                      variant={isNotified ? 'secondary' : 'outline'}
                      className={`w-full text-xs h-8 ${isNotified ? '' : 'border-emerald-300 dark:border-emerald-700 text-emerald-600'}`}
                      onClick={() => handleNotifyDeal(deal.id)}
                      disabled={isNotified}
                    >
                      {isNotified ? (
                        <>
                          <Check className="size-3 me-1" />
                          {t('subscribed')}
                        </>
                      ) : (
                        <>
                          <Bell className="size-3 me-1" />
                          {t('notifyMe')}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Email Notification Signup */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
          <CardContent className="p-6 text-center space-y-3">
            <Mail className="size-8 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-bold">{t('neverMissDeal')}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t('b_dealAlertDesc')}
            </p>
            {!notifySubmitted ? (
              <div className="flex gap-2 max-w-sm mx-auto">
                <Input
                  type="email"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  placeholder={t('enterEmail')}
                  className="h-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleNotifyEmail()}
                />
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white h-10" onClick={handleNotifyEmail}>
                  {t('subscribe')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 justify-center text-emerald-600">
                <Check className="size-5" />
                <span className="font-medium">{t('successfullySubscribed')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
