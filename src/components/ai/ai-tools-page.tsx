'use client';

import React from 'react';
import { Camera, MessageSquare, Zap, Languages, Sparkles, CreditCard, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useI18n } from '@/lib/i18n';
import { AI_CREDIT_PACKAGES } from '@/lib/config';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useUserStore } from '@/stores/user-store';

const aiTools = [
  {
    id: 'visual-search',
    icon: Camera,
    titleKey: 'visualSearch',
    descKey: 'aiVisualSearchDesc',
    credits: 1,
    gradient: 'from-violet-500 to-purple-600',
    bgGradient: 'from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
    iconBg: 'bg-violet-100 dark:bg-violet-900/60',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    id: 'rfq-agent',
    icon: MessageSquare,
    titleKey: 'rfqAgent',
    descKey: 'aiRfqDesc',
    credits: 3,
    gradient: 'from-emerald-500 to-teal-600',
    bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'smart-pricing',
    icon: Zap,
    titleKey: 'smartPricing',
    descKey: 'aiSmartPricingDesc',
    credits: 2,
    gradient: 'from-amber-500 to-orange-600',
    bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40',
    iconBg: 'bg-amber-100 dark:bg-amber-900/60',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    id: 'ai-translate',
    icon: Languages,
    titleKey: 'aiTranslate',
    descKey: 'aiTranslateDesc',
    credits: 1,
    gradient: 'from-sky-500 to-cyan-600',
    bgGradient: 'from-sky-50 to-cyan-50 dark:from-sky-950/40 dark:to-cyan-950/40',
    iconBg: 'bg-sky-100 dark:bg-sky-900/60',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
] as const;

const creditPackages = AI_CREDIT_PACKAGES;

const recentSearches: { type: string; query: string; time: string; credits: number }[] = [];

export function AIToolsPage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const user = useUserStore((s) => s.user);
  const isRTL = locale === 'ar';

  const credits = user?.aiCredits ?? 25;
  const maxCredits = 100;

  const handleTryNow = (toolId: string) => {
    if (toolId === 'visual-search') nav.setView('visual-search');
    else if (toolId === 'rfq-agent') nav.setView('rfq-agent');
    else nav.setView('ai-tools');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-8 md:p-12 text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="size-6 animate-pulse" />
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  {t('aiPoweredShopping')}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                {t('aiPoweredShopping')}
              </h1>
              <p className="text-emerald-100 max-w-lg text-base">
                {isRTL
                  ? 'استخدم أدوات الذكاء الاصطناعي للعثور على المنتجات والتفاوض على الأسعار والترجمة التلقائية'
                  : 'Use AI-powered tools to find products, negotiate prices, and translate automatically'}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 min-w-[200px]">
              <div className="text-sm text-emerald-100 mb-1">{t('creditsRemaining')}</div>
              <div className="text-4xl font-bold mb-2">{credits}</div>
              <Progress value={(credits / maxCredits) * 100} className="h-2 bg-white/20" />
              <div className="text-xs text-emerald-200 mt-1">{credits}/{maxCredits} credits</div>
            </div>
          </div>
        </div>

        {/* AI Tool Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card
                key={tool.id}
                className={`group overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br ${tool.bgGradient}`}
              >
                <CardContent className="p-5 space-y-4">
                  <div className={`inline-flex p-3 rounded-xl ${tool.iconBg}`}>
                    <Icon className={`size-6 ${tool.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base mb-1">{t(tool.titleKey)}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isRTL
                        ? tool.id === 'visual-search'
                          ? 'ابحث عن المنتجات بالصور'
                          : tool.id === 'rfq-agent'
                          ? 'احصل على عروض أسعار من موردين متعددين'
                          : tool.id === 'smart-pricing'
                          ? 'اقتراحات تسعير مدعومة بالذكاء'
                          : 'ترجمة تلقائية للرسائل'
                        : tool.id === 'visual-search'
                        ? 'Search by image'
                        : tool.id === 'rfq-agent'
                        ? 'Source products with AI'
                        : tool.id === 'smart-pricing'
                        ? 'AI-powered pricing suggestions'
                        : 'Auto-translate messages'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-[10px]">
                      {tool.credits} {t('credits')}
                    </Badge>
                    <Button
                      size="sm"
                      className={`bg-gradient-to-r ${tool.gradient} text-white text-xs h-8 rounded-lg hover:opacity-90`}
                      onClick={() => handleTryNow(tool.id)}
                    >
                      {t('tryNow')}
                      <ArrowRight className={`size-3 ${isRTL ? 'rotate-180' : ''} ms-1`} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Credits Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Buy Credits */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <CreditCard className="size-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">{t('buyCredits')}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {creditPackages.map((pkg) => (
                  <div
                    key={pkg.credits}
                    className={`relative rounded-xl border-2 p-4 text-center cursor-pointer transition-all hover:shadow-md hover:border-emerald-400 ${
                      pkg.popular
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                        : 'border-border bg-card'
                    }`}
                  >
                    {pkg.popular && (
                      <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px]">
                        Popular
                      </Badge>
                    )}
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {pkg.unlimited ? '∞' : pkg.credits}
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {pkg.unlimited ? t('adminUnlimitedMonthly') : t('credits')}
                    </div>
                    <div className="text-lg font-semibold">${pkg.price}</div>
                    {!pkg.unlimited && (
                      <div className="text-[10px] text-muted-foreground">
                        ${pkg.perCredit.toFixed(2)}/credit
                      </div>
                    )}
                    <Button size="sm" className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 rounded-lg">
                      {t('buyNow')}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent AI Searches */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="size-5 text-emerald-600" />
                <h2 className="text-lg font-semibold">
                  {isRTL ? 'عمليات البحث الأخيرة' : 'Recent AI Searches'}
                </h2>
              </div>
              {recentSearches.length === 0 ? (
                <div className="py-8 text-center">
                  <Clock className="size-10 mx-auto text-muted-foreground/20 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'لا توجد عمليات بحث أخيرة' : 'No recent searches'}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {isRTL ? 'استخدم أدوات الذكاء الاصطناعي لترى سجلك هنا' : 'Use AI tools to see your search history here'}
                  </p>
                </div>
              ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {recentSearches.map((search, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`size-8 rounded-lg flex items-center justify-center ${
                        search.type === 'visual'
                          ? 'bg-violet-100 dark:bg-violet-900/40'
                          : search.type === 'rfq'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40'
                          : search.type === 'pricing'
                          ? 'bg-amber-100 dark:bg-amber-900/40'
                          : 'bg-sky-100 dark:bg-sky-900/40'
                      }`}>
                        {search.type === 'visual' ? (
                          <Camera className="size-4 text-violet-600 dark:text-violet-400" />
                        ) : search.type === 'rfq' ? (
                          <MessageSquare className="size-4 text-emerald-600 dark:text-emerald-400" />
                        ) : search.type === 'pricing' ? (
                          <Zap className="size-4 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <Languages className="size-4 text-sky-600 dark:text-sky-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{search.query}</div>
                        <div className="text-[10px] text-muted-foreground">{search.time}</div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      -{search.credits}
                    </Badge>
                  </div>
                ))}
              </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
