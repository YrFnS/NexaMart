import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

function source(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

test('product quick view uses persistent wishlist and authoritative SKU routing', () => {
  const quickView = source('src/components/buyer/product-quick-view.tsx');
  assert.match(quickView, /useWishlistStore/);
  assert.match(quickView, /Choose options/);
  assert.match(quickView, /variantSkus/);
  assert.doesNotMatch(quickView, /setIsWishlisted\(!isWishlisted\)/);
  assert.doesNotMatch(quickView, /from-emerald/);
});

test('product details make no escrow delivery or refund guarantees', () => {
  const info = source(
    'src/components/buyer/product-detail/product-info-section.tsx',
  );
  const supporting = source(
    'src/components/buyer/product-detail/related-products.tsx',
  );
  assert.match(info, /Payment is made directly to the seller on delivery/);
  assert.match(info, /optionIsAvailable/);
  assert.doesNotMatch(info, /escrowNote/);
  assert.doesNotMatch(info, /DEFAULT_SELLER_PHONE/);
  assert.doesNotMatch(info, /orderWithinHours/);
  assert.doesNotMatch(info, /chatWithSeller/);
  assert.doesNotMatch(supporting, /addAllToCart/);
  assert.doesNotMatch(supporting, /Money-back guarantee/);
  assert.doesNotMatch(supporting, /30-day free returns/);
  assert.doesNotMatch(supporting, /Ask a Question/);
  assert.doesNotMatch(supporting, /SHIPPING_CONFIG/);
  assert.match(supporting, /--nexa-mobile-nav-total/);
});

test('store APIs expose bounded public data and server-side product scoping', () => {
  const storesRoute = source('src/app/api/stores/route.ts');
  const productsRoute = source('src/app/api/products/route.ts');
  assert.match(storesRoute, /publicStoreSelect/);
  assert.match(storesRoute, /validatePagination/);
  assert.match(storesRoute, /similarStores/);
  assert.doesNotMatch(storesRoute, /ownerId = searchParams/);
  assert.doesNotMatch(storesRoute, /include: \{ owner/);
  assert.doesNotMatch(storesRoute, /commission: true/);
  assert.match(productsRoute, /storeId = optionalId/);
  assert.match(productsRoute, /\.\.\.\(storeId \? \{ storeId \} : \{\}\)/);
});

test('store pages contain no simulated following or invented service promises', () => {
  const directory = source('src/components/buyer/stores-page.tsx');
  const profile = source('src/components/buyer/store-profile-page.tsx');
  const reviews = source('src/components/buyer/store-reviews-section.tsx');
  assert.doesNotMatch(directory, /followedStores/);
  assert.doesNotMatch(directory, /setFollowBounce/);
  assert.doesNotMatch(profile, /isFollowing/);
  assert.doesNotMatch(profile, /followers/);
  assert.doesNotMatch(profile, /avgResponseTime/);
  assert.doesNotMatch(profile, /Business Hours/);
  assert.doesNotMatch(profile, /Free shipping on orders over/);
  assert.match(profile, /storeId=\{store\.id\}/);
  assert.match(reviews, /storeId/);
  assert.doesNotMatch(reviews, /Review Submitted/);
  assert.doesNotMatch(reviews, /handleSubmitReview/);
});

test('unimplemented follow and saved-search features fail honestly', () => {
  const following = source('src/app/api/followed-stores/route.ts');
  const savedSearches = source('src/app/api/saved-searches/route.ts');
  const savedPage = source('src/components/buyer/saved-searches-page.tsx');
  for (const route of [following, savedSearches]) {
    assert.match(route, /FEATURE_NOT_AVAILABLE/);
    assert.match(route, /status: 410/);
  }
  assert.match(savedPage, /Saved searches are not available yet/);
  assert.doesNotMatch(savedPage, /toggleNotifications/);
  assert.doesNotMatch(savedPage, /newResultsCount/);
});

test('seller marketing is backed by authorized coupon APIs only', () => {
  const marketing = source('src/components/seller/marketing-tools.tsx');
  assert.match(marketing, /fetch\('\/api\/seller\/coupons'/);
  assert.match(marketing, /method: 'POST'/);
  assert.match(marketing, /method: 'PATCH'/);
  assert.match(marketing, /storeId: form\.storeId/);
  assert.doesNotMatch(marketing, /techstore-pro/);
  assert.doesNotMatch(marketing, /Date\.now\(\)/);
  assert.doesNotMatch(marketing, /setFlashSales/);
  assert.doesNotMatch(marketing, /mktBoostNow/);
  assert.doesNotMatch(marketing, /mktCreateCampaign/);
  assert.doesNotMatch(marketing, /bg-emerald/);
});

test('admin dashboard reports operations rather than invented revenue', () => {
  const route = source('src/app/api/admin/dashboard/route.ts');
  const dashboard = source('src/components/admin/admin-dashboard.tsx');
  assert.match(route, /recordedOrderValue/);
  assert.match(route, /orderValueChart/);
  assert.doesNotMatch(route, /0\.1; \/\/ 10% commission estimate/);
  assert.doesNotMatch(route, /platformRevenue/);
  assert.match(dashboard, /Recorded order value is not collected revenue/);
  assert.match(dashboard, /href="\/admin\/orders"/);
  assert.match(dashboard, /href="\/admin\/users"/);
  assert.doesNotMatch(dashboard, /adminViewPayouts/);
  assert.doesNotMatch(dashboard, /<Wallet/);
  assert.doesNotMatch(dashboard, /bg-emerald/);
});
