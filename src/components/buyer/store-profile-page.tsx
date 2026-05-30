'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft, Star, MapPin, MessageCircle, Heart, BadgeCheck, Package,
  Clock, Truck, RotateCcw, Shield, Store, Users, Calendar,
  ChevronDown, ChevronUp, TrendingUp, Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useAppStore } from '@/stores/app-store';
import { ProductCard, Product } from '@/components/buyer/product-card';
import { StoreReviewsSection } from '@/components/buyer/store-reviews-section';


interface StoreData {
  id: string;
  name: string;
  nameAr?: string | null;
  description: string;
  descriptionAr?: string | null;
  logo: string;
  banner: string;
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  productCount: number;
  memberSince: string;
  location: string;
  locationAr?: string | null;
  followers: number;
}

interface StoreReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

interface SimilarStore {
  id: string;
  name: string;
  nameAr?: string | null;
  logo?: string | null;
  rating: number;
  productCount: number;
  isVerified: boolean;
  location?: string;
  locationAr?: string | null;
}

// Store stat card component
function StoreStatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="size-4 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function StoreProfilePage({ storeId }: { storeId?: string }) {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const selectedStoreId = storeId;
  const isRTL = locale === 'ar';

  const [store, setStore] = useState<StoreData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [similarStores, setSimilarStores] = useState<SimilarStore[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      try {
        if (selectedStoreId) {
          const res = await fetch('/api/stores');
          const data = await res.json();
          const storesArr = data.stores || data;
          const found = storesArr.find((s: StoreData & { id: string }) => s.id === selectedStoreId);
          if (found) {
            setStore({
              ...found,
              description: found.description || '',
              descriptionAr: found.descriptionAr || '',
              banner: found.banner || '',
              logo: found.logo || '',
              rating: found.rating || 0,
              reviewCount: found.reviewCount || 0,
              isVerified: found.isVerified ?? false,
              productCount: found.productCount || 0,
              memberSince: found.memberSince || '',
              location: found.location || '',
              followers: found.followers || 0,
            });

            // Get similar stores (other stores excluding current, up to 4)
            const similar = storesArr
              .filter((s: StoreData & { id: string }) => s.id !== selectedStoreId)
              .slice(0, 4)
              .map((s: Record<string, unknown>) => ({
                id: s.id as string,
                name: (s.name as string) || '',
                nameAr: (s.nameAr as string) || null,
                logo: (s.logo as string) || null,
                rating: (s.rating as number) || 0,
                productCount: (s.productCount as number) || 0,
                isVerified: (s.isVerified as boolean) || false,
                location: (s.location as string) || '',
                locationAr: (s.locationAr as string) || null,
              }));
            setSimilarStores(similar);
          }
        }

        const prodRes = await fetch(`/api/products${selectedStoreId ? `?storeId=${selectedStoreId}&limit=8` : '?limit=8'}`);
        const prodData = await prodRes.json();
        if (prodData.products && prodData.products.length > 0) {
          setProducts(prodData.products.slice(0, 8));
        }

        // Fetch reviews from API
        const reviewRes = await fetch(`/api/store-reviews${selectedStoreId ? `?storeId=${selectedStoreId}` : ''}`);
        if (reviewRes.ok) {
          const reviewData = await reviewRes.json();
          if (reviewData.reviews) {
            setReviews(reviewData.reviews.map((r: Record<string, unknown>) => ({
              id: r.id as string,
              userName: (r.userName as string) || 'Anonymous',
              rating: (r.rating as number) || 0,
              comment: (r.comment as string) || '',
              date: (r.date as string) || '',
            })));
          }
        }
      } catch {
        // API error — leave state empty
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [selectedStoreId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="animate-pulse space-y-4 w-full max-w-6xl mx-auto px-4">
          <div className="h-48 bg-muted rounded-xl" />
          <div className="h-20 bg-muted rounded-xl" />
          <div className="grid grid-cols-4 gap-4">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-64 bg-muted rounded-xl" />)}</div>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center space-y-3">
          <Store className="size-16 mx-auto text-muted-foreground/20" />
          <p className="text-lg font-medium text-muted-foreground">
            {isRTL ? 'لم يتم العثور على المتجر' : 'Store not found'}
          </p>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`size-4 ${i < Math.floor(rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
      />
    ));
  };

  // Compute store stats
  const memberYear = store.memberSince ? new Date(store.memberSince).getFullYear() : null;
  const yearsActive = memberYear ? new Date().getFullYear() - memberYear : 0;
  const avgResponseTime = isRTL ? 'ساعتين' : '2 hours';
  const storeDescription = isRTL && store.descriptionAr ? store.descriptionAr : store.description;
  const isLongDescription = storeDescription.length > 200;

  // Store stats cards data
  const storeStats = [
    {
      icon: Package,
      label: isRTL ? 'عدد المنتجات' : 'Products',
      value: store.productCount,
      color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    },
    {
      icon: Star,
      label: isRTL ? 'التقييم' : 'Rating',
      value: store.rating > 0 ? store.rating.toFixed(1) : '—',
      color: 'bg-gradient-to-br from-amber-500 to-orange-600',
    },
    {
      icon: Timer,
      label: isRTL ? 'وقت الاستجابة' : 'Response Time',
      value: avgResponseTime,
      color: 'bg-gradient-to-br from-blue-500 to-cyan-600',
    },
    {
      icon: Calendar,
      label: isRTL ? 'سنوات النشاط' : 'Years Active',
      value: yearsActive > 0 ? `${yearsActive}+` : isRTL ? 'جديد' : 'New',
      color: 'bg-gradient-to-br from-purple-500 to-violet-600',
    },
  ];

  // Gradients for similar store cards
  const storeGradients = [
    'from-blue-500 to-cyan-500',
    'from-pink-500 to-rose-500',
    'from-amber-500 to-orange-500',
    'from-emerald-500 to-teal-500',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Banner */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700">
          <div className="absolute inset-0 bg-black/20" />
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-4 start-4 z-10 size-9 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white"
            onClick={() => nav.setView('shop')}
          >
            <ArrowLeft className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background" />
        </div>

        {/* Store Info */}
        <div className="container px-4 -mt-16 relative z-10">
          <div className="flex flex-col sm:flex-row items-start gap-4 mb-6">
            <Avatar className="size-20 border-4 border-background shadow-lg">
              <AvatarImage src={store.logo} />
              <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 text-2xl font-bold">
                {store.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{store.name}</h1>
                {store.isVerified && <BadgeCheck className="size-6 text-emerald-500" />}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1">
                  {renderStars(store.rating)}
                  <span className="text-sm font-medium ms-1">{store.rating}</span>
                  <span className="text-xs text-muted-foreground">({store.reviewCount.toLocaleString()})</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Package className="size-3.5" />
                  {store.productCount} {isRTL ? 'منتج' : 'products'}
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {store.location}
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3.5" />
                  {store.followers.toLocaleString()} {isRTL ? 'متابع' : 'followers'}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t('memberSince')} {store.memberSince}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={isFollowing ? 'secondary' : 'default'}
                className={isFollowing ? '' : 'bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5'}
                onClick={() => setIsFollowing(!isFollowing)}
              >
                <Heart className={`size-4 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`} />
                {isFollowing ? (isRTL ? 'متابَع' : 'Following') : (isRTL ? 'متابعة' : 'Follow')}
              </Button>
              <Button variant="outline" className="gap-1.5" onClick={() => nav.setView('chat')}>
                <MessageCircle className="size-4" />
                {t('chatWithSeller')}
              </Button>
            </div>
          </div>

          {/* Store Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {storeStats.map((stat) => (
              <StoreStatCard
                key={stat.label}
                icon={stat.icon}
                label={stat.label}
                value={stat.value}
                color={stat.color}
              />
            ))}
          </div>

          {/* Store Description with expand/collapse */}
          {storeDescription && (
            <Card className="border-0 shadow-sm mb-6">
              <CardContent className="p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Store className="size-4 text-emerald-600" />
                  {isRTL ? 'عن المتجر' : 'About the Store'}
                </h3>
                <p className={`text-sm text-muted-foreground leading-relaxed ${!descriptionExpanded && isLongDescription ? 'line-clamp-3' : ''}`}>
                  {storeDescription}
                </p>
                {isLongDescription && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 text-xs gap-1 px-0"
                    onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  >
                    {descriptionExpanded
                      ? (isRTL ? 'عرض أقل' : 'Show less')
                      : (isRTL ? 'قراءة المزيد' : 'Read more')
                    }
                    {descriptionExpanded
                      ? <ChevronUp className="size-3" />
                      : <ChevronDown className="size-3" />
                    }
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tabs */}
          <Tabs defaultValue="products">
            <TabsList className="mb-6">
              <TabsTrigger value="products">{isRTL ? 'المنتجات' : 'Products'}</TabsTrigger>
              <TabsTrigger value="reviews">{t('reviews')}</TabsTrigger>
              <TabsTrigger value="about">{isRTL ? 'حول' : 'About'}</TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products">
              {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                  <Package className="size-12 text-muted-foreground/20" />
                  <p className="text-sm text-muted-foreground">
                    {isRTL ? 'لا توجد منتجات في هذا المتجر بعد' : 'No products in this store yet'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews">
              <StoreReviewsSection
                storeName={store.name}
                overallRating={store.rating}
                totalReviews={store.reviewCount}
              />
            </TabsContent>

            {/* About Tab */}
            <TabsContent value="about">
              <div className="max-w-2xl space-y-4">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Store className="size-4 text-emerald-600" />
                        {isRTL ? 'عن المتجر' : 'About the Store'}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{storeDescription || (isRTL ? 'لا يوجد وصف' : 'No description available')}</p>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Truck className="size-4 text-emerald-600" />
                        {t('shippingPolicy')}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isRTL
                          ? 'شحن مجاني للطلبات فوق 50$. توصيل سريع خلال 2-5 أيام عمل. شحن دولي متاح لمعظم الدول.'
                          : 'Free shipping on orders over $50. Express delivery within 2-5 business days. International shipping available to most countries.'}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <RotateCcw className="size-4 text-emerald-600" />
                        {t('returnPolicy')}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isRTL
                          ? 'إرجاع مجاني خلال 30 يوم. استرداد كامل للمنتجات غير المفتوحة. استبدال أو إصلاح للمنتجات المعيبة.'
                          : '30-day free returns. Full refund for unopened items. Replacement or repair for defective products.'}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Clock className="size-4 text-emerald-600" />
                        {isRTL ? 'ساعات العمل' : 'Business Hours'}
                      </h3>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{isRTL ? 'الأحد - الخميس: 9:00 ص - 9:00 م' : 'Sunday - Thursday: 9:00 AM - 9:00 PM'}</p>
                        <p>{isRTL ? 'الجمعة: 2:00 م - 9:00 م' : 'Friday: 2:00 PM - 9:00 PM'}</p>
                        <p>{isRTL ? 'السبت: 10:00 ص - 6:00 م' : 'Saturday: 10:00 AM - 6:00 PM'}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex items-center gap-2 text-sm text-emerald-600">
                      <Shield className="size-4" />
                      {isRTL ? 'متجر موثق - هوية البائع مؤكدة' : 'Verified Store — Seller identity confirmed'}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Similar Stores Section */}
        {similarStores.length > 0 && (
          <section className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500 shrink-0" />
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/70">
                <Store className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                {isRTL ? 'متاجر مشابهة' : 'Similar Stores'}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similarStores.map((similarStore, idx) => (
                <Link key={similarStore.id} href={`/store/${similarStore.id}`}>
                  <Card className="border border-border hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 hover:-translate-y-1 group overflow-hidden cursor-pointer">
                    <CardContent className="p-4">
                      {/* Store logo/initial */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${storeGradients[idx % storeGradients.length]} flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform duration-300 shrink-0`}>
                          {similarStore.logo ? (
                            <img
                              src={similarStore.logo}
                              alt={similarStore.name}
                              className="w-full h-full object-cover rounded-xl"
                              onError={(e) => {
                                const img = e.currentTarget;
                                if (!img.dataset.retried) {
                                  img.dataset.retried = 'true';
                                  img.style.display = 'none';
                                  const parent = img.parentElement;
                                  if (parent) {
                                    parent.textContent = similarStore.name.charAt(0).toUpperCase();
                                  }
                                }
                              }}
                            />
                          ) : (
                            similarStore.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium truncate">{isRTL && similarStore.nameAr ? similarStore.nameAr : similarStore.name}</span>
                            {similarStore.isVerified && <BadgeCheck className="size-3.5 text-emerald-500 shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} className={`size-2.5 ${i < Math.floor(similarStore.rating) ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20'}`} />
                            ))}
                            <span className="text-[10px] font-medium ms-0.5">{(similarStore.rating ?? 0).toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      {/* Product count & location */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Package className="size-3" />
                          <span>{similarStore.productCount} {isRTL ? 'منتج' : 'products'}</span>
                        </div>
                        {similarStore.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            <span className="truncate max-w-[80px]">{isRTL && similarStore.locationAr ? similarStore.locationAr : similarStore.location}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
