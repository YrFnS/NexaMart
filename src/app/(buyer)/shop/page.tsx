import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PackageSearch, Search, SlidersHorizontal } from 'lucide-react';
import { ServerProductGrid } from '@/components/buyer/server-product-grid';
import { Card, CardContent } from '@/components/ui/card';
import { APP_DESCRIPTION, APP_NAME, APP_URL } from '@/lib/config';
import {
  jsonLd,
  getProductListingData,
} from '@/lib/storefront-data';
import type {
  ProductListingQuery,
  ProductSort,
} from '@/lib/storefront-types';
import {
  LOCALE_COOKIE,
  normalizeLocale,
} from '@/lib/locale';

export const metadata: Metadata = {
  title: 'Shop products',
  description:
    'Browse active products from independent stores and place pay-on-delivery orders through NexaMart.',
  alternates: { canonical: '/shop' },
};

type RawSearchParams = Record<
  string,
  string | string[] | undefined
>;

interface ShopRouteProps {
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

function boundedNumber(
  value: string | undefined,
  minimum: number,
  maximum: number,
): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function boundedText(
  value: string | undefined,
  maximum: number,
): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, maximum) : undefined;
}

const validSorts = new Set<ProductSort>([
  'newest',
  'price-asc',
  'price-desc',
  'rating',
  'popular',
]);

function parseQuery(raw: RawSearchParams): ProductListingQuery {
  const rawSort = first(raw.sort) as ProductSort | undefined;
  const minPrice = boundedNumber(first(raw.minPrice), 0, 10_000_000);
  const maxPrice = boundedNumber(first(raw.maxPrice), 0, 10_000_000);

  return {
    page: boundedInteger(first(raw.page), 1, 1, 100_000),
    limit: 12,
    categoryId: boundedText(first(raw.category), 64),
    search: boundedText(first(raw.search), 120),
    sort: rawSort && validSorts.has(rawSort) ? rawSort : 'newest',
    minPrice:
      minPrice !== undefined &&
      (maxPrice === undefined || minPrice <= maxPrice)
        ? minPrice
        : undefined,
    maxPrice:
      maxPrice !== undefined &&
      (minPrice === undefined || minPrice <= maxPrice)
        ? maxPrice
        : undefined,
    minRating: boundedNumber(first(raw.minRating), 0, 5),
    freeShipping: first(raw.freeShipping) === 'true',
    b2bOnly: first(raw.b2b) === 'true',
    onSale: first(raw.sale) === 'true',
  };
}

function shopHref(query: ProductListingQuery, page: number): string {
  const params = new URLSearchParams();
  if (page > 1) params.set('page', String(page));
  if (query.categoryId) params.set('category', query.categoryId);
  if (query.search) params.set('search', query.search);
  if (query.sort !== 'newest') params.set('sort', query.sort);
  if (query.minPrice !== undefined) {
    params.set('minPrice', String(query.minPrice));
  }
  if (query.maxPrice !== undefined) {
    params.set('maxPrice', String(query.maxPrice));
  }
  if (query.minRating !== undefined && query.minRating > 0) {
    params.set('minRating', String(query.minRating));
  }
  if (query.freeShipping) params.set('freeShipping', 'true');
  if (query.b2bOnly) params.set('b2b', 'true');
  if (query.onSale) params.set('sale', 'true');
  const value = params.toString();
  return value ? `/shop?${value}` : '/shop';
}

export default async function ShopRoute({ searchParams }: ShopRouteProps) {
  const raw = await searchParams;
  const query = parseQuery(raw);
  const data = await getProductListingData(query);
  if (data.total > 0 && query.page > data.pages) {
    redirect(shopHref(query, data.pages));
  }

  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const isRTL = locale === 'ar';
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Products on ${APP_NAME}`,
    numberOfItems: data.total,
    itemListElement: data.products.map((product, index) => ({
      '@type': 'ListItem',
      position: (query.page - 1) * query.limit + index + 1,
      name: product.name,
      url: `${APP_URL}/product/${product.id}`,
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
      <div className="container mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-8">
        <header className="mb-6">
          <h1 className="flex items-center gap-2 text-2xl font-bold md:text-3xl">
            <PackageSearch className="size-7 text-amber-600" aria-hidden="true" />
            {isRTL ? 'تصفح المنتجات' : 'Browse products'}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {isRTL
              ? 'اعثر على المنتجات النشطة من المتاجر المختلفة، ثم اختر الخيارات والكمية قبل تسجيل طلب الدفع عند الاستلام.'
              : APP_DESCRIPTION}
          </p>
        </header>

        <Card className="mb-6">
          <CardContent className="p-4">
            <form action="/shop" method="get" className="space-y-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(10rem,1fr)_minmax(10rem,1fr)]">
                <label className="relative block">
                  <span className="sr-only">
                    {isRTL ? 'البحث عن منتج' : 'Search products'}
                  </span>
                  <Search
                    className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    name="search"
                    defaultValue={query.search || ''}
                    placeholder={isRTL ? 'ابحث بالاسم أو SKU' : 'Search by name or SKU'}
                    className="h-11 w-full rounded-md border bg-background ps-9 pe-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-amber-500"
                  />
                </label>

                <label>
                  <span className="sr-only">
                    {isRTL ? 'الفئة' : 'Category'}
                  </span>
                  <select
                    name="category"
                    defaultValue={query.categoryId || ''}
                    className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">
                      {isRTL ? 'كل الفئات' : 'All categories'}
                    </option>
                    {data.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {isRTL && category.nameAr
                          ? category.nameAr
                          : category.name}{' '}
                        ({category.productCount})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="sr-only">
                    {isRTL ? 'ترتيب المنتجات' : 'Sort products'}
                  </span>
                  <select
                    name="sort"
                    defaultValue={query.sort}
                    className="h-11 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="newest">
                      {isRTL ? 'الأحدث' : 'Newest'}
                    </option>
                    <option value="popular">
                      {isRTL ? 'الأكثر طلباً' : 'Most ordered'}
                    </option>
                    <option value="rating">
                      {isRTL ? 'الأعلى تقييماً' : 'Highest rated'}
                    </option>
                    <option value="price-asc">
                      {isRTL ? 'السعر: من الأقل' : 'Price: low to high'}
                    </option>
                    <option value="price-desc">
                      {isRTL ? 'السعر: من الأعلى' : 'Price: high to low'}
                    </option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <label className="text-xs text-muted-foreground">
                  {isRTL ? 'أدنى سعر' : 'Minimum price'}
                  <input
                    type="number"
                    name="minPrice"
                    min="0"
                    step="0.01"
                    defaultValue={query.minPrice}
                    className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground"
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  {isRTL ? 'أعلى سعر' : 'Maximum price'}
                  <input
                    type="number"
                    name="maxPrice"
                    min="0"
                    step="0.01"
                    defaultValue={query.maxPrice}
                    className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground"
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  {isRTL ? 'أدنى تقييم' : 'Minimum rating'}
                  <select
                    name="minRating"
                    defaultValue={String(query.minRating || 0)}
                    className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground"
                  >
                    <option value="0">{isRTL ? 'الكل' : 'All'}</option>
                    <option value="3">3.0+</option>
                    <option value="4">4.0+</option>
                    <option value="4.5">4.5+</option>
                  </select>
                </label>

                <fieldset className="flex flex-wrap items-end gap-x-4 gap-y-2 sm:col-span-2">
                  <legend className="sr-only">
                    {isRTL ? 'فلاتر إضافية' : 'Additional filters'}
                  </legend>
                  <label className="flex min-h-10 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="sale"
                      value="true"
                      defaultChecked={query.onSale}
                    />
                    {isRTL ? 'تخفيض' : 'On sale'}
                  </label>
                  <label className="flex min-h-10 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="freeShipping"
                      value="true"
                      defaultChecked={query.freeShipping}
                    />
                    {isRTL ? 'شحن مجاني مسجل' : 'Recorded free shipping'}
                  </label>
                  <label className="flex min-h-10 items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="b2b"
                      value="true"
                      defaultChecked={query.b2bOnly}
                    />
                    B2B
                  </label>
                </fieldset>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-amber-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                >
                  <SlidersHorizontal className="me-2 size-4" aria-hidden="true" />
                  {isRTL ? 'تطبيق الفلاتر' : 'Apply filters'}
                </button>
                <Link
                  href="/shop"
                  className="inline-flex min-h-11 items-center justify-center rounded-md border px-5 text-sm font-medium hover:bg-muted"
                >
                  {isRTL ? 'مسح الفلاتر' : 'Clear filters'}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {isRTL
              ? `${data.total.toLocaleString('ar-IQ')} منتج مطابق`
              : `${data.total.toLocaleString('en-US')} matching products`}
          </p>
          <p className="text-xs text-muted-foreground">
            {isRTL
              ? `الصفحة ${data.page} من ${data.pages}`
              : `Page ${data.page} of ${data.pages}`}
          </p>
        </div>

        {data.products.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-72 flex-col items-center justify-center text-center">
              <PackageSearch
                className="mb-4 size-14 text-muted-foreground/30"
                aria-hidden="true"
              />
              <h2 className="text-lg font-semibold">
                {isRTL ? 'لا توجد منتجات مطابقة' : 'No matching products'}
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {isRTL
                  ? 'جرّب تغيير البحث أو إزالة بعض الفلاتر.'
                  : 'Adjust the search or remove some filters.'}
              </p>
              <Link
                href="/shop"
                className="mt-4 inline-flex min-h-11 items-center rounded-md border px-4 text-sm font-medium hover:bg-muted"
              >
                {isRTL ? 'عرض كل المنتجات' : 'View all products'}
              </Link>
            </CardContent>
          </Card>
        ) : (
          <ServerProductGrid products={data.products} />
        )}

        {data.pages > 1 && (
          <nav
            className="mt-8 flex items-center justify-center gap-3"
            aria-label={isRTL ? 'صفحات المنتجات' : 'Product pages'}
          >
            {data.page > 1 ? (
              <Link
                href={shopHref(query, data.page - 1)}
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
                href={shopHref(query, data.page + 1)}
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
