'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Home,
  ShoppingBag,
  Tag,
  Sparkles,
  Store,
  ShoppingCart,
  Heart,
  Package,
  Search,
  TrendingUp,
  Clock,
  ArrowRight,
  LayoutGrid,
  Bot,
  Gavel,
  Boxes,
  Crown,
  Puzzle,
} from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command';
import { useI18n } from '@/lib/i18n';
import { LS_KEYS } from '@/lib/config';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation, type AppView } from '@/lib/use-app-navigation';

interface QuickNav {
  key: string;
  view: AppView;
  icon: React.ReactNode;
  i18nKey: string;
}

const quickNavItems: QuickNav[] = [
  { key: 'home', view: 'home', icon: <Home className="size-4" />, i18nKey: 'home' },
  { key: 'shop', view: 'shop', icon: <ShoppingBag className="size-4" />, i18nKey: 'shop' },
  { key: 'deals', view: 'deals', icon: <Tag className="size-4" />, i18nKey: 'deals' },
  { key: 'ai', view: 'ai-tools', icon: <Sparkles className="size-4" />, i18nKey: 'aiTools' },
  { key: 'cart', view: 'cart', icon: <ShoppingCart className="size-4" />, i18nKey: 'cart' },
  { key: 'wishlist', view: 'wishlist', icon: <Heart className="size-4" />, i18nKey: 'wishlist' },
  { key: 'orders', view: 'orders', icon: <Package className="size-4" />, i18nKey: 'orders' },
  { key: 'categories', view: 'shop', icon: <LayoutGrid className="size-4" />, i18nKey: 'categories' },
  { key: 'auctions', view: 'auctions', icon: <Gavel className="size-4" />, i18nKey: 'auctions' },
  { key: 'wholesale', view: 'wholesale', icon: <Boxes className="size-4" />, i18nKey: 'wholesale' },
  { key: 'loyalty', view: 'subscriptions-loyalty', icon: <Crown className="size-4" />, i18nKey: 'searchNavLoyalty' },
  { key: 'marketplace', view: 'app-marketplace', icon: <Puzzle className="size-4" />, i18nKey: 'appMarketplace' },
  { key: 'seller', view: 'seller-dashboard', icon: <Store className="size-4" />, i18nKey: 'sellerDashboard' },
  { key: 'visual-search', view: 'visual-search', icon: <Search className="size-4" />, i18nKey: 'visualSearch' },
  { key: 'rfq', view: 'rfq-agent', icon: <Bot className="size-4" />, i18nKey: 'rfqAgent' },
];

const trendingSearches = [
  { i18nKey: 'searchTrendingHeadphones' },
  { i18nKey: 'searchTrendingSmartWatch' },
  { i18nKey: 'searchTrendingShoes' },
  { i18nKey: 'searchTrendingLaptop' },
  { i18nKey: 'searchTrendingCases' },
];

const STORAGE_KEY = LS_KEYS.recentSearches;

export function SearchCommand() {
  const { t, dir, locale } = useI18n();
  const { setSearchQuery } = useAppStore();
  const nav = useAppNavigation();
  const [open, setOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // localStorage not available
    }
    return [];
  });

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addRecentSearch = useCallback((query: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s !== query);
      const updated = [query, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage not available
      }
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage not available
    }
  }, []);

  const handleSelect = useCallback(
    (callback: () => void) => {
      setOpen(false);
      callback();
    },
    []
  );

  const handleSearch = useCallback(
    (query: string) => {
      if (query.trim()) {
        addRecentSearch(query.trim());
        setSearchQuery(query.trim());
        nav.setView('search');
      }
      setOpen(false);
    },
    [addRecentSearch, setSearchQuery, nav]
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title={t('commandPalette')}
      description={t('typeToSearch')}
    >
      <CommandInput placeholder={t('typeToSearch')} />
      <CommandList>
        <CommandEmpty>{t('noResults')}</CommandEmpty>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <>
            <CommandGroup
              heading={
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-3" />
                    {t('recentSearches')}
                  </span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {t('clearRecent')}
                  </button>
                </div>
              }
            >
              {recentSearches.map((search) => (
                <CommandItem
                  key={`recent-${search}`}
                  value={`recent-${search}`}
                  onSelect={() => handleSearch(search)}
                >
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span>{search}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Trending Searches */}
        <CommandGroup
          heading={
            <span className="flex items-center gap-1.5">
              <TrendingUp className="size-3" />
              {t('trendingSearches')}
            </span>
          }
        >
          {trendingSearches.map((item, i) => (
            <CommandItem
              key={`trending-${i}`}
              value={`trending-${t(item.i18nKey)}`}
              onSelect={() => handleSearch(t(item.i18nKey))}
            >
              <TrendingUp className="size-3.5 text-emerald-500" />
              <span>{t(item.i18nKey)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />

        {/* Quick Navigation */}
        <CommandGroup
          heading={
            <span className="flex items-center gap-1.5">
              <ArrowRight className="size-3" />
              {t('quickNavigation')}
            </span>
          }
        >
          {quickNavItems.map((item) => (
            <CommandItem
              key={item.key}
              value={`nav-${item.key}`}
              onSelect={() =>
                handleSelect(() => {
                  nav.setView(item.view);
                })
              }
            >
              {item.icon}
              <span>{t(item.i18nKey)}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
