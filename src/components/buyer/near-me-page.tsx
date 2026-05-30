'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Navigation,
  Star,
  Phone,
  MessageCircle,
  ChevronDown,
  Search,
  Locate,
  Expand,
  ShieldCheck,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { formatPrice } from '@/lib/currency';
import { NEAR_ME_CATEGORY_FILTERS } from '@/lib/reference-data';

interface NearbyProduct {
  id: string;
  name: string;
  nameAr: string;
  image: string;
  price: number;
  originalPrice?: number;
  category: string;
  categoryAr: string;
  distance: number;
  sellerName: string;
  sellerNameAr: string;
  sellerLocation: string;
  sellerLocationAr: string;
  sellerPhone: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
}

interface City {
  key: string;
  name: string;
  nameAr: string;
  country: string;
  countryAr: string;
  lat: number;
  lng: number;
}

const categoryFilters = NEAR_ME_CATEGORY_FILTERS;

const distanceOptions = [5, 10, 25, 50, 100];

export function NearMePage() {
  const { t, locale } = useI18n();
  const { currency } = useAppStore();
  const nav = useAppNavigation();
  const isRTL = locale === 'ar';

  const [products, setProducts] = useState<NearbyProduct[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<string>('riyadh');
  const [selectedDistance, setSelectedDistance] = useState(25);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [showMapView, setShowMapView] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (userLocation) {
        params.set('lat', userLocation.lat.toString());
        params.set('lng', userLocation.lng.toString());
      } else {
        params.set('city', selectedCity);
      }
      params.set('radius', selectedDistance.toString());
      params.set('category', selectedCategory);

      const res = await fetch(`/api/near-me?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      if (data.cities) setCities(data.cities);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, [userLocation, selectedCity, selectedDistance, selectedCategory]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setSelectedCity('');
        setLocating(false);
      },
      () => {
        setLocating(false);
      }
    );
  };

  const handleExpandSearch = () => {
    const currentIdx = distanceOptions.indexOf(selectedDistance);
    if (currentIdx < distanceOptions.length - 1) {
      setSelectedDistance(distanceOptions[currentIdx + 1]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/20 blur-xl" />
          <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-white/20 blur-xl" />
          <div className="absolute top-1/2 left-1/2 w-24 h-24 rounded-full bg-white/10 blur-lg" />
        </div>
        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
              <MapPin className="size-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                {isRTL ? 'اعثر على منتجات بالقرب منك' : t('findProductsNearYou')}
              </h1>
              <p className="text-white/80 mt-1">
                {isRTL ? 'تسوق من البائعين القريبين من موقعك' : t('nearMeDesc')}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
              <Navigation className="size-4" />
              <span className="text-sm font-medium">{isRTL ? `${products.length} منتج قريب` : `${products.length} products nearby`}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
              <ShieldCheck className="size-4" />
              <span className="text-sm font-medium">{isRTL ? 'بائعون موثوقون' : 'Verified Sellers'}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-2">
              <Sparkles className="size-4" />
              <span className="text-sm font-medium">{isRTL ? '10 مدن' : '10 Cities'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Location Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <Button
            onClick={handleUseMyLocation}
            disabled={locating}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 gap-2"
          >
            <Locate className="size-4" />
            {locating ? t('locating') : isRTL ? 'استخدم موقعي' : t('useMyLocation')}
          </Button>
          <Select value={selectedCity} onValueChange={(v) => { setSelectedCity(v); setUserLocation(null); }}>
            <SelectTrigger className="w-full md:w-64">
              <MapPin className="size-4 text-emerald-500 me-2" />
              <SelectValue placeholder={t('selectYourCity')} />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city.key} value={city.key}>
                  {isRTL ? city.nameAr : city.name}, {isRTL ? city.countryAr : city.country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Distance Filter */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {isRTL ? 'المسافة:' : 'Distance:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {distanceOptions.map((dist) => (
              <Button
                key={dist}
                variant={selectedDistance === dist ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDistance(dist)}
                className={selectedDistance === dist
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950'
                }
              >
                {isRTL ? `خلال ${dist} كم` : `Within ${dist}km`}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            {isRTL ? 'الفئة:' : 'Category:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {categoryFilters.map((cat) => (
              <Button
                key={cat.key}
                variant={selectedCategory === cat.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.key)}
                className={selectedCategory === cat.key
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : 'border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950'
                }
              >
                <span className="me-1">{cat.icon}</span>
                {isRTL ? cat.labelAr : cat.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Map Placeholder */}
        <div
          className="relative rounded-2xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 overflow-hidden cursor-pointer"
          onClick={() => setShowMapView(!showMapView)}
        >
          <div className="h-48 md:h-64 flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                <MapPin className="size-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="absolute -top-1 -right-1 size-5 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
                <span className="text-white text-[10px] font-bold">{products.length}</span>
              </div>
            </div>
            <p className="text-emerald-700 dark:text-emerald-300 font-medium">
              {showMapView
                ? (isRTL ? 'إخفاء عرض الخريطة' : 'Hide Map View')
                : (isRTL ? 'عرض الخريطة' : 'Map View')
              }
            </p>
            <p className="text-sm text-emerald-600/70 dark:text-emerald-400/70">
              {isRTL
                ? `${products.length} منتج ضمن ${selectedDistance} كم`
                : `${products.length} products within ${selectedDistance}km`
              }
            </p>
          </div>
          {/* Decorative pins on map */}
          {showMapView && (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-teal-100/50 dark:from-emerald-900/50 dark:to-teal-900/50">
              {[...Array(Math.min(products.length, 8))].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce"
                  style={{
                    top: `${20 + (i * 8) % 60}%`,
                    left: `${15 + (i * 13) % 70}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '2s',
                  }}
                >
                  <MapPin className="size-5 text-emerald-600 dark:text-emerald-400 drop-shadow" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Search className="size-4 text-emerald-500" />
            <span className="text-sm font-medium">
              {isRTL
                ? `${products.length} منتج ضمن ${selectedDistance} كم`
                : t('productsFoundWithin', { count: products.length, distance: selectedDistance })
              }
            </span>
          </div>
          {selectedDistance < 100 && (
            <Button variant="outline" size="sm" onClick={handleExpandSearch} className="gap-1.5 text-emerald-600 border-emerald-200 dark:border-emerald-800">
              <Expand className="size-3.5" />
              {isRTL ? 'توسيع البحث' : t('expandSearch')}
            </Button>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-40 bg-muted rounded-lg mb-3" />
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="size-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              {isRTL ? 'لا توجد منتجات قريبة' : t('noProductsNearby')}
            </h3>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {isRTL ? 'جرب زيادة نطاق البحث أو تغيير المدينة' : t('tryExpandingSearch')}
            </p>
            <Button variant="outline" className="mt-4 gap-2" onClick={handleExpandSearch}>
              <Expand className="size-4" />
              {isRTL ? 'توسيع البحث' : t('expandSearch')}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <Card
                key={product.id}
                className="group hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 border-border/50 overflow-hidden cursor-pointer"
                onClick={() => nav.selectProduct(product.id)}
              >
                <CardContent className="p-0">
                  {/* Product Image Placeholder */}
                  <div className="relative h-44 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
                    <div className="text-4xl opacity-30">
                      {product.category === 'Cars' ? '🚗' : product.category === 'Electronics' ? '📱' : product.category === 'Fashion' ? '👗' : product.category === 'Services' ? '🔧' : '🏠'}
                    </div>
                    {/* Distance Badge */}
                    <Badge className="absolute top-2 start-2 bg-blue-500/90 text-white hover:bg-blue-600 backdrop-blur-sm gap-1">
                      <Navigation className="size-3" />
                      {product.distance} km
                    </Badge>
                    {/* Category Badge */}
                    <Badge className="absolute top-2 end-2 bg-emerald-500/90 text-white hover:bg-emerald-600 backdrop-blur-sm">
                      {isRTL ? product.categoryAr : product.category}
                    </Badge>
                    {/* Discount Badge */}
                    {product.originalPrice && (
                      <Badge className="absolute bottom-2 start-2 bg-red-500/90 text-white hover:bg-red-600 backdrop-blur-sm gap-1">
                        <TrendingDown className="size-3" />
                        {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                      </Badge>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4 space-y-3">
                    <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {isRTL ? product.nameAr : product.name}
                    </h3>

                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {formatPrice(product.price, currency)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(product.originalPrice, currency)}
                        </span>
                      )}
                    </div>

                    {/* Seller Info */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="size-3 shrink-0" />
                      <span className="truncate">{isRTL ? product.sellerLocationAr : product.sellerLocation}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">{isRTL ? product.sellerNameAr : product.sellerName}</span>
                      {product.verified && (
                        <ShieldCheck className="size-3.5 text-emerald-500" />
                      )}
                      <div className="flex items-center gap-0.5 ms-auto">
                        <Star className="size-3 text-amber-400 fill-amber-400" />
                        <span className="text-muted-foreground">{product.rating}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1"
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <Navigation className="size-3" />
                        {isRTL ? 'الاتجاهات' : t('getDirections')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs gap-1 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <MessageCircle className="size-3" />
                        {isRTL ? 'تواصل' : t('contact')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Expand Search CTA */}
        {products.length > 0 && selectedDistance < 100 && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              className="gap-2 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              onClick={handleExpandSearch}
            >
              <Expand className="size-4" />
              {isRTL ? 'توسيع البحث لمسافة أبعد' : t('expandSearchFurther')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
