'use client';

import React from 'react';
import { CreditCard, Sparkles, TrendingDown, Camera, MessageSquare, Zap, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { useUserStore } from '@/stores/user-store';
import { AI_CREDIT_PACKAGES } from '@/lib/config';

const creditPackages = AI_CREDIT_PACKAGES;

const usageHistory: { date: string; tool: string; toolType: string; credits: number }[] = [];

function getToolIcon(type: string) {
  switch (type) {
    case 'visual': return Camera;
    case 'rfq': return MessageSquare;
    case 'pricing': return Zap;
    case 'translate': return Languages;
    default: return Sparkles;
  }
}

export function CreditsPanel() {
  const { t, locale } = useI18n();
  const user = useUserStore((s) => s.user);
  const isRTL = locale === 'ar';

  const credits = user?.aiCredits ?? 25;

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Current Credits */}
      <Card className="border-0 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">{t('aiCreditsBalance')}</p>
              <p className="text-5xl font-bold mt-1">{credits}</p>
              <p className="text-emerald-200 text-sm mt-1">{t('creditsRemaining')}</p>
            </div>
            <div className="size-20 rounded-full bg-white/10 flex items-center justify-center">
              <CreditCard className="size-10 text-white" />
            </div>
          </div>
        </div>
      </Card>

      {/* Buy Credits */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="size-5 text-emerald-600" />
            {t('buyCredits')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {creditPackages.map((pkg) => (
              <div
                key={pkg.credits}
                className={`relative rounded-xl border-2 p-4 text-center transition-all hover:shadow-md hover:border-emerald-400 ${
                  pkg.popular
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-border bg-card'
                }`}
              >
                {pkg.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px]">
                    {isRTL ? 'الأكثر شعبية' : 'Best Value'}
                  </Badge>
                )}
                <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {pkg.unlimited ? '∞' : pkg.credits}
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  {pkg.unlimited ? t('adminUnlimitedMonthly') : t('credits')}
                </div>
                <div className="text-xl font-semibold">${pkg.price}</div>
                {!pkg.unlimited && (
                  <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
                    <TrendingDown className="size-3" />
                    ${pkg.perCredit.toFixed(2)}/credit
                  </div>
                )}
                {pkg.monthly && (
                  <div className="text-[10px] text-muted-foreground">
                    {isRTL ? 'شهرياً' : '/month'}
                  </div>
                )}
                <Button size="sm" className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-lg">
                  {t('buyNow')}
                </Button>
              </div>
            ))}
          </div>

          {/* Per-credit breakdown */}
          <Separator className="my-4" />
          <div className="space-y-1">
            <p className="text-sm font-medium">{isRTL ? 'التكلفة لكل رصيد' : 'Per-Credit Cost Breakdown'}</p>
            {creditPackages.filter((p) => !p.unlimited).map((pkg) => (
              <div key={pkg.credits} className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{pkg.credits} {t('credits')}</span>
                <span>${pkg.perCredit.toFixed(2)}/{isRTL ? 'رصيد' : 'credit'}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage History */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{isRTL ? 'سجل الاستخدام' : 'Usage History'}</CardTitle>
        </CardHeader>
        <CardContent>
          {usageHistory.length === 0 ? (
            <div className="py-8 text-center">
              <Sparkles className="size-10 mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">
                {isRTL ? 'لا يوجد سجل استخدام' : 'No usage history'}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {isRTL ? 'استخدم أدوات الذكاء الاصطناعي لترى سجلك هنا' : 'Use AI tools to see your history here'}
              </p>
            </div>
          ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {usageHistory.map((entry, i) => {
              const Icon = getToolIcon(entry.toolType);
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                      <Icon className="size-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{entry.tool}</p>
                      <p className="text-[10px] text-muted-foreground">{entry.date}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">-{entry.credits}</Badge>
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
