'use client';

import React, { useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft, Home } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { usePathname } from 'next/navigation';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export function BreadcrumbNav() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const pathname = usePathname();
  const currentView = nav.getCurrentView();
  const isRTL = locale === 'ar';
  const Separator = isRTL ? ChevronLeft : ChevronRight;

  const [productName, setProductName] = useState<string | null>(null);

  // Extract product ID from pathname
  const productId = (() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments[0] === 'product' && segments[1]) return segments[1];
    return null;
  })();

  // Fetch product name for breadcrumb when on product detail page
  useEffect(() => {
    if (currentView === 'product' && productId) {
      let cancelled = false;
      fetch(`/api/products?id=${productId}`)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          if (data?.name) {
            setProductName(locale === 'ar' && data.nameAr ? data.nameAr : data.name);
          } else if (Array.isArray(data) && data[0]?.name) {
            const p = data[0];
            setProductName(locale === 'ar' && p.nameAr ? p.nameAr : p.name);
          }
        })
        .catch(() => {
          if (!cancelled) return;
        });
      return () => { cancelled = true; };
    }
  }, [currentView, productId, locale]);

  // Reset product name when leaving product view
  const isProductView = currentView === 'product';
  const effectiveProductName = isProductView ? productName : null;

  // Build breadcrumb items based on current view
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const crumbs: BreadcrumbItem[] = [
      { label: t('home'), onClick: () => nav.setView('home') },
    ];

    switch (currentView) {
      case 'shop':
        crumbs.push({ label: t('shop') });
        break;
      case 'product':
        crumbs.push({ label: t('shop'), onClick: () => nav.setView('shop') });
        if (effectiveProductName) {
          crumbs.push({ label: effectiveProductName });
        } else {
          crumbs.push({ label: t('description') });
        }
        break;
      case 'deals':
        crumbs.push({ label: t('deals') });
        break;
      case 'cart':
        crumbs.push({ label: t('cart') });
        break;
      case 'checkout':
        crumbs.push({ label: t('cart'), onClick: () => nav.setView('cart') });
        crumbs.push({ label: t('checkout') });
        break;
      case 'orders':
        crumbs.push({ label: t('orders') });
        break;
      case 'wishlist':
        crumbs.push({ label: t('wishlist') });
        break;
      case 'profile':
        crumbs.push({ label: t('profile') });
        break;
      case 'ai-tools':
        crumbs.push({ label: t('aiTools') });
        break;
      case 'search':
        crumbs.push({ label: t('search') });
        break;
      case 'compare':
        crumbs.push({ label: t('compare') });
        break;
      case 'chat':
        crumbs.push({ label: t('chat') });
        break;
      case 'safety-tips':
        crumbs.push({ label: t('safetyTipsNav') });
        break;
      case 'returns':
        crumbs.push({ label: t('returnsAndRefunds') });
        break;
      case 'near-me':
        crumbs.push({ label: t('nearMe') });
        break;
      case 'price-alerts':
        crumbs.push({ label: t('priceAlerts') });
        break;
      case 'help-center':
        crumbs.push({ label: t('helpCenterNav') });
        break;
      default:
        break;
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Don't show breadcrumb on home page
  if (currentView === 'home') return null;

  return (
    <nav aria-label="Breadcrumb" className="container mx-auto px-4 py-3">
      <ol className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <li key={index} className="flex items-center gap-1.5">
              {index > 0 && (
                <Separator className="size-3.5 text-muted-foreground/50" />
              )}
              {index === 0 && (
                <Home className="size-3.5 text-muted-foreground me-0.5" />
              )}
              {isLast ? (
                <span className="font-medium text-emerald-600 dark:text-emerald-400 truncate max-w-[200px]">
                  {crumb.label}
                </span>
              ) : (
                <button
                  onClick={crumb.onClick}
                  className="text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate max-w-[200px]"
                >
                  {crumb.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
