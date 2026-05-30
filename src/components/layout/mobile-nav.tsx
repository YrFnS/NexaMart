'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Zap, ShoppingCart, UserCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { getViewUrl, type AppView } from '@/lib/use-app-navigation';
import { useCartStore } from '@/stores/cart-store';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  icon: React.ElementType;
  label: string;
  view: AppView;
  badge?: number;
}

export function MobileNav() {
  const { t, dir } = useI18n();
  const pathname = usePathname();
  const { getItemCount } = useCartStore();

  const itemCount = getItemCount();

  const navItems: NavItem[] = [
    {
      icon: Home,
      label: t('home'),
      view: 'home',
    },
    {
      icon: ShoppingBag,
      label: t('shop'),
      view: 'shop',
    },
    {
      icon: Zap,
      label: t('deals'),
      view: 'deals',
    },
    {
      icon: ShoppingCart,
      label: t('cart'),
      view: 'cart',
      badge: itemCount,
    },
    {
      icon: UserCircle,
      label: t('profile'),
      view: 'profile',
    },
  ];

  const isActive = (view: AppView) => {
    const viewUrl = getViewUrl(view);
    // Home is active only on exact root path
    if (view === 'home') return pathname === '/';
    // Shop is active for shop and related sub-pages
    if (view === 'shop') return pathname === '/shop' || pathname.startsWith('/product') || pathname.startsWith('/auctions') || pathname.startsWith('/wholesale') || pathname.startsWith('/compare') || pathname.startsWith('/reels') || pathname.startsWith('/properties');
    if (view === 'deals') return pathname === '/deals' || pathname.startsWith('/installments');
    if (view === 'cart') return pathname === '/cart' || pathname.startsWith('/checkout');
    if (view === 'profile') return pathname === '/profile' || pathname.startsWith('/auth') || pathname.startsWith('/orders') || pathname.startsWith('/wishlist') || pathname.startsWith('/loyalty') || pathname.startsWith('/order-tracking') || pathname.startsWith('/jobs');
    // Generic fallback
    return pathname === viewUrl || (viewUrl !== '/' && pathname.startsWith(viewUrl));
  };

  return (
    <nav
      dir={dir()}
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-background/95 backdrop-blur-md border-t border-border"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.view);
          return (
            <Link
              key={item.view}
              href={getViewUrl(item.view)}
              className={`
                relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-full
                transition-colors duration-200
                ${
                  active
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <div className="relative">
                <item.icon
                  className={`size-5 transition-all duration-200 ${
                    active ? 'scale-110' : ''
                  }`}
                />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge className="absolute -top-2 -right-3 size-4 p-0 flex items-center justify-center text-[9px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span
                className={`text-[10px] leading-tight font-medium ${
                  active ? 'font-semibold' : ''
                }`}
              >
                {item.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
