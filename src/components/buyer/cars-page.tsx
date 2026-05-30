'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Car, Search, SlidersHorizontal, Grid3X3, List, Heart, Phone,
  BadgeCheck, MapPin, ChevronDown, Fuel, Gauge, Settings2,
  Palette, Calendar, Tag, Star, ArrowRight, ArrowLeft, X,
  Zap, Plus, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import {
  CAR_MAKES, CAR_MAKE_MODELS, FUEL_TYPES, TRANSMISSIONS,
  BODY_TYPES, CAR_CONDITIONS, CAR_COLORS, BODY_TYPE_GRADIENTS,
} from '@/lib/reference-data';

// --- Types ---
// Matches the actual API response from /api/cars
interface CarListing {
  id: string;
  title: string;
  titleAr: string | null;
  make: string;
  model: string;
  year: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  condition: string; // 'new' | 'used' (lowercase from API)
  color: string;
  price: number;
  city: string;
  images: string[]; // parsed JSON array from API
  sellerName: string;
  isFeatured: boolean;
  description: string;
  descriptionAr: string | null;
  views: number;
  createdAt: string;
}

// Reference data imported from centralized file
// CAR_MAKES, CAR_MAKE_MODELS, FUEL_TYPES, TRANSMISSIONS, BODY_TYPES,
// CAR_CONDITIONS, CAR_COLORS, BODY_TYPE_GRADIENTS

function getCarGradient(car: CarListing): string {
  return BODY_TYPE_GRADIENTS[car.bodyType] || 'from-slate-500 to-gray-600';
}

// Display label helpers for API values
function getFuelTypeLabel(value: string, isRTL: boolean): string {
  const ft = FUEL_TYPES.find(f => f.value === value);
  if (ft) return isRTL ? ft.labelAr : ft.label;
  return value;
}

function getTransmissionLabel(value: string, isRTL: boolean): string {
  const tr = TRANSMISSIONS.find(t => t.value === value);
  if (tr) return isRTL ? tr.labelAr : tr.label;
  return value;
}

function getBodyTypeLabel(value: string, isRTL: boolean): string {
  const bt = BODY_TYPES.find(b => b.value === value);
  if (bt) return isRTL ? bt.labelAr : bt.label;
  return value;
}

function getConditionLabel(value: string, isRTL: boolean): string {
  const c = CAR_CONDITIONS.find(cond => cond.value === value);
  if (c) return isRTL ? c.labelAr : c.label;
  return value;
}

// --- Filter State ---
interface CarFilters {
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  mileageFrom: number;
  mileageTo: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  condition: string;
  priceFrom: number;
  priceTo: number;
  color: string;
}

const DEFAULT_FILTERS: CarFilters = {
  make: 'all',
  model: 'all',
  yearFrom: 2010,
  yearTo: 2025,
  mileageFrom: 0,
  mileageTo: 200000,
  fuelType: 'all',
  transmission: 'all',
  bodyType: 'all',
  condition: 'all',
  priceFrom: 0,
  priceTo: 200000,
  color: 'all',
};

type SortOption = 'price-asc' | 'price-desc' | 'newest' | 'mileage-asc';

// --- Car Card Component ---
function CarCard({ car, locale, isListView }: { car: CarListing; locale: string; isListView: boolean }) {
  const { t } = useI18n();
  const isRTL = locale === 'ar';
  const [isFavorited, setIsFavorited] = useState(false);
  const [heartBounce, setHeartBounce] = useState(false);

  const gradient = getCarGradient(car);
  const firstImage = car.images && car.images.length > 0 ? car.images[0] : null;

  // Display name: use titleAr for RTL if available, otherwise compose from make+model
  const displayName = isRTL
    ? (car.titleAr || `${car.make} ${car.model}`)
    : `${car.make} ${car.model}`;

  const displayFuel = getFuelTypeLabel(car.fuelType, isRTL);
  const displayTransmission = getTransmissionLabel(car.transmission, isRTL);
  const displayBodyType = getBodyTypeLabel(car.bodyType, isRTL);
  const displayCondition = getConditionLabel(car.condition, isRTL);
  const displayColor = car.color;
  const displayLocation = car.city;
  const displaySeller = car.sellerName;
  const displayDesc = isRTL ? (car.descriptionAr || car.description) : car.description;

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    setHeartBounce(true);
    setTimeout(() => setHeartBounce(false), 400);
  };

  const imageSection = (
    <div className={`relative w-full aspect-[4/3] bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
      {firstImage ? (
        <img
          src={firstImage}
          alt={displayName}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            const img = e.currentTarget;
            if (!img.dataset.retried) {
              img.dataset.retried = 'true';
              img.style.display = 'none';
              const placeholder = img.nextElementSibling as HTMLElement;
              if (placeholder) placeholder.style.display = 'flex';
            }
          }}
        />
      ) : null}
      {/* Gradient placeholder with brand initial */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center ${firstImage ? 'hidden' : ''}`}>
        <span className="text-4xl font-bold text-white/30 select-none">{car.make.charAt(0)}</span>
        <Car className="size-8 text-white/20 mt-1" />
      </div>
      {/* Bottom gradient overlay for readability */}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      {/* Badges */}
      <div className="absolute top-2 start-2 flex flex-col gap-1 z-10">
        {car.isFeatured && (
          <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] px-2 py-0.5 font-semibold shadow-sm shimmer-bg">
            <Zap className="size-2.5 me-0.5" />
            {t('featured')}
          </Badge>
        )}
        {car.condition === 'new' && (
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] px-2 py-0.5 font-semibold shimmer-bg">
            {t('new')}
          </Badge>
        )}
      </div>
      {/* Favorite button */}
      <button
        className={`absolute top-2 ${isRTL ? 'left-2' : 'right-2'} z-10 size-8 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-gray-700 transition-all duration-300`}
        onClick={handleFavorite}
        aria-label={t('cars_favorite')}
      >
        <Heart className={`size-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-500'} ${heartBounce ? 'animate-heart-bounce' : ''} transition-all duration-200`} />
      </button>
    </div>
  );

  if (isListView) {
    return (
      <div className="bg-card/80 border border-border/60 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 flex flex-col sm:flex-row group backdrop-blur-md hover:-translate-y-0.5">
        {/* Image */}
        <div className={`relative w-full sm:w-64 h-48 sm:h-auto bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 overflow-hidden`}>
          {firstImage ? (
            <img
              src={firstImage}
              alt={displayName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                const img = e.currentTarget;
                if (!img.dataset.retried) {
                  img.dataset.retried = 'true';
                  img.style.display = 'none';
                  const placeholder = img.nextElementSibling as HTMLElement;
                  if (placeholder) placeholder.style.display = 'flex';
                }
              }}
            />
          ) : null}
          {/* Gradient placeholder with brand initial */}
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center ${firstImage ? 'hidden' : ''}`}>
            <span className="text-3xl font-bold text-white/30 select-none">{car.make.charAt(0)}</span>
            <Car className="size-6 text-white/20 mt-1" />
          </div>
          {car.isFeatured && (
            <Badge className="absolute top-2 start-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] px-2 py-0.5 font-semibold shadow-sm">
              <Zap className="size-2.5 me-0.5" />
              {t('featured')}
            </Badge>
          )}
          {car.condition === 'new' && (
            <Badge className="absolute top-2 end-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] px-2 py-0.5 font-semibold">
              {t('new')}
            </Badge>
          )}
        </div>
        {/* Content */}
        <div className="flex-1 p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-bold text-lg">{displayName}</h3>
              {displayDesc && <p className="text-sm text-muted-foreground line-clamp-1">{displayDesc}</p>}
            </div>
            <Button variant="ghost" size="icon" className="shrink-0" onClick={handleFavorite}>
              <Heart className={`size-5 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-muted-foreground'} ${heartBounce ? 'animate-heart-bounce' : ''}`} />
            </Button>
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(car.price)}</div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5"><Calendar className="size-2.5 me-0.5" />{car.year}</Badge>
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5"><Gauge className="size-2.5 me-0.5" />{car.mileage.toLocaleString()} {t('cars_km')}</Badge>
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5"><Fuel className="size-2.5 me-0.5" />{displayFuel}</Badge>
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5"><Settings2 className="size-2.5 me-0.5" />{displayTransmission}</Badge>
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5"><Car className="size-2.5 me-0.5" />{displayBodyType}</Badge>
            {car.color && <Badge variant="secondary" className="text-[10px] px-2 py-0.5"><Palette className="size-2.5 me-0.5" />{displayColor}</Badge>}
            <Badge variant="secondary" className="text-[10px] px-2 py-0.5"><Tag className="size-2.5 me-0.5" />{displayCondition}</Badge>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">{displayLocation}</span>
              {displaySeller && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{displaySeller}</span>
                </>
              )}
            </div>
            <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-1 shadow-md shadow-emerald-500/20">
              <Phone className="size-3" />
              {t('cars_call')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Grid card
  return (
    <div className="group bg-card/80 border border-border/60 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] flex flex-col relative backdrop-blur-md">
      {imageSection}

      {/* Content */}
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        {/* Price - prominent */}
        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(car.price)}</div>

        {/* Name */}
        <h3 className="text-sm font-semibold leading-tight line-clamp-1">{displayName}</h3>

        {/* Spec badges */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5"><Calendar className="size-2.5 me-0.5" />{car.year}</Badge>
          <Badge className={`text-[9px] px-1.5 py-0.5 font-semibold ${car.mileage > 100000 ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'}`}><Gauge className="size-2.5 me-0.5" />{(car.mileage / 1000).toFixed(0)}K {t('cars_km')}</Badge>
          <Badge className="text-[9px] px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 font-semibold"><Fuel className="size-2.5 me-0.5" />{displayFuel}</Badge>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0.5"><Settings2 className="size-2.5 me-0.5" />{displayTransmission}</Badge>
          <Badge className={`text-[9px] px-1.5 py-0.5 font-semibold ${car.condition === 'new' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'}`}>{displayCondition}</Badge>
        </div>

        {/* Location + Seller */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0 text-emerald-500" />
          <span className="truncate">{displayLocation}</span>
          {displaySeller && (
            <>
              <span>·</span>
              <span className="truncate">{displaySeller}</span>
            </>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Phone button with gradient */}
        <Button size="sm" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-1.5 text-xs h-9 rounded-lg transition-all duration-300 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5">
          <Phone className="size-3.5" />
          {t('cars_callSeller')}
        </Button>
      </div>
    </div>
  );
}

// --- Filter Panel ---
function FilterPanel({
  filters, setFilters, locale, isMobile,
}: {
  filters: CarFilters;
  setFilters: React.Dispatch<React.SetStateAction<CarFilters>>;
  locale: string;
  isMobile?: boolean;
}) {
  const { t } = useI18n();
  const isRTL = locale === 'ar';
  const availableModels = filters.make !== 'all' ? CAR_MAKE_MODELS[filters.make] || [] : [];

  const updateFilter = (key: keyof CarFilters, value: string | number) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'make') next.model = 'all';
      return next;
    });
  };

  const clearFilters = () => setFilters(DEFAULT_FILTERS);

  const content = (
    <div className="space-y-4">
      {/* Make */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('make')}</label>
        <Select value={filters.make} onValueChange={v => updateFilter('make', v)}>
          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('cars_allMakes')}</SelectItem>
            {CAR_MAKES.map(m => (
              <SelectItem key={m.value} value={m.value}>{isRTL ? m.labelAr : m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('model')}</label>
        <Select value={filters.model} onValueChange={v => updateFilter('model', v)} disabled={filters.make === 'all'}>
          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('cars_allModels')}</SelectItem>
            {availableModels.map(m => (
              <SelectItem key={m.value} value={m.value}>{isRTL ? m.labelAr : m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Year range */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('year')}</label>
        <div className="flex gap-2">
          <Select value={String(filters.yearFrom)} onValueChange={v => updateFilter('yearFrom', Number(v))}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 16 }, (_, i) => 2010 + i).reverse().map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="self-center text-xs text-muted-foreground">—</span>
          <Select value={String(filters.yearTo)} onValueChange={v => updateFilter('yearTo', Number(v))}>
            <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 16 }, (_, i) => 2010 + i).reverse().map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mileage range */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('mileage')}</label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={t('cars_from')}
            value={filters.mileageFrom || ''}
            onChange={e => updateFilter('mileageFrom', Number(e.target.value) || 0)}
            className="h-9 text-xs"
          />
          <Input
            type="number"
            placeholder={t('cars_to')}
            value={filters.mileageTo === 200000 ? '' : filters.mileageTo}
            onChange={e => updateFilter('mileageTo', Number(e.target.value) || 200000)}
            className="h-9 text-xs"
          />
        </div>
      </div>

      {/* Fuel Type */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('fuelType')}</label>
        <Select value={filters.fuelType} onValueChange={v => updateFilter('fuelType', v)}>
          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('cars_all')}</SelectItem>
            {FUEL_TYPES.map(f => (
              <SelectItem key={f.value} value={f.value}>{isRTL ? f.labelAr : f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transmission */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('transmission')}</label>
        <Select value={filters.transmission} onValueChange={v => updateFilter('transmission', v)}>
          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('cars_all')}</SelectItem>
            {TRANSMISSIONS.map(tr => (
              <SelectItem key={tr.value} value={tr.value}>{isRTL ? tr.labelAr : tr.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Body Type */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('bodyType')}</label>
        <Select value={filters.bodyType} onValueChange={v => updateFilter('bodyType', v)}>
          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('cars_all')}</SelectItem>
            {BODY_TYPES.map(b => (
              <SelectItem key={b.value} value={b.value}>{isRTL ? b.labelAr : b.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Condition */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('carCondition')}</label>
        <Select value={filters.condition} onValueChange={v => updateFilter('condition', v)}>
          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('cars_all')}</SelectItem>
            {CAR_CONDITIONS.map(c => (
              <SelectItem key={c.value} value={c.value}>{isRTL ? c.labelAr : c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price range */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('priceRange')}</label>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={t('cars_from')}
            value={filters.priceFrom || ''}
            onChange={e => updateFilter('priceFrom', Number(e.target.value) || 0)}
            className="h-9 text-xs"
          />
          <Input
            type="number"
            placeholder={t('cars_to')}
            value={filters.priceTo === 200000 ? '' : filters.priceTo}
            onChange={e => updateFilter('priceTo', Number(e.target.value) || 200000)}
            className="h-9 text-xs"
          />
        </div>
      </div>

      {/* Color */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t('color')}</label>
        <Select value={filters.color} onValueChange={v => updateFilter('color', v)}>
          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('cars_all')}</SelectItem>
            {CAR_COLORS.map(c => (
              <SelectItem key={c.value} value={c.value}>{isRTL ? c.labelAr : c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
        {t('clearFilters')}
      </Button>
    </div>
  );

  if (isMobile) {
    return content;
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <SlidersHorizontal className="size-4 text-emerald-600" />
          {t('filter')}
        </h3>
      </div>
      <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
        {content}
      </div>
    </div>
  );
}

// --- Make quick-filter pills ---
function MakePills({ selected, onSelect, locale }: { selected: string; onSelect: (make: string) => void; locale: string }) {
  const { t } = useI18n();
  const isRTL = locale === 'ar';
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
      <button
        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 shrink-0 ${
          selected === 'all'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'bg-muted/50 text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-300'
        }`}
        onClick={() => onSelect('all')}
      >
        {t('cars_all')}
      </button>
      {CAR_MAKES.map(m => (
        <button
          key={m.value}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 shrink-0 ${
            selected === m.value
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-muted/50 text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-300'
          }`}
          onClick={() => onSelect(m.value)}
        >
          {isRTL ? m.labelAr : m.label}
        </button>
      ))}
    </div>
  );
}

// --- Main CarsPage ---
export function CarsPage() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const [cars, setCars] = useState<CarListing[]>([]);
  const [carsLoading, setCarsLoading] = useState(true);
  const [filters, setFilters] = useState<CarFilters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCars = async () => {
      setCarsLoading(true);
      try {
        const res = await fetch('/api/cars');
        if (res.ok) {
          const data = await res.json();
          setCars(Array.isArray(data) ? data : data.cars || []);
        } else {
          setCars([]);
        }
      } catch {
        setCars([]);
      } finally {
        setCarsLoading(false);
      }
    };
    fetchCars();
  }, []);

  // Apply quick make filter from pills
  const handleMakePillSelect = useCallback((make: string) => {
    setFilters(prev => ({ ...prev, make, model: 'all' }));
  }, []);

  // Filter and sort
  const filteredCars = useMemo(() => {
    let result = cars.filter(car => {
      if (filters.make !== 'all' && car.make !== filters.make) return false;
      if (filters.model !== 'all' && car.model !== filters.model) return false;
      if (car.year < filters.yearFrom || car.year > filters.yearTo) return false;
      if (car.mileage < filters.mileageFrom || car.mileage > filters.mileageTo) return false;
      if (filters.fuelType !== 'all' && car.fuelType !== filters.fuelType) return false;
      if (filters.transmission !== 'all' && car.transmission !== filters.transmission) return false;
      if (filters.bodyType !== 'all' && car.bodyType !== filters.bodyType) return false;
      if (filters.condition !== 'all' && car.condition !== filters.condition) return false;
      if (car.price < filters.priceFrom || car.price > filters.priceTo) return false;
      if (filters.color !== 'all' && car.color !== filters.color) return false;
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          car.make.toLowerCase().includes(q) ||
          car.model.toLowerCase().includes(q) ||
          car.title.toLowerCase().includes(q) ||
          (car.titleAr && car.titleAr.includes(q)) ||
          car.city.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => b.year - a.year);
        break;
      case 'mileage-asc':
        result.sort((a, b) => a.mileage - b.mileage);
        break;
    }

    // Featured first
    result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

    return result;
  }, [cars, filters, sortBy, searchQuery]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.make !== 'all') count++;
    if (filters.model !== 'all') count++;
    if (filters.yearFrom !== 2010 || filters.yearTo !== 2025) count++;
    if (filters.mileageFrom !== 0 || filters.mileageTo !== 200000) count++;
    if (filters.fuelType !== 'all') count++;
    if (filters.transmission !== 'all') count++;
    if (filters.bodyType !== 'all') count++;
    if (filters.condition !== 'all') count++;
    if (filters.priceFrom !== 0 || filters.priceTo !== 200000) count++;
    if (filters.color !== 'all') count++;
    return count;
  }, [filters]);

  // Loading state
  if (carsLoading) {
    return (
      <div className="min-h-screen overflow-x-hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="h-48 rounded-2xl bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-cyan-600/20 animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden border-0 shadow-sm">
                <div className="aspect-[4/3] bg-gradient-to-br from-emerald-100/50 to-teal-100/50 dark:from-emerald-950/30 dark:to-teal-950/30 animate-pulse" />
                <CardContent className="p-3 space-y-2">
                  <div className="h-4 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-950/50 dark:to-teal-950/50 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (cars.length === 0 && !carsLoading) {
    return (
      <div className="min-h-screen overflow-x-hidden">
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <div className="size-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 flex items-center justify-center mb-4">
            <Car className="size-10 text-emerald-500" />
          </div>
          <p className="text-lg font-medium">{t('noResults')}</p>
          <p className="text-sm">{t('cars_noCarsAvailable')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-600 text-white">
        {/* Mesh gradient overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 end-0 w-96 h-96 rounded-full bg-white/10 blur-3xl -translate-y-1/3" />
          <div className="absolute bottom-0 start-0 w-72 h-72 rounded-full bg-white/10 blur-3xl translate-y-1/3" />
          <div className="absolute top-1/3 end-1/4 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-1/4 start-1/3 w-24 h-24 rounded-full bg-cyan-300/10 blur-2xl" />
        </div>
        <div className="container mx-auto px-4 py-10 md:py-16 relative z-10">
          {/* Car silhouette SVG */}
          <div className="absolute end-8 bottom-0 hidden lg:block opacity-10">
            <svg width="280" height="120" viewBox="0 0 280 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 80 C40 80, 60 50, 100 45 C140 40, 180 40, 220 45 C250 48, 265 60, 270 75 L275 85 C275 85, 278 95, 270 95 L240 95 C235 85, 225 80, 210 80 C195 80, 185 85, 180 95 L110 95 C105 85, 95 80, 80 80 C65 80, 55 85, 50 95 L20 95 C12 95, 10 88, 15 82 L25 75 C28 70, 35 80, 40 80Z" fill="white" />
              <circle cx="80" cy="95" r="14" fill="white" opacity="0.5" />
              <circle cx="80" cy="95" r="8" fill="rgba(255,255,255,0.3)" />
              <circle cx="210" cy="95" r="14" fill="white" opacity="0.5" />
              <circle cx="210" cy="95" r="8" fill="rgba(255,255,255,0.3)" />
              <rect x="95" y="52" width="80" height="20" rx="4" fill="white" opacity="0.3" />
              <path d="M70 65 L95 52 L105 52 L95 65 Z" fill="white" opacity="0.4" />
              <path d="M180 52 L195 65 L210 65 L195 52 Z" fill="white" opacity="0.4" />
            </svg>
          </div>

          <div className="relative max-w-2xl space-y-4 z-10">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium">
              <Car className="size-4" />
              NexaMart {t('cars_autos')}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-100 to-white">{t('findYourDreamCar')}</span>
            </h1>
            <p className="text-base md:text-lg text-white/80 max-w-lg">
              {t('carsForSale')}
            </p>
            {/* Search bar with glassmorphism */}
            <div className="flex items-center max-w-lg mt-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5 gap-1.5">
              <div className="relative flex-1">
                <Search className={`absolute top-1/2 -translate-y-1/2 size-4 text-white/60 ${isRTL ? 'right-4' : 'left-4'}`} />
                <Input
                  type="text"
                  placeholder={t('cars_searchCar')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={`${isRTL ? 'pe-3 ps-11' : 'ps-11 pe-3'} h-12 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/60 focus-visible:border-white/50 focus-visible:ring-white/20 rounded-lg`}
                />
              </div>
              <Button className="bg-white text-emerald-700 hover:bg-white/90 h-11 px-6 rounded-lg font-semibold shrink-0 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5">
                {t('prop_search')}
              </Button>
            </div>
            {/* Stats */}
            <div className="flex items-center gap-6 mt-4 text-sm">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
                <span className="text-xl font-bold block">{cars.length}</span>
                <span className="text-white/70 text-xs">{t('cars_carsCount')}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10">
                <span className="text-xl font-bold block">{cars.filter(c => c.condition === 'new').length}</span>
                <span className="text-white/70 text-xs">{t('new')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Make Quick Filter Pills with brand icons */}
      <section className="container mx-auto px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
          <button
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 ${
              filters.make === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-muted/50 text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-300'
            }`}
            onClick={() => handleMakePillSelect('all')}
          >
            {t('cars_all')}
          </button>
          {CAR_MAKES.map(m => (
            <button
              key={m.value}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-300 flex items-center gap-1.5 ${
                filters.make === m.value
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-300'
              }`}
              onClick={() => handleMakePillSelect(m.value)}
            >
              <span className="size-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-[8px] font-bold text-gray-700 dark:text-gray-300 shrink-0">{m.value.charAt(0)}</span>
              {isRTL ? m.labelAr : m.label}
            </button>
          ))}
        </div>
      </section>

      <div className="container mx-auto px-4">
        <div className="flex gap-6">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-72 shrink-0">
            <FilterPanel filters={filters} setFilters={setFilters} locale={locale} />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {filteredCars.length} {t('cars_carsCount')}
                </span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {activeFilterCount} {t('cars_filters')}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Sort */}
                <Select value={sortBy} onValueChange={v => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-40 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price-asc">{t('priceLowHigh')}</SelectItem>
                    <SelectItem value="price-desc">{t('priceHighLow')}</SelectItem>
                    <SelectItem value="newest">{t('newest')}</SelectItem>
                    <SelectItem value="mileage-asc">{t('cars_lowestMileage')}</SelectItem>
                  </SelectContent>
                </Select>

                {/* View toggle */}
                <div className="flex items-center border border-border rounded-lg overflow-hidden">
                  <button
                    className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600' : 'text-muted-foreground hover:bg-muted/50'}`}
                    onClick={() => setViewMode('grid')}
                    aria-label={t('gridView')}
                  >
                    <Grid3X3 className="size-4" />
                  </button>
                  <button
                    className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600' : 'text-muted-foreground hover:bg-muted/50'}`}
                    onClick={() => setViewMode('list')}
                    aria-label={t('listView')}
                  >
                    <List className="size-4" />
                  </button>
                </div>

                {/* Mobile filter button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden gap-1.5">
                      <SlidersHorizontal className="size-3.5" />
                      {t('filter')}
                      {activeFilterCount > 0 && (
                        <Badge className="size-5 p-0 flex items-center justify-center text-[10px] bg-emerald-600 text-white border-0">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side={isRTL ? 'right' : 'left'} className="w-80 overflow-y-auto">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <SlidersHorizontal className="size-4 text-emerald-600" />
                        {t('filter')}
                      </SheetTitle>
                    </SheetHeader>
                    <Separator className="my-4" />
                    <FilterPanel filters={filters} setFilters={setFilters} locale={locale} isMobile />
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Results */}
            {filteredCars.length === 0 ? (
              <div className="text-center py-16">
                <div className="size-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/40 dark:to-teal-950/40 flex items-center justify-center mb-4">
                  <Car className="size-10 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{t('noResults')}</h3>
                <p className="text-sm text-muted-foreground">
                  {t('cars_tryAdjusting')}
                </p>
                <Button variant="outline" className="mt-4 border-emerald-300 dark:border-emerald-700 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  {t('clearFilters')}
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCars.map(car => (
                  <CarCard key={car.id} car={car} locale={locale} isListView={false} />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCars.map(car => (
                  <CarCard key={car.id} car={car} locale={locale} isListView={true} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Your Car CTA */}
      <section className="container mx-auto px-4 pb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 md:p-8 shadow-xl shadow-emerald-500/20">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 end-0 w-48 h-48 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-0 start-0 w-36 h-36 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-cyan-300/10 blur-3xl" />
          </div>
          <div className="relative flex flex-col md:flex-row items-center gap-4 z-10">
            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 border border-white/20 shadow-lg shadow-white/5">
              <Plus className="size-7" />
            </div>
            <div className="flex-1 text-center md:text-start">
              <h3 className="font-bold text-lg text-white">{t('cars_postYourCar')}</h3>
              <p className="text-sm text-white/80">{t('cars_postYourCarDesc')}</p>
            </div>
            <Button className="bg-white text-emerald-700 hover:bg-white/90 rounded-full px-6 font-semibold shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-900/20">
              {t('postNow')}
              <ChevronRight className={`size-4 ${isRTL ? 'rotate-180' : ''} ms-1`} />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
