'use client';

import React, { useState, useEffect } from 'react';
import {
  Package, ShieldCheck, Star, Users, ShoppingCart, Filter,
  Monitor, Shirt, Home as HomeIcon, Flower2,
  ChevronDown, ChevronUp, Mail, CheckCircle2, Award,
  Sparkles, ArrowDownUp, Search, Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { formatPrice } from '@/lib/currency';
import { WHOLESALE_CATEGORIES, WHOLESALE_CATEGORY_ICONS, WHOLESALE_CATEGORY_GRADIENTS } from '@/lib/reference-data';

// --- Types ---
interface PriceTier {
  minQty: number;
  maxQty: number | null;
  price: number;
}

interface WholesaleProduct {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  moq: number;
  priceTiers: PriceTier[];
  retailPrice: number;
  rating: number;
  reviewCount: number;
  supplierName: string;
  supplierNameAr: string;
  isVerified: boolean;
  certifications: string[];
  certificationsAr: string[];
  stock: number;
  isFeatured?: boolean;
}

// --- Category Config ---
const wholesaleCategories = WHOLESALE_CATEGORIES;

// Icon mapping (client-side only)

const categoryIconMap: Record<string, React.ElementType> = {
  Monitor,
  Shirt,
  Home: HomeIcon,
  Flower2,
};

const categoryIcons: Record<string, React.ElementType> = Object.fromEntries(
  Object.entries(WHOLESALE_CATEGORY_ICONS).map(([k, v]) => [k, categoryIconMap[v] || Sparkles])
);

const categoryGradients = WHOLESALE_CATEGORY_GRADIENTS;



// --- Placeholder ---
function WholesalePlaceholder({ category, name, nameAr, locale }: { category: string; name: string; nameAr: string; locale: string }) {
  const config = categoryGradients[category] || categoryGradients.electronics;
  const Icon = categoryIcons[category] || Sparkles;
  const displayName = locale === 'ar' ? nameAr : name;

  return (
    <div className={`flex flex-col items-center justify-center h-full bg-gradient-to-br ${config.light} ${config.dark} relative overflow-hidden`}>
      <div className="absolute top-3 end-3 w-12 h-12 rounded-full bg-white/10" />
      <div className="absolute bottom-4 start-3 w-8 h-8 rounded-full bg-white/10" />
      <Icon className={`size-10 ${config.iconColor} mb-2 opacity-60`} />
      <p className="text-xs font-medium text-center px-3 leading-tight max-w-[85%] text-muted-foreground/80 line-clamp-2">{displayName}</p>
    </div>
  );
}

// --- Main Component ---
export function WholesalePage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const isRTL = locale === 'ar';

  const [wholesaleProducts, setWholesaleProducts] = useState<WholesaleProduct[]>([]);
  const [wholesaleLoading, setWholesaleLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('moq');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 50]);
  const [moqFilter, setMoqFilter] = useState('all');
  const [certFilter, setCertFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<WholesaleProduct | null>(null);
  const [rfqSent, setRfqSent] = useState(false);

  useEffect(() => {
    const fetchWholesale = async () => {
      setWholesaleLoading(true);
      try {
        const res = await fetch('/api/wholesale');
        if (res.ok) {
          const data = await res.json();
          setWholesaleProducts(Array.isArray(data) ? data : data.items || data.products || []);
        } else {
          setWholesaleProducts([]);
        }
      } catch {
        setWholesaleProducts([]);
      } finally {
        setWholesaleLoading(false);
      }
    };
    fetchWholesale();
  }, []);

  const filteredProducts = wholesaleProducts.filter((p) => {
    const catMatch = activeCategory === 'all' || p.category === activeCategory;
    const searchMatch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameAr.includes(searchQuery) ||
      p.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
    const priceMatch = p.priceTiers[0].price >= priceRange[0] && p.priceTiers[0].price <= priceRange[1];
    const moqMatch = moqFilter === 'all' ||
      (moqFilter === 'low' && p.moq <= 30) ||
      (moqFilter === 'medium' && p.moq > 30 && p.moq <= 100) ||
      (moqFilter === 'high' && p.moq > 100);
    const certMatch = certFilter === 'all' || p.certifications.includes(certFilter);
    return catMatch && searchMatch && priceMatch && moqMatch && certMatch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'moq': return a.moq - b.moq;
      case 'price-low': return a.priceTiers[0].price - b.priceTiers[0].price;
      case 'price-high': return b.priceTiers[0].price - a.priceTiers[0].price;
      case 'rating': return b.rating - a.rating;
      default: return a.moq - b.moq;
    }
  });

  const allCertifications = Array.from(new Set(wholesaleProducts.flatMap((p) => p.certifications)));

  const handleRFQ = () => {
    setRfqSent(true);
    setTimeout(() => setRfqSent(false), 3000);
  };

  const getDiscount = (retailPrice: number, wholesalePrice: number) => {
    return Math.round(((retailPrice - wholesalePrice) / retailPrice) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        {/* Loading State */}
        {wholesaleLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <div className="aspect-square bg-muted animate-pulse" />
                <CardContent className="p-3 space-y-2">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!wholesaleLoading && wholesaleProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">{t('noResults')}</p>
            <p className="text-sm">{t('ws_noWholesaleAvailable')}</p>
          </div>
        )}

        {!wholesaleLoading && wholesaleProducts.length > 0 && (<>
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="size-7 text-emerald-600" />
              {t('wholesale')}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('ws_bulkBuyingDesc')}
            </p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 rounded-xl h-11">
            <Mail className="size-4" />
            {t('requestQuote')}
          </Button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t('ws_searchWholesale')}
              className="ps-9 h-10 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            className="gap-2 rounded-xl h-10"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="size-4" />
            {t('ws_filters')}
            {showFilters ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </Button>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-44 rounded-xl h-10">
              <ArrowDownUp className="size-4 me-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="moq">{t('ws_lowestMOQ')}</SelectItem>
              <SelectItem value="price-low">{t('ws_priceLowFirst')}</SelectItem>
              <SelectItem value="price-high">{t('ws_priceHighFirst')}</SelectItem>
              <SelectItem value="rating">{t('ws_highestRating')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expandable Filters */}
        {showFilters && (
          <Card className="border-0 shadow-sm p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('minOrderQty')}</p>
                <Select value={moqFilter} onValueChange={setMoqFilter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('ws_allMOQ')}</SelectItem>
                    <SelectItem value="low">{t('ws_1to30units')}</SelectItem>
                    <SelectItem value="medium">{t('ws_31to100units')}</SelectItem>
                    <SelectItem value="high">{t('ws_100plusUnits')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('priceRangePerUnit')}</p>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={0}
                  max={50}
                  step={1}
                  className="mt-3"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t('certifications')}</p>
                <Select value={certFilter} onValueChange={setCertFilter}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('ws_all')}</SelectItem>
                    {allCertifications.map((cert) => (
                      <SelectItem key={cert} value={cert}>{cert}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 px-4 sm:px-0">
          {wholesaleCategories.map((cat) => (
            <Button
              key={cat.value}
              variant={activeCategory === cat.value ? 'default' : 'outline'}
              size="sm"
              className={`rounded-full text-xs ${activeCategory === cat.value ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
              onClick={() => setActiveCategory(cat.value)}
            >
              {isRTL ? cat.labelAr : cat.label}
            </Button>
          ))}
        </div>

        {/* Featured Wholesale Deal */}
        {wholesaleProducts.find((p) => p.isFeatured) && activeCategory === 'all' && (() => {
          const featured = wholesaleProducts.find((p) => p.isFeatured) || wholesaleProducts[0];
          return featured ? (
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="relative bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white">
                <div className="absolute inset-0 bg-black/10" />
                <div className="relative grid md:grid-cols-2 gap-6 p-6 md:p-8 items-center">
                  <div className="space-y-3">
                    <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 text-xs font-bold gap-1">
                      <Award className="size-3" />
                      {t('featuredWholesaleDeal')}
                    </Badge>
                    <h2 className="text-2xl font-bold">
                      {isRTL ? featured.nameAr : featured.name}
                    </h2>
                    <div className="flex items-center gap-3 text-emerald-100">
                      <span className="text-sm">{t('saveUpTo')}</span>
                      <span className="text-3xl font-bold text-yellow-300">
                        {featured.priceTiers.length > 2 ? getDiscount(featured.retailPrice, featured.priceTiers[2].price) : getDiscount(featured.retailPrice, featured.priceTiers[featured.priceTiers.length - 1].price)}%
                      </span>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 space-y-1.5">
                      {featured.priceTiers.map((tier, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-emerald-200">
                            {tier.maxQty
                              ? `${tier.minQty}-${tier.maxQty} ${t('units')}`
                              : `${tier.minQty}+ ${t('units')}`}
                          </span>
                          <span className="font-bold">{formatPrice(tier.price)}/{t('ws_unit')}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold h-11 rounded-xl gap-2"
                      onClick={() => setSelectedProduct(featured)}
                    >
                      <ShoppingCart className="size-4" />
                      {t('ws_orderNow')}
                    </Button>
                  </div>
                  <div className="relative aspect-square max-h-56 mx-auto rounded-xl overflow-hidden">
                    <WholesalePlaceholder
                      category={featured.category}
                      name={featured.name}
                      nameAr={featured.nameAr}
                      locale={locale}
                    />
                  </div>
                </div>
              </div>
            </Card>
          ) : null;
        })()}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const config = categoryGradients[product.category] || categoryGradients.electronics;
            const bestDiscount = getDiscount(product.retailPrice, product.priceTiers[2].price);

            return (
              <Card
                key={product.id}
                className="group border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer overflow-hidden h-full flex flex-col"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="relative aspect-square overflow-hidden">
                  <WholesalePlaceholder
                    category={product.category}
                    name={product.name}
                    nameAr={product.nameAr}
                    locale={locale}
                  />
                  <Badge className="absolute top-2 start-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 gap-0.5">
                    <Package className="size-2.5" />
                    {t('ws_wholesaleBadge')}
                  </Badge>
                  <Badge className="absolute top-2 end-2 bg-red-500 text-white text-[10px] font-bold px-2">
                    -{bestDiscount}%
                  </Badge>
                </div>

                <CardContent className="p-3 space-y-2 flex-1 flex flex-col">
                  <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {isRTL ? product.nameAr : product.name}
                  </h3>

                  {/* Supplier */}
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground truncate">
                      {isRTL ? product.supplierNameAr : product.supplierName}
                    </span>
                    {product.isVerified && (
                      <ShieldCheck className="size-3 text-emerald-500 shrink-0" />
                    )}
                  </div>

                  {/* MOQ Badge */}
                  <Badge variant="secondary" className="text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-0">
                    {`MOQ: ${product.moq} ${t('units')}`}
                  </Badge>

                  {/* Tiered Pricing */}
                  <div className="space-y-1">
                    {product.priceTiers.map((tier, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[10px]">
                        <span className="text-muted-foreground">
                          {tier.maxQty
                            ? `${tier.minQty}-${tier.maxQty}`
                            : `${tier.minQty}+`}
                        </span>
                        <span className={`font-semibold ${idx === product.priceTiers.length - 1 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                          {formatPrice(tier.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex-1" />

                  {/* Rating & Stock */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="size-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium">{product.rating}</span>
                      <span className="text-[10px] text-muted-foreground">({product.reviewCount})</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {product.stock.toLocaleString()} {t('ws_inStock')}
                    </span>
                  </div>

                  {/* Certifications */}
                  <div className="flex flex-wrap gap-1">
                    {product.certifications.slice(0, 2).map((cert) => (
                      <Badge key={cert} variant="outline" className="text-[8px] px-1.5 py-0 h-4">
                        {cert}
                      </Badge>
                    ))}
                    {product.certifications.length > 2 && (
                      <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4">
                        +{product.certifications.length - 2}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 rounded-lg gap-1"
                      onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); }}
                    >
                      <ShoppingCart className="size-3" />
                      {t('ws_order')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 rounded-lg gap-1"
                      onClick={(e) => { e.stopPropagation(); handleRFQ(); }}
                    >
                      <Mail className="size-3" />
                      {t('ws_rfq')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredProducts.length === 0 && wholesaleProducts.length > 0 && (
          <div className="text-center py-16">
            <Package className="size-16 mx-auto text-muted-foreground/20" />
            <h3 className="text-lg font-medium mt-4">{t('noResults')}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {t('ws_noMatchingProducts')}
            </p>
          </div>
        )}
        </>)}
      </div>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => { setSelectedProduct(null); setRfqSent(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="size-5 text-emerald-600" />
                  {isRTL ? selectedProduct.nameAr : selectedProduct.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Image */}
                <div className="relative aspect-video rounded-xl overflow-hidden">
                  <WholesalePlaceholder
                    category={selectedProduct.category}
                    name={selectedProduct.name}
                    nameAr={selectedProduct.nameAr}
                    locale={locale}
                  />
                </div>

                {/* Supplier Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                      <Building2 className="size-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{isRTL ? selectedProduct.supplierNameAr : selectedProduct.supplierName}</p>
                      {selectedProduct.isVerified && (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <ShieldCheck className="size-3" />
                          <span className="text-[10px]">{t('verifiedSupplier')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-0">
                    {`MOQ: ${selectedProduct.moq} ${t('units')}`}
                  </Badge>
                </div>

                <Separator />

                {/* Tiered Pricing */}
                <div>
                  <p className="text-sm font-medium mb-2">{t('tieredPricing')}</p>
                  <div className="bg-muted/50 rounded-xl p-3 space-y-2">
                    {selectedProduct.priceTiers.map((tier, idx) => (
                      <div key={idx} className={`flex justify-between items-center p-2 rounded-lg ${idx === selectedProduct.priceTiers.length - 1 ? 'bg-emerald-50 dark:bg-emerald-950' : ''}`}>
                        <span className="text-sm text-muted-foreground">
                          {tier.maxQty
                            ? `${tier.minQty}-${tier.maxQty} ${t('units')}`
                            : `${tier.minQty}+ ${t('units')}`}
                        </span>
                        <div className="text-end">
                          <span className={`text-sm font-bold ${idx === selectedProduct.priceTiers.length - 1 ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                            {formatPrice(tier.price)}
                          </span>
                          {idx === 0 && (
                            <p className="text-[10px] text-muted-foreground line-through">{formatPrice(selectedProduct.retailPrice)} {t('ws_retail')}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <p className="text-sm font-medium mb-2">{t('certifications')}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.certifications.map((cert) => (
                      <Badge key={cert} variant="outline" className="gap-1 text-xs">
                        <CheckCircle2 className="size-3 text-emerald-500" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Stock & Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-medium">{selectedProduct.rating}</span>
                    <span className="text-xs text-muted-foreground">({selectedProduct.reviewCount} {t('ws_reviews')})</span>
                  </div>
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    {selectedProduct.stock.toLocaleString()} {t('ws_available')}
                  </span>
                </div>

                <Separator />

                {/* Actions */}
                <div className="flex gap-3">
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11 rounded-xl">
                    <ShoppingCart className="size-4" />
                    {t('orderWholesale')}
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 h-11 rounded-xl"
                    onClick={handleRFQ}
                  >
                    <Mail className="size-4" />
                    {t('sendRFQ')}
                  </Button>
                </div>

                {rfqSent && (
                  <div className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 p-3 rounded-lg text-sm text-center font-medium">
                    {t('rfqSent')}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
