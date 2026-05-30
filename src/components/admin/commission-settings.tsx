'use client';

import React, { useState } from 'react';
import { Percent, Save, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { COMMISSION_CONFIG, AI_CREDIT_PACKAGES } from '@/lib/config';
import { adminFetch } from '@/lib/admin-api';

interface CommissionConfig {
  commissionRate: number;
  proSubscriptionPrice: number;
  aiTokenPrices: { credits: number; price: number }[];
  unlimitedMonthlyPrice: number;
  paymentGatewayFee: number;
  minPayoutThreshold: number;
}

const defaultConfig: CommissionConfig = {
  commissionRate: COMMISSION_CONFIG.defaultRate,
  proSubscriptionPrice: COMMISSION_CONFIG.proSubscriptionPrice,
  aiTokenPrices: AI_CREDIT_PACKAGES.filter((p) => !p.unlimited).map((p) => ({
    credits: p.credits,
    price: p.price,
  })),
  unlimitedMonthlyPrice: COMMISSION_CONFIG.unlimitedMonthlyPrice,
  paymentGatewayFee: COMMISSION_CONFIG.paymentGatewayFee,
  minPayoutThreshold: COMMISSION_CONFIG.minPayoutThreshold,
};

export function CommissionSettings() {
  const { t } = useI18n();
  const [config, setConfig] = useState<CommissionConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const updateConfig = (updates: Partial<CommissionConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const updateTokenPrice = (index: number, price: number) => {
    const newPrices = [...config.aiTokenPrices];
    newPrices[index] = { ...newPrices[index], price };
    setConfig(prev => ({ ...prev, aiTokenPrices: newPrices }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'commission', data: config }),
      });
      if (res.ok) {
        setHasChanges(false);
      }
    } catch {
      // handle error
    }
    setSaving(false);
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    setHasChanges(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Percent className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-semibold">{t('adminCommissionRate')}</h2>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0 text-[11px]">
              {t('adminUnsavedChanges')}
            </Badge>
          </div>
        )}
      </div>

      {/* Commission Rate */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('adminCommissionRate')}</CardTitle>
          <CardDescription className="text-xs">{t('csPctFromTransaction')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{t('csCommissionRateLabel')}</Label>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{config.commissionRate}%</span>
            </div>
            <Slider
              value={[config.commissionRate]}
              onValueChange={(v) => updateConfig({ commissionRate: v[0] })}
              min={0}
              max={30}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>0%</span>
              <span>15%</span>
              <span>30%</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">
              {t('csCommissionExample', { orderAmount: formatPrice(100), platformEarnings: formatPrice(100 * config.commissionRate / 100), sellerEarnings: formatPrice(100 * (100 - config.commissionRate) / 100) })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pro Subscription */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('adminProSubscription')}</CardTitle>
          <CardDescription className="text-xs">{t('csProSubscriptionDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Label className="text-xs whitespace-nowrap">{t('csPricePerMonth')}</Label>
            <div className="relative flex-1 max-w-[200px]">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                value={config.proSubscriptionPrice}
                onChange={(e) => updateConfig({ proSubscriptionPrice: parseFloat(e.target.value) || 0 })}
                className="ps-7 h-9"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Token Prices */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">{t('adminAITokenPrices')}</CardTitle>
          <CardDescription className="text-xs">{t('csAiCreditPricing')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {config.aiTokenPrices.map((pkg, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 flex items-center justify-center">
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{pkg.credits}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium">{pkg.credits} {t('adminCredits')}</p>
              </div>
              <div className="relative w-[100px]">
                <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={pkg.price}
                  onChange={(e) => updateTokenPrice(i, parseFloat(e.target.value) || 0)}
                  className="ps-7 h-8 text-xs"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          ))}

          <Separator />

          {/* Unlimited Monthly */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-emerald-200 to-teal-200 dark:from-emerald-800 dark:to-teal-800 flex items-center justify-center">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-200">&#8734;</span>
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium">{t('adminUnlimitedMonthly')}</p>
              <p className="text-[11px] text-muted-foreground">{t('csUnlimitedCreditsDesc')}</p>
            </div>
            <div className="relative w-[100px]">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
              <Input
                type="number"
                value={config.unlimitedMonthlyPrice}
                onChange={(e) => updateConfig({ unlimitedMonthlyPrice: parseFloat(e.target.value) || 0 })}
                className="ps-7 h-8 text-xs"
                step="0.01"
                min="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Gateway & Payout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('adminPaymentGatewayFees')}</CardTitle>
            <CardDescription className="text-xs">{t('csGatewayFeeDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Input
                  type="number"
                  value={config.paymentGatewayFee}
                  onChange={(e) => updateConfig({ paymentGatewayFee: parseFloat(e.target.value) || 0 })}
                  className="h-9"
                  step="0.1"
                  min="0"
                />
                <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{t('adminMinPayoutThreshold')}</CardTitle>
            <CardDescription className="text-xs">{t('csMinPayoutDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                type="number"
                value={config.minPayoutThreshold}
                onChange={(e) => updateConfig({ minPayoutThreshold: parseFloat(e.target.value) || 0 })}
                className="ps-7 h-9"
                step="1"
                min="0"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save/Reset Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button variant="outline" onClick={handleReset} className="text-xs h-9">
          <RotateCcw className="h-3.5 w-3.5 me-1.5" />
          {t('adminReset')}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Save className="h-3.5 w-3.5 me-1.5" />
          {saving ? t('csSaving') : t('adminSaveChanges')}
        </Button>
      </div>
    </div>
  );
}
