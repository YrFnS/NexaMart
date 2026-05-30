'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCallback } from 'react';

export type AppView =
  | 'home'
  | 'shop'
  | 'product'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'wishlist'
  | 'chat'
  | 'seller-dashboard'
  | 'admin'
  | 'ai-tools'
  | 'visual-search'
  | 'rfq-agent'
  | 'profile'
  | 'auth'
  | 'search'
  | 'store-profile'
  | 'deals'
  | 'compare'
  | 'order-tracking'
  | 'seller-onboarding'
  | 'auctions'
  | 'wholesale'
  | 'subscriptions-loyalty'
  | 'app-marketplace'
  | 'installments'
  | 'reels'
  | 'properties'
  | 'jobs'
  | 'quick-post'
  | 'cars'
  | 'services'
  | 'safety-tips'
  | 'shipping'
  | 'promote-listing'
  | 'returns'
  | 'near-me'
  | 'price-alerts'
  | 'help-center'
  | 'saved-searches'
  | 'stores'
  | 'my-reviews';

// Map view names to Next.js route paths
const viewToUrl: Record<string, string> = {
  home: '/',
  shop: '/shop',
  product: '/product',
  cart: '/cart',
  checkout: '/checkout',
  orders: '/orders',
  wishlist: '/wishlist',
  chat: '/chat',
  'seller-dashboard': '/seller/dashboard',
  admin: '/admin',
  'ai-tools': '/ai-tools',
  'visual-search': '/ai/visual-search',
  'rfq-agent': '/ai/rfq',
  profile: '/profile',
  auth: '/auth',
  search: '/search',
  'store-profile': '/store',
  deals: '/deals',
  compare: '/compare',
  'order-tracking': '/order-tracking',
  'seller-onboarding': '/seller/onboarding',
  auctions: '/auctions',
  wholesale: '/wholesale',
  'subscriptions-loyalty': '/loyalty',
  'app-marketplace': '/apps',
  installments: '/installments',
  reels: '/reels',
  properties: '/properties',
  jobs: '/jobs',
  'quick-post': '/post-ad',
  cars: '/cars',
  services: '/services',
  'safety-tips': '/safety',
  shipping: '/shipping',
  'promote-listing': '/promote',
  returns: '/returns',
  'near-me': '/near-me',
  'price-alerts': '/price-alerts',
  'help-center': '/help',
  'saved-searches': '/saved-searches',
  stores: '/stores',
  'my-reviews': '/my-reviews',
};

/**
 * Get the URL path for a given view name. Use this with `<Link href={getViewUrl('shop')}>`.
 */
export function getViewUrl(view: string): string {
  return viewToUrl[view] || '/';
}

export function useAppNavigation() {
  const router = useRouter();
  const pathname = usePathname();

  const setView = useCallback(
    (view: AppView | string) => {
      const url = viewToUrl[view] || '/';
      router.push(url);
    },
    [router]
  );

  const selectProduct = useCallback(
    (id: string) => {
      router.push(`/product/${id}`);
    },
    [router]
  );

  const selectStore = useCallback(
    (id: string) => {
      router.push(`/store/${id}`);
    },
    [router]
  );

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  const getCurrentView = useCallback((): AppView => {
    // Parse pathname to determine current view
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return 'home';

    const first = segments[0];
    switch (first) {
      case 'shop':
        return 'shop';
      case 'product':
        return 'product';
      case 'cart':
        return 'cart';
      case 'checkout':
        return 'checkout';
      case 'orders':
        return 'orders';
      case 'wishlist':
        return 'wishlist';
      case 'chat':
        return 'chat';
      case 'seller':
        if (segments[1] === 'onboarding') return 'seller-onboarding';
        return 'seller-dashboard';
      case 'admin':
        return 'admin';
      case 'ai-tools':
        return 'ai-tools';
      case 'ai':
        if (segments[1] === 'visual-search') return 'visual-search';
        if (segments[1] === 'rfq') return 'rfq-agent';
        return 'ai-tools';
      case 'profile':
        return 'profile';
      case 'auth':
        return 'auth';
      case 'search':
        return 'search';
      case 'store':
        return 'store-profile';
      case 'deals':
        return 'deals';
      case 'compare':
        return 'compare';
      case 'order-tracking':
        return 'order-tracking';
      case 'auctions':
        return 'auctions';
      case 'wholesale':
        return 'wholesale';
      case 'loyalty':
        return 'subscriptions-loyalty';
      case 'apps':
        return 'app-marketplace';
      case 'installments':
        return 'installments';
      case 'reels':
        return 'reels';
      case 'properties':
        return 'properties';
      case 'jobs':
        return 'jobs';
      case 'post-ad':
        return 'quick-post';
      case 'cars':
        return 'cars';
      case 'services':
        return 'services';
      case 'safety':
        return 'safety-tips';
      case 'shipping':
        return 'shipping';
      case 'promote':
        return 'promote-listing';
      case 'returns':
        return 'returns';
      case 'near-me':
        return 'near-me';
      case 'price-alerts':
        return 'price-alerts';
      case 'help':
        return 'help-center';
      case 'saved-searches':
        return 'saved-searches';
      case 'stores':
        return 'stores';
      case 'my-reviews':
        return 'my-reviews';
      default:
        return 'home';
    }
  }, [pathname]);

  return {
    setView,
    selectProduct,
    selectStore,
    goBack,
    getCurrentView,
    pathname,
  };
}
