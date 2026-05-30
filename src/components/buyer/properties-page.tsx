'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2, Home, Landmark, Store, BedDouble, Bath, Maximize, MapPin,
  Phone, Heart, Search, SlidersHorizontal, ChevronDown, ShieldCheck,
  Star, Plus, Eye, LayoutGrid, List, MessageCircle, ArrowUpDown,
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
import { PROPERTY_TYPE_GRADIENTS, MENA_CITIES } from '@/lib/reference-data';

// Matches the actual API response from /api/properties
interface PropertyListing {
  id: string;
  title: string;
  titleAr: string | null;
  type: string; // apartment, villa, house, land, commercial, office
  listingType: string; // sale, rent
  price: number;
  location: string; // city from API
  locationAr: string; // empty string from API
  bedrooms: number;
  bathrooms: number;
  area: number;
  isFurnished: boolean;
  agentName: string;
  agentVerified: boolean;
  featured: boolean;
  views: number;
  images: string[];
  description: string;
  descriptionAr: string | null;
  createdAt: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  apartment: <Building2 className="size-6" />,
  villa: <Home className="size-6" />,
  house: <Home className="size-6" />,
  land: <Landmark className="size-6" />,
  commercial: <Store className="size-6" />,
  office: <Building2 className="size-6" />,
};

const typeGradients = PROPERTY_TYPE_GRADIENTS;

export function PropertiesPage() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const [properties, setProperties] = useState<PropertyListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [bedroomFilter, setBedroomFilter] = useState<string>('all');
  const [bathroomFilter, setBathroomFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [listingTypeFilter, setListingTypeFilter] = useState<string>('all');
  const [furnishedFilter, setFurnishedFilter] = useState<string>('all');
  const [sortFilter, setSortFilter] = useState<string>('newest');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [savedProperties, setSavedProperties] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/properties');
        if (res.ok) {
          const data = await res.json();
          setProperties(Array.isArray(data) ? data : data.properties || []);
        } else {
          setProperties([]);
        }
      } catch {
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

  const toggleSave = (id: string) => {
    setSavedProperties((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const propertyTypes = [
    { key: 'all', label: t('prop_all') },
    { key: 'apartment', label: t('apartment'), icon: <Building2 className="size-4" /> },
    { key: 'villa', label: t('villa'), icon: <Home className="size-4" /> },
    { key: 'house', label: t('house'), icon: <Home className="size-4" /> },
    { key: 'land', label: t('prop_land'), icon: <Landmark className="size-4" /> },
    { key: 'commercial', label: t('prop_commercial'), icon: <Store className="size-4" /> },
    { key: 'office', label: t('office'), icon: <Building2 className="size-4" /> },
  ];

  const cities = [
    { value: 'all', label: t('prop_allCities') },
    ...MENA_CITIES.map(c => ({ value: c.value, label: isRTL ? c.labelAr : c.label })),
  ];

  const priceRanges = [
    { value: 'all', label: t('allPrices') },
    { value: '0-1000', label: t('prop_under1k') },
    { value: '1000-5000', label: t('prop_1kTo5k') },
    { value: '5000-100000', label: t('prop_5kTo100k') },
    { value: '100000-500000', label: t('prop_100kTo500k') },
    { value: '500000-9999999', label: t('prop_500kPlus') },
  ];

  const filteredProperties = useMemo(() => {
    let filtered = [...properties];

    if (activeType !== 'all') filtered = filtered.filter((p) => p.type === activeType);
    if (listingTypeFilter !== 'all') filtered = filtered.filter((p) => p.listingType === listingTypeFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) => p.title.toLowerCase().includes(q) || (p.titleAr && p.titleAr.includes(q)) || p.location.toLowerCase().includes(q)
      );
    }
    if (cityFilter !== 'all') filtered = filtered.filter((p) => p.location.includes(cityFilter));
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter((p) => p.price >= min && (max ? p.price <= max : true));
    }
    if (bedroomFilter !== 'all') {
      const beds = parseInt(bedroomFilter);
      filtered = filtered.filter((p) => p.bedrooms >= beds || p.type === 'land' || p.type === 'office');
    }
    if (bathroomFilter !== 'all') {
      const baths = parseInt(bathroomFilter);
      filtered = filtered.filter((p) => p.bathrooms >= baths);
    }
    if (areaFilter !== 'all') {
      const [min, max] = areaFilter.split('-').map(Number);
      filtered = filtered.filter((p) => p.area >= min && (max ? p.area <= max : true));
    }
    if (furnishedFilter === 'yes') filtered = filtered.filter((p) => p.isFurnished);
    if (furnishedFilter === 'no') filtered = filtered.filter((p) => !p.isFurnished);
    if (verifiedFilter === 'verified') filtered = filtered.filter((p) => p.agentVerified);

    // Sort
    if (sortFilter === 'price-low') filtered.sort((a, b) => a.price - b.price);
    else if (sortFilter === 'price-high') filtered.sort((a, b) => b.price - a.price);
    else if (sortFilter === 'area-high') filtered.sort((a, b) => b.area - a.area);

    return filtered;
  }, [properties, activeType, searchQuery, cityFilter, priceRange, bedroomFilter, bathroomFilter, areaFilter, listingTypeFilter, furnishedFilter, sortFilter, verifiedFilter]);

  const featuredProperties = useMemo(() => properties.filter((p) => p.featured), [properties]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-40 bg-muted animate-pulse" />
                <CardContent className="p-3 space-y-2">
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
  if (properties.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Landmark className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">{t('noProperties')}</p>
          <p className="text-sm">{t('prop_noPropertiesAvailable')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-600 text-white">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-10 start-10 size-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-10 end-10 size-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/3 end-1/4 w-32 h-32 rounded-full bg-cyan-300/10 blur-2xl" />
          <div className="absolute bottom-1/4 start-1/3 w-24 h-24 rounded-full bg-emerald-300/10 blur-2xl" />
        </div>
        {/* Building silhouette decorative element */}
        <div className="absolute end-8 bottom-0 hidden lg:block opacity-[0.07]">
          <svg width="240" height="140" viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="60" width="40" height="80" rx="2" fill="white" />
            <rect x="70" y="30" width="50" height="110" rx="2" fill="white" />
            <rect x="130" y="50" width="35" height="90" rx="2" fill="white" />
            <rect x="175" y="70" width="45" height="70" rx="2" fill="white" />
            <rect x="24" y="70" width="8" height="10" rx="1" fill="rgba(255,255,255,0.3)" />
            <rect x="36" y="70" width="8" height="10" rx="1" fill="rgba(255,255,255,0.3)" />
            <rect x="24" y="90" width="8" height="10" rx="1" fill="rgba(255,255,255,0.3)" />
            <rect x="36" y="90" width="8" height="10" rx="1" fill="rgba(255,255,255,0.3)" />
            <rect x="80" y="40" width="10" height="12" rx="1" fill="rgba(255,255,255,0.3)" />
            <rect x="96" y="40" width="10" height="12" rx="1" fill="rgba(255,255,255,0.3)" />
            <rect x="80" y="60" width="10" height="12" rx="1" fill="rgba(255,255,255,0.3)" />
            <rect x="96" y="60" width="10" height="12" rx="1" fill="rgba(255,255,255,0.3)" />
          </svg>
        </div>
        <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-sm font-medium shadow-lg shadow-white/5">
              <Home className="size-4" />
              {t('prop_badge')}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-emerald-100 to-white">{t('findYourDreamProperty')}</span>
            </h1>
            <p className="text-white/80 text-lg">
              {t('propertiesDesc')}
            </p>
            <div className="flex items-center max-w-xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5 gap-1.5 shadow-xl shadow-black/10">
              <div className="relative flex-1">
                <Search className={`absolute top-1/2 -translate-y-1/2 size-4 text-white/60 ${isRTL ? 'right-3' : 'left-3'}`} />
                <Input
                  placeholder={t('propertySearch')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${isRTL ? 'pe-3 ps-11' : 'ps-11 pe-3'} h-12 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-white/50 focus-visible:border-white/50 focus-visible:ring-white/20 rounded-lg`}
                />
              </div>
              <Button className="bg-white text-emerald-700 hover:bg-white/90 h-11 px-6 rounded-lg font-semibold shrink-0 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5">
                {t('prop_search')}
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10 shadow-lg shadow-white/5">
                <span className="text-2xl font-bold block">{properties.length}</span>
                <span className="text-white/70 text-xs">{t('prop_propertyCount')}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/10 shadow-lg shadow-white/5">
                <span className="text-2xl font-bold block">{featuredProperties.length}</span>
                <span className="text-white/70 text-xs">{t('prop_featuredCount')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Property Type Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {propertyTypes.map((type) => (
            <Button
              key={type.key}
              variant={activeType === type.key ? 'default' : 'outline'}
              size="sm"
              className={`shrink-0 rounded-full ${activeType === type.key ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'hover:border-emerald-300 hover:text-emerald-700'}`}
              onClick={() => setActiveType(type.key)}
            >
              {type.key !== 'all' && <span className="me-1.5">{type.icon}</span>}
              {type.label}
            </Button>
          ))}
        </div>

        {/* Filter Bar + View Toggle */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-emerald-600" />
                {t('filterResults')}
                <Badge variant="secondary" className="text-[10px]">{filteredProperties.length}</Badge>
              </h3>
              <div className="flex items-center gap-2">
                {/* Grid/List Toggle */}
                <div className="hidden md:flex items-center gap-1 bg-muted rounded-lg p-0.5">
                  <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="size-7" onClick={() => setViewMode('grid')}>
                    <LayoutGrid className="size-3.5" />
                  </Button>
                  <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="size-7" onClick={() => setViewMode('list')}>
                    <List className="size-3.5" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-emerald-600" onClick={() => setShowFilters(!showFilters)}>
                  {showFilters ? (t('prop_hide')) : (t('prop_more'))}
                  <ChevronDown className={`size-3 ms-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select value={listingTypeFilter} onValueChange={setListingTypeFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder={t('listingType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('prop_all')}</SelectItem>
                  <SelectItem value="sale">{t('forSale')}</SelectItem>
                  <SelectItem value="rent">{t('forRent')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="text-xs">
                  <MapPin className="size-3.5 me-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priceRanges.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={bedroomFilter} onValueChange={setBedroomFilter}>
                <SelectTrigger className="text-xs">
                  <BedDouble className="size-3.5 me-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('prop_any')}</SelectItem>
                  <SelectItem value="1">1+</SelectItem>
                  <SelectItem value="2">2+</SelectItem>
                  <SelectItem value="3">3+</SelectItem>
                  <SelectItem value="4">4+</SelectItem>
                  <SelectItem value="5">5+</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {showFilters && (
              <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-4 gap-3">
                <Select value={bathroomFilter} onValueChange={setBathroomFilter}>
                  <SelectTrigger className="text-xs">
                    <Bath className="size-3.5 me-1.5 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('prop_any')}</SelectItem>
                    <SelectItem value="1">1+</SelectItem>
                    <SelectItem value="2">2+</SelectItem>
                    <SelectItem value="3">3+</SelectItem>
                    <SelectItem value="4">4+</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={areaFilter} onValueChange={setAreaFilter}>
                  <SelectTrigger className="text-xs">
                    <Maximize className="size-3.5 me-1.5 text-muted-foreground" />
                    <SelectValue placeholder={t('areaSqm')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('prop_anyArea')}</SelectItem>
                    <SelectItem value="0-100">{t('prop_under100sqm')}</SelectItem>
                    <SelectItem value="100-300">{t('prop_100to300sqm')}</SelectItem>
                    <SelectItem value="300-600">{t('prop_300to600sqm')}</SelectItem>
                    <SelectItem value="600-9999">{t('prop_600plusSqm')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={furnishedFilter} onValueChange={setFurnishedFilter}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder={t('furnished')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('prop_any')}</SelectItem>
                    <SelectItem value="yes">{t('prop_furnishedOption')}</SelectItem>
                    <SelectItem value="no">{t('prop_unfurnished')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortFilter} onValueChange={setSortFilter}>
                  <SelectTrigger className="text-xs">
                    <ArrowUpDown className="size-3.5 me-1.5 text-muted-foreground" />
                    <SelectValue placeholder={t('prop_sort')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t('prop_newest')}</SelectItem>
                    <SelectItem value="price-low">{t('prop_priceLow')}</SelectItem>
                    <SelectItem value="price-high">{t('prop_priceHigh')}</SelectItem>
                    <SelectItem value="area-high">{t('prop_areaLargest')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {showFilters && verifiedFilter !== 'all' && (
              <div className="mt-2">
                <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                  <SelectTrigger className="text-xs max-w-[200px]">
                    <ShieldCheck className="size-3.5 me-1.5 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('prop_allAgents')}</SelectItem>
                    <SelectItem value="verified">{t('verifiedOnly')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Featured Properties */}
        {activeType === 'all' && !searchQuery && listingTypeFilter === 'all' && featuredProperties.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Star className="size-5 text-amber-500" />
                {t('featuredProperties')}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredProperties.slice(0, 3).map((property) => {
                const gradient = typeGradients[property.type] || 'from-teal-500 to-cyan-600';
                const firstImage = property.images && property.images.length > 0 ? property.images[0] : null;
                return (
                  <Card key={property.id} className="border border-border/60 rounded-2xl shadow-md overflow-hidden group hover:shadow-xl hover:shadow-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] backdrop-blur-md bg-card/80 h-full flex flex-col">
                    <div className={`relative h-48 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={isRTL ? (property.titleAr || property.title) : property.title}
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
                      {/* Gradient placeholder with type icon */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center ${firstImage ? 'hidden' : ''}`}>
                        {typeIcons[property.type] && <span className="text-white/20">{typeIcons[property.type]}</span>}
                        <span className="text-2xl font-bold text-white/20 mt-1 select-none">{property.title.charAt(0)}</span>
                      </div>
                      <div className="absolute top-3 start-3 flex gap-1.5">
                        <Badge className={`${property.listingType === 'rent' ? 'bg-emerald-500' : 'bg-amber-500'} text-white border-0 text-xs font-semibold px-2.5 py-1 shadow-sm`}>
                          {property.listingType === 'rent' ? t('forRent') : t('forSale')}
                        </Badge>
                        {property.isFurnished && (
                          <Badge className="bg-white/25 text-white border-0 text-[10px] backdrop-blur-sm">{t('furnished')}</Badge>
                        )}
                      </div>
                      <div className="absolute top-3 end-3">
                        <Badge className="bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 border-0 text-[10px] font-bold shadow-sm">⭐ {t('prop_featuredCount')}</Badge>
                      </div>
                      <Button variant="ghost" size="icon" className={`absolute bottom-3 end-3 size-8 rounded-full transition-all duration-300 ${savedProperties.includes(property.id) ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/40 backdrop-blur-sm'}`} onClick={() => toggleSave(property.id)}>
                        <Heart className={`size-4 ${savedProperties.includes(property.id) ? 'fill-current' : ''} transition-all duration-200`} />
                      </Button>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h3 className="font-semibold text-sm line-clamp-1">{isRTL ? (property.titleAr || property.title) : property.title}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3 text-emerald-500" />{property.location}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {property.bedrooms > 0 && <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded"><BedDouble className="size-3 text-emerald-600 dark:text-emerald-400" /><span className="font-semibold">{property.bedrooms}</span></span>}
                        {property.bathrooms > 0 && <span className="flex items-center gap-1 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 rounded"><Bath className="size-3 text-sky-600 dark:text-sky-400" /><span className="font-semibold">{property.bathrooms}</span></span>}
                        <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded"><Maximize className="size-3 text-amber-600 dark:text-amber-400" /><span className="font-semibold">{property.area} {t('prop_sqm')}</span></span>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-lg font-bold text-emerald-600">
                          {formatPrice(property.price)}
                          {property.listingType === 'rent' && <span className="text-xs text-muted-foreground">{t('pricePerMonth')}</span>}
                        </p>
                        {property.area > 0 && (
                          <p className="text-[10px] text-muted-foreground">
                            {t('prop_perSqm')}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground"><Eye className="size-3" />{property.views}</div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {property.agentName && (
                            <>
                              <Avatar className="size-6"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-[10px]">{property.agentName.charAt(0)}</AvatarFallback></Avatar>
                              <span className="text-xs font-medium">{property.agentName}</span>
                              {property.agentVerified && <ShieldCheck className="size-3.5 text-emerald-500" />}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" className="h-7 text-[9px] px-2 rounded-full">
                            <MessageCircle className="size-2.5 me-0.5" />
                          </Button>
                          <Button size="sm" className="h-7 text-[9px] px-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full shadow-sm">
                            <Phone className="size-2.5 me-0.5" />
                            {t('prop_call')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* All Properties */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {t('allProperties')}
              <span className="text-sm font-normal text-muted-foreground ms-2">({filteredProperties.length})</span>
            </h2>
          </div>
          {filteredProperties.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Landmark className="size-16 mx-auto text-muted-foreground/20" />
              <p className="text-lg font-medium text-muted-foreground">{t('noProperties')}</p>
              <p className="text-sm text-muted-foreground/60">{t('noPropertiesDesc')}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProperties.map((property) => {
                const gradient = typeGradients[property.type] || 'from-teal-500 to-cyan-600';
                const firstImage = property.images && property.images.length > 0 ? property.images[0] : null;
                return (
                  <Card key={property.id} className="border border-border/60 rounded-2xl shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] backdrop-blur-md bg-card/80 h-full flex flex-col">
                    <div className={`relative h-40 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={isRTL ? (property.titleAr || property.title) : property.title}
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
                      {/* Gradient placeholder with type icon */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center ${firstImage ? 'hidden' : ''}`}>
                        {typeIcons[property.type] && <span className="text-white/20">{typeIcons[property.type]}</span>}
                        <span className="text-xl font-bold text-white/20 mt-1 select-none">{property.title.charAt(0)}</span>
                      </div>
                      <div className="absolute top-3 start-3 flex gap-1.5">
                        <Badge className={`${property.listingType === 'rent' ? 'bg-emerald-500' : 'bg-amber-500'} text-white border-0 text-[10px] font-semibold px-2 py-0.5 shadow-sm`}>
                          {property.listingType === 'rent' ? t('forRent') : t('forSale')}
                        </Badge>
                        {property.isFurnished && (
                          <Badge className="bg-white/25 text-white border-0 text-[10px] backdrop-blur-sm">{t('furnished')}</Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className={`absolute bottom-3 end-3 size-7 rounded-full transition-all duration-300 ${savedProperties.includes(property.id) ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/40 backdrop-blur-sm'}`} onClick={() => toggleSave(property.id)}>
                        <Heart className={`size-3.5 ${savedProperties.includes(property.id) ? 'fill-current' : ''} transition-all duration-200`} />
                      </Button>
                    </div>
                    <CardContent className="p-4 space-y-2 flex-1 flex flex-col">
                      <h3 className="font-semibold text-sm line-clamp-1">{isRTL ? (property.titleAr || property.title) : property.title}</h3>
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="size-3 text-emerald-500" />{property.location}</div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {property.bedrooms > 0 && <span className="flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded"><BedDouble className="size-3 text-emerald-600 dark:text-emerald-400" /><span className="font-semibold">{property.bedrooms}</span></span>}
                        {property.bathrooms > 0 && <span className="flex items-center gap-0.5 bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.5 rounded"><Bath className="size-3 text-sky-600 dark:text-sky-400" /><span className="font-semibold">{property.bathrooms}</span></span>}
                        <span className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded"><Maximize className="size-3 text-amber-600 dark:text-amber-400" /><span className="font-semibold">{property.area} {t('prop_sqm')}</span></span>
                      </div>
                      <div className="flex-1" />
                      <div className="flex items-center justify-between pt-0.5">
                        <div>
                          <p className="text-base font-bold text-emerald-600">
                            {formatPrice(property.price)}
                            {property.listingType === 'rent' && <span className="text-[10px] text-muted-foreground">{t('pricePerMonth')}</span>}
                          </p>
                          {property.area > 0 && (
                            <p className="text-[9px] text-muted-foreground">
                              {t('prop_perSqm')}
                            </p>
                          )}
                        </div>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {property.agentName && (
                            <>
                              <Avatar className="size-5"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-[8px]">{property.agentName.charAt(0)}</AvatarFallback></Avatar>
                              <span className="text-[10px] font-medium truncate max-w-[80px]">{property.agentName}</span>
                              {property.agentVerified && <ShieldCheck className="size-3 text-emerald-500" />}
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="outline" className="h-6 text-[9px] px-2 rounded-full" onClick={() => toggleSave(property.id)}>
                            <Heart className={`size-2.5 me-0.5 ${savedProperties.includes(property.id) ? 'fill-red-500 text-red-500' : ''}`} />
                            {t('prop_save')}
                          </Button>
                          <Button size="sm" className="h-6 text-[9px] px-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full shadow-sm">
                            <Phone className="size-2.5 me-0.5" />
                            {t('prop_call')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="space-y-3">
              {filteredProperties.map((property) => {
                const gradient = typeGradients[property.type] || 'from-teal-500 to-cyan-600';
                const firstImage = property.images && property.images.length > 0 ? property.images[0] : null;
                return (
                  <Card key={property.id} className="border border-border/50 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className={`shrink-0 w-full md:w-48 h-32 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center relative overflow-hidden`}>
                          {firstImage ? (
                            <img
                              src={firstImage}
                              alt={isRTL ? (property.titleAr || property.title) : property.title}
                              className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
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
                          {/* Gradient placeholder with type icon */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex flex-col items-center justify-center rounded-xl ${firstImage ? 'hidden' : ''}`}>
                            {typeIcons[property.type] && <span className="text-white/20">{typeIcons[property.type]}</span>}
                            <span className="text-lg font-bold text-white/20 mt-1 select-none">{property.title.charAt(0)}</span>
                          </div>
                          <Badge className={`absolute top-2 start-2 ${property.listingType === 'rent' ? 'bg-emerald-500' : 'bg-amber-500'} text-white border-0 text-[10px] font-semibold px-2 py-0.5 shadow-sm`}>
                            {property.listingType === 'rent' ? t('forRent') : t('forSale')}
                          </Badge>
                          {property.isFurnished && (
                            <Badge className="absolute bottom-2 start-2 bg-white/25 text-white border-0 text-[10px] backdrop-blur-sm">{t('furnished')}</Badge>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-sm md:text-base">{isRTL ? (property.titleAr || property.title) : property.title}</h3>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5"><MapPin className="size-3" />{property.location}</div>
                            </div>
                            <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => toggleSave(property.id)}>
                              <Heart className={`size-4 ${savedProperties.includes(property.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            {property.bedrooms > 0 && <span className="flex items-center gap-1"><BedDouble className="size-3" />{property.bedrooms} {t('bedrooms')}</span>}
                            {property.bathrooms > 0 && <span className="flex items-center gap-1"><Bath className="size-3" />{property.bathrooms} {t('bathrooms')}</span>}
                            <span className="flex items-center gap-1"><Maximize className="size-3" />{property.area} {t('prop_sqm')}</span>
                            <span className="flex items-center gap-1"><Eye className="size-3" />{property.views} {t('views')}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <p className="text-lg font-bold text-emerald-600">
                              {formatPrice(property.price)}
                              {property.listingType === 'rent' && <span className="text-xs text-muted-foreground">{t('pricePerMonth')}</span>}
                            </p>
                            <div className="flex items-center gap-2">
                              {property.agentName && (
                                <div className="flex items-center gap-1.5">
                                  <Avatar className="size-6"><AvatarFallback className="bg-emerald-100 text-emerald-700 text-[10px]">{property.agentName.charAt(0)}</AvatarFallback></Avatar>
                                  <span className="text-xs font-medium">{property.agentName}</span>
                                  {property.agentVerified && <ShieldCheck className="size-3.5 text-emerald-500" />}
                                </div>
                              )}
                              <Button size="sm" className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-3">
                                <Phone className="size-3 me-1" />
                                {t('prop_call')}
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-full px-3">
                                <MessageCircle className="size-3 me-1" />
                                {t('prop_whatsapp')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Post Your Property CTA */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white p-8 md:p-12 shadow-xl shadow-emerald-500/20">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-5 end-5 size-32 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute bottom-5 start-5 size-24 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute top-1/2 start-1/3 w-40 h-40 rounded-full bg-cyan-300/10 blur-3xl" />
          </div>
          <div className="relative z-10 max-w-xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 shadow-lg shadow-white/5">
              <Plus className="size-7" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">{t('postYourProperty')}</h2>
            <p className="text-emerald-100">{t('postYourPropertyDesc')}</p>
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-white/90 font-semibold rounded-full px-8 shadow-lg shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
              <Plus className="size-4 me-2" />
              {t('postNow')}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
