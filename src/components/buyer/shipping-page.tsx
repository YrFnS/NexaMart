'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Package,
  Calculator,
  MapPin,
  Weight,
  Ruler,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  Shield,
  ArrowRightLeft,
  BadgeCheck,
  FileText,
  RotateCcw,
  ShieldCheck,
  Info,
  Zap,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { SHIPPING_CONFIG } from '@/lib/config';

interface City {
  id: string;
  name: string;
  nameAr: string;
  country: string;
  countryAr: string;
}

interface ShippingRate {
  carrierId: string;
  carrierName: string;
  carrierNameAr: string;
  carrierLogo: string;
  type: 'standard' | 'express' | 'same_day';
  typeName: string;
  typeNameAr: string;
  estimatedDays: string;
  estimatedDaysAr: string;
  minDays: number;
  maxDays: number;
  price: number;
  currency: string;
  trackingIncluded: boolean;
  insuranceIncluded: boolean;
}

interface ShipmentStep {
  key: string;
  label: string;
  labelAr: string;
  completed: boolean;
  date: string;
}

interface Shipment {
  id: string;
  orderId: string;
  carrier: string;
  carrierAr: string;
  trackingNumber: string;
  origin: string;
  originAr: string;
  destination: string;
  destinationAr: string;
  status: string;
  statusAr: string;
  currentStep: number;
  totalSteps: number;
  steps: ShipmentStep[];
  estimatedDelivery: string;
  weight: string;
}

export function ShippingPage() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const [cities, setCities] = useState<City[]>([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [widthVal, setWidthVal] = useState('');
  const [height, setHeight] = useState('');
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [activeTab, setActiveTab] = useState('calculator');

  // Fetch cities on mount
  useEffect(() => {
    fetch('/api/shipping?action=cities')
      .then(res => res.json())
      .then(data => setCities(data.cities || []))
      .catch(() => {});
  }, []);

  // Fetch shipments on mount
  useEffect(() => {
    fetch('/api/shipping?action=shipments')
      .then(res => res.json())
      .then(data => setShipments(data.shipments || []))
      .catch(() => {});
  }, []);

  const handleCalculate = async () => {
    if (!origin || !destination) return;
    setIsCalculating(true);
    try {
      const res = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          weight: Number(weight) || 1,
          length: Number(length) || 30,
          width: Number(widthVal) || 20,
          height: Number(height) || 15,
        }),
      });
      const data = await res.json();
      setRates(data.rates || []);
      setHasCalculated(true);
    } catch {
      // ignore
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSwapCities = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    if (hasCalculated) {
      setHasCalculated(false);
      setRates([]);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'standard': return <Package className="size-5" />;
      case 'express': return <Zap className="size-5" />;
      case 'same_day': return <Rocket className="size-5" />;
      default: return <Package className="size-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'standard': return 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30';
      case 'express': return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30';
      case 'same_day': return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30';
      default: return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30';
    }
  };

  const getTypeBorder = (type: string) => {
    switch (type) {
      case 'standard': return 'border-teal-200 dark:border-teal-800';
      case 'express': return 'border-amber-200 dark:border-amber-800';
      case 'same_day': return 'border-rose-200 dark:border-rose-800';
      default: return 'border-emerald-200 dark:border-emerald-800';
    }
  };

  const getStepIcon = (completed: boolean, isCurrent: boolean) => {
    if (completed) return <CheckCircle2 className="size-5 text-emerald-500" />;
    if (isCurrent) return <Circle className="size-5 text-emerald-500 fill-emerald-500/30 animate-pulse" />;
    return <Circle className="size-5 text-muted-foreground/40" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'picked_up': return 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300';
      case 'in_transit': return 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300';
      case 'out_for_delivery': return 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300';
      case 'delivered': return 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Group rates by type
  const groupedRates = rates.reduce<Record<string, ShippingRate[]>>((acc, rate) => {
    if (!acc[rate.type]) acc[rate.type] = [];
    acc[rate.type].push(rate);
    return acc;
  }, {});

  const renderCalculator = () => (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 md:p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Calculator className="size-6" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {isRTL ? 'حاسبة الشحن' : t('shippingCalculator')}
            </h1>
          </div>
          <p className="text-white/80 text-sm md:text-base max-w-xl">
            {isRTL
              ? 'احسب تكاليف الشحن بين مدن الشرق الأوسط وشمال أفريقيا مع شركات شحن متعددة'
              : 'Calculate shipping costs across MENA cities with multiple carrier options'}
          </p>
          <div className="flex items-center gap-4 mt-4 text-sm text-white/70">
            <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {cities.length} {isRTL ? 'مدينة' : 'Cities'}</span>
            <span className="flex items-center gap-1"><Truck className="size-3.5" /> 6 {isRTL ? 'شركات شحن' : 'Carriers'}</span>
            <span className="flex items-center gap-1"><Shield className="size-3.5" /> {isRTL ? 'تتبع مجاني' : 'Free Tracking'}</span>
          </div>
        </div>
      </div>

      {/* Calculator Form */}
      <Card className="border-emerald-200/50 dark:border-emerald-800/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="size-5 text-emerald-600 dark:text-emerald-400" />
            {isRTL ? 'تفاصيل الشحنة' : t('shipmentDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Origin & Destination */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {isRTL ? 'مدينة المنشأ' : t('originCity')}
              </Label>
              <Select value={origin} onValueChange={(v) => { setOrigin(v); if (hasCalculated) { setHasCalculated(false); setRates([]); } }}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={isRTL ? 'اختر مدينة المنشأ' : t('selectOrigin')} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city.id} value={city.id}>
                      {isRTL ? city.nameAr : city.name} — {isRTL ? city.countryAr : city.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full border-emerald-300 dark:border-emerald-700 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 shrink-0"
              onClick={handleSwapCities}
              disabled={!origin && !destination}
            >
              <ArrowRightLeft className="size-4" />
            </Button>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {isRTL ? 'مدينة الوجهة' : t('destinationCity')}
              </Label>
              <Select value={destination} onValueChange={(v) => { setDestination(v); if (hasCalculated) { setHasCalculated(false); setRates([]); } }}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={isRTL ? 'اختر مدينة الوجهة' : t('selectDestination')} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city.id} value={city.id}>
                      {isRTL ? city.nameAr : city.name} — {isRTL ? city.countryAr : city.country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Package Details */}
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Package className="size-4 text-emerald-600 dark:text-emerald-400" />
              {isRTL ? 'تفاصيل الطرد' : t('packageDetails')}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Weight className="size-3" /> {isRTL ? 'الوزن (كجم)' : t('weightKg')}
                </Label>
                <Input
                  type="number"
                  placeholder="1.0"
                  min="0.1"
                  step="0.1"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Ruler className="size-3" /> {isRTL ? 'الطول (سم)' : t('lengthCm')}
                </Label>
                <Input
                  type="number"
                  placeholder="30"
                  min="1"
                  value={length}
                  onChange={e => setLength(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Ruler className="size-3" /> {isRTL ? 'العرض (سم)' : t('widthCm')}
                </Label>
                <Input
                  type="number"
                  placeholder="20"
                  min="1"
                  value={widthVal}
                  onChange={e => setWidthVal(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1">
                  <Ruler className="size-3" /> {isRTL ? 'الارتفاع (سم)' : t('heightCm')}
                </Label>
                <Input
                  type="number"
                  placeholder="15"
                  min="1"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold h-11 shadow-lg shadow-emerald-500/20"
            onClick={handleCalculate}
            disabled={!origin || !destination || isCalculating}
          >
            {isCalculating ? (
              <>
                <Loader2 className="size-4 me-2 animate-spin" />
                {isRTL ? 'جاري الحساب...' : t('calculating')}
              </>
            ) : (
              <>
                <Calculator className="size-4 me-2" />
                {isRTL ? 'احسب تكاليف الشحن' : t('calculateShipping')}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {hasCalculated && rates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Truck className="size-5 text-emerald-600 dark:text-emerald-400" />
              {isRTL ? 'خيارات الشحن المتاحة' : t('availableShippingOptions')}
            </h2>
            <Badge variant="outline" className="text-emerald-600 border-emerald-300 dark:border-emerald-700">
              {rates.length} {isRTL ? 'خيار' : 'options'}
            </Badge>
          </div>

          {(['standard', 'express', 'same_day'] as const).map(type => {
            const typeRates = groupedRates[type];
            if (!typeRates || typeRates.length === 0) return null;

            return (
              <div key={type} className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${getTypeColor(type)}`}>
                    {getTypeIcon(type)}
                    {type === 'standard'
                      ? (isRTL ? 'توصيل عادي' : 'Standard Delivery')
                      : type === 'express'
                        ? (isRTL ? 'توصيل سريع' : 'Express Delivery')
                        : (isRTL ? 'توصيل في نفس اليوم' : 'Same-Day Delivery')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {type === 'standard'
                      ? (isRTL ? '3-5 أيام - الأرخص' : '3-5 days — Cheapest')
                      : type === 'express'
                        ? (isRTL ? '1-2 أيام - معتدل' : '1-2 days — Moderate')
                        : (isRTL ? 'المحلي فقط - الأغلى' : 'Local only — Premium')}
                  </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {typeRates.map((rate, idx) => (
                    <Card
                      key={`${rate.carrierId}-${rate.type}-${idx}`}
                      className={`border-2 transition-all hover:shadow-md ${getTypeBorder(type)} ${
                        idx === 0 && type === 'standard'
                          ? 'ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
                          : ''
                      }`}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{rate.carrierLogo}</span>
                            <div>
                              <p className="text-sm font-semibold">
                                {isRTL ? rate.carrierNameAr : rate.carrierName}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {isRTL ? rate.typeNameAr : rate.typeName}
                              </p>
                            </div>
                          </div>
                          {idx === 0 && type === 'standard' && (
                            <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-[10px]">
                              {isRTL ? 'الأفضل قيمة' : 'Best Value'}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="size-3" />
                            {isRTL ? rate.estimatedDaysAr : rate.estimatedDays}
                          </span>
                          {rate.trackingIncluded && (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <BadgeCheck className="size-3" />
                              {isRTL ? 'تتبع مجاني' : 'Tracking'}
                            </span>
                          )}
                        </div>

                        {rate.insuranceIncluded && (
                          <div className="flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 px-2 py-1 rounded">
                            <ShieldCheck className="size-3" />
                            {isRTL ? 'تأمين مشمول' : 'Insurance included'}
                          </div>
                        )}

                        <Separator />

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {isRTL ? 'السعر' : 'Price'}
                          </span>
                          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                            {formatPrice(rate.price)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasCalculated && rates.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Package className="size-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {isRTL ? 'لا توجد خيارات شحن متاحة لهذا المسار' : 'No shipping options available for this route'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderShipments = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Truck className="size-5 text-emerald-600 dark:text-emerald-400" />
          {isRTL ? 'شحناتي' : t('myShipments')}
        </h2>
        <Badge variant="outline" className="text-emerald-600 border-emerald-300 dark:border-emerald-700">
          {shipments.length} {isRTL ? 'شحنة' : 'shipments'}
        </Badge>
      </div>

      {shipments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <Package className="size-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">{isRTL ? 'لا توجد شحنات نشطة' : 'No active shipments'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {shipments.map(shipment => {
            const progressPercent = (shipment.currentStep / shipment.totalSteps) * 100;
            return (
              <Card key={shipment.id} className="overflow-hidden border-emerald-200/50 dark:border-emerald-800/50">
                <CardContent className="p-0">
                  {/* Header */}
                  <div className="p-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/20 dark:to-teal-950/20 border-b">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                          <Package className="size-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{shipment.orderId}</p>
                          <p className="text-xs text-muted-foreground">{isRTL ? shipment.carrierAr : shipment.carrier}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] ${getStatusColor(shipment.status)}`}>
                          {isRTL ? shipment.statusAr : shipment.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Route */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="size-3.5 text-emerald-500 shrink-0" />
                          <span className="font-medium">{isRTL ? shipment.originAr : shipment.origin}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <div className="w-8 h-px bg-border" />
                        {isRTL ? <ChevronLeft className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                        <div className="w-8 h-px bg-border" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="size-3.5 text-rose-500 shrink-0" />
                          <span className="font-medium">{isRTL ? shipment.destinationAr : shipment.destination}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tracking Number */}
                    <div className="flex items-center gap-2 text-xs bg-muted/50 px-3 py-2 rounded-lg">
                      <span className="text-muted-foreground">{isRTL ? 'رقم التتبع:' : 'Tracking:'}</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{shipment.trackingNumber}</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>{isRTL ? 'تقدم الشحنة' : 'Shipment Progress'}</span>
                        <span>{Math.round(progressPercent)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Status Timeline */}
                    <div className="flex items-start gap-2 pt-2">
                      {shipment.steps.map((step, idx) => {
                        const isCurrent = idx === shipment.currentStep - 1 && !step.completed;
                        return (
                          <React.Fragment key={step.key}>
                            <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
                              {getStepIcon(step.completed, isCurrent)}
                              <span className={`text-[10px] text-center leading-tight ${
                                step.completed ? 'text-emerald-600 dark:text-emerald-400 font-medium' :
                                isCurrent ? 'text-emerald-500 font-medium' :
                                'text-muted-foreground'
                              }`}>
                                {isRTL ? step.labelAr : step.label}
                              </span>
                              {step.date && (
                                <span className="text-[9px] text-muted-foreground">{step.date}</span>
                              )}
                            </div>
                            {idx < shipment.steps.length - 1 && (
                              <div className={`h-0.5 w-4 mt-2.5 shrink-0 ${
                                step.completed && shipment.steps[idx + 1]?.completed
                                  ? 'bg-emerald-500'
                                  : step.completed
                                    ? 'bg-emerald-300 dark:bg-emerald-700'
                                    : 'bg-muted'
                              }`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>

                    {/* Estimated Delivery */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" />
                        {isRTL ? 'التسليم المتوقع' : 'Est. Delivery'}
                      </span>
                      <span className="font-medium">{shipment.estimatedDelivery}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderPolicies = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <FileText className="size-5 text-emerald-600 dark:text-emerald-400" />
        {isRTL ? 'سياسات الشحن' : t('shippingPolicies')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Shipping Policy */}
        <Card className="border-teal-200/50 dark:border-teal-800/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900">
                <Truck className="size-5 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="font-semibold text-sm">{isRTL ? 'سياسة الشحن' : 'Shipping Policy'}</h3>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-teal-500 mt-0.5 shrink-0" />
                {t('freeShippingOverThreshold', { amount: formatPrice(SHIPPING_CONFIG.freeShippingThreshold) })}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-teal-500 mt-0.5 shrink-0" />
                {isRTL ? 'التوصيل في نفس اليوم متاح في نفس المدينة' : 'Same-day delivery available within the same city'}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-teal-500 mt-0.5 shrink-0" />
                {isRTL ? 'تتبع الشحنات في الوقت الفعلي لجميع الطلبات' : 'Real-time tracking for all shipments'}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-teal-500 mt-0.5 shrink-0" />
                {isRTL ? 'تغليف آمن لجميع المنتجات' : 'Secure packaging for all products'}
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Return Shipping */}
        <Card className="border-amber-200/50 dark:border-amber-800/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
                <RotateCcw className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="font-semibold text-sm">{isRTL ? 'شحن الإرجاع' : 'Return Shipping'}</h3>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                {isRTL ? 'إرجاع مجاني خلال 14 يوماً من الاستلام' : 'Free returns within 14 days of delivery'}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                {isRTL ? 'استلام من الباب للمنتجات المعيبة' : 'Door pickup for defective products'}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                {isRTL ? 'استرداد تكاليف الشحن للمنتجات التالفة' : 'Shipping cost refund for damaged items'}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-amber-500 mt-0.5 shrink-0" />
                {isRTL ? 'عملية إرجاع سهلة عبر التطبيق' : 'Easy return process via the app'}
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Shipping Insurance */}
        <Card className="border-emerald-200/50 dark:border-emerald-800/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900">
                <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-semibold text-sm">{isRTL ? 'تأمين الشحن' : 'Shipping Insurance'}</h3>
            </div>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                {isRTL ? 'تأمين مجاني للطرق فوق 10 كجم' : 'Free insurance for packages over 10kg'}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                {isRTL ? 'تأمين الشحن السريع مشمول تلقائياً' : 'Express shipping insurance included automatically'}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                {isRTL ? 'تغطية تصل إلى 5000 دولار' : 'Coverage up to $5,000'}
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                {isRTL ? 'تعويض سريع خلال 3-5 أيام عمل' : 'Fast claim processing in 3-5 business days'}
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/50">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">{isRTL ? 'هل تعلم؟' : 'Did you know?'}</p>
            <p>
              {isRTL
                ? 'نكسا مارت تستخدم نظام دفع الضمان (Escrow) — لا يتم إطلاق أموالك للبائع إلا بعد تأكيد استلام الشحنة. هذا يضمن حمايتك الكاملة.'
                : 'NexaMart uses an Escrow payment system — your funds are only released to the seller after you confirm delivery. This ensures full protection.'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl" dir={isRTL ? 'rtl' : 'ltr'}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50">
          <TabsTrigger value="calculator" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Calculator className="size-4" />
            <span className="hidden sm:inline">{isRTL ? 'حاسبة الشحن' : t('shippingCalculator')}</span>
            <span className="sm:hidden">{isRTL ? 'حاسبة' : 'Calc'}</span>
          </TabsTrigger>
          <TabsTrigger value="shipments" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Truck className="size-4" />
            <span className="hidden sm:inline">{isRTL ? 'شحناتي' : t('myShipments')}</span>
            <span className="sm:hidden">{isRTL ? 'شحنات' : 'Ship'}</span>
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <FileText className="size-4" />
            <span className="hidden sm:inline">{isRTL ? 'سياسات الشحن' : t('shippingPolicies')}</span>
            <span className="sm:hidden">{isRTL ? 'سياسات' : 'Policies'}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          {renderCalculator()}
        </TabsContent>

        <TabsContent value="shipments">
          {renderShipments()}
        </TabsContent>

        <TabsContent value="policies">
          {renderPolicies()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
