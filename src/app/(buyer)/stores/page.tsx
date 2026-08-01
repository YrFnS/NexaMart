import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package,
  Search,
  Star,
  Store,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { APP_NAME, APP_URL } from '@/lib/config';
import { getStoreListingData, jsonLd } from '@/lib/storefront-data';
import type { StoreListingQuery, StoreSort } from '@/lib/storefront-types';
import { LOCALE_COOKIE, normalizeLocale } from '@/lib/locale';

export const metadata: Metadata = {
  title: 'Store directory',
  description:
    'Browse independent stores, their active products, recorded ratings, and seller-provided marketplace information.',
  alternates: { canonical: '/stores' },
};

type RawSearchParams = Record<
  string,
  string | string[] | undefined
>;

interface StoresRouteProps {
  searchParams: Promise<RawSearchParams>;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function boundedInteger(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function boundedRating(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.min(5, parsed)
    : undefined;
}

function boundedText(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 120) : undefined;
}

const validSorts = new Set<StoreSort>(['rating', 'products', 'newest']);

function parseQuery(raw: RawSearchParams): StoreListingQuery {
  const rawSort = first(raw.sort) as StoreSort | undefined;
  return {
    page: boundedInteger(first(raw.page), 1, 1, 100_000),
    limit: 18,
    search: boundedText(first(raw.search)),
    minRating: boundedRating(first(raw.minRating)),
    verifiedOnly: first(raw.verified) === 'true',
    sort: rawSort && validSorts.has(rawSort) ? rawSort : 'rating',
  };
}

function storesHref(query: StoreListingQuery, page: number): string {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (query.search) params.set('search', query.search);
  if (query.minRating !== undefined) {
    params.set('minRating', String(query.minRating));
  }
  if (query.verifiedOnly) params.set('verified', 'true');
  if (query.sort !== 'rating') params.set('sort', query.sort);
  const value = params.toString();
  return value ? `/stores?${value}` : '/stores';
}

export default async function StoresRoute({ searchParams }: StoresRouteProps) {
  const query = parseQuery(await searchParams);
  const data = await getStoreListingData(query);
  if (data.total > 0 && query.page > data.pages) {
    redirect(storesHref(query, data.pages));
  }

  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const isRTL = locale === 'ar';
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Stores on ${APP_NAME}`,
    numberOfItems: data.total,
    itemListElement: data.stores.map((store, index) => ({
      '@type': 'ListItem',
      position: (query.page - 1) * query.limit + index + 1,
      name: store.name,
      url: `${APP_URL}/store/${store.id}`,
    })),
  };

  return (
    <main
      className="min-h-screen bg-gradient-to-b from-amber-50/40 to-background dark:from-amber-950/10"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(itemListSchema) }}
      />
      <div className="container mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-8">
        <header className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <Store className="size-7 text-amber-600" aria-hidden="true" />
            {isRTL ? 'دليل المتاجر' : 'Store directory'}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {isRTL
              ? 'تصفح معلومات البائعين المحفوظة والمنتجات النشطة والتقييمات المسجلة فعلياً.'
              : 'Browse seller-provided information, active products, and ratings actually recorded for each store.'}
          </p>
        </header>

        <Card className="mb-6">
          <CardContent className="p-4">
            <form
              action="/stores"
              method="get"
              className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem_11rem_10rem_auto]"
            >
              <label className="relative block">
                <span className="sr-only">
                  {isRTL ? 'البحث في المتاجر' : 'Search stores'}
                </span>
                <Search
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  name="search"
                  defaultValue={query.search || ''}
                  placeholder={isRTL ? 'اسم المتجر أو الموقع' : 'Store name or location'}
                  className="h-11 w-full rounded-md border bg-background ps-9 pe-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                />
              </label>

              <label>
                <span className="sr-only">
                  {isRTL ? 'أدنى تقييم' : 'Minimum rating'}
                </span>
                <select
                  name="minRating"
                  defaultValue={String(query.minRating || 0)}
                  className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="0">{isRTL ? 'كل التقييمات' : 'All ratings'}</option>
                  <option value="3">3.0+</option>
                  <option value="4">4.0+</option>
                  <option value="4.5">4.5+</option>
                </select>
              </label>

              <label>
                <span className="sr-only">
                  {isRTL ? 'حالة التوثيق' : 'Verification'}
                </span>
                <select
                  name="verified"
                  defaultValue={query.verifiedOnly ? 'true' : 'false'}
                  className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="false">{isRTL ? 'كل المتاجر' : 'All stores'}</option>
                  <option value="true">
                    {isRTL ? 'المتاجر الموثقة' : 'Verified stores'}
                  </option>
                </select>
              </label>

              <label>
                <span className="sr-only">
                  {isRTL ? 'ترتيب المتاجر' : 'Sort stores'}
                </span>
                <select
                  name="sort"
                  defaultValue={query.sort}
                  className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="rating">
                    {isRTL ? 'الأعلى تقييماً' : 'Highest rated'}
                  </option>
                  <option value="products">
                    {isRTL ? 'الأكثر منتجات' : 'Most products'}
                  </option>
                  <option value="newest">
                    {isRTL ? 'الأحدث' : 'Newest'}
                  </option>
                </select>
              </label>

              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-md bg-amber-600 px-5 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              >
                {isRTL ? 'تطبيق' : 'Apply'}
              </button>
            </form>
            {(query.search ||
              query.minRating !== undefined ||
              query.verifiedOnly ||
              query.sort !== 'rating') && (
              <div className="mt-3">
                <Link
                  href="/stores"
                  className="text-sm font-medium text-amber-700 hover:underline dark:text-amber-300"
                >
                  {isRTL ? 'مسح الفلاتر' : 'Clear filters'}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {isRTL
              ? `${data.total.toLocaleString('ar-IQ')} متجر مطابق`
              : `${data.total.toLocaleString('en-US')} matching stores`}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.page} / {data.pages}
          </p>
        </div>

        {data.stores.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
              <Store
                className="mb-4 size-14 text-muted-foreground/30"
                aria-hidden="true"
              />
              <h2 className="text-lg font-semibold">
                {isRTL ? 'لا توجد متاجر مطابقة' : 'No matching stores'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {isRTL
                  ? 'غيّر البحث أو الفلاتر لعرض متاجر أخرى.'
                  : 'Adjust the search or filters to view other stores.'}
              </p>
              <Link
                href="/stores"
                className="mt-4 inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
              >
                {isRTL ? 'عرض كل المتاجر' : 'View all stores'}
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.stores.map((store) => {
              const displayName =
                isRTL && store.nameAr ? store.nameAr : store.name;
              const description =
                isRTL && store.descriptionAr
                  ? store.descriptionAr
                  : store.description;
              return (
                <Link
                  key={store.id}
                  href={`/store/${store.id}`}
                  className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                >
                  <Card className="h-full transition-colors hover:border-amber-400 hover:bg-amber-50/40 dark:hover:border-amber-700 dark:hover:bg-amber-950/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="size-12 shrink-0 border border-amber-200 dark:border-amber-900">
                          <AvatarImage src={store.logo || undefined} alt="" />
                          <AvatarFallback className="bg-amber-100 font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                            {store.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <h2 className="truncate text-sm font-semibold">
                              {displayName}
                            </h2>
                            {store.isVerified && (
                              <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                                <BadgeCheck
                                  className="me-1 size-3"
                                  aria-hidden="true"
                                />
                                {isRTL ? 'موثّق' : 'Verified'}
                              </Badge>
                            )}
                          </div>
                          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <Star
                              className="size-3 fill-amber-400 text-amber-400"
                              aria-hidden="true"
                            />
                            {store.rating.toFixed(1)} · {store.reviewCount}{' '}
                            {isRTL ? 'تقييم' : 'reviews'}
                          </p>
                        </div>
                      </div>

                      {description && (
                        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {description}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                          <Package className="size-3" aria-hidden="true" />
                          {store.productCount} {isRTL ? 'منتج' : 'products'}
                        </span>
                        {store.location && (
                          <span className="flex min-w-0 items-center gap-1">
                            <MapPin
                              className="size-3 shrink-0"
                              aria-hidden="true"
                            />
                            <span className="truncate">{store.location}</span>
                          </span>
                        )}
                        <span className="ms-auto text-amber-700 dark:text-amber-300">
                          {isRTL ? (
                            <ChevronLeft className="size-4" aria-hidden="true" />
                          ) : (
                            <ChevronRight className="size-4" aria-hidden="true" />
                          )}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {data.pages > 1 && (
          <nav
            className="mt-8 flex items-center justify-center gap-3"
            aria-label={isRTL ? 'صفحات المتاجر' : 'Store pages'}
          >
            {data.page > 1 ? (
              <Link
                href={storesHref(query, data.page - 1)}
                className="inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
              >
                {isRTL ? 'السابق' : 'Previous'}
              </Link>
            ) : (
              <span className="inline-flex min-h-11 items-center rounded-md border px-4 text-sm text-muted-foreground opacity-50">
                {isRTL ? 'السابق' : 'Previous'}
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              {data.page} / {data.pages}
            </span>
            {data.page < data.pages ? (
              <Link
                href={storesHref(query, data.page + 1)}
                className="inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
              >
                {isRTL ? 'التالي' : 'Next'}
              </Link>
            ) : (
              <span className="inline-flex min-h-11 items-center rounded-md border px-4 text-sm text-muted-foreground opacity-50">
                {isRTL ? 'التالي' : 'Next'}
              </span>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}
