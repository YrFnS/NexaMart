'use client';

import React, { useState } from 'react';
import {
  Building2,
  Store,
  Truck,
  CreditCard,
  ShieldCheck,
  Check,
  ArrowLeft,
  ArrowRight,
  Upload,
  Sparkles,
  Globe,
  Clock,
  FileText,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { APP_DOMAIN } from '@/lib/config';

type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

interface BusinessInfo {
  businessName: string;
  registrationNumber: string;
  businessType: string;
  yearEstablished: string;
}

interface StoreSetup {
  storeName: string;
  storeSlug: string;
  storeDescription: string;
  logoUploaded: boolean;
  bannerUploaded: boolean;
}

interface ShippingReturns {
  defaultShippingTime: string;
  returnPolicy: string;
  shippingZones: string[];
  freeShippingThreshold: string;
}

interface PaymentSetup {
  bankName: string;
  accountHolder: string;
  iban: string;
  swiftCode: string;
  payoutFrequency: string;
}

interface VerificationDocs {
  idUploaded: boolean;
  businessLicenseUploaded: boolean;
  addressProofUploaded: boolean;
}

const shippingZoneOptions = [
  { id: 'local', labelEn: 'Local (Same City)', labelAr: 'محلي (نفس المدينة)' },
  { id: 'national', labelEn: 'National (Countrywide)', labelAr: 'وطني (عموم البلاد)' },
  { id: 'regional', labelEn: 'Regional (Middle East)', labelAr: 'إقليمي (الشرق الأوسط)' },
  { id: 'international', labelEn: 'International (Worldwide)', labelAr: 'دولي (عالمي)' },
  { id: 'gcc', labelEn: 'GCC Countries', labelAr: 'دول مجلس التعاون' },
  { id: 'mena', labelEn: 'MENA Region', labelAr: 'منطقة الشرق الأوسط وشمال أفريقيا' },
];

export function SellerOnboarding() {
  const { t, dir } = useI18n();
  const nav = useAppNavigation();
  const isRTL = dir() === 'rtl';

  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>({
    businessName: '',
    registrationNumber: '',
    businessType: '',
    yearEstablished: '',
  });
  const [storeSetup, setStoreSetup] = useState<StoreSetup>({
    storeName: '',
    storeSlug: '',
    storeDescription: '',
    logoUploaded: false,
    bannerUploaded: false,
  });
  const [shippingReturns, setShippingReturns] = useState<ShippingReturns>({
    defaultShippingTime: '',
    returnPolicy: '',
    shippingZones: [],
    freeShippingThreshold: '',
  });
  const [paymentSetup, setPaymentSetup] = useState<PaymentSetup>({
    bankName: '',
    accountHolder: '',
    iban: '',
    swiftCode: '',
    payoutFrequency: '',
  });
  const [verificationDocs, setVerificationDocs] = useState<VerificationDocs>({
    idUploaded: false,
    businessLicenseUploaded: false,
    addressProofUploaded: false,
  });

  const totalSteps = 5;
  const progressValue = currentStep <= 5 ? (currentStep / totalSteps) * 100 : 100;

  const stepLabels = [
    { en: 'Business Info', ar: 'معلومات العمل', icon: Building2 },
    { en: 'Store Setup', ar: 'إعداد المتجر', icon: Store },
    { en: 'Shipping & Returns', ar: 'الشحن والإرجاع', icon: Truck },
    { en: 'Payment Setup', ar: 'إعداد الدفع', icon: CreditCard },
    { en: 'Verification', ar: 'التحقق', icon: ShieldCheck },
  ];

  const handleNext = () => {
    if (currentStep < 6) {
      setCurrentStep((currentStep + 1) as OnboardingStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as OnboardingStep);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const toggleShippingZone = (zoneId: string) => {
    setShippingReturns(prev => ({
      ...prev,
      shippingZones: prev.shippingZones.includes(zoneId)
        ? prev.shippingZones.filter(z => z !== zoneId)
        : [...prev.shippingZones, zoneId],
    }));
  };

  const BackArrow = isRTL ? ArrowRight : ArrowLeft;
  const NextArrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div dir={dir()} className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-950 dark:via-background dark:to-emerald-950/20">
      {/* Top Progress Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                N
              </div>
              <span className="font-bold text-sm">NexaMart Seller</span>
            </div>
            {currentStep <= 5 && (
              <span className="text-xs text-muted-foreground">
                {t('s_step')} {currentStep} {t('s_of')} {totalSteps}
              </span>
            )}
          </div>
          <Progress value={progressValue} className="h-2" />
          {/* Step indicators */}
          <div className="flex items-center justify-between mt-3">
            {stepLabels.map((step, i) => {
              const Icon = step.icon;
              const stepNum = i + 1;
              const isCompleted = currentStep > stepNum;
              const isCurrent = currentStep === stepNum;
              return (
                <div key={i} className="flex flex-col items-center gap-1">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <span className={`text-[10px] hidden sm:block ${isCurrent ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-muted-foreground'}`}>
                    {isRTL ? step.ar : step.en}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        {currentStep === 1 && (
          <StepBusinessInfo
            data={businessInfo}
            setData={setBusinessInfo}
            isRTL={isRTL}
          />
        )}
        {currentStep === 2 && (
          <StepStoreSetup
            data={storeSetup}
            setData={setStoreSetup}
            isRTL={isRTL}
          />
        )}
        {currentStep === 3 && (
          <StepShippingReturns
            data={shippingReturns}
            setData={setShippingReturns}
            toggleShippingZone={toggleShippingZone}
            isRTL={isRTL}
          />
        )}
        {currentStep === 4 && (
          <StepPaymentSetup
            data={paymentSetup}
            setData={setPaymentSetup}
            isRTL={isRTL}
          />
        )}
        {currentStep === 5 && (
          <StepVerification
            data={verificationDocs}
            setData={setVerificationDocs}
            isRTL={isRTL}
          />
        )}
        {currentStep === 6 && (
          <StepSuccess isRTL={isRTL} setView={nav.setView} />
        )}

        {/* Navigation Buttons */}
        {currentStep <= 5 && (
          <div className="flex items-center justify-between mt-8">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handleBack} className="gap-2">
                  <BackArrow className="h-4 w-4" />
                  {t('s_backBtn')}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {currentStep >= 2 && currentStep <= 4 && (
                <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground text-sm">
                  {t('s_skipForNow')}
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {currentStep === 5
                  ? t('s_submitForReview')
                  : t('next')
                }
                <NextArrow className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Step 1: Business Information ────────────────────────────── */
function StepBusinessInfo({
  data,
  setData,
  isRTL,
}: {
  data: BusinessInfo;
  setData: React.Dispatch<React.SetStateAction<BusinessInfo>>;
  isRTL: boolean;
}) {
  const { t } = useI18n();
  return (
    <Card className="border-emerald-200 dark:border-emerald-800/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
            <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {t('s_businessInformation')}
            </CardTitle>
            <CardDescription className="text-sm">
              {t('s_enterBusinessDetails')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('s_businessName')}
            </Label>
            <Input
              value={data.businessName}
              onChange={(e) => setData({ ...data, businessName: e.target.value })}
              placeholder={t('s_businessNamePh')}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('s_registrationNumber')}
            </Label>
            <Input
              value={data.registrationNumber}
              onChange={(e) => setData({ ...data, registrationNumber: e.target.value })}
              placeholder={t('s_registrationPh')}
              className="h-10"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('s_businessType')}
            </Label>
            <Select
              value={data.businessType}
              onValueChange={(v) => setData({ ...data, businessType: v })}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t('s_selectBusinessType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sole">{t('s_soleProprietorship')}</SelectItem>
                <SelectItem value="llc">{t('s_llc')}</SelectItem>
                <SelectItem value="corporation">{t('s_corporation')}</SelectItem>
                <SelectItem value="partnership">{t('s_partnership')}</SelectItem>
                <SelectItem value="freelancer">{t('s_freelancer')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('s_yearEstablished')}
            </Label>
            <Input
              type="number"
              value={data.yearEstablished}
              onChange={(e) => setData({ ...data, yearEstablished: e.target.value })}
              placeholder={t('s_yearPh')}
              min="1950"
              max="2025"
              className="h-10"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Step 2: Store Setup ────────────────────────────────────── */
function StepStoreSetup({
  data,
  setData,
  isRTL,
}: {
  data: StoreSetup;
  setData: React.Dispatch<React.SetStateAction<StoreSetup>>;
  isRTL: boolean;
}) {
  const { t } = useI18n();
  const slugPreview = data.storeName
    ? data.storeName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
    : 'your-store';

  return (
    <Card className="border-emerald-200 dark:border-emerald-800/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
            <Store className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {t('s_storeSetup')}
            </CardTitle>
            <CardDescription className="text-sm">
              {t('s_customizeStore')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('s_storeName')}
            </Label>
            <Input
              value={data.storeName}
              onChange={(e) => setData({ ...data, storeName: e.target.value })}
              placeholder={t('s_storeNamePh')}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('s_storeSlug')}
            </Label>
            <div className="flex items-center h-10 rounded-md border border-input bg-muted/50 px-3">
              <Globe className="h-4 w-4 text-muted-foreground me-2 shrink-0" />
              <span className="text-sm text-muted-foreground truncate">{APP_DOMAIN}/store/</span>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 truncate">{slugPreview}</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('s_storeDescription')}
          </Label>
          <Textarea
            value={data.storeDescription}
            onChange={(e) => setData({ ...data, storeDescription: e.target.value })}
            placeholder={t('s_storeDescPh')}
            rows={4}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('s_storeLogo')}
            </Label>
            <button
              onClick={() => setData({ ...data, logoUploaded: true })}
              className={`w-full border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                data.logoUploaded
                  ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-border hover:border-emerald-400 dark:hover:border-emerald-600'
              }`}
            >
              {data.logoUploaded ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {t('s_logoUploaded')}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {t('s_clickUploadLogo')}
                  </span>
                  <span className="text-[10px] text-muted-foreground">PNG, JPG (max 2MB)</span>
                </div>
              )}
            </button>
          </div>
          {/* Banner Upload */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('s_bannerImage')}
            </Label>
            <button
              onClick={() => setData({ ...data, bannerUploaded: true })}
              className={`w-full border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                data.bannerUploaded
                  ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-border hover:border-emerald-400 dark:hover:border-emerald-600'
              }`}
            >
              {data.bannerUploaded ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {t('s_bannerUploaded')}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {t('s_clickUploadBanner')}
                  </span>
                  <span className="text-[10px] text-muted-foreground">1200x400px recommended</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Step 3: Shipping & Returns ────────────────────────────── */
function StepShippingReturns({
  data,
  setData,
  toggleShippingZone,
  isRTL,
}: {
  data: ShippingReturns;
  setData: React.Dispatch<React.SetStateAction<ShippingReturns>>;
  toggleShippingZone: (zoneId: string) => void;
  isRTL: boolean;
}) {
  const { t } = useI18n();
  return (
    <Card className="border-emerald-200 dark:border-emerald-800/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
            <Truck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {t('s_shippingAndReturns')}
            </CardTitle>
            <CardDescription className="text-sm">
              {t('s_setShippingPolicies')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('s_defaultShippingTime')}
            </Label>
            <Select
              value={data.defaultShippingTime}
              onValueChange={(v) => setData({ ...data, defaultShippingTime: v })}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder={t('s_selectShippingTime')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-2">{t('s_1to2days')}</SelectItem>
                <SelectItem value="3-5">{t('s_3to5days')}</SelectItem>
                <SelectItem value="5-7">{t('s_5to7days')}</SelectItem>
                <SelectItem value="7-14">{t('s_7to14days')}</SelectItem>
                <SelectItem value="14-30">{t('s_14to30days')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('s_freeShippingThreshold')}
            </Label>
            <Input
              type="number"
              value={data.freeShippingThreshold}
              onChange={(e) => setData({ ...data, freeShippingThreshold: e.target.value })}
              placeholder={t('s_freeShippingPh')}
              className="h-10"
            />
            <p className="text-[11px] text-muted-foreground">
              {t('s_leaveEmptyFreeShip')}
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('s_returnPolicyLabel')}
          </Label>
          <Textarea
            value={data.returnPolicy}
            onChange={(e) => setData({ ...data, returnPolicy: e.target.value })}
            placeholder={t('s_returnPolicyPh')}
            rows={3}
          />
        </div>
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            {t('s_shippingZones')}
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shippingZoneOptions.map((zone) => (
              <label
                key={zone.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  data.shippingZones.includes(zone.id)
                    ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                }`}
              >
                <Checkbox
                  checked={data.shippingZones.includes(zone.id)}
                  onCheckedChange={() => toggleShippingZone(zone.id)}
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">
                    {isRTL ? zone.labelAr : zone.labelEn}
                  </span>
                </div>
                {data.shippingZones.includes(zone.id) && (
                  <Check className="h-4 w-4 text-emerald-500" />
                )}
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Step 4: Payment Setup ──────────────────────────────────── */
function StepPaymentSetup({
  data,
  setData,
  isRTL,
}: {
  data: PaymentSetup;
  setData: React.Dispatch<React.SetStateAction<PaymentSetup>>;
  isRTL: boolean;
}) {
  const { t } = useI18n();
  return (
    <Card className="border-emerald-200 dark:border-emerald-800/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
            <CreditCard className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {t('s_paymentSetup')}
            </CardTitle>
            <CardDescription className="text-sm">
              {t('s_addBankDetails')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('s_bankName')}
            </Label>
            <Input
              value={data.bankName}
              onChange={(e) => setData({ ...data, bankName: e.target.value })}
              placeholder={t('s_bankNamePh')}
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('s_accountHolder')}
            </Label>
            <Input
              value={data.accountHolder}
              onChange={(e) => setData({ ...data, accountHolder: e.target.value })}
              placeholder={t('s_accountHolderPh')}
              className="h-10"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('s_iban')}
            </Label>
            <Input
              value={data.iban}
              onChange={(e) => setData({ ...data, iban: e.target.value })}
              placeholder="IQ00 XXXX XXXX XXXX XXXX"
              className="h-10 font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t('s_swiftCode')}
            </Label>
            <Input
              value={data.swiftCode}
              onChange={(e) => setData({ ...data, swiftCode: e.target.value })}
              placeholder="BNORXXXX"
              className="h-10 font-mono"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t('s_preferredPayoutFreq')}
          </Label>
          <Select
            value={data.payoutFrequency}
            onValueChange={(v) => setData({ ...data, payoutFrequency: v })}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder={t('s_selectPayoutFreq')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t('s_daily')}</SelectItem>
              <SelectItem value="weekly">{t('s_weekly')}</SelectItem>
              <SelectItem value="biweekly">{t('s_biweekly')}</SelectItem>
              <SelectItem value="monthly">{t('s_monthly')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4">
          <div className="flex gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                {t('s_yourInfoSecure')}
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {t('s_bankDataEncrypted')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Step 5: Verification ────────────────────────────────────── */
function StepVerification({
  data,
  setData,
  isRTL,
}: {
  data: VerificationDocs;
  setData: React.Dispatch<React.SetStateAction<VerificationDocs>>;
  isRTL: boolean;
}) {
  const { t } = useI18n();
  const docItems = [
    {
      key: 'idUploaded' as const,
      titleEn: 'Government ID',
      titleAr: 'الهوية الحكومية',
      descEn: 'Upload a valid government-issued ID (passport, national ID)',
      descAr: 'ارفع هوية حكومية سارية (جواز سفر، بطاقة وطنية)',
      icon: FileText,
    },
    {
      key: 'businessLicenseUploaded' as const,
      titleEn: 'Business License',
      titleAr: 'رخصة العمل',
      descEn: 'Upload your business registration certificate or trade license',
      descAr: 'ارفع شهادة تسجيل العمل أو رخصة التجارة',
      icon: Building2,
    },
    {
      key: 'addressProofUploaded' as const,
      titleEn: 'Address Proof',
      titleAr: 'إثبات العنوان',
      descEn: 'Upload a utility bill or bank statement (within last 3 months)',
      descAr: 'ارفع فاتورة مرافق أو كشف حساب بنكي (خلال آخر 3 أشهر)',
      icon: Clock,
    },
  ];

  return (
    <Card className="border-emerald-200 dark:border-emerald-800/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-lg">
              {t('s_identityVerification')}
            </CardTitle>
            <CardDescription className="text-sm">
              {t('s_uploadDocsToVerify')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {docItems.map((doc) => {
          const Icon = doc.icon;
          const isUploaded = data[doc.key];
          return (
            <div
              key={doc.key}
              className={`p-4 rounded-xl border-2 transition-all ${
                isUploaded
                  ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/10'
                  : 'border-dashed border-border hover:border-emerald-300 dark:hover:border-emerald-700'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg shrink-0 ${isUploaded ? 'bg-emerald-100 dark:bg-emerald-900/50' : 'bg-muted'}`}>
                  <Icon className={`h-5 w-5 ${isUploaded ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium">
                      {isRTL ? doc.titleAr : doc.titleEn}
                    </h4>
                    {isUploaded && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 text-[10px]">
                        <Check className="h-3 w-3 me-1" />
                        {t('s_uploaded')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {isRTL ? doc.descAr : doc.descEn}
                  </p>
                  {!isUploaded && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                      onClick={() => setData({ ...data, [doc.key]: true })}
                    >
                      <Upload className="h-3.5 w-3.5 me-1.5" />
                      {t('s_uploadDocument')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4 mt-4">
          <div className="flex gap-3">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {t('s_reviewTime')}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {t('s_verificationTakesTime')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Step 6: Success ────────────────────────────────────────── */
function StepSuccess({
  isRTL,
  setView,
}: {
  isRTL: boolean;
  setView: (view: 'seller-dashboard') => void;
}) {
  const { t } = useI18n();
  return (
    <div className="text-center py-8">
      <div className="relative inline-block mb-6">
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
          <Check className="h-12 w-12 text-white" />
        </div>
        <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-br from-emerald-300 to-teal-400 flex items-center justify-center animate-bounce">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-3 -left-3 h-6 w-6 rounded-full bg-emerald-200 dark:bg-emerald-800/50 opacity-60" />
        <div className="absolute top-0 -left-5 h-4 w-4 rounded-full bg-teal-200 dark:bg-teal-800/50 opacity-40" />
      </div>
      <h2 className="text-2xl font-bold mb-2">
        {t('s_congratulations')}
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto mb-8">
        {t('s_applicationSubmitted')}
      </p>
      <div className="max-w-sm mx-auto space-y-3">
        <Card className="border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-start">
                <p className="text-sm font-medium">{t('s_reviewStatus')}</p>
                <p className="text-xs text-muted-foreground">{t('s_underReviewEst')}</p>
              </div>
              <Badge className="ms-auto bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">
                {t('s_pendingReview')}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800/50">
          <CardContent className="p-4">
            <h4 className="text-sm font-medium mb-2">{t('s_whatsNext')}</h4>
            <ul className="space-y-2">
              {[
                t('s_confirmEmail'),
                t('s_teamReviewDocs'),
                t('s_onceApprovedAddProducts'),
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{i + 1}</span>
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Button
          onClick={() => setView('seller-dashboard')}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
        >
          {t('s_goToSellerDashboard')}
          {isRTL ? <ChevronLeft className="h-4 w-4 ms-2" /> : <ChevronRight className="h-4 w-4 ms-2" />}
        </Button>
        <p className="text-[11px] text-muted-foreground">
          {t('s_completeSetupLater')}
        </p>
      </div>
    </div>
  );
}
