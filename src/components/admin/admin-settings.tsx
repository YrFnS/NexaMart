'use client';

import React, { useState, useCallback } from 'react';
import {
  Settings,
  Globe,
  Store,
  CreditCard,
  Truck,
  Receipt,
  Shield,
  Search,
  Mail,
  Scale,
  Code,
  Wrench,
  Save,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useI18n } from '@/lib/i18n';
import {
  APP_NAME,
  APP_TAGLINE,
  APP_DESCRIPTION,
  APP_SUPPORT_EMAIL,
  APP_SUPPORT_PHONE,
  APP_URL,
  APP_NOREPLY_EMAIL,
  SEO_DEFAULTS,
  SHIPPING_CONFIG,
  COMMISSION_CONFIG,
  STORE_LIMITS,
  TAX_CONFIG,
  SMTP_CONFIG,
  DEFAULT_TIMEZONE,
  LS_KEYS,
} from '@/lib/config';
import { adminFetch } from '@/lib/admin-api';

interface SettingsData {
  // General
  siteName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  favicon: string;
  supportEmail: string;
  supportPhone: string;
  defaultLanguage: string;
  defaultCurrency: string;
  timezone: string;
  dateFormat: string;
  // Store
  autoApproveStores: boolean;
  productApproval: boolean;
  reviewModeration: boolean;
  allowCustomStorefronts: boolean;
  maxProductsPerStore: number;
  maxImagesPerProduct: number;
  // Payment
  acceptedMethods: string[];
  minOrderAmount: number;
  maxOrderAmount: number;
  escrowPeriod: number;
  refundPolicy: string;
  currencyConversionFee: number;
  // Shipping
  freeShippingThreshold: number;
  defaultShippingRate: number;
  estimatedDeliveryDays: number;
  expressShipping: boolean;
  internationalShipping: boolean;
  // Tax
  taxEnabled: boolean;
  taxRate: number;
  inclusivePricing: boolean;
  taxLabel: string;
  vatEnabled: boolean;
  exemptCategories: string;
  // Security
  twoFARequired: boolean;
  bruteForceProtection: boolean;
  csrfProtection: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  rateLimit: number;
  // SEO
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  canonicalUrl: string;
  analyticsId: string;
  sitemapEnabled: boolean;
  // Email
  smtpHost: string;
  smtpPort: number;
  smtpEncryption: string;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  // Legal
  termsUrl: string;
  privacyUrl: string;
  cookieUrl: string;
  gdprEnabled: boolean;
  dataRetention: number;
  ageVerification: boolean;
  // API
  apiEnabled: boolean;
  restEnabled: boolean;
  graphqlEnabled: boolean;
  publicDocs: boolean;
  corsOrigins: string;
  apiRateLimit: number;
  webhooksEnabled: boolean;
  // Maintenance
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowedIPs: string;
  scheduledMaintenance: boolean;
}

const defaultSettings: SettingsData = {
  // General — from centralized config
  siteName: APP_NAME,
  tagline: APP_TAGLINE,
  description: APP_DESCRIPTION,
  logoUrl: '/logo.svg',
  favicon: '/favicon.ico',
  supportEmail: APP_SUPPORT_EMAIL,
  supportPhone: APP_SUPPORT_PHONE,
  defaultLanguage: 'en',
  defaultCurrency: 'USD',
  timezone: DEFAULT_TIMEZONE,
  dateFormat: 'YYYY-MM-DD',
  // Store — from centralized config
  autoApproveStores: false,
  productApproval: true,
  reviewModeration: true,
  allowCustomStorefronts: true,
  maxProductsPerStore: STORE_LIMITS.maxProductsPerStore,
  maxImagesPerProduct: STORE_LIMITS.maxImagesPerProduct,
  // Payment — from centralized config
  acceptedMethods: ['credit_card', 'paypal', 'apple_pay'],
  minOrderAmount: STORE_LIMITS.minOrderAmount,
  maxOrderAmount: STORE_LIMITS.maxOrderAmount,
  escrowPeriod: STORE_LIMITS.escrowPeriodDays,
  refundPolicy: 'Full refund within 14 days of delivery',
  currencyConversionFee: COMMISSION_CONFIG.currencyConversionFee,
  // Shipping — from centralized config
  freeShippingThreshold: SHIPPING_CONFIG.freeShippingThreshold,
  defaultShippingRate: SHIPPING_CONFIG.defaultShippingRate,
  estimatedDeliveryDays: SHIPPING_CONFIG.estimatedDeliveryDays,
  expressShipping: true,
  internationalShipping: true,
  // Tax — from centralized config
  taxEnabled: true,
  taxRate: TAX_CONFIG.defaultRate,
  inclusivePricing: TAX_CONFIG.inclusivePricing,
  taxLabel: TAX_CONFIG.defaultLabel,
  vatEnabled: true,
  exemptCategories: TAX_CONFIG.exemptCategories,
  // Security — from centralized config
  twoFARequired: false,
  bruteForceProtection: true,
  csrfProtection: true,
  sessionTimeout: STORE_LIMITS.sessionTimeoutMinutes,
  maxLoginAttempts: STORE_LIMITS.maxLoginAttempts,
  rateLimit: STORE_LIMITS.rateLimitPerMinute,
  // SEO — from centralized config
  metaTitle: SEO_DEFAULTS.title,
  metaDescription: SEO_DEFAULTS.metaDescription,
  ogImage: SEO_DEFAULTS.ogImage,
  canonicalUrl: APP_URL,
  analyticsId: SEO_DEFAULTS.analyticsId,
  sitemapEnabled: true,
  // Email — from centralized config
  smtpHost: SMTP_CONFIG.host,
  smtpPort: SMTP_CONFIG.port,
  smtpEncryption: SMTP_CONFIG.encryption,
  smtpUsername: SMTP_CONFIG.username,
  smtpPassword: '',
  fromEmail: APP_NOREPLY_EMAIL,
  fromName: APP_NAME,
  // Legal
  termsUrl: '/terms',
  privacyUrl: '/privacy',
  cookieUrl: '/cookies',
  gdprEnabled: true,
  dataRetention: STORE_LIMITS.dataRetentionDays,
  ageVerification: false,
  // API — from centralized config
  apiEnabled: true,
  restEnabled: true,
  graphqlEnabled: false,
  publicDocs: true,
  corsOrigins: '*',
  apiRateLimit: STORE_LIMITS.apiRateLimitPerMinute,
  webhooksEnabled: true,
  // Maintenance
  maintenanceMode: false,
  maintenanceMessage: 'We are performing scheduled maintenance. We will be back shortly.',
  allowedIPs: '',
  scheduledMaintenance: false,
};

type SettingsTab = 'general' | 'store' | 'payment' | 'shipping' | 'tax' | 'security' | 'seo' | 'email' | 'legal' | 'api' | 'maintenance';

const tabList: { id: SettingsTab; labelKey: string; icon: React.ElementType }[] = [
  { id: 'general', labelKey: 'adminSettingsGeneral', icon: Globe },
  { id: 'store', labelKey: 'adminSettingsStore', icon: Store },
  { id: 'payment', labelKey: 'adminSettingsPayment', icon: CreditCard },
  { id: 'shipping', labelKey: 'adminSettingsShipping', icon: Truck },
  { id: 'tax', labelKey: 'adminSettingsTax', icon: Receipt },
  { id: 'security', labelKey: 'adminSettingsSecurity', icon: Shield },
  { id: 'seo', labelKey: 'adminSettingsSEO', icon: Search },
  { id: 'email', labelKey: 'adminSettingsEmail', icon: Mail },
  { id: 'legal', labelKey: 'adminSettingsLegal', icon: Scale },
  { id: 'api', labelKey: 'adminSettingsAPI', icon: Code },
  { id: 'maintenance', labelKey: 'adminSettingsMaintenance', icon: Wrench },
];

function SettingField({ label, children, description }: { label: string; children: React.ReactNode; description?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
    </div>
  );
}

function SettingSwitch({ label, checked, onChange, description }: { label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="space-y-0.5">
        <Label className="text-xs font-medium">{label}</Label>
        {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function AdminSettings() {
  const { t } = useI18n();

  // Load persisted settings from localStorage via lazy initializer (no effect needed)
  const [settings, setSettings] = useState<SettingsData>(() => {
    if (typeof window === 'undefined') return defaultSettings;
    try {
      const stored = localStorage.getItem(LS_KEYS.adminSettings);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<SettingsData>;
        // Merge with defaults so new config keys are picked up
        return { ...defaultSettings, ...parsed };
      }
    } catch {
      // If localStorage is unavailable or data is corrupt, use defaults
    }
    return defaultSettings;
  });

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const update = useCallback(<K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: activeTab, data: settings }),
      });
      // Persist to localStorage
      try {
        localStorage.setItem(LS_KEYS.adminSettings, JSON.stringify(settings));
      } catch {
        // localStorage unavailable — silently ignore
      }
      setHasChanges(false);
    } catch {
      // handle error
    }
    setSaving(false);
  };

  const handleReset = () => {
    setSettings(defaultSettings);
    // Also clear localStorage on reset
    try {
      localStorage.removeItem(LS_KEYS.adminSettings);
    } catch {
      // localStorage unavailable
    }
    setHasChanges(true);
  };

  const renderGeneral = () => (
    <div className="space-y-4">
      <SettingField label={t('asSiteName')}>
        <Input value={settings.siteName} onChange={(e) => update('siteName', e.target.value)} className="h-9 text-sm" />
      </SettingField>
      <SettingField label={t('asTagline')}>
        <Input value={settings.tagline} onChange={(e) => update('tagline', e.target.value)} className="h-9 text-sm" />
      </SettingField>
      <SettingField label={t('description')}>
        <Textarea value={settings.description} onChange={(e) => update('description', e.target.value)} className="min-h-[60px] text-sm" />
      </SettingField>
      <div className="grid grid-cols-2 gap-3">
        <SettingField label={t('asLogoUrl')}>
          <Input value={settings.logoUrl} onChange={(e) => update('logoUrl', e.target.value)} className="h-9 text-sm" />
        </SettingField>
        <SettingField label={t('asFavicon')}>
          <Input value={settings.favicon} onChange={(e) => update('favicon', e.target.value)} className="h-9 text-sm" />
        </SettingField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SettingField label={t('asSupportEmail')}>
          <Input value={settings.supportEmail} onChange={(e) => update('supportEmail', e.target.value)} className="h-9 text-sm" type="email" />
        </SettingField>
        <SettingField label={t('asSupportPhone')}>
          <Input value={settings.supportPhone} onChange={(e) => update('supportPhone', e.target.value)} className="h-9 text-sm" />
        </SettingField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SettingField label={t('asDefaultLanguage')}>
          <Select value={settings.defaultLanguage} onValueChange={(v) => update('defaultLanguage', v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="en">English</SelectItem><SelectItem value="ar">Arabic</SelectItem></SelectContent>
          </Select>
        </SettingField>
        <SettingField label={t('asDefaultCurrency')}>
          <Select value={settings.defaultCurrency} onValueChange={(v) => update('defaultCurrency', v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="USD">USD</SelectItem><SelectItem value="SAR">SAR</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent>
          </Select>
        </SettingField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SettingField label={t('asTimezone')}>
          <Select value={settings.timezone} onValueChange={(v) => update('timezone', v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="Asia/Riyadh">Asia/Riyadh</SelectItem><SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem><SelectItem value="UTC">UTC</SelectItem></SelectContent>
          </Select>
        </SettingField>
        <SettingField label={t('asDateFormat')}>
          <Select value={settings.dateFormat} onValueChange={(v) => update('dateFormat', v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem><SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem><SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem></SelectContent>
          </Select>
        </SettingField>
      </div>
    </div>
  );

  const renderStore = () => (
    <div className="space-y-4">
      <SettingSwitch label={t('asAutoApproveStores')} checked={settings.autoApproveStores} onChange={(v) => update('autoApproveStores', v)} description={t('asAutoApproveDesc')} />
      <SettingSwitch label={t('asProductApproval')} checked={settings.productApproval} onChange={(v) => update('productApproval', v)} description={t('asProductApprovalDesc')} />
      <SettingSwitch label={t('asReviewModeration')} checked={settings.reviewModeration} onChange={(v) => update('reviewModeration', v)} description={t('asReviewModerationDesc')} />
      <SettingSwitch label={t('asAllowCustomStorefronts')} checked={settings.allowCustomStorefronts} onChange={(v) => update('allowCustomStorefronts', v)} description={t('asAllowCustomDesc')} />
      <Separator />
      <div className="grid grid-cols-2 gap-3">
        <SettingField label={t('asMaxProductsPerStore')}>
          <Input type="number" value={settings.maxProductsPerStore} onChange={(e) => update('maxProductsPerStore', parseInt(e.target.value) || 0)} className="h-9 text-sm" />
        </SettingField>
        <SettingField label={t('asMaxImagesPerProduct')}>
          <Input type="number" value={settings.maxImagesPerProduct} onChange={(e) => update('maxImagesPerProduct', parseInt(e.target.value) || 0)} className="h-9 text-sm" />
        </SettingField>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="space-y-4">
      <SettingField label={t('asAcceptedPaymentMethods')}>
        <div className="flex flex-wrap gap-2">
          {['Credit/Debit Card', 'PayPal', 'Apple Pay', 'Google Pay', 'Zain Cash', 'STC Pay'].map(m => (
            <Badge key={m} variant="outline" className="text-[11px] cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950">{m}</Badge>
          ))}
        </div>
      </SettingField>
      <div className="grid grid-cols-2 gap-3">
        <SettingField label={t('asMinOrderAmount')}>
          <Input type="number" value={settings.minOrderAmount} onChange={(e) => update('minOrderAmount', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
        </SettingField>
        <SettingField label={t('asMaxOrderAmount')}>
          <Input type="number" value={settings.maxOrderAmount} onChange={(e) => update('maxOrderAmount', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
        </SettingField>
      </div>
      <SettingField label={t('asEscrowPeriod')}>
        <Input type="number" value={settings.escrowPeriod} onChange={(e) => update('escrowPeriod', parseInt(e.target.value) || 0)} className="h-9 text-sm" />
      </SettingField>
      <SettingField label={t('asRefundPolicy')}>
        <Textarea value={settings.refundPolicy} onChange={(e) => update('refundPolicy', e.target.value)} className="min-h-[60px] text-sm" />
      </SettingField>
      <SettingField label={t('asCurrencyConversionFee')}>
        <Input type="number" value={settings.currencyConversionFee} onChange={(e) => update('currencyConversionFee', parseFloat(e.target.value) || 0)} className="h-9 text-sm" step="0.1" />
      </SettingField>
    </div>
  );

  const renderShipping = () => (
    <div className="space-y-4">
      <SettingField label={t('asFreeShippingThreshold')}>
        <Input type="number" value={settings.freeShippingThreshold} onChange={(e) => update('freeShippingThreshold', parseFloat(e.target.value) || 0)} className="h-9 text-sm" />
      </SettingField>
      <SettingField label={t('asDefaultShippingRate')}>
        <Input type="number" value={settings.defaultShippingRate} onChange={(e) => update('defaultShippingRate', parseFloat(e.target.value) || 0)} className="h-9 text-sm" step="0.01" />
      </SettingField>
      <SettingField label={t('asEstimatedDelivery')}>
        <Input type="number" value={settings.estimatedDeliveryDays} onChange={(e) => update('estimatedDeliveryDays', parseInt(e.target.value) || 0)} className="h-9 text-sm" />
      </SettingField>
      <SettingSwitch label={t('asExpressShipping')} checked={settings.expressShipping} onChange={(v) => update('expressShipping', v)} description={t('asExpressShippingDesc')} />
      <SettingSwitch label={t('asInternationalShipping')} checked={settings.internationalShipping} onChange={(v) => update('internationalShipping', v)} description={t('asInternationalShippingDesc')} />
    </div>
  );

  const renderTax = () => (
    <div className="space-y-4">
      <SettingSwitch label={t('asTaxEnabled')} checked={settings.taxEnabled} onChange={(v) => update('taxEnabled', v)} />
      <SettingField label={t('asTaxRate')}>
        <Input type="number" value={settings.taxRate} onChange={(e) => update('taxRate', parseFloat(e.target.value) || 0)} className="h-9 text-sm" step="0.5" />
      </SettingField>
      <SettingSwitch label={t('asInclusivePricing')} checked={settings.inclusivePricing} onChange={(v) => update('inclusivePricing', v)} description={t('asInclusivePricingDesc')} />
      <SettingField label={t('asTaxLabel')}>
        <Input value={settings.taxLabel} onChange={(e) => update('taxLabel', e.target.value)} className="h-9 text-sm" />
      </SettingField>
      <SettingSwitch label={t('asVatEnabled')} checked={settings.vatEnabled} onChange={(v) => update('vatEnabled', v)} />
      <SettingField label={t('asExemptCategories')}>
        <Input value={settings.exemptCategories} onChange={(e) => update('exemptCategories', e.target.value)} className="h-9 text-sm" placeholder={t('asExemptPlaceholder')} />
      </SettingField>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-4">
      <SettingSwitch label={t('as2FARequired')} checked={settings.twoFARequired} onChange={(v) => update('twoFARequired', v)} description={t('as2FADesc')} />
      <SettingSwitch label={t('asBruteForce')} checked={settings.bruteForceProtection} onChange={(v) => update('bruteForceProtection', v)} description={t('asBruteForceDesc')} />
      <SettingSwitch label={t('asCsrfProtection')} checked={settings.csrfProtection} onChange={(v) => update('csrfProtection', v)} />
      <SettingField label={t('asSessionTimeout')}>
        <Input type="number" value={settings.sessionTimeout} onChange={(e) => update('sessionTimeout', parseInt(e.target.value) || 0)} className="h-9 text-sm" />
      </SettingField>
      <SettingField label={t('asMaxLoginAttempts')}>
        <Input type="number" value={settings.maxLoginAttempts} onChange={(e) => update('maxLoginAttempts', parseInt(e.target.value) || 0)} className="h-9 text-sm" />
      </SettingField>
      <SettingField label={t('asRateLimit')}>
        <Input type="number" value={settings.rateLimit} onChange={(e) => update('rateLimit', parseInt(e.target.value) || 0)} className="h-9 text-sm" />
      </SettingField>
    </div>
  );

  const renderSEO = () => (
    <div className="space-y-4">
      <SettingField label={t('asMetaTitle')}>
        <Input value={settings.metaTitle} onChange={(e) => update('metaTitle', e.target.value)} className="h-9 text-sm" />
      </SettingField>
      <SettingField label={t('asMetaDescription')}>
        <Textarea value={settings.metaDescription} onChange={(e) => update('metaDescription', e.target.value)} className="min-h-[60px] text-sm" />
      </SettingField>
      <SettingField label={t('asOgImageUrl')}>
        <Input value={settings.ogImage} onChange={(e) => update('ogImage', e.target.value)} className="h-9 text-sm" />
      </SettingField>
      <SettingField label={t('asCanonicalUrl')}>
        <Input value={settings.canonicalUrl} onChange={(e) => update('canonicalUrl', e.target.value)} className="h-9 text-sm" />
      </SettingField>
      <SettingField label={t('asAnalyticsId')}>
        <Input value={settings.analyticsId} onChange={(e) => update('analyticsId', e.target.value)} className="h-9 text-sm" placeholder="G-XXXXXXXXXX" />
      </SettingField>
      <SettingSwitch label={t('asSitemapEnabled')} checked={settings.sitemapEnabled} onChange={(v) => update('sitemapEnabled', v)} />
    </div>
  );

  const renderEmail = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <SettingField label={t('asSmtpHost')}>
          <Input value={settings.smtpHost} onChange={(e) => update('smtpHost', e.target.value)} className="h-9 text-sm" />
        </SettingField>
        <SettingField label={t('asSmtpPort')}>
          <Input type="number" value={settings.smtpPort} onChange={(e) => update('smtpPort', parseInt(e.target.value) || 0)} className="h-9 text-sm" />
        </SettingField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SettingField label={t('asEncryption')}>
          <Select value={settings.smtpEncryption} onValueChange={(v) => update('smtpEncryption', v)}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="tls">TLS</SelectItem><SelectItem value="ssl">SSL</SelectItem><SelectItem value="none">None</SelectItem></SelectContent>
          </Select>
        </SettingField>
        <SettingField label={t('asUsername')}>
          <Input value={settings.smtpUsername} onChange={(e) => update('smtpUsername', e.target.value)} className="h-9 text-sm" />
        </SettingField>
      </div>
      <SettingField label={t('asPassword')}>
        <Input type="password" value={settings.smtpPassword} onChange={(e) => update('smtpPassword', e.target.value)} className="h-9 text-sm" />
      </SettingField>
      <div className="grid grid-cols-2 gap-3">
        <SettingField label={t('asFromEmail')}>
          <Input value={settings.fromEmail} onChange={(e) => update('fromEmail', e.target.value)} className="h-9 text-sm" type="email" />
        </SettingField>
        <SettingField label={t('asFromName')}>
          <Input value={settings.fromName} onChange={(e) => update('fromName', e.target.value)} className="h-9 text-sm" />
        </SettingField>
      </div>
      <Button variant="outline" size="sm" className="h-8 text-xs">
        <Mail className="h-3.5 w-3.5 me-1.5" />
        {t('asSendTestEmail')}
      </Button>
    </div>
  );

  const renderLegal = () => (
    <div className="space-y-4">
      <SettingField label={t('asTermsUrl')}>
        <Input value={settings.termsUrl} onChange={(e) => update('termsUrl', e.target.value)} className="h-9 text-sm" />
      </SettingField>
      <SettingField label={t('asPrivacyUrl')}>
        <Input value={settings.privacyUrl} onChange={(e) => update('privacyUrl', e.target.value)} className="h-9 text-sm" />
      </SettingField>
      <SettingField label={t('asCookieUrl')}>
        <Input value={settings.cookieUrl} onChange={(e) => update('cookieUrl', e.target.value)} className="h-9 text-sm" />
      </SettingField>
      <SettingSwitch label={t('asGdprCompliance')} checked={settings.gdprEnabled} onChange={(v) => update('gdprEnabled', v)} description={t('asGdprDesc')} />
      <SettingField label={t('asDataRetention')}>
        <Input type="number" value={settings.dataRetention} onChange={(e) => update('dataRetention', parseInt(e.target.value) || 0)} className="h-9 text-sm" />
      </SettingField>
      <SettingSwitch label={t('asAgeVerification')} checked={settings.ageVerification} onChange={(v) => update('ageVerification', v)} description={t('asAgeVerificationDesc')} />
    </div>
  );

  const renderAPI = () => (
    <div className="space-y-4">
      <SettingSwitch label={t('asApiEnabled')} checked={settings.apiEnabled} onChange={(v) => update('apiEnabled', v)} />
      <SettingSwitch label={t('asRestApi')} checked={settings.restEnabled} onChange={(v) => update('restEnabled', v)} description={t('asRestApiDesc')} />
      <SettingSwitch label={t('asGraphqlApi')} checked={settings.graphqlEnabled} onChange={(v) => update('graphqlEnabled', v)} description={t('asGraphqlDesc')} />
      <SettingSwitch label={t('asPublicApiDocs')} checked={settings.publicDocs} onChange={(v) => update('publicDocs', v)} description={t('asPublicApiDesc')} />
      <SettingField label={t('asCorsOrigins')}>
        <Input value={settings.corsOrigins} onChange={(e) => update('corsOrigins', e.target.value)} className="h-9 text-sm" placeholder="* or https://example.com" />
      </SettingField>
      <SettingField label={t('asApiRateLimit')}>
        <Input type="number" value={settings.apiRateLimit} onChange={(e) => update('apiRateLimit', parseInt(e.target.value) || 0)} className="h-9 text-sm" />
      </SettingField>
      <SettingSwitch label={t('asWebhooksEnabled')} checked={settings.webhooksEnabled} onChange={(v) => update('webhooksEnabled', v)} />
    </div>
  );

  const renderMaintenance = () => (
    <div className="space-y-4">
      <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
        <div className="flex items-center gap-2 mb-1">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">{t('asWarning')}</span>
        </div>
        <p className="text-[11px] text-amber-700 dark:text-amber-300">{t('asMaintenanceWarning')}</p>
      </div>
      <SettingSwitch label={t('asMaintenanceMode')} checked={settings.maintenanceMode} onChange={(v) => update('maintenanceMode', v)} description={t('asMaintenanceModeDesc')} />
      <SettingField label={t('asMaintenanceMessage')}>
        <Textarea value={settings.maintenanceMessage} onChange={(e) => update('maintenanceMessage', e.target.value)} className="min-h-[60px] text-sm" />
      </SettingField>
      <SettingField label={t('asAllowedIps')}>
        <Input value={settings.allowedIPs} onChange={(e) => update('allowedIPs', e.target.value)} className="h-9 text-sm" placeholder="192.168.1.1, 10.0.0.1" />
      </SettingField>
      <SettingSwitch label={t('asScheduledMaintenance')} checked={settings.scheduledMaintenance} onChange={(v) => update('scheduledMaintenance', v)} description={t('asScheduledDesc')} />
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general': return renderGeneral();
      case 'store': return renderStore();
      case 'payment': return renderPayment();
      case 'shipping': return renderShipping();
      case 'tax': return renderTax();
      case 'security': return renderSecurity();
      case 'seo': return renderSEO();
      case 'email': return renderEmail();
      case 'legal': return renderLegal();
      case 'api': return renderAPI();
      case 'maintenance': return renderMaintenance();
      default: return renderGeneral();
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-semibold">{t('systemSettings')}</h2>
        </div>
        {hasChanges && (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0 text-[11px]">
            {t('adminUnsavedChanges')}
          </Badge>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sidebar tabs */}
        <Card className="lg:w-56 shrink-0">
          <CardContent className="p-2">
            <nav className="space-y-0.5">
              {tabList.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                    {t(tab.labelKey)}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <Card className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {(() => {
                const TabIcon = tabList.find(t => t.id === activeTab)?.icon || Settings;
                return <TabIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />;
              })()}
              <CardTitle className="text-sm">{t(tabList.find(t => t.id === activeTab)?.labelKey || 'adminSettingsGeneral')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {renderTabContent()}
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
