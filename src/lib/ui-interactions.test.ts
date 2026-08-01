import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

function source(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

test('product cards use sibling links and actions with persistent wishlist state', () => {
  const card = source('src/components/buyer/product-card.tsx');

  assert.match(card, /<article className=/);
  assert.match(card, /useWishlistStore/);
  assert.match(card, /aria-pressed=\{isWishlisted\}/);
  assert.match(card, /loading="lazy"/);
  assert.doesNotMatch(card, /setIsWishlisted/);
  assert.doesNotMatch(card, /loading="eager"/);
  assert.doesNotMatch(
    card,
    /<Link[\s\S]{0,200}className="group relative[\s\S]{0,5000}<Button/,
  );
});

test('wishlist screen exposes only server-backed behavior', () => {
  const wishlist = source('src/components/buyer/wishlist-page.tsx');
  const store = source('src/stores/wishlist-store.ts');

  assert.match(wishlist, /useWishlistStore/);
  assert.match(store, /\/api\/wishlist/);
  assert.match(wishlist, /removeAll\(user\.id\)/);
  assert.doesNotMatch(wishlist, /DEFAULT_COLLECTIONS/);
  assert.doesNotMatch(wishlist, /priceDropAlerts/);
  assert.doesNotMatch(wishlist, /userId=\$\{/);
  assert.doesNotMatch(
    store,
    /JSON\.stringify\(\{[\s\S]{0,300}userId/,
  );
});

test('header and footer omit simulated promotional controls', () => {
  const header = source('src/components/layout/header.tsx');
  const footer = source('src/components/layout/footer.tsx');

  assert.match(header, /aria-label=\{label\('Primary navigation'/);
  assert.match(header, /Search products and stores/);
  assert.doesNotMatch(header, /Quick Demo Login|quickDemoLogin/);
  assert.doesNotMatch(header, /countryCode|CountrySelector|CurrencySelector/);

  assert.match(footer, /does not process payments/i);
  assert.doesNotMatch(footer, /newsletter/i);
  assert.doesNotMatch(footer, /App Store|Google Play|QR/);
});

test('homepage renders bounded server data without simulated urgency', () => {
  const route = source('src/app/(buyer)/page.tsx');
  const home = source('src/components/buyer/home-page.tsx');

  assert.doesNotMatch(route, /'use client'/);
  assert.match(route, /getHomePageData/);
  assert.match(route, /<HomePage initialData=\{initialData\}/);
  assert.match(home, /FeaturedProductsSection/);
  assert.doesNotMatch(home, /fetch\('\/api\//);
  assert.doesNotMatch(home, /FlashSaleBanner/);
  assert.doesNotMatch(home, /Math\.random/);
  assert.doesNotMatch(home, /AIRecommendationsSection/);
  assert.doesNotMatch(home, /NewsletterSection/);
  assert.doesNotMatch(home, /TrendingSearchesSection/);
  assert.doesNotMatch(home, /LocationGuideSection/);
});
