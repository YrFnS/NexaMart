'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Bell,
  BellOff,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Clock,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { getViewUrl } from '@/lib/use-app-navigation';

interface SavedSearch {
  id: string;
  query: string;
  queryAr: string;
  savedDate: string;
  notificationsEnabled: boolean;
  newResultsCount: number;
  filters?: string;
}



export function SavedSearchesPage() {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [searchesLoading, setSearchesLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  // Fetch saved searches from API
  useEffect(() => {
    fetch('/api/saved-searches')
      .then((r) => r.json())
      .then((result) => {
        setSearches(result.searches || result.data || result || []);
        setSearchesLoading(false);
      })
      .catch(() => {
        setSearches([]);
        setSearchesLoading(false);
      });
  }, []);

  const filteredSearches = searches.filter((s) => {
    if (!searchFilter) return true;
    const q = isRTL ? s.queryAr : s.query;
    return q.toLowerCase().includes(searchFilter.toLowerCase());
  });

  const toggleNotifications = useCallback((id: string) => {
    setSearches((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, notificationsEnabled: !s.notificationsEnabled } : s
      )
    );
  }, []);

  const deleteSearch = useCallback((id: string) => {
    setSearches((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleSearchClick = useCallback(
    (query: string) => {
      // Navigate to search with the query
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    },
    []
  );

  const formatDate = useCallback(
    (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
    [isRTL]
  );

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="container mx-auto px-4 py-6 pb-24 md:pb-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900">
            <Bookmark className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('savedSearches')}</h1>
            <p className="text-sm text-muted-foreground">{t('savedSearchesDesc')}</p>
          </div>
        </div>
      </div>

      {/* Search filter */}
      {searches.length > 0 && (
        <div className="mb-4">
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              placeholder={isRTL ? 'ابحث في عمليات البحث المحفوظة...' : 'Filter saved searches...'}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className={isRTL ? 'pr-9' : 'pl-9'}
            />
          </div>
        </div>
      )}

      {/* Saved Searches List */}
      {filteredSearches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="size-24 rounded-full bg-muted flex items-center justify-center">
            <Bookmark className="size-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold">{t('noSavedSearches')}</h2>
          <p className="text-sm text-muted-foreground max-w-sm text-center">
            {t('savedSearchesDesc')}
          </p>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white mt-2"
            asChild
          >
            <Link href={getViewUrl('shop')}>
              <Plus className="size-4 me-2" />
              {isRTL ? 'ابدأ البحث' : 'Start Searching'}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSearches.map((search) => (
            <div
              key={search.id}
              className="p-4 rounded-xl border border-border bg-card hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-200 cursor-pointer group"
              onClick={() => handleSearchClick(isRTL ? search.queryAr : search.query)}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 shrink-0 mt-0.5">
                  <Search className="size-4 text-emerald-600 dark:text-emerald-400" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-sm truncate">
                      {isRTL ? search.queryAr : search.query}
                    </h3>
                    {search.newResultsCount > 0 && (
                      <Badge className="bg-emerald-500 text-white text-[10px] px-1.5 py-0 shrink-0">
                        {search.newResultsCount} {t('newItems')}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {t('savedOn')} {formatDate(search.savedDate)}
                    </span>
                    {search.filters && (
                      <span className="truncate">{search.filters}</span>
                    )}
                  </div>

                  {/* Notification toggle */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">
                      {search.notificationsEnabled ? t('notificationEnabled') : t('notificationDisabled')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNotifications(search.id);
                    }}
                  >
                    {search.notificationsEnabled ? (
                      <Bell className="size-4 text-emerald-600" />
                    ) : (
                      <BellOff className="size-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSearch(search.id);
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                  <ArrowIcon className="size-4 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {searches.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {isRTL ? `${searches.length} عمليات بحث محفوظة` : `${searches.length} saved searches`}
            </span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {searches.reduce((sum, s) => sum + s.newResultsCount, 0)} {isRTL ? 'نتائج جديدة إجمالاً' : 'total new results'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
