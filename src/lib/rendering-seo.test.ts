import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

function source(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

test('primary storefront routes render their data on the server', () => {
  const home = source('src/app/(buyer)/page.tsx');
  const shop = source('src/app/(buyer)/shop/page.tsx');
  const stores = source('src/app/(buyer)/stores/page.tsx');
  const product = source('src/app/(buyer)/product/[id]/page.tsx');
  const store = source('src/app/(buyer)/store/[id]/page.tsx');

  for (const route of [home, shop, stores, product, store]) {
    assert.doesNotMatch(route, /['"]use client['"]/);
  }

  assert.match(home, /getHomePageData/);
  assert.match(shop, /getProductListingData/);
  assert.match(stores, /getStoreListingData/);
  assert.match(product, /getProductDetailData/);
  assert.match(product, /generateMetadata/);
  assert.match(product, /initialData=\{initialData\}/);
  assert.match(store, /getStorePageData/);
  assert.match(store, /generateMetadata/);
  assert.match(store, /initialData=\{initialData\}/);
});

test('storefront data is bounded, serialized, and review counts are grouped', () => {
  const data = source('src/lib/storefront-data.ts');
  const reviewApi = source('src/app/api/store-reviews/route.ts');

  assert.match(data, /take: 24/);
  assert.match(data, /Number\(product\.price\)/);
  assert.match(data, /toISOString\(\)/);
  assert.match(data, /storeReview\.groupBy/);
  assert.match(reviewApi, /storeReview\.groupBy/);
  assert.doesNotMatch(reviewApi, /rating: 5 \}\) \}\),/);
  assert.doesNotMatch(data, /Math\.random/);
});

test('metadata, crawler files, structured data, and PWA branding are present', () => {
  const layout = source('src/app/layout.tsx');
  const robots = source('src/app/robots.ts');
  const sitemap = source('src/app/sitemap.ts');
  const openGraphImage = source('src/app/opengraph-image.tsx');
  const manifest = source('public/manifest.json');
  const product = source('src/app/(buyer)/product/[id]/page.tsx');
  const store = source('src/app/(buyer)/store/[id]/page.tsx');

  assert.match(layout, /metadataBase: new URL\(APP_URL\)/);
  assert.match(layout, /export const viewport: Viewport/);
  assert.match(layout, /title: \{/);
  assert.doesNotMatch(
    layout,
    /alternates:\s*\{\s*canonical:\s*['"]\/['"]\s*\}/,
  );
  assert.match(robots, /sitemap\.xml/);
  assert.match(robots, /disallow/);
  assert.match(sitemap, /getSitemapStorefrontData/);
  assert.match(sitemap, /MAX_SITEMAP_URLS = 50_000/);
  assert.match(sitemap, /availableDynamicSlots/);
  assert.match(openGraphImage, /new ImageResponse/);
  assert.match(openGraphImage, /Pay on delivery/);
  assert.match(manifest, /Multi-Vendor Marketplace/);
  assert.match(manifest, /#d97706/);
  assert.doesNotMatch(manifest, /AI-Powered/);
  assert.match(product, /application\/ld\+json/);
  assert.match(product, /'@type': 'Product'/);
  assert.match(store, /application\/ld\+json/);
  assert.match(store, /'@type': 'Store'/);
});

test('Next.js request protection uses the proxy convention', () => {
  const proxy = source('src/proxy.ts');

  assert.match(proxy, /export async function proxy/);
  assert.match(proxy, /matcher: \['\/api\/:path\*'\]/);
  assert.equal(existsSync(join(process.cwd(), 'src/middleware.ts')), false);
});
