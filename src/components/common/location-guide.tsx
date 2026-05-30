'use client';

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Navigation,
  ChevronRight,
  Search,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { LS_KEYS } from '@/lib/config';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';

interface CityData {
  id: string;
  nameEn: string;
  nameAr: string;
  countryFlag: string;
  popular: boolean;
}

const cities: CityData[] = [
  { id: 'amman', nameEn: 'Amman', nameAr: 'عمّان', countryFlag: '🇯🇴', popular: true },
  { id: 'dubai', nameEn: 'Dubai', nameAr: 'دبي', countryFlag: '🇦🇪', popular: true },
  { id: 'riyadh', nameEn: 'Riyadh', nameAr: 'الرياض', countryFlag: '🇸🇦', popular: true },
  { id: 'baghdad', nameEn: 'Baghdad', nameAr: 'بغداد', countryFlag: '🇮🇶', popular: false },
  { id: 'cairo', nameEn: 'Cairo', nameAr: 'القاهرة', countryFlag: '🇪🇬', popular: true },
  { id: 'kuwait-city', nameEn: 'Kuwait City', nameAr: 'مدينة الكويت', countryFlag: '🇰🇼', popular: false },
  { id: 'manama', nameEn: 'Manama', nameAr: 'المنامة', countryFlag: '🇧🇭', popular: false },
  { id: 'muscat', nameEn: 'Muscat', nameAr: 'مسقط', countryFlag: '🇴🇲', popular: false },
  { id: 'doha', nameEn: 'Doha', nameAr: 'الدوحة', countryFlag: '🇶🇦', popular: false },
  { id: 'beirut', nameEn: 'Beirut', nameAr: 'بيروت', countryFlag: '🇱🇧', popular: false },
  { id: 'casablanca', nameEn: 'Casablanca', nameAr: 'الدار البيضاء', countryFlag: '🇲🇦', popular: false },
  { id: 'algiers', nameEn: 'Algiers', nameAr: 'الجزائر العاصمة', countryFlag: '🇩🇿', popular: false },
  { id: 'tunis', nameEn: 'Tunis', nameAr: 'تونس العاصمة', countryFlag: '🇹🇳', popular: false },
  { id: 'jeddah', nameEn: 'Jeddah', nameAr: 'جدة', countryFlag: '🇸🇦', popular: true },
  { id: 'abu-dhabi', nameEn: 'Abu Dhabi', nameAr: 'أبو ظبي', countryFlag: '🇦🇪', popular: false },
];

const STORAGE_KEY = LS_KEYS.selectedCity;

export function LocationGuide() {
  const { dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const nav = useAppNavigation();

  const [selectedCity, setSelectedCity] = useState<CityData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const found = cities.find(c => c.id === saved);
        if (found) return found;
      }
    } catch {
      // localStorage not available
    }
    return cities[0];
  });
  const [searchCity, setSearchCity] = useState('');
  const [nearMeLoading, setNearMeLoading] = useState(false);

  const handleSelectCity = (city: CityData) => {
    setSelectedCity(city);
    try {
      localStorage.setItem(STORAGE_KEY, city.id);
    } catch {
      // localStorage not available
    }
  };

  const handleNearMe = () => {
    setNearMeLoading(true);
    // Simulate geolocation
    setTimeout(() => {
      handleSelectCity(cities[0]); // Default to Amman for demo
      setNearMeLoading(false);
    }, 1500);
  };

  const filteredCities = cities.filter(city => {
    if (!searchCity.trim()) return true;
    const q = searchCity.toLowerCase();
    return (
      city.nameEn.toLowerCase().includes(q) ||
      city.nameAr.includes(q)
    );
  });

  const popularCities = filteredCities.filter(c => c.popular);
  const otherCities = filteredCities.filter(c => !c.popular);

  return (
    <Card className="border-emerald-200 dark:border-emerald-800/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="size-4 text-emerald-500" />
          {isRTL ? 'اختر مدينتك' : 'Select Your City'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current selection + Near me */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <span className="text-lg">{selectedCity.countryFlag}</span>
            <div>
              <div className="text-sm font-medium">
                {isRTL ? selectedCity.nameAr : selectedCity.nameEn}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleNearMe}
            disabled={nearMeLoading}
            className="shrink-0 border-emerald-300 dark:border-emerald-700"
          >
            <Navigation className="size-3.5 me-1" />
            {nearMeLoading
              ? (isRTL ? 'جاري التحديد...' : 'Locating...')
              : (isRTL ? 'بالقرب مني' : 'Near Me')
            }
          </Button>
        </div>

        {/* Search cities */}
        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground ${isRTL ? 'right-2.5' : 'left-2.5'}`} />
          <Input
            type="search"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            placeholder={isRTL ? 'ابحث عن مدينة...' : 'Search city...'}
            className={`${isRTL ? 'ps-3 pe-8' : 'ps-8 pe-3'} h-8 text-sm bg-muted/50`}
          />
        </div>

        {/* Popular cities */}
        {popularCities.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              {isRTL ? 'المدن الشائعة' : 'Popular Cities'}
            </h4>
            <div className="flex flex-wrap gap-2">
              {popularCities.map(city => (
                <button
                  key={city.id}
                  onClick={() => handleSelectCity(city)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    selectedCity.id === city.id
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                      : 'bg-background border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                  }`}
                >
                  <span>{city.countryFlag}</span>
                  {isRTL ? city.nameAr : city.nameEn}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Other cities list */}
        {otherCities.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">
              {isRTL ? 'جميع المدن' : 'All Cities'}
            </h4>
            <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1">
              {otherCities.map(city => (
                <button
                  key={city.id}
                  onClick={() => handleSelectCity(city)}
                  className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg text-sm transition-colors ${
                    selectedCity.id === city.id
                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{city.countryFlag}</span>
                    <span>{isRTL ? city.nameAr : city.nameEn}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Map placeholder */}
        <div className="rounded-lg overflow-hidden border border-border">
          <div className="h-32 bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-950 flex items-center justify-center relative">
            {/* Grid lines */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-1/4 inset-x-0 border-t border-emerald-400" />
              <div className="absolute top-1/2 inset-x-0 border-t border-emerald-400" />
              <div className="absolute top-3/4 inset-x-0 border-t border-emerald-400" />
              <div className="absolute start-1/4 inset-y-0 border-s border-emerald-400" />
              <div className="absolute start-1/2 inset-y-0 border-s border-emerald-400" />
              <div className="absolute start-3/4 inset-y-0 border-s border-emerald-400" />
            </div>
            {/* Pin */}
            <div className="relative z-10 flex flex-col items-center">
              <MapPin className="size-8 text-emerald-500 fill-emerald-500/20" />
              <span className="text-xs font-medium mt-1 text-emerald-700 dark:text-emerald-400">
                {isRTL ? selectedCity.nameAr : selectedCity.nameEn}
              </span>
            </div>
            {/* Decorative dots for "nearby listings" */}
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="absolute size-3 rounded-full bg-emerald-500/30 animate-pulse"
                style={{
                  top: `${20 + i * 20}%`,
                  left: `${15 + i * 25}%`,
                }}
              />
            ))}
          </div>
          <div className="p-2 bg-muted/30 flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">
              {isRTL ? 'اختر مدينتك للعثور على منتجات قريبة' : 'Select your city to find nearby products'}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-6 text-emerald-600 dark:text-emerald-400"
              onClick={() => nav.setView('shop')}
            >
              {isRTL ? 'تصفح' : 'Browse'}
              <ChevronRight className={`size-3 ms-0.5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
