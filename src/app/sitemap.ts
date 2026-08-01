import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/config';
import { getSitemapStorefrontData } from '@/lib/storefront-data';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const data = await getSitemapStorefrontData();

  return [
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
    ...data.products.map((product) => ({
      url: `${APP_URL}/product/${product.id}`,
      lastModified: product.updatedAt,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...data.stores.map((store) => ({
      url: `${APP_URL}/store/${store.id}`,
      lastModified: store.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
