'use client';

import React, { useState, useEffect } from 'react';
import {
  Crown, Star, Gift, Award, ChevronRight, Check, Zap,
  ShieldCheck, Truck, Headphones, CreditCard, Percent,
  Users, Clock, TrendingUp, Sparkles, ArrowRight, Gem,
  ShoppingBag, Target, Medal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/lib/i18n';
import { useUserStore } from '@/stores/user-store';
import { formatPrice } from '@/lib/currency';
import { SHIPPING_CONFIG } from '@/lib/config';

// --- Types ---
interface LoyaltyTier {
  id: string;
  name: string;
  nameAr: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  gradient: string;
  icon: React.ElementType;
  benefits: string[];
  benefitsAr: string[];
  pointsMultiplier: number;
}

interface Reward {
  id: string;
  name: string;
  nameAr: string;
  pointsCost: number;
  description: string;
  descriptionAr: string;
  category: string;
  categoryAr: string;
  isPopular?: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  priceAr: string;
  period: string;
  periodAr: string;
  features: string[];
  featuresAr: string[];
  isPopular?: boolean;
  icon: React.ElementType;
}

interface PointsEntry {
  id: string;
  description: string;
  descriptionAr: string;
  points: number;
  date: string;
  dateAr: string;
  type: 'earned' | 'redeemed';
}

// --- Loyalty Tiers ---
const loyaltyTiers: LoyaltyTier[] = [
  {
    id: 'bronze', name: 'Bronze', nameAr: 'برونزي',
    minPoints: 0, maxPoints: 999,
    color: 'text-amber-700 dark:text-amber-500',
    gradient: 'from-amber-400 to-amber-600',
    icon: Medal,
    benefits: ['1x points on all purchases', 'Birthday reward', `Free shipping on orders $${SHIPPING_CONFIG.freeShippingThreshold}+`],
    benefitsAr: ['نقاط 1x على جميع المشتريات', 'مكافأة عيد ميلاد', `شحن مجاني للطلبات فوق $${SHIPPING_CONFIG.freeShippingThreshold}`],
    pointsMultiplier: 1,
  },
  {
    id: 'silver', name: 'Silver', nameAr: 'فضي',
    minPoints: 1000, maxPoints: 4999,
    color: 'text-gray-500 dark:text-gray-300',
    gradient: 'from-gray-400 to-gray-500',
    icon: Award,
    benefits: ['1.5x points on all purchases', 'Birthday reward', 'Free shipping on orders $75+', 'Early access to sales', 'Exclusive deals'],
    benefitsAr: ['نقاط 1.5x على جميع المشتريات', 'مكافأة عيد ميلاد', 'شحن مجاني للطلبات فوق $75', 'وصول مبكر للعروض', 'عروض حصرية'],
    pointsMultiplier: 1.5,
  },
  {
    id: 'gold', name: 'Gold', nameAr: 'ذهبي',
    minPoints: 5000, maxPoints: 14999,
    color: 'text-yellow-600 dark:text-yellow-400',
    gradient: 'from-yellow-400 to-yellow-600',
    icon: Crown,
    benefits: ['2x points on all purchases', 'Birthday reward + gift', 'Free shipping on all orders', 'Early access to sales', 'Exclusive deals', 'Priority support', 'Monthly surprise box'],
    benefitsAr: ['نقاط 2x على جميع المشتريات', 'مكافأة عيد ميلاد + هدية', 'شحن مجاني على جميع الطلبات', 'وصول مبكر للعروض', 'عروض حصرية', 'دعم ذو أولوية', 'صندوق مفاجأة شهري'],
    pointsMultiplier: 2,
  },
  {
    id: 'platinum', name: 'Platinum', nameAr: 'بلاتيني',
    minPoints: 15000, maxPoints: 49999,
    color: 'text-cyan-600 dark:text-cyan-400',
    gradient: 'from-cyan-400 to-cyan-600',
    icon: Gem,
    benefits: ['3x points on all purchases', 'Birthday reward + premium gift', 'Free express shipping', 'VIP sale access', 'Personal shopper', '24/7 priority support', 'Monthly surprise box', 'Annual bonus points'],
    benefitsAr: ['نقاط 3x على جميع المشتريات', 'مكافأة عيد ميلاد + هدية فاخرة', 'شحن سريع مجاني', 'وصول VIP للعروض', 'متسوق شخصي', 'دعم ذو أولوية 24/7', 'صندوق مفاجأة شهري', 'نقاط مكافأة سنوية'],
    pointsMultiplier: 3,
  },
  {
    id: 'diamond', name: 'Diamond', nameAr: 'ألماسي',
    minPoints: 50000, maxPoints: Infinity,
    color: 'text-purple-600 dark:text-purple-400',
    gradient: 'from-purple-400 via-pink-400 to-indigo-400',
    icon: Sparkles,
    benefits: ['5x points on all purchases', 'Birthday luxury gift', 'Free same-day delivery', 'Private sale access', 'Personal concierge', '24/7 dedicated support', 'Monthly premium box', 'Annual double points week', 'Exclusive events access'],
    benefitsAr: ['نقاط 5x على جميع المشتريات', 'هدية فاخرة بمناسبة عيد الميلاد', 'توصيل مجاني في نفس اليوم', 'وصول لعروض خاصة', 'خدمة كونسيرج شخصية', 'دعم مخصص 24/7', 'صندوق فاخر شهري', 'أسبوع نقاط مضاعفة سنوي', 'وصول لفعاليات حصرية'],
    pointsMultiplier: 5,
  },
];



// --- Subscription Plans ---
const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'free', name: 'Free', nameAr: 'مجاني',
    price: 0, priceAr: 'مجاني', period: 'forever', periodAr: 'للأبد',
    icon: ShoppingBag,
    features: [
      'Browse all products', 'Standard shipping', 'Basic AI tools (5 credits/mo)',
      'Email support', 'Standard returns',
    ],
    featuresAr: [
      'تصفح جميع المنتجات', 'شحن عادي', 'أدوات ذكاء أساسية (5 أرصدة/شهر)',
      'دعم بالبريد الإلكتروني', 'إرجاع عادي',
    ],
  },
  {
    id: 'pro', name: 'Pro', nameAr: 'احترافي',
    price: 9.99, priceAr: '$9.99', period: '/month', periodAr: '/شهر',
    icon: Zap,
    isPopular: true,
    features: [
      'Everything in Free', 'Free express shipping', 'AI tools (50 credits/mo)',
      'Priority support', 'Extended returns (60 days)', '2x loyalty points', 'Early sale access',
    ],
    featuresAr: [
      'كل ما في المجاني', 'شحن سريع مجاني', 'أدوات ذكاء (50 رصيد/شهر)',
      'دعم ذو أولوية', 'إرجاع موسع (60 يوم)', 'نقاط ولاء مضاعفة', 'وصول مبكر للعروض',
    ],
  },
  {
    id: 'premium', name: 'Premium', nameAr: 'متميز',
    price: 24.99, priceAr: '$24.99', period: '/month', periodAr: '/شهر',
    icon: Crown,
    features: [
      'Everything in Pro', 'Free same-day delivery', 'Unlimited AI tools',
      '24/7 dedicated support', '90-day returns', '5x loyalty points', 'VIP sale access',
      'Personal shopper', 'Monthly surprise box', 'Exclusive events',
    ],
    featuresAr: [
      'كل ما في الاحترافي', 'توصيل مجاني في نفس اليوم', 'أدوات ذكاء غير محدودة',
      'دعم مخصص 24/7', 'إرجاع 90 يوم', 'نقاط ولاء 5x', 'وصول VIP للعروض',
      'متسوق شخصي', 'صندوق مفاجأة شهري', 'فعاليات حصرية',
    ],
  },
];



// --- Main Component ---
export function SubscriptionsLoyaltyPage() {
  const { t, locale } = useI18n();
  const { user } = useUserStore();
  const isRTL = locale === 'ar';

  // Default user points if not logged in
  const currentPoints = user?.loyaltyPoints ?? 2350;
  const currentTierId = user?.loyaltyTier ?? 'silver';

  const [activeSection, setActiveSection] = useState('loyalty');
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [pointsHistory, setPointsHistory] = useState<PointsEntry[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [pointsLoading, setPointsLoading] = useState(true);

  // Fetch rewards and points history from API
  useEffect(() => {
    fetch('/api/loyalty')
      .then((r) => r.json())
      .then((result) => {
        setRewards(result.rewards || result.items || []);
        setPointsHistory(result.pointsHistory || result.history || []);
        setRewardsLoading(false);
        setPointsLoading(false);
      })
      .catch(() => {
        setRewards([]);
        setPointsHistory([]);
        setRewardsLoading(false);
        setPointsLoading(false);
      });
  }, []);

  const currentTier = loyaltyTiers.find((t) => t.id === currentTierId) || loyaltyTiers[1];
  const nextTier = loyaltyTiers.find((t) => t.minPoints > currentPoints && t.id !== currentTierId);
  const progressToNext = nextTier
    ? ((currentPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  const handleRedeem = (rewardId: string) => {
    setRedeemingId(rewardId);
    setTimeout(() => setRedeemingId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">

        {/* Section Tabs */}
        <Tabs value={activeSection} onValueChange={setActiveSection}>
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="loyalty" className="gap-1.5">
              <Star className="size-3.5" />
              {isRTL ? 'برنامج الولاء' : 'Loyalty Program'}
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1.5">
              <Crown className="size-3.5" />
              {isRTL ? 'الاشتراكات' : 'Subscriptions'}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* ========= LOYALTY SECTION ========= */}
        {activeSection === 'loyalty' && (
          <div className="space-y-6">
            {/* Current Tier Hero */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className={`relative bg-gradient-to-r ${currentTier.gradient} text-white`}>
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative p-6 md:p-8 text-center space-y-4">
                  <div className="inline-flex items-center justify-center size-20 rounded-full bg-white/20 backdrop-blur-sm">
                    {React.createElement(currentTier.icon, { className: 'size-10' })}
                  </div>
                  <div>
                    <p className="text-sm text-white/80">{isRTL ? 'مستواك الحالي' : 'Your Current Tier'}</p>
                    <h2 className="text-3xl font-bold">{isRTL ? currentTier.nameAr : currentTier.name}</h2>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 inline-block">
                    <p className="text-sm text-white/80">{isRTL ? 'رصيد النقاط' : 'Points Balance'}</p>
                    <p className="text-4xl font-bold">{currentPoints.toLocaleString()}</p>
                  </div>

                  {/* Progress to Next Tier */}
                  {nextTier && (
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="flex justify-between text-sm text-white/80">
                        <span>{isRTL ? currentTier.nameAr : currentTier.name}</span>
                        <span>{isRTL ? nextTier.nameAr : nextTier.name}</span>
                      </div>
                      <Progress value={progressToNext} className="h-3 bg-white/20" />
                      <p className="text-xs text-white/70">
                        {isRTL
                          ? `${(nextTier.minPoints - currentPoints).toLocaleString()} نقطة للوصول للمستوى التالي`
                          : `${(nextTier.minPoints - currentPoints).toLocaleString()} points to next tier`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* All Tiers */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Target className="size-5 text-emerald-600" />
                {isRTL ? 'مستويات الولاء' : 'Loyalty Tiers'}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {loyaltyTiers.map((tier) => {
                  const isActive = tier.id === currentTierId;
                  const isLocked = currentPoints < tier.minPoints;
                  const Icon = tier.icon;

                  return (
                    <Card
                      key={tier.id}
                      className={`border-0 shadow-sm transition-all duration-300 cursor-pointer ${
                        isActive
                          ? 'ring-2 ring-emerald-500 shadow-lg -translate-y-1'
                          : 'hover:shadow-md hover:-translate-y-0.5'
                      } ${isLocked && !isActive ? 'opacity-60' : ''}`}
                    >
                      <CardContent className="p-4 text-center space-y-2">
                        <div className={`inline-flex items-center justify-center size-12 rounded-full bg-gradient-to-br ${tier.gradient} text-white`}>
                          <Icon className="size-6" />
                        </div>
                        <h4 className={`font-bold text-sm ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                          {isRTL ? tier.nameAr : tier.name}
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                          {tier.maxPoints === Infinity
                            ? (isRTL ? `${tier.minPoints.toLocaleString()}+ نقطة` : `${tier.minPoints.toLocaleString()}+ pts`)
                            : (isRTL ? `${tier.minPoints.toLocaleString()}-${tier.maxPoints.toLocaleString()} نقطة` : `${tier.minPoints.toLocaleString()}-${tier.maxPoints.toLocaleString()} pts`)}
                        </p>
                        <Badge variant="secondary" className="text-[10px]">
                          {tier.pointsMultiplier}x {isRTL ? 'نقاط' : 'points'}
                        </Badge>
                        {isActive && (
                          <Badge className="bg-emerald-600 text-white text-[10px]">{isRTL ? 'مستواك' : 'Current'}</Badge>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Available Rewards */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Gift className="size-5 text-emerald-600" />
                {isRTL ? 'المكافآت المتاحة' : 'Available Rewards'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rewards.length === 0 && !rewardsLoading && (
                  <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Gift className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">{t('noResults')}</p>
                    <p className="text-sm">{isRTL ? 'لا توجد مكافآت متاحة' : 'No rewards available'}</p>
                  </div>
                )}
                {rewards.map((reward) => {
                  const canRedeem = currentPoints >= reward.pointsCost;
                  const isRedeeming = redeemingId === reward.id;

                  return (
                    <Card
                      key={reward.id}
                      className="border-0 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 flex items-center justify-center">
                            <Gift className="size-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          {reward.isPopular && (
                            <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-0 text-[10px]">
                              <Star className="size-2.5 me-0.5 fill-amber-500" />
                              {isRTL ? 'شائع' : 'Popular'}
                            </Badge>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{isRTL ? reward.nameAr : reward.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{isRTL ? reward.descriptionAr : reward.description}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px]">
                            {reward.pointsCost} {isRTL ? 'نقطة' : 'pts'}
                          </Badge>
                          <Button
                            size="sm"
                            disabled={!canRedeem || isRedeeming}
                            className={`text-xs h-8 rounded-lg gap-1 ${canRedeem ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                            onClick={() => handleRedeem(reward.id)}
                          >
                            {isRedeeming ? (
                              <><Check className="size-3" /> {isRTL ? 'تم!' : 'Redeemed!'}</>
                            ) : canRedeem ? (
                              <>{isRTL ? 'استبدل' : 'Redeem'}</>
                            ) : (
                              <>{isRTL ? 'نقاط غير كافية' : 'Not enough pts'}</>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Points History */}
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock className="size-5 text-emerald-600" />
                {isRTL ? 'سجل النقاط' : 'Points History'}
              </h3>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-0">
                  <div className="divide-y">
                    {pointsHistory.length === 0 && !pointsLoading && (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Clock className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">{t('noResults')}</p>
                        <p className="text-sm">{isRTL ? 'لا يوجد سجل نقاط' : 'No points history'}</p>
                      </div>
                    )}
                    {pointsHistory.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`size-8 rounded-full flex items-center justify-center ${
                            entry.type === 'earned'
                              ? 'bg-emerald-100 dark:bg-emerald-900'
                              : 'bg-red-100 dark:bg-red-900'
                          }`}>
                            {entry.type === 'earned' ? (
                              <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Gift className="size-4 text-red-600 dark:text-red-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{isRTL ? entry.descriptionAr : entry.description}</p>
                            <p className="text-[10px] text-muted-foreground">{isRTL ? entry.dateAr : entry.date}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${entry.type === 'earned' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {entry.type === 'earned' ? '+' : ''}{entry.points} {isRTL ? 'نقطة' : 'pts'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Rewards Preview */}
            <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950">
              <CardContent className="p-6">
                <h3 className="font-bold flex items-center gap-2 mb-3">
                  <Sparkles className="size-5 text-emerald-600" />
                  {isRTL ? 'مكافآتك الشهرية' : 'Your Monthly Rewards'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { icon: Percent, label: isRTL ? 'خصم حصري' : 'Exclusive Discount', value: isRTL ? '15%' : '15%' },
                    { icon: Truck, label: isRTL ? 'شحن مجاني' : 'Free Shipping', value: isRTL ? '2x/شهر' : '2x/mo' },
                    { icon: Headphones, label: isRTL ? 'دعم ذو أولوية' : 'Priority Support', value: isRTL ? 'متاح' : 'Active' },
                    { icon: Gift, label: isRTL ? 'صندوق مفاجأة' : 'Surprise Box', value: isRTL ? 'شهرياً' : 'Monthly' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-background rounded-xl p-3 text-center space-y-1">
                      <item.icon className="size-5 mx-auto text-emerald-600" />
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========= SUBSCRIPTIONS SECTION ========= */}
        {activeSection === 'subscriptions' && (
          <div className="space-y-6">
            {/* Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {subscriptionPlans.map((plan) => {
                const Icon = plan.icon;
                const isCurrentPlan = user?.loyaltyTier === plan.id || (!user && plan.id === 'free');

                return (
                  <Card
                    key={plan.id}
                    className={`border-0 shadow-sm transition-all duration-300 overflow-hidden ${
                      plan.isPopular ? 'ring-2 ring-emerald-500 shadow-lg relative' : 'hover:shadow-md'
                    }`}
                  >
                    {plan.isPopular && (
                      <div className="bg-emerald-600 text-white text-center text-xs font-bold py-1.5">
                        {isRTL ? 'الأكثر شعبية' : 'Most Popular'}
                      </div>
                    )}
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl bg-gradient-to-br ${
                          plan.id === 'free' ? 'from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-700' :
                          plan.id === 'pro' ? 'from-emerald-400 to-teal-500' :
                          'from-amber-400 to-yellow-500'
                        } flex items-center justify-center text-white`}>
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <h3 className="font-bold">{isRTL ? plan.nameAr : plan.name}</h3>
                        </div>
                      </div>

                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">
                          {plan.price === 0 ? (isRTL ? plan.priceAr : 'Free') : formatPrice(plan.price)}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-sm text-muted-foreground">
                            {isRTL ? plan.periodAr : plan.period}
                          </span>
                        )}
                      </div>

                      <Separator />

                      <ul className="space-y-2.5">
                        {(isRTL ? plan.featuresAr : plan.features).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <Check className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        className={`w-full rounded-xl h-11 gap-2 ${
                          plan.isPopular
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : plan.id === 'free'
                            ? ''
                            : ''
                        }`}
                        variant={plan.id === 'free' ? 'outline' : 'default'}
                        disabled={isCurrentPlan}
                      >
                        {isCurrentPlan
                          ? (isRTL ? 'خطتك الحالية' : 'Current Plan')
                          : (isRTL ? 'اشترك الآن' : 'Subscribe Now')}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Benefits Comparison Table */}
            <Card className="border-0 shadow-sm overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ShieldCheck className="size-5 text-emerald-600" />
                  {isRTL ? 'مقارنة المزايا' : 'Benefits Comparison'}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-y bg-muted/30">
                      <th className="p-3 text-start font-medium text-muted-foreground">{isRTL ? 'الميزة' : 'Benefit'}</th>
                      <th className="p-3 text-center font-medium">{isRTL ? 'مجاني' : 'Free'}</th>
                      <th className="p-3 text-center font-medium text-emerald-600">{isRTL ? 'احترافي' : 'Pro'}</th>
                      <th className="p-3 text-center font-medium">{isRTL ? 'متميز' : 'Premium'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: isRTL ? 'تصفح المنتجات' : 'Browse Products', free: true, pro: true, premium: true },
                      { feature: isRTL ? 'الشحن العادي' : 'Standard Shipping', free: true, pro: true, premium: true },
                      { feature: isRTL ? 'الشحن السريع المجاني' : 'Free Express Shipping', free: false, pro: true, premium: true },
                      { feature: isRTL ? 'التوصيل في نفس اليوم' : 'Same-Day Delivery', free: false, pro: false, premium: true },
                      { feature: isRTL ? 'أدوات الذكاء (5 أرصدة/شهر)' : 'AI Tools (5 credits/mo)', free: true, pro: false, premium: false },
                      { feature: isRTL ? 'أدوات الذكاء (50 رصيد/شهر)' : 'AI Tools (50 credits/mo)', free: false, pro: true, premium: false },
                      { feature: isRTL ? 'أدوات الذكاء غير المحدودة' : 'Unlimited AI Tools', free: false, pro: false, premium: true },
                      { feature: isRTL ? 'نقاط ولاء مضاعفة' : 'Bonus Loyalty Points', free: false, pro: '2x', premium: '5x' },
                      { feature: isRTL ? 'وصول مبكر للعروض' : 'Early Sale Access', free: false, pro: true, premium: true },
                      { feature: isRTL ? 'وصول VIP للعروض' : 'VIP Sale Access', free: false, pro: false, premium: true },
                      { feature: isRTL ? 'متسوق شخصي' : 'Personal Shopper', free: false, pro: false, premium: true },
                      { feature: isRTL ? 'صندوق مفاجأة شهري' : 'Monthly Surprise Box', free: false, pro: false, premium: true },
                      { feature: isRTL ? 'دعم 24/7' : '24/7 Support', free: false, pro: false, premium: true },
                      { feature: isRTL ? 'إرجاع ممتد' : 'Extended Returns', free: '30d', pro: '60d', premium: '90d' },
                    ].map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium">{row.feature}</td>
                        <td className="p-3 text-center">
                          {typeof row.free === 'boolean' ? (
                            row.free ? <Check className="size-4 text-emerald-600 mx-auto" /> : <span className="text-muted-foreground">—</span>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">{row.free}</Badge>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {typeof row.pro === 'boolean' ? (
                            row.pro ? <Check className="size-4 text-emerald-600 mx-auto" /> : <span className="text-muted-foreground">—</span>
                          ) : (
                            <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-0 text-[10px]">{row.pro}</Badge>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {typeof row.premium === 'boolean' ? (
                            row.premium ? <Check className="size-4 text-emerald-600 mx-auto" /> : <span className="text-muted-foreground">—</span>
                          ) : (
                            <Badge className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-0 text-[10px]">{row.premium}</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
