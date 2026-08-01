import type { MetadataRoute } from 'next';
import { APP_URL } from '@/lib/config';
import { isSearchIndexingAllowed } from '@/lib/deployment';

export default function robots(): MetadataRoute.Robots {
  if (!isSearchIndexingAllowed()) {
    return {
      rules: [
        {
          userAgent: '*',
          disallow: '/',
        },
      ],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/seller/',
          '/checkout',
          '/orders',
          '/profile',
          '/wishlist',
          '/notifications',
          '/auth',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
