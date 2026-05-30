'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Star, MapPin, ShieldCheck, Phone, MessageCircle,
  CalendarCheck, SlidersHorizontal, ChevronDown, Wrench,
  Sparkles, Droplets, Settings2, GraduationCap, HeartPulse,
  Scale, Monitor, Hammer, PartyPopper, Truck, Scissors,
  Heart, Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { getPlaceholderImage } from '@/lib/placeholder-image';
import {
  SERVICE_CATEGORIES, SERVICE_CATEGORY_GRADIENTS, MENA_CITIES,
} from '@/lib/reference-data';

// Matches the actual API response from /api/services
interface ServiceListing {
  id: string;
  provider: string;
  providerAr: string; // empty string from API
  avatar: string; // URL or empty from API
  title: string;
  titleAr: string | null;
  description: string;
  descriptionAr: string | null;
  category: string;
  categoryAr: string; // empty string from API
  price: number;
  priceUnit: string; // hour, visit, consultation, service
  priceUnitAr: string; // empty string from API
  rating: number;
  reviewCount: number;
  location: string; // city from API
  locationAr: string; // empty string from API
  verified: boolean;
  availableToday: boolean;
}

// Icon mapping for service categories (client-side only, depends on React)

const SERVICE_CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Cleaning': <Droplets className="size-5" />,
  'Maintenance': <Settings2 className="size-5" />,
  'Education': <GraduationCap className="size-5" />,
  'Health': <HeartPulse className="size-5" />,
  'Legal': <Scale className="size-5" />,
  'IT & Tech': <Monitor className="size-5" />,
  'Home Improvement': <Hammer className="size-5" />,
  'Event Planning': <PartyPopper className="size-5" />,
  'Transport': <Truck className="size-5" />,
  'Beauty': <Scissors className="size-5" />,
};

// Maps service category values to i18n keys
const SVC_CATEGORY_KEYS: Record<string, string> = {
  'Cleaning': 'svc_cat_cleaning',
  'Maintenance': 'svc_cat_maintenance',
  'Education': 'svc_cat_education',
  'Health': 'svc_cat_health',
  'Legal': 'svc_cat_legal',
  'IT & Tech': 'svc_cat_it_tech',
  'Home Improvement': 'svc_cat_home_improvement',
  'Event Planning': 'svc_cat_event_planning',
  'Transport': 'svc_cat_transport',
  'Beauty': 'svc_cat_beauty',
};

const SVC_CITY_KEYS: Record<string, string> = {
  'Dubai': 'svc_city_Dubai',
  'Riyadh': 'svc_city_Riyadh',
  'Amman': 'svc_city_Amman',
  'Cairo': 'svc_city_Cairo',
  'Baghdad': 'svc_city_Baghdad',
  'Kuwait': 'svc_city_Kuwait',
  'Manama': 'svc_city_Manama',
  'Muscat': 'svc_city_Muscat',
};

const SVC_PRICE_UNIT_KEYS: Record<string, string> = {
  'hour': 'svc_pu_hour',
  'visit': 'svc_pu_visit',
  'consultation': 'svc_pu_consultation',
  'service': 'svc_pu_service',
};

// Derived from centralized SERVICE_CATEGORIES
const categoryConfig: Record<string, { icon: React.ReactNode; gradient: string }> = Object.fromEntries(
  SERVICE_CATEGORIES.map(c => [c.value, { icon: SERVICE_CATEGORY_ICONS[c.value] || <Sparkles className="size-5" />, gradient: c.gradient }])
);

export function ServicesPage() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const [services, setServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [savedServices, setSavedServices] = useState<string[]>([]);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          setServices(Array.isArray(data) ? data : data.services || []);
        } else {
          setServices([]);
        }
      } catch {
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const toggleSave = (id: string) => {
    setSavedServices((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const filteredServices = useMemo(() => {
    let filtered = [...services];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          (s.titleAr && s.titleAr.includes(q)) ||
          s.provider.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((s) => s.category === categoryFilter);
    }
    if (priceFilter !== 'all') {
      const [min, max] = priceFilter.split('-').map(Number);
      filtered = filtered.filter((s) => s.price >= min && (max ? s.price <= max : true));
    }
    if (ratingFilter !== 'all') {
      const minRating = parseFloat(ratingFilter);
      filtered = filtered.filter((s) => s.rating >= minRating);
    }
    if (availabilityFilter === 'today') {
      filtered = filtered.filter((s) => s.availableToday);
    }
    if (locationFilter !== 'all') {
      filtered = filtered.filter((s) => s.location.includes(locationFilter));
    }
    return filtered;
  }, [services, searchQuery, categoryFilter, priceFilter, ratingFilter, availabilityFilter, locationFilter]);

  // Helper for data-driven text (titles/descriptions from API)
  const localize = (en: string, ar: string | null | undefined) => (ar && isRTL) ? ar : en;

  const priceUnitLabel = (unit: string) => {
    const key = SVC_PRICE_UNIT_KEYS[unit];
    return key ? t(key) : t('svc_perService');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-2 bg-muted animate-pulse" />
                <CardContent className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (services.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Wrench className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">{t('noServices') || 'No services found'}</p>
          <p className="text-sm">{t('svc_noServicesAvailable')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 start-10 size-40 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 end-10 size-60 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 size-80 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <Badge className="bg-white/20 text-white border-0 text-xs">
              <Wrench className="size-3 me-1" />
              {t('svc_marketplace')}
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              {t('findProfessionalServices')}
            </h1>
            <p className="text-emerald-100 text-lg">
              {t('svc_findTrusted')}
            </p>
            <div className="flex items-center max-w-xl mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-1.5 gap-1.5">
              <div className="relative flex-1">
                <Search className={`absolute top-1/2 -translate-y-1/2 size-4 text-white/60 ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input
                  placeholder={t('svc_searchServices')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${isRTL ? 'pr-9' : 'pl-9'} bg-white/10 border-white/20 text-white placeholder:text-white/50 h-11 rounded-lg`}
                />
              </div>
              <Button className="bg-white text-emerald-700 hover:bg-white/90 h-11 px-6 rounded-lg font-semibold shrink-0">
                {t('svc_search')}
              </Button>
            </div>
            {/* Stats */}
            <div className="flex items-center justify-center gap-8 mt-6 text-sm">
              <div><span className="text-2xl font-bold">{services.length}</span><br />{t('svc_providers')}</div>
              <div><span className="text-2xl font-bold">{services.filter(s => s.availableToday).length}</span><br />{t('availableToday')}</div>
              <div><span className="text-2xl font-bold">{services.length > 0 ? (services.reduce((sum, s) => sum + s.rating, 0) / services.length).toFixed(1) : '0'}</span><br />{t('svc_avgRating')}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-8">
        {/* Category Cards - Horizontal Scroll */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="size-5 text-emerald-500" />
            {t('svc_browseByCategory')}
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin px-4 sm:px-0">
            {Object.entries(categoryConfig).map(([key, config]) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(categoryFilter === key ? 'all' : key)}
                className={`shrink-0 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all min-w-[100px] ${
                  categoryFilter === key
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950 shadow-lg shadow-emerald-500/10'
                    : 'border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md'
                }`}
              >
                <div className={`size-12 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white`}>
                  {config.icon}
                </div>
                <span className={`text-xs font-medium text-center ${categoryFilter === key ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                  {t(SVC_CATEGORY_KEYS[key] || key)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-emerald-600" />
                {t('filterResults')}
                <Badge variant="secondary" className="text-[10px]">{filteredServices.length}</Badge>
              </h3>
              <Button variant="ghost" size="sm" className="text-xs text-emerald-600" onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? (t('prop_hide')) : (t('prop_more'))}
                <ChevronDown className={`size-3 ms-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder={t('svc_category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('svc_allCategories')}</SelectItem>
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{t(SVC_CATEGORY_KEYS[key] || key)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder={t('svc_priceRange')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('svc_anyPrice')}</SelectItem>
                  <SelectItem value="0-50">{t('svc_under50')}</SelectItem>
                  <SelectItem value="50-100">{t('svc_50to100')}</SelectItem>
                  <SelectItem value="100-300">{t('svc_100to300')}</SelectItem>
                  <SelectItem value="300-9999">{t('svc_300plus')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger className="text-xs">
                  <Star className="size-3.5 me-1.5 text-muted-foreground" />
                  <SelectValue placeholder={t('svc_ratingLabel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('svc_anyRating')}</SelectItem>
                  <SelectItem value="4">{t('svc_4plusStars')}</SelectItem>
                  <SelectItem value="4.5">{t('svc_4halfPlusStars')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger className="text-xs">
                  <CalendarCheck className="size-3.5 me-1.5 text-muted-foreground" />
                  <SelectValue placeholder={t('svc_availability')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('svc_anyTime')}</SelectItem>
                  <SelectItem value="today">{t('availableToday')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {showFilters && (
              <div className="mt-3 pt-3 border-t">
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="text-xs">
                    <MapPin className="size-3.5 me-1.5 text-muted-foreground" />
                    <SelectValue placeholder={t('svc_location')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('svc_allLocations')}</SelectItem>
                    {MENA_CITIES.map(city => (
                      <SelectItem key={city.value} value={city.value}>{t(SVC_CITY_KEYS[city.value] || city.label)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Listings */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Wrench className="size-16 mx-auto text-muted-foreground/20" />
            <p className="text-lg font-medium text-muted-foreground">{t('noServices')}</p>
            <p className="text-sm text-muted-foreground/60">{t('noServicesDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => {
              const catConfig = categoryConfig[service.category];
              const gradient = catConfig?.gradient || 'from-slate-500 to-gray-600';
              return (
                <Card
                  key={service.id}
                  className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-all group hover:-translate-y-0.5 h-full flex flex-col"
                >
                  {/* Top gradient bar with category */}
                  <div className={`relative h-2 bg-gradient-to-r ${gradient} shrink-0`} />
                  <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
                    {/* Provider info row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-11 rounded-xl">
                          {service.avatar ? (
                            <img
                              src={service.avatar}
                              alt={service.provider}
                              className="w-full h-full object-cover rounded-xl"
                              onError={(e) => {
                                const img = e.currentTarget;
                                if (!img.dataset.retried) {
                                  img.dataset.retried = 'true';
                                  img.src = getPlaceholderImage(service.category.toLowerCase() || 'home', service.provider, 88, 88);
                                }
                              }}
                            />
                          ) : (
                            <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white font-bold text-xs`}>
                              {service.provider.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-sm flex items-center gap-1.5">
                            {service.provider}
                            {service.verified && <ShieldCheck className="size-3.5 text-emerald-500" />}
                          </h3>
                          <Badge variant="secondary" className="text-[10px] mt-0.5">
                            {catConfig && <span className="me-1 inline-flex">{catConfig.icon}</span>}
                            {t(SVC_CATEGORY_KEYS[service.category] || service.category)}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        onClick={() => toggleSave(service.id)}
                      >
                        <Heart className={`size-4 ${savedServices.includes(service.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                      </Button>
                    </div>

                    {/* Service title */}
                    <h4 className="font-semibold text-base">{localize(service.title, service.titleAr)}</h4>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {localize(service.description, service.descriptionAr)}
                    </p>

                    {/* Rating & Location */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="size-3 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-foreground">{service.rating}</span>
                        <span className="text-muted-foreground">({service.reviewCount})</span>
                      </span>
                      {service.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />
                          {service.location}
                        </span>
                      )}
                    </div>

                    {/* Available today badge */}
                    {service.availableToday && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-0 text-[10px]">
                        <CalendarCheck className="size-3 me-1" />
                        {t('availableToday')}
                      </Badge>
                    )}

                    <div className="flex-1" />

                    <Separator />

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-emerald-600">
                        {formatPrice(service.price)}
                        <span className="text-xs text-muted-foreground font-normal">
                          {priceUnitLabel(service.priceUnit)}
                        </span>
                      </p>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-full px-3">
                          <MessageCircle className="size-3 me-1" />
                          {t('svc_contact')}
                        </Button>
                        <Button size="sm" className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-3">
                          <CalendarCheck className="size-3 me-1" />
                          {t('bookNow')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* List Your Service CTA */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white p-8 md:p-12">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-5 end-5 size-32 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute bottom-5 start-5 size-24 rounded-full bg-white/10 blur-2xl" />
          </div>
          <div className="relative z-10 max-w-xl mx-auto text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">{t('listYourService')}</h2>
            <p className="text-emerald-100">{t('listYourServiceDesc')}</p>
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-white/90 font-semibold rounded-full px-8">
              <Sparkles className="size-4 me-2" />
              {t('listNow')}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
