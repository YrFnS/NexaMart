'use client';

import React, { useState } from 'react';
import {
  Store,
  Truck,
  CreditCard,
  Clock,
  ShieldCheck,
  Upload,
  Plus,
  Trash2,
  Save,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';

interface ShippingRate {
  id: string;
  region: string;
  rate: number;
  freeAbove: number;
  estimatedDays: string;
}

interface BusinessHour {
  day: string;
  isOpen: boolean;
  open: string;
  close: string;
}

export function StoreSettings() {
  const { t } = useI18n();
  const [saved, setSaved] = useState(false);

  // Store Profile
  const [storeName, setStoreName] = useState('TechStore Pro');
  const [storeDesc, setStoreDesc] = useState('Your one-stop shop for premium tech accessories and gadgets. We offer the latest products with fast shipping and excellent customer service.');
  const [storeLogo, setStoreLogo] = useState('');
  const [storeBanner, setStoreBanner] = useState('');

  // Shipping
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([
    { id: '1', region: 'Domestic (Iraq)', rate: 5, freeAbove: 50, estimatedDays: '2-3' },
    { id: '2', region: 'Gulf Countries', rate: 15, freeAbove: 150, estimatedDays: '5-7' },
    { id: '3', region: 'International', rate: 25, freeAbove: 250, estimatedDays: '7-14' },
  ]);
  const [expressShipping, setExpressShipping] = useState(true);
  const [expressRate, setExpressRate] = useState('10');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('50');

  // Payment
  const [bankName, setBankName] = useState('Baghdad International Bank');
  const [accountName, setAccountName] = useState('TechStore Pro LLC');
  const [accountNumber, setAccountNumber] = useState('****4567');
  const [payoutMethod, setPayoutMethod] = useState('bank');

  // Business Hours
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([
    { day: 'Monday', isOpen: true, open: '09:00', close: '18:00' },
    { day: 'Tuesday', isOpen: true, open: '09:00', close: '18:00' },
    { day: 'Wednesday', isOpen: true, open: '09:00', close: '18:00' },
    { day: 'Thursday', isOpen: true, open: '09:00', close: '18:00' },
    { day: 'Friday', isOpen: true, open: '09:00', close: '20:00' },
    { day: 'Saturday', isOpen: true, open: '10:00', close: '16:00' },
    { day: 'Sunday', isOpen: false, open: '00:00', close: '00:00' },
  ]);

  // Verification
  const [isVerified, setIsVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'none' | 'pending' | 'approved'>('none');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addShippingRate = () => {
    setShippingRates([
      ...shippingRates,
      { id: `sr-${Date.now()}`, region: '', rate: 0, freeAbove: 0, estimatedDays: '' },
    ]);
  };

  const removeShippingRate = (id: string) => {
    setShippingRates(shippingRates.filter(sr => sr.id !== id));
  };

  const updateShippingRate = (id: string, field: keyof ShippingRate, value: string | number) => {
    setShippingRates(shippingRates.map(sr => sr.id === id ? { ...sr, [field]: value } : sr));
  };

  const toggleBusinessHour = (index: number) => {
    setBusinessHours(businessHours.map((bh, i) => i === index ? { ...bh, isOpen: !bh.isOpen } : bh));
  };

  const updateBusinessHour = (index: number, field: keyof BusinessHour, value: string | boolean) => {
    setBusinessHours(businessHours.map((bh, i) => i === index ? { ...bh, [field]: value } : bh));
  };

  const applyForVerification = () => {
    setVerificationStatus('pending');
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">{t('storeSettings')}</h2>
          <p className="text-sm text-muted-foreground">{t('ssManageConfig')}</p>
        </div>
        <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSave}>
          {saved ? <CheckCircle className="h-3.5 w-3.5 me-1.5" /> : <Save className="h-3.5 w-3.5 me-1.5" />}
          {saved ? t('ssSaved') : t('save')} {t('pmChanges')}
        </Button>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="h-9 bg-muted/50 flex-wrap">
          <TabsTrigger value="profile" className="text-xs">
            <Store className="h-3.5 w-3.5 me-1.5" /> {t('storeProfile')}
          </TabsTrigger>
          <TabsTrigger value="shipping" className="text-xs">
            <Truck className="h-3.5 w-3.5 me-1.5" /> {t('shipping')}
          </TabsTrigger>
          <TabsTrigger value="payment" className="text-xs">
            <CreditCard className="h-3.5 w-3.5 me-1.5" /> {t('ssPayment')}
          </TabsTrigger>
          <TabsTrigger value="hours" className="text-xs">
            <Clock className="h-3.5 w-3.5 me-1.5" /> {t('ssHours')}
          </TabsTrigger>
          <TabsTrigger value="verification" className="text-xs">
            <ShieldCheck className="h-3.5 w-3.5 me-1.5" /> {t('ssVerify')}
          </TabsTrigger>
        </TabsList>

        {/* Store Profile */}
        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">{t('storeProfile')}</CardTitle>
              <CardDescription className="text-xs">{t('ssStoreInfoVisible')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('ssStoreName')}</Label>
                <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('description')}</Label>
                <Textarea value={storeDesc} onChange={(e) => setStoreDesc(e.target.value)} rows={4} />
              </div>

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label className="text-sm">{t('ssStoreLogo')}</Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-2xl shadow-md shrink-0">
                    {storeName.charAt(0)}
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Upload className="h-3.5 w-3.5 me-1.5" />
                    {t('ssUploadLogo')}
                  </Button>
                </div>
              </div>

              {/* Banner Upload */}
              <div className="space-y-2">
                <Label className="text-sm">{t('ssStoreBanner')}</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t('ssUploadBanner')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('ssBannerHint')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">{t('ssShippingSettings')}</CardTitle>
              <CardDescription className="text-xs">{t('ssConfigureShipping')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('ssFreeShippingThreshold')}</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(e.target.value)}
                    className="h-9 w-32"
                  />
                  <span className="text-xs text-muted-foreground">{t('ssFreeShippingNote')}</span>
                </div>
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">{t('ssShippingRates')}</Label>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={addShippingRate}>
                    <Plus className="h-3 w-3 me-1" /> {t('ssAddRate')}
                  </Button>
                </div>
                <div className="space-y-3">
                  {shippingRates.map((rate) => (
                    <div key={rate.id} className="flex items-end gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className="flex-1 space-y-1">
                        <label className="text-[11px] text-muted-foreground">{t('ssRegion')}</label>
                        <Input
                          value={rate.region}
                          onChange={(e) => updateShippingRate(rate.id, 'region', e.target.value)}
                          className="h-8 text-sm"
                          placeholder="e.g. Domestic"
                        />
                      </div>
                      <div className="w-20 space-y-1">
                        <label className="text-[11px] text-muted-foreground">{t('ssRate')}</label>
                        <Input
                          type="number"
                          value={rate.rate}
                          onChange={(e) => updateShippingRate(rate.id, 'rate', parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="w-24 space-y-1">
                        <label className="text-[11px] text-muted-foreground">{t('ssFreeAbove')}</label>
                        <Input
                          type="number"
                          value={rate.freeAbove}
                          onChange={(e) => updateShippingRate(rate.id, 'freeAbove', parseFloat(e.target.value) || 0)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="w-20 space-y-1">
                        <label className="text-[11px] text-muted-foreground">{t('ssDays')}</label>
                        <Input
                          value={rate.estimatedDays}
                          onChange={(e) => updateShippingRate(rate.id, 'estimatedDays', e.target.value)}
                          className="h-8 text-sm"
                          placeholder="3-5"
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 shrink-0" onClick={() => removeShippingRate(rate.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium">{t('ssExpressShipping')}</Label>
                  <p className="text-xs text-muted-foreground">{t('ssOfferExpress')}</p>
                </div>
                <Switch checked={expressShipping} onCheckedChange={setExpressShipping} />
              </div>

              {expressShipping && (
                <div className="space-y-2 ms-4">
                  <Label className="text-sm">{t('ssExpressRate')}</Label>
                  <Input
                    type="number"
                    value={expressRate}
                    onChange={(e) => setExpressRate(e.target.value)}
                    className="h-9 w-32"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">{t('ssPaymentSettings')}</CardTitle>
              <CardDescription className="text-xs">{t('ssConfigurePayout')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('ssPayoutMethod')}</Label>
                <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                  <SelectTrigger className="h-9 w-full sm:w-[240px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank">{t('bankTransfer')}</SelectItem>
                    <SelectItem value="wallet">{t('ssNexaMartWallet')}</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {payoutMethod === 'bank' && (
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-sm">{t('ssBankName')}</Label>
                    <Input value={bankName} onChange={(e) => setBankName(e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{t('ssAccountHolder')}</Label>
                    <Input value={accountName} onChange={(e) => setAccountName(e.target.value)} className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">{t('ssAccountNumber')}</Label>
                    <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="h-9" />
                  </div>
                </div>
              )}

              <Separator />

              <div className="p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">{t('ssPayoutSchedule')}</h4>
                <p className="text-xs text-muted-foreground">{t('ssPayoutProcessed')} <span className="font-medium text-foreground">{t('ssDayTuesday')}</span> {t('ssAnd')} <span className="font-medium text-foreground">{t('ssDayFriday')}</span></p>
                <p className="text-xs text-muted-foreground mt-1">{t('ssMinPayoutAmount')} <span className="font-medium text-foreground">$50</span></p>
                <p className="text-xs text-muted-foreground mt-1">{t('ssCommissionRateNote')} <span className="font-medium text-foreground">10%</span> {t('ssOnEachSale')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Hours */}
        <TabsContent value="hours" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-600" /> {t('ssBusinessHours')}
              </CardTitle>
              <CardDescription className="text-xs">{t('ssBusinessHoursDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {businessHours.map((bh, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="w-24">
                    <span className="text-sm font-medium">{bh.day}</span>
                  </div>
                  <Switch checked={bh.isOpen} onCheckedChange={() => toggleBusinessHour(i)} />
                  {bh.isOpen ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={bh.open}
                        onChange={(e) => updateBusinessHour(i, 'open', e.target.value)}
                        className="h-8 w-28 text-sm"
                      />
                      <span className="text-xs text-muted-foreground">{t('ssTo')}</span>
                      <Input
                        type="time"
                        value={bh.close}
                        onChange={(e) => updateBusinessHour(i, 'close', e.target.value)}
                        className="h-8 w-28 text-sm"
                      />
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-[11px] bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400">{t('ssClosed')}</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Verification */}
        <TabsContent value="verification" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> {t('ssSellerVerification')}
              </CardTitle>
              <CardDescription className="text-xs">{t('ssVerificationDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {verificationStatus === 'approved' && (
                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{t('verifiedSeller')}</p>
                    <p className="text-xs text-muted-foreground">{t('ssVerifiedSellerMsg')}</p>
                  </div>
                </div>
              )}

              {verificationStatus === 'pending' && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <Clock className="h-6 w-6 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">{t('ssVerificationPending')}</p>
                    <p className="text-xs text-muted-foreground">{t('ssVerificationPendingMsg')}</p>
                  </div>
                </div>
              )}

              {verificationStatus === 'none' && (
                <>
                  <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                    <h4 className="text-sm font-semibold">{t('ssBenefitsOfVerification')}</h4>
                    <ul className="space-y-2">
                      {[
                        t('ssVerifiedBadgeListings'),
                        t('ssHigherRanking'),
                        t('ssIncreasedTrust'),
                        t('ssPremiumFeatures'),
                        t('ssPrioritySupport'),
                      ].map((benefit, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">{t('ssRequiredDocuments')}</h4>
                    <div className="space-y-2">
                      {[t('ssBusinessLicense'), t('ssGovernmentId'), t('ssTaxCertificate')].map((doc, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm">{doc}</span>
                          <Button variant="outline" size="sm" className="h-7 text-xs">
                            <Upload className="h-3 w-3 me-1" /> {t('ssUpload')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={applyForVerification}>
                    <ShieldCheck className="h-4 w-4 me-2" />
                    {t('ssApplyVerification')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
