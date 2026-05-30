'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Search, X, Clock, TrendingUp, ArrowRight, Sparkles,
  ShoppingBag, Store, Grid3X3, FileSearch, Loader2,
  SlidersHorizontal, ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { LS_KEYS } from '@/lib/config';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation, getViewUrl } from '@/lib/use-app-navigation';
import { ProductCard, Product } from '@/components/buyer/product-card';
import { SavedSearches } from '@/components/common/saved-searches';

const LS_RECENT_KEY = LS_KEYS.recentSearches;
const MAX_RECENT = 5;

const trendingSearches = [
  { en: 'Summer dresses', ar: 'فستانات صيفية' },
  { en: 'Gaming laptop', ar: 'لابتوب جيمنج' },
  { en: 'Air purifier', ar: 'منقي الهواء' },
  { en: 'Mechanical keyboard', ar: 'كيبورد ميكانيكي' },
  { en: 'Sunglasses', ar: 'نظارات شمسية' },
  { en: 'Yoga mat', ar: 'سجادة يوغا' },
  { en: 'Coffee maker', ar: 'ماكينة قهوة' },
  { en: 'Backpack', ar: 'حقيبة ظهر' },
];

const popularCategories = [
  { id: 'electronics', name: 'Electronics', nameAr: 'إلكترونيات', icon: '📱', color: 'from-blue-100 to-cyan-100 dark:from-blue-950 dark:to-cyan-950' },
  { id: 'fashion', name: 'Fashion', nameAr: 'أزياء', icon: '👗', color: 'from-pink-100 to-rose-100 dark:from-pink-950 dark:to-rose-950' },
  { id: 'home', name: 'Home & Garden', nameAr: 'المنزل والحديقة', icon: '🏠', color: 'from-amber-100 to-orange-100 dark:from-amber-950 dark:to-orange-950' },
  { id: 'beauty', name: 'Beauty', nameAr: 'الجمال', icon: '💄', color: 'from-purple-100 to-fuchsia-100 dark:from-purple-950 dark:to-fuchsia-950' },
  { id: 'sports', name: 'Sports', nameAr: 'رياضة', icon: '⚽', color: 'from-green-100 to-lime-100 dark:from-green-950 dark:to-lime-950' },
  { id: 'toys', name: 'Toys & Games', nameAr: 'ألعاب', icon: '🎮', color: 'from-red-100 to-pink-100 dark:from-red-950 dark:to-pink-950' },
  { id: 'automotive', name: 'Automotive', nameAr: 'سيارات', icon: '🚗', color: 'from-slate-100 to-gray-100 dark:from-slate-950 dark:to-gray-950' },
  { id: 'books', name: 'Books', nameAr: 'كتب', icon: '📚', color: 'from-yellow-100 to-amber-100 dark:from-yellow-950 dark:to-amber-950' },
];

type ResultTab = 'all' | 'products' | 'stores' | 'categories';
type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'rating';

export function SearchPage() {
  const { t, locale } = useI18n();
  const { searchQuery: appSearchQuery, setSearchQuery, selectCategory } = useAppStore();
  const nav = useAppNavigation();
  const isRTL = locale === 'ar';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [didYouMean, setDidYouMean] = useState('');
  const [resultTab, setResultTab] = useState<ResultTab>('all');
  const [showDropdown, setShowDropdown] = useState(false);
  const [localRecentSearches, setLocalRecentSearches] = useState<string[]>([]);
  const [searchError, setSearchError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [sortOption, setSortOption] = useState<SortOption>('relevance');
  const [showFilters, setShowFilters] = useState(false);

  // Categories extracted from search results
  const resultCategories = useMemo(() => {
    const catSet = new Map<string, { id: string; name: string }>();
    results.forEach((p) => {
      const cat = p.category;
      if (cat && cat.id && !catSet.has(cat.id)) {
        catSet.set(cat.id, { id: cat.id, name: cat.name });
      }
    });
    return Array.from(catSet.values());
  }, [results]);

  // Filtered and sorted results
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category?.id === selectedCategory);
    }

    // Price range filter
    filtered = filtered.filter(
      (p) => p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Sort
    switch (sortOption) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        // Products already come in newest order from API
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      default:
        // relevance - keep API order
        break;
    }

    return filtered;
  }, [results, selectedCategory, priceRange, sortOption]);

  // Load recent searches from localStorage and read URL query param
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_RECENT_KEY);
      if (stored) {
        setLocalRecentSearches(JSON.parse(stored));
      }
    } catch {
      // ignore
    }

    // Read URL query parameter ?q=...
    const urlParams = new URLSearchParams(window.location.search);
    const urlQuery = urlParams.get('q') || '';

    // If navigated from header search, use the stored query
    if (appSearchQuery.trim()) {
      setQuery(appSearchQuery);
      performSearch(appSearchQuery);
      saveRecentSearch(appSearchQuery);
      setSearchQuery(''); // Clear to prevent re-triggering
    } else if (urlQuery.trim()) {
      // If navigated directly via URL with ?q= parameter
      setQuery(urlQuery);
      performSearch(urlQuery);
      saveRecentSearch(urlQuery);
    }
  }, []);

  // Save recent search to localStorage
  const saveRecentSearch = useCallback((searchText: string) => {
    setLocalRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== searchText.toLowerCase());
      const updated = [searchText, ...filtered].slice(0, MAX_RECENT);
      try {
        localStorage.setItem(LS_RECENT_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Did you mean
  useEffect(() => {
    if (query.length >= 3) {
      const misspellMap: Record<string, string> = {
        'hedphones': 'headphones',
        'earbds': 'earbuds',
        'smatwatch': 'smartwatch',
        'laptp': 'laptop',
        'sneekers': 'sneakers',
      };
      const lower = query.toLowerCase();
      if (misspellMap[lower]) {
        setDidYouMean(misspellMap[lower]);
      } else {
        setDidYouMean('');
      }
    } else {
      setDidYouMean('');
    }
  }, [query]);

  // Search suggestions based on query
  const searchSuggestions = query.length >= 2
    ? [
        ...trendingSearches.filter(s =>
          s.en.toLowerCase().includes(query.toLowerCase()) ||
          s.ar.includes(query)
        ).slice(0, 3),
      ].filter((v, i, a) => a.findIndex(x => x.en === v.en) === i)
    : [];

  // Debounced search function
  const debouncedSearch = useCallback((searchText: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      performSearch(searchText);
    }, 300);
  }, []);

  const performSearch = async (searchText: string) => {
    if (!searchText.trim()) return;
    setIsSearching(true);
    setSearchError(false);
    setShowSuggestions(false);
    setShowDropdown(false);

    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(searchText)}&limit=20`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        setResults(data.products);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
      setSearchError(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (searchText: string) => {
    if (!searchText.trim()) return;
    setQuery(searchText);
    saveRecentSearch(searchText);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    performSearch(searchText);
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (value.length === 0) {
      setShowSuggestions(true);
      setResults([]);
      setShowDropdown(false);
    } else {
      setShowDropdown(true);
      // Debounced search as user types
      if (value.length >= 2) {
        debouncedSearch(value);
      }
    }
  };

  const handleCategoryClick = (catId: string) => {
    selectCategory(catId);
    nav.setView('shop');
  };

  const clearRecentSearches = () => {
    setLocalRecentSearches([]);
    try {
      localStorage.removeItem(LS_RECENT_KEY);
    } catch {
      // ignore
    }
  };

  const removeRecentSearch = (searchText: string) => {
    setLocalRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== searchText);
      try {
        localStorage.setItem(LS_RECENT_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setPriceRange([0, 5000]);
    setSortOption('relevance');
  };

  const hasActiveFilters = selectedCategory !== 'all' || priceRange[0] > 0 || priceRange[1] < 5000 || sortOption !== 'relevance';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Search Bar with Suggestions Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Search className={`absolute top-1/2 -translate-y-1/2 size-5 text-muted-foreground z-10 ${isRTL ? 'right-4' : 'left-4'}`} />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(query); }}
            onFocus={() => { if (query.length >= 2) setShowDropdown(true); }}
            placeholder={isRTL ? 'ابحث عن منتجات، علامات تجارية...' : 'Search products, brands...'}
            className={`text-lg h-14 rounded-2xl ${isRTL ? 'pr-12' : 'pl-12'} pe-12 shadow-sm`}
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-1/2 -translate-y-1/2 size-8 ${isRTL ? 'left-2' : 'right-2'}`}
              onClick={() => { setQuery(''); setShowSuggestions(true); setResults([]); setShowDropdown(false); }}
            >
              <X className="size-4" />
            </Button>
          )}

          {/* Search Suggestions Dropdown */}
          {showDropdown && searchSuggestions.length > 0 && (
            <div className="absolute top-full mt-2 inset-x-0 bg-card border border-border rounded-xl shadow-lg z-30 overflow-hidden">
              <div className="p-3 space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 mb-1">
                  {isRTL ? 'اقتراحات' : 'Suggestions'}
                </p>
                {searchSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    className="w-full text-start px-3 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center gap-2 text-sm"
                    onClick={() => handleSearch(isRTL ? suggestion.ar : suggestion.en)}
                  >
                    <Search className="size-3.5 text-muted-foreground" />
                    <span>{isRTL ? suggestion.ar : suggestion.en}</span>
                    <ArrowRight className={`size-3 text-muted-foreground ms-auto ${isRTL ? 'rotate-180' : ''}`} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Did you mean? */}
        {didYouMean && !showSuggestions && (
          <div className="text-sm text-muted-foreground">
            {isRTL ? 'هل تقصد:' : 'Did you mean:'}{' '}
            <button
              className="text-emerald-600 font-medium hover:underline"
              onClick={() => handleSearch(didYouMean)}
            >
              {didYouMean}
            </button>
          </div>
        )}

        {/* Error state */}
        {searchError && !isSearching && (
          <div className="text-center py-8">
            <p className="text-sm text-red-500">
              {isRTL ? 'حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.' : 'An error occurred while searching. Please try again.'}
            </p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => handleSearch(query)}>
              {isRTL ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </div>
        )}

        {/* Suggestions (before search) */}
        {showSuggestions && (
          <div className="space-y-6">
            {/* Recent Searches from localStorage */}
            {localRecentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {isRTL ? 'بحثات أخيرة' : 'Recent Searches'}
                    </h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-red-500 hover:text-red-600"
                    onClick={clearRecentSearches}
                  >
                    {isRTL ? 'مسح الكل' : 'Clear all'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {localRecentSearches.map((search, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors gap-1 py-1.5 px-3 group"
                      onClick={() => handleSearch(search)}
                    >
                      <Clock className="size-3 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                      {search}
                      <button
                        className="ms-1 hover:text-red-500 transition-colors"
                        onClick={(e) => { e.stopPropagation(); removeRecentSearch(search); }}
                      >
                        <X className="size-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Searches */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="size-4 text-emerald-600" />
                <h3 className="text-sm font-medium">{t('trendingSearches')}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((search, i) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors gap-1 py-1.5 px-3"
                    onClick={() => handleSearch(isRTL ? search.ar : search.en)}
                  >
                    <TrendingUp className="size-3 text-emerald-500" />
                    {isRTL ? search.ar : search.en}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Popular Categories */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="size-4 text-emerald-600" />
                <h3 className="text-sm font-medium">{isRTL ? 'الفئات الشائعة' : 'Popular Categories'}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {popularCategories.map((cat) => (
                  <Card
                    key={cat.id}
                    className="border-0 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden"
                    onClick={() => handleCategoryClick(cat.id)}
                  >
                    <CardContent className={`p-4 text-center bg-gradient-to-br ${cat.color}`}>
                      <div className="text-2xl mb-1">{cat.icon}</div>
                      <p className="text-sm font-medium">{isRTL ? cat.nameAr : cat.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Saved Searches - shown when not actively searching */}
        {!query && !isSearching && (
          <SavedSearches />
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="size-5 text-emerald-500 animate-spin" />
              <p className="text-sm text-muted-foreground">
                {isRTL ? 'جاري البحث...' : 'Searching...'}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {!isSearching && results.length > 0 && !showSuggestions && (
          <div className="space-y-4">
            {/* Results header with count and filters toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? `${filteredResults.length} نتيجة لـ "${query}"`
                  : `${filteredResults.length} results for "${query}"`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant={showFilters ? 'secondary' : 'outline'}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="size-3.5" />
                  {t('filter')}
                  {hasActiveFilters && (
                    <span className="size-2 rounded-full bg-emerald-500" />
                  )}
                </Button>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="text-xs text-red-500 hover:text-red-600" onClick={clearFilters}>
                    {t('clearFilters')}
                  </Button>
                )}
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setShowSuggestions(true); setQuery(''); setResults([]); }}>
                  {isRTL ? 'بحث جديد' : 'New Search'}
                </Button>
              </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <Card className="border border-border">
                <CardContent className="p-4 space-y-4">
                  {/* Sort Options */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('sortBy')}</label>
                    <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">{t('sortRelevance')}</SelectItem>
                        <SelectItem value="price-asc">{t('priceLowHigh')}</SelectItem>
                        <SelectItem value="price-desc">{t('priceHighLow')}</SelectItem>
                        <SelectItem value="newest">{t('newest')}</SelectItem>
                        <SelectItem value="rating">{t('bestRating')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category Filter Chips */}
                  {resultCategories.length > 0 && (
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">{t('categories')}</label>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant={selectedCategory === 'all' ? 'default' : 'outline'}
                          className={`cursor-pointer transition-colors ${selectedCategory === 'all' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}`}
                          onClick={() => setSelectedCategory('all')}
                        >
                          {isRTL ? 'الكل' : 'All'}
                        </Badge>
                        {resultCategories.map((cat) => (
                          <Badge
                            key={cat.id}
                            variant={selectedCategory === cat.id ? 'default' : 'outline'}
                            className={`cursor-pointer transition-colors ${selectedCategory === cat.id ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}`}
                            onClick={() => setSelectedCategory(cat.id)}
                          >
                            {cat.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Price Range Slider */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-muted-foreground">{t('priceRange')}</label>
                      <span className="text-xs text-emerald-600 font-medium">
                        {priceRange[0]} - {priceRange[1]} {isRTL ? 'ر.س' : 'USD'}
                      </span>
                    </div>
                    <Slider
                      min={0}
                      max={5000}
                      step={50}
                      value={priceRange}
                      onValueChange={(value) => setPriceRange(value as [number, number])}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Result Type Tabs */}
            <Tabs value={resultTab} onValueChange={(v) => setResultTab(v as ResultTab)}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="all" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Search className="size-3.5" />
                  {isRTL ? 'الكل' : 'All'}
                </TabsTrigger>
                <TabsTrigger value="products" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <ShoppingBag className="size-3.5" />
                  {isRTL ? 'منتجات' : 'Products'}
                </TabsTrigger>
                <TabsTrigger value="stores" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Store className="size-3.5" />
                  {isRTL ? 'متاجر' : 'Stores'}
                </TabsTrigger>
                <TabsTrigger value="categories" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <Grid3X3 className="size-3.5" />
                  {isRTL ? 'فئات' : 'Categories'}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {(resultTab === 'all' || resultTab === 'products') && (
              <>
                {filteredResults.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredResults.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'لا توجد منتجات مطابقة للفلاتر المحددة' : 'No products match the selected filters'}
                    </p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={clearFilters}>
                      {t('clearFilters')}
                    </Button>
                  </div>
                )}
              </>
            )}

            {resultTab === 'stores' && (
              <div className="text-center py-8">
                <Store className="size-12 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'لا توجد متاجر مطابقة حالياً' : 'No matching stores at the moment'}
                </p>
              </div>
            )}

            {resultTab === 'categories' && (
              <div className="text-center py-8">
                <Grid3X3 className="size-12 mx-auto text-muted-foreground/20 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'لا توجد فئات مطابقة حالياً' : 'No matching categories at the moment'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {!isSearching && results.length === 0 && query && !showSuggestions && !searchError && (
          <div className="text-center py-16">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
                <FileSearch className="size-10 text-emerald-300 dark:text-emerald-700" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <X className="size-3 text-red-500" />
              </div>
            </div>
            <h3 className="text-lg font-medium">
              {isRTL
                ? `لم يتم العثور على نتائج لـ "${query}"`
                : `No results found for "${query}"`}
            </h3>
            <div className="mt-4 space-y-2">
              {didYouMean && (
                <p className="text-sm">
                  {isRTL ? 'هل تقصد:' : 'Did you mean:'}{' '}
                  <button className="text-emerald-600 font-medium hover:underline" onClick={() => handleSearch(didYouMean)}>
                    {didYouMean}
                  </button>
                </p>
              )}
              <div className="text-sm text-muted-foreground">
                <p>{isRTL ? 'نصائح:' : 'Tips:'}</p>
                <ul className="list-disc ps-4 mt-1 space-y-0.5">
                  <li>{isRTL ? 'تحقق من الإملاء' : 'Check your spelling'}</li>
                  <li>{isRTL ? 'استخدم كلمات أكثر عمومية' : 'Use more general terms'}</li>
                  <li>{isRTL ? 'جرب كلمات مختلفة' : 'Try different keywords'}</li>
                </ul>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {trendingSearches.slice(0, 4).map((search, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                    onClick={() => handleSearch(isRTL ? search.ar : search.en)}
                  >
                    {isRTL ? search.ar : search.en}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
