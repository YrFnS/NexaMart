'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  RotateCcw,
  ShoppingBag,
  Star,
  Truck,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type Product, ProductCard } from '@/components/buyer/product-card';
import { StoreReviewsSection } from '@/components/buyer/store-reviews-section';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';

interface PublicStore {
  id: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  descriptionAr?: string | null;
  slug: string;
  logo?: string | null;
  banner?: string | null;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  productCount: number;
  location?: string | null;
  memberSince: string;
  createdAt: string;
  updatedAt: string;
}

interface StorePayload {
  store?: PublicStore;
  similarStores?: PublicStore[];
  error?: string;
}

interface ProductsPayload {
  products?: Product[];
  error?: string;
}

function storeInitial(store: PublicStore): string {
  return store.name.trim().charAt(0).toUpperCase() || 'N';
}

export function StoreProfilePage({ storeId }: { storeId?: string }) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const [store, setStore] = useState<PublicStore | null>(null);
  const [similarStores, setSimilarStores] = useState<PublicStore[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(Boolean(storeId));
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const currentStoreId = storeId;
    if (!currentStoreId) return;

    const controller = new AbortController();

    async function loadStore() {
      setLoading(true);
      setError('');
      try {
        const storeQuery = new URLSearchParams({ id: currentStoreId });
        const productQuery = new URLSearchParams({
          storeId: currentStoreId,
          limit: '24',
          sort: 'newest',
        });
        const [storeResponse, productResponse] = await Promise.all([
          fetch(`/api/stores?${storeQuery.toString()}`, {
            signal: controller.signal,
            cache: 'no-store',
          }),
          fetch(`/api/products?${productQuery.toString()}`, {
            signal: controller.signal,
          }),
        ]);

        const storePayload = (await storeResponse
          .json()
          .catch(() => ({}))) as StorePayload;
        if (!storeResponse.ok || !storePayload.store) {
          throw new Error(storePayload.error || 'Store not found.');
        }

        const productPayload = (await productResponse
          .json()
          .catch(() => ({}))) as ProductsPayload;
        if (!productResponse.ok) {
          throw new Error(
            productPayload.error || 'Failed to load this store’s products.',
          );
        }

        setStore(storePayload.store);
        setSimilarStores(storePayload.similarStores || []);
        setProducts(productPayload.products || []);
      } catch (loadError) {
        if (loadError instanceof Error && loadError.name === 'AbortError') return;
        setStore(null);
        setSimilarStores([]);
        setProducts([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Failed to load store.',
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    const timer = window.setTimeout(() => void loadStore(), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [reloadKey, storeId]);

  const displayName = useMemo(() => {
    if (!store) return '';
    return isRTL && store.nameAr ? store.nameAr : store.name;
  }, [isRTL, store]);
  const description = useMemo(() => {
    if (!store) return '';
    return isRTL && store.descriptionAr
      ? store.descriptionAr
      : store.description || '';
  }, [isRTL, store]);

  if (loading && !store) {
    return (
      <div
        className="container mx-auto flex min-h-[60vh] items-center justify-center px-4"
        aria-busy="true"
      >
        <Loader2
          className="size-9 animate-spin text-amber-600"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!store) {
    return (
      <div
        className="container mx-auto px-4 py-16"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        <Card className="mx-auto max-w-xl">
          <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 text-center">
            <AlertCircle className="size-12 text-red-500" aria-hidden="true" />
            <h1 className="text-2xl font-bold">
              {isRTL ? 'تعذر فتح المتجر' : 'Store unavailable'}
            </h1>
            <p className="text-sm text-muted-foreground" role="alert">
              {error ||
                (isRTL ? 'لم يتم العثور على المتجر.' : 'Store not found.')}
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReloadKey((value) => value + 1)}
              >
                <RefreshCw className="me-2 size-4" aria-hidden="true" />
                {isRTL ? 'إعادة المحاولة' : 'Try again'}
              </Button>
              <Button
                asChild
                className="bg-amber-600 text-white hover:bg-amber-700"
              >
                <Link href="/stores">
                  {isRTL ? 'تصفح المتاجر' : 'Browse stores'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const joinedDate = new Date(store.memberSince);
  const joinedLabel = Number.isNaN(joinedDate.getTime())
    ? '—'
    : new Intl.DateTimeFormat(getLocale(isRTL), {
        year: 'numeric',
        month: 'short',
      }).format(joinedDate);

  return (
    <main
      className="min-h-screen bg-gradient-to-b from-amber-50/40 to-background dark:from-amber-950/10"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto max-w-6xl">
        <div className="relative h-44 overflow-hidden bg-gradient-to-br from-amber-700 via-amber-600 to-orange-600 md:h-56">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_42%)]" />
          <Button
            asChild
            variant="secondary"
            size="icon"
            className="absolute start-4 top-4 z-10 size-11 rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/30"
          >
            <Link
              href="/stores"
              aria-label={isRTL ? 'العودة إلى المتاجر' : 'Back to stores'}
            >
              <ArrowLeft
                className={`size-5 ${isRTL ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </Link>
          </Button>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative z-10 -mt-14 px-4 pb-10">
          <section
            className="rounded-2xl border bg-background/95 p-5 shadow-sm backdrop-blur md:p-6"
            aria-labelledby="store-title"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <Avatar className="size-24 shrink-0 border-4 border-background shadow-lg">
                <AvatarImage src={store.logo || undefined} alt="" />
                <AvatarFallback className="bg-amber-100 text-3xl font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  {storeInitial(store)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1
                    id="store-title"
                    className="text-2xl font-bold md:text-3xl"
                  >
                    {displayName}
                  </h1>
                  {store.isVerified && (
                    <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      <BadgeCheck className="me-1 size-4" aria-hidden="true" />
                      {t('verified')}
                    </Badge>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Star
                      className="size-4 fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                    {store.rating.toFixed(1)} · {store.reviewCount}{' '}
                    {t('reviews')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Package className="size-4" aria-hidden="true" />
                    {store.productCount}{' '}
                    {isRTL ? 'منتج نشط' : 'active products'}
                  </span>
                  {store.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-4" aria-hidden="true" />
                      {store.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="size-4" aria-hidden="true" />
                    {isRTL ? 'منذ' : 'Since'} {joinedLabel}
                  </span>
                </div>

                {description && (
                  <p className="mt-4 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <ShoppingBag
                  className="mt-0.5 size-5 text-amber-600"
                  aria-hidden="true"
                />
                <div>
                  <h2 className="font-semibold">
                    {isRTL ? 'الدفع عند الاستلام' : 'Pay on delivery'}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isRTL
                      ? 'يسجل NexaMart الطلب ولا يجمع الدفعة داخل المنصة.'
                      : 'NexaMart records the order and does not collect payment in the platform.'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <Truck
                  className="mt-0.5 size-5 text-amber-600"
                  aria-hidden="true"
                />
                <div>
                  <h2 className="font-semibold">
                    {isRTL ? 'تتبع مسجل' : 'Recorded tracking'}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isRTL
                      ? 'يضيف البائع الناقل ورقم التتبع عندما تصبح الشحنة جاهزة.'
                      : 'The seller adds the carrier and tracking number when the shipment is dispatched.'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-start gap-3 p-4">
                <RotateCcw
                  className="mt-0.5 size-5 text-amber-600"
                  aria-hidden="true"
                />
                <div>
                  <h2 className="font-semibold">
                    {isRTL ? 'إرجاع مرتبط بالطلب' : 'Order-linked returns'}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isRTL
                      ? 'يرتبط طلب الإرجاع بعنصر الطلب وSKU والكمية الفعلية.'
                      : 'Each return request is tied to the exact order item, SKU, and quantity.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="products" className="mt-7">
            <TabsList className="grid h-auto w-full grid-cols-3 sm:w-fit">
              <TabsTrigger value="products" className="min-h-11">
                {isRTL ? 'المنتجات' : 'Products'}
              </TabsTrigger>
              <TabsTrigger value="reviews" className="min-h-11">
                {t('reviews')}
              </TabsTrigger>
              <TabsTrigger value="about" className="min-h-11">
                {isRTL ? 'معلومات' : 'Information'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products" className="mt-5">
              {products.length === 0 ? (
                <Card>
                  <CardContent className="flex min-h-56 flex-col items-center justify-center text-center text-muted-foreground">
                    <Package
                      className="mb-3 size-11 opacity-40"
                      aria-hidden="true"
                    />
                    {isRTL
                      ? 'لا توجد منتجات نشطة في هذا المتجر.'
                      : 'This store has no active products.'}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="mt-5">
              <StoreReviewsSection
                storeId={store.id}
                storeName={displayName}
              />
            </TabsContent>

            <TabsContent value="about" className="mt-5">
              <Card>
                <CardContent className="space-y-4 p-5 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    {isRTL
                      ? 'تعرض صفحة المتجر المعلومات التي حفظها البائع والمنتجات النشطة والتقييمات المسجلة. لا يفترض NexaMart ساعات عمل أو موعد توصيل أو سياسة مجانية غير محفوظة.'
                      : 'The store page shows seller-provided information, active products, and recorded reviews. NexaMart does not invent business hours, delivery promises, or free-return guarantees.'}
                  </p>
                  <p>
                    {isRTL
                      ? 'يؤكد البائع الطلب قبل التجهيز، ثم يسجل الشحن والتسليم. تتم أي دفعة أو استرداد مالي مباشرةً خارج NexaMart.'
                      : 'The seller confirms the order before preparation, then records shipment and delivery. Any payment or refund is completed directly outside NexaMart.'}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {similarStores.length > 0 && (
            <section className="mt-10" aria-labelledby="similar-stores-title">
              <h2 id="similar-stores-title" className="mb-4 text-xl font-bold">
                {isRTL ? 'متاجر أخرى' : 'Other stores'}
              </h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {similarStores.map((similarStore) => {
                  const similarName =
                    isRTL && similarStore.nameAr
                      ? similarStore.nameAr
                      : similarStore.name;
                  return (
                    <Link
                      key={similarStore.id}
                      href={`/store/${similarStore.id}`}
                      className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                    >
                      <Card className="h-full transition-colors hover:border-amber-400 hover:bg-amber-50/40 dark:hover:border-amber-700 dark:hover:bg-amber-950/20">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="size-11 shrink-0">
                              <AvatarImage
                                src={similarStore.logo || undefined}
                                alt=""
                              />
                              <AvatarFallback className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                                {storeInitial(similarStore)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {similarName}
                              </p>
                              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <Star
                                  className="size-3 fill-amber-400 text-amber-400"
                                  aria-hidden="true"
                                />
                                {similarStore.rating.toFixed(1)} ·{' '}
                                {similarStore.productCount}{' '}
                                {isRTL ? 'منتج' : 'products'}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
