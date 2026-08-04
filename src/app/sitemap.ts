import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/config';
import { getSitemapStorefrontData } from '@/lib/storefront-data';

export const revalidate = 3600;

const MAX_SITEMAP_URLS = 50_000;
const MAX_PRODUCT_URLS = 40_000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const data = await getSitemapStorefrontData();
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: APP_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${APP_URL}/shop`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${APP_URL}/stores`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  const availableDynamicSlots = Math.max(
    0,
    MAX_SITEMAP_URLS - staticEntries.length,
  );
  const products = data.products.slice(
    0,
    Math.min(MAX_PRODUCT_URLS, availableDynamicSlots),
  );
  const remainingStoreSlots = Math.max(
    0,
    availableDynamicSlots - products.length,
  );
  const stores = data.stores.slice(0, remainingStoreSlots);

  return [
    ...staticEntries,
    ...products.map((product) => ({
      url: `${APP_URL}/product/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...stores.map((store) => ({
      url: `${APP_URL}/store/${store.id}`,
      lastModified: store.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
