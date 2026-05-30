'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Camera,
  Smartphone,
  Shirt,
  Home,
  Sparkles,
  Gamepad2,
  Car,
  Dumbbell,
  BookOpen,
  Baby,
  Palette,
  Dog,
  Briefcase,
  Pill,
  GraduationCap,
  Utensils,
  MapPin,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { CLASSIFIEDS_CATEGORIES, CLASSIFIEDS_CITIES } from '@/lib/reference-data';

// Map string icon names from reference data to actual Lucide components
const iconMap: Record<string, React.ElementType> = {
  Smartphone, Shirt, Home, Sparkles, Gamepad2, Car, Dumbbell, BookOpen, Baby, Palette, Dog, Briefcase, Pill, GraduationCap, Utensils,
};

const categories = CLASSIFIEDS_CATEGORIES.map(c => ({ ...c, icon: iconMap[c.icon] || Smartphone }));
const cities = CLASSIFIEDS_CITIES;

interface AdFormData {
  category: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  price: string;
  condition: string;
  location: string;
  phone: string;
  photos: string[];
}

export function QuickPostPage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const isRTL = locale === 'ar';

  const [step, setStep] = useState(1);
  const [published, setPublished] = useState(false);
  const [formData, setFormData] = useState<AdFormData>({
    category: '',
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    price: '',
    condition: 'new',
    location: '',
    phone: '',
    photos: [],
  });

  const updateField = (field: keyof AdFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceedStep1 = formData.category !== '';
  const canProceedStep2 = formData.title.trim() !== '' && formData.price !== '' && formData.phone !== '';

  const handlePublish = async () => {
    try {
      await fetch('/api/classifieds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
    } catch {
      // Mock - still show success
    }
    setPublished(true);
  };

  const BackIcon = isRTL ? ChevronRight : ArrowLeft;
  const NextIcon = isRTL ? ArrowLeft : ArrowRight;

  // Published success screen
  if (published) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-6">
            <Check className="size-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">{t('adPublished')}</h2>
          <p className="text-muted-foreground mb-6">
            {isRTL ? 'سيظهر إعلانك للمستخدمين قريباً' : 'Your ad will be visible to users soon'}
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => nav.setView('home')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {t('home')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setPublished(false);
                setStep(1);
                setFormData({
                  category: '',
                  title: '',
                  titleAr: '',
                  description: '',
                  descriptionAr: '',
                  price: '',
                  condition: 'new',
                  location: '',
                  phone: '',
                  photos: [],
                });
              }}
            >
              {isRTL ? 'أعلن مرة أخرى' : 'Post Another Ad'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => nav.setView('home')}>
          <BackIcon className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{t('postFreeAd')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('stepOf').replace('{current}', String(step)).replace('{total}', '3')}
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <button
              onClick={() => {
                if (s === 1) setStep(1);
                if (s === 2 && canProceedStep1) setStep(2);
                if (s === 3 && canProceedStep1 && canProceedStep2) setStep(3);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                step === s
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                  : step > s
                  ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {step > s ? <Check className="size-3.5" /> : <span>{s}</span>}
              <span className="hidden sm:inline">
                {s === 1 ? t('selectCategory') : s === 2 ? t('adDetails') : t('reviewPublish')}
              </span>
            </button>
            {s < 3 && (
              <div className={`flex-1 h-0.5 rounded ${step > s ? 'bg-emerald-500' : 'bg-muted'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Category Selection */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h2 className="text-lg font-semibold mb-4">{t('selectCategory')}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = formData.category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => updateField('category', cat.id)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 shadow-md shadow-emerald-500/10'
                      : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                    <Icon className="size-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">
                    {isRTL ? cat.nameAr : cat.id}
                  </span>
                  {isSelected && (
                    <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0">
                      <Check className="size-2.5" />
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end mt-6">
            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {t('next')}
              <NextIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Ad Details */}
      {step === 2 && (
        <div className="animate-fade-in space-y-5">
          <h2 className="text-lg font-semibold">{t('adDetails')}</h2>

          {/* Title EN */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('adTitle')} (English) <span className="text-red-500">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g. iPhone 14 Pro Max 256GB"
              className="input-emerald"
            />
          </div>

          {/* Title AR */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('adTitle')} (العربية)
            </label>
            <Input
              value={formData.titleAr}
              onChange={(e) => updateField('titleAr', e.target.value)}
              placeholder="مثال: آيفون 14 برو ماكس 256 جيجا"
              dir="rtl"
              className="input-emerald"
            />
          </div>

          {/* Description EN */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('adDescription')} (English)
            </label>
            <Textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Describe your item in detail..."
              rows={3}
              className="input-emerald resize-none"
            />
          </div>

          {/* Description AR */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('adDescription')} (العربية)
            </label>
            <Textarea
              value={formData.descriptionAr}
              onChange={(e) => updateField('descriptionAr', e.target.value)}
              placeholder="صف المنتج بالتفصيل..."
              rows={3}
              dir="rtl"
              className="input-emerald resize-none"
            />
          </div>

          {/* Price & Condition row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {t('price')} ($) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => updateField('price', e.target.value)}
                placeholder="0"
                min="0"
                className="input-emerald"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {t('itemCondition')} <span className="text-red-500">*</span>
              </label>
              <Select value={formData.condition} onValueChange={(v) => updateField('condition', v)}>
                <SelectTrigger className="input-emerald">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">{t('newCondition')}</SelectItem>
                  <SelectItem value="used">{t('usedCondition')}</SelectItem>
                  <SelectItem value="refurbished">{t('refurbishedCondition')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('adLocation')}
            </label>
            <Select value={formData.location} onValueChange={(v) => updateField('location', v)}>
              <SelectTrigger className="input-emerald">
                <SelectValue placeholder={isRTL ? 'اختر المدينة' : 'Select city'} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.id}>
                    {isRTL ? city.nameAr : city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('contactPhone')} <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+971 50 123 4567"
              className="input-emerald"
            />
          </div>

          {/* Photo Upload Placeholders */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {t('uploadPhotos')}
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4].map((idx) => (
                <button
                  key={idx}
                  className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-emerald-400 dark:hover:border-emerald-600 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors bg-muted/30"
                >
                  <Camera className="size-5" />
                  {idx === 0 && (
                    <span className="text-[9px] font-medium">
                      {isRTL ? 'رئيسية' : 'Main'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <BackIcon className="size-4" />
              {t('back')}
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {t('next')}
              <NextIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Publish */}
      {step === 3 && (
        <div className="animate-fade-in space-y-5">
          <h2 className="text-lg font-semibold">{t('reviewPublish')}</h2>

          {/* Category */}
          <Card className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const cat = categories.find((c) => c.id === formData.category);
                    if (!cat) return null;
                    const Icon = cat.icon;
                    return (
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                        <Icon className="size-5 text-white" />
                      </div>
                    );
                  })()}
                  <div>
                    <p className="text-xs text-muted-foreground">{t('selectCategory')}</p>
                    <p className="font-medium">
                      {isRTL
                        ? categories.find((c) => c.id === formData.category)?.nameAr || formData.category
                        : formData.category}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-emerald-600 gap-1">
                  <Pencil className="size-3" />
                  {t('editStep')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="overflow-hidden">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{t('adDetails')}</p>
                <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-emerald-600 gap-1">
                  <Pencil className="size-3" />
                  {t('editStep')}
                </Button>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t('adTitle')}</p>
                  <p className="font-medium">{formData.title || '—'}</p>
                  {formData.titleAr && (
                    <p className="text-sm text-muted-foreground" dir="rtl">{formData.titleAr}</p>
                  )}
                </div>

                {(formData.description || formData.descriptionAr) && (
                  <div>
                    <p className="text-xs text-muted-foreground">{t('adDescription')}</p>
                    <p className="text-sm">{formData.description || formData.descriptionAr}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('price')}</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">${formData.price || '0'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('itemCondition')}</p>
                    <Badge variant="secondary" className={
                      formData.condition === 'new'
                        ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                        : formData.condition === 'used'
                        ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300'
                        : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                    }>
                      {formData.condition === 'new'
                        ? t('newCondition')
                        : formData.condition === 'used'
                        ? t('usedCondition')
                        : t('refurbishedCondition')}
                    </Badge>
                  </div>
                  {formData.location && (
                    <div>
                      <p className="text-xs text-muted-foreground">{t('adLocation')}</p>
                      <p className="text-sm flex items-center gap-1">
                        <MapPin className="size-3" />
                        {isRTL
                          ? cities.find((c) => c.id === formData.location)?.nameAr || formData.location
                          : cities.find((c) => c.id === formData.location)?.name || formData.location}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">{t('contactPhone')}</p>
                  <p className="text-sm font-medium">{formData.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
              <BackIcon className="size-4" />
              {t('back')}
            </Button>
            <Button
              onClick={handlePublish}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 px-8"
            >
              <Check className="size-4" />
              {t('publishAd')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
