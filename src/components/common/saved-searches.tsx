'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Bookmark, Trash2, Bell, BellOff, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { LS_KEYS } from '@/lib/config';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';

interface SavedSearch {
  id: string;
  query: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  createdAt: string;
  notificationsEnabled: boolean;
  newItemsCount: number;
}

const STORAGE_KEY = LS_KEYS.savedSearches;

export function SavedSearches() {
  const { dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const { setSearchQuery, selectCategory } = useAppStore();
  const nav = useAppNavigation();

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // localStorage not available
    }
    return [];
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newQuery, setNewQuery] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newMinPrice, setNewMinPrice] = useState('');
  const [newMaxPrice, setNewMaxPrice] = useState('');

  // Save to localStorage whenever searches change
  const saveToStorage = useCallback((searches: SavedSearch[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
    } catch {
      // localStorage not available
    }
  }, []);

  const handleSaveSearch = () => {
    if (!newQuery.trim()) return;

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      query: newQuery.trim(),
      category: newCategory || undefined,
      minPrice: newMinPrice ? parseFloat(newMinPrice) : undefined,
      maxPrice: newMaxPrice ? parseFloat(newMaxPrice) : undefined,
      createdAt: new Date().toISOString(),
      notificationsEnabled: true,
      newItemsCount: Math.floor(Math.random() * 5), // Mock new items
    };

    const updated = [newSearch, ...savedSearches];
    setSavedSearches(updated);
    saveToStorage(updated);

    // Reset form
    setNewQuery('');
    setNewCategory('');
    setNewMinPrice('');
    setNewMaxPrice('');
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    const updated = savedSearches.filter(s => s.id !== id);
    setSavedSearches(updated);
    saveToStorage(updated);
  };

  const toggleNotifications = (id: string) => {
    const updated = savedSearches.map(s =>
      s.id === id ? { ...s, notificationsEnabled: !s.notificationsEnabled } : s
    );
    setSavedSearches(updated);
    saveToStorage(updated);
  };

  const handleApplySearch = (search: SavedSearch) => {
    setSearchQuery(search.query);
    if (search.category) {
      selectCategory(search.category);
    }
    nav.setView('search');
  };

  const totalNewItems = savedSearches.reduce((sum, s) => sum + s.newItemsCount, 0);

  return (
    <Card className="border-emerald-200 dark:border-emerald-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bookmark className="size-4 text-emerald-500" />
            {isRTL ? 'عمليات البحث المحفوظة' : 'Saved Searches'}
            {totalNewItems > 0 && (
              <Badge className="bg-emerald-500 text-white border-0 text-[10px]">
                {totalNewItems} {isRTL ? 'جديد' : 'new'}
              </Badge>
            )}
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1 text-xs border-emerald-300 dark:border-emerald-700">
                <Plus className="size-3" />
                {isRTL ? 'حفظ بحث' : 'Save Search'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Search className="size-5 text-emerald-500" />
                  {isRTL ? 'حفظ بحث جديد' : 'Save New Search'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {isRTL ? 'كلمة البحث' : 'Search Query'} *
                  </label>
                  <Input
                    value={newQuery}
                    onChange={(e) => setNewQuery(e.target.value)}
                    placeholder={isRTL ? 'مثال: سماعات لاسلكية' : 'e.g., wireless headphones'}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {isRTL ? 'الفئة' : 'Category'} ({isRTL ? 'اختياري' : 'optional'})
                  </label>
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder={isRTL ? 'مثال: إلكترونيات' : 'e.g., Electronics'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      {isRTL ? 'أقل سعر' : 'Min Price'}
                    </label>
                    <Input
                      type="number"
                      value={newMinPrice}
                      onChange={(e) => setNewMinPrice(e.target.value)}
                      placeholder="$0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      {isRTL ? 'أعلى سعر' : 'Max Price'}
                    </label>
                    <Input
                      type="number"
                      value={newMaxPrice}
                      onChange={(e) => setNewMaxPrice(e.target.value)}
                      placeholder="$1000"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveSearch}
                  disabled={!newQuery.trim()}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
                >
                  {isRTL ? 'حفظ البحث' : 'Save Search'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {savedSearches.length === 0 ? (
          <div className="text-center py-6">
            <Bookmark className="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'لا توجد عمليات بحث محفوظة' : 'No saved searches yet'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isRTL ? 'احفظ بحثك لتلقي إشعارات عند توفر منتجات جديدة' : 'Save searches to get notified when new items match'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <button
                  onClick={() => handleApplySearch(search)}
                  className="flex-1 min-w-0 text-start"
                >
                  <div className="flex items-center gap-2">
                    <Search className="size-3.5 text-emerald-500 shrink-0" />
                    <span className="text-sm font-medium truncate">{search.query}</span>
                    {search.newItemsCount > 0 && (
                      <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[9px] shrink-0">
                        +{search.newItemsCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 ms-5">
                    {search.category && (
                      <span className="text-[10px] text-muted-foreground">{search.category}</span>
                    )}
                    {search.minPrice !== undefined && search.maxPrice !== undefined && (
                      <span className="text-[10px] text-muted-foreground">
                        ${search.minPrice}-${search.maxPrice}
                      </span>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleNotifications(search.id)}
                    className="size-7 rounded-md hover:bg-muted flex items-center justify-center"
                    title={search.notificationsEnabled
                      ? (isRTL ? 'إيقاف الإشعارات' : 'Disable notifications')
                      : (isRTL ? 'تفعيل الإشعارات' : 'Enable notifications')
                    }
                  >
                    {search.notificationsEnabled ? (
                      <Bell className="size-3.5 text-emerald-500" />
                    ) : (
                      <BellOff className="size-3.5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(search.id)}
                    className="size-7 rounded-md hover:bg-red-50 dark:hover:bg-red-950 flex items-center justify-center"
                    title={isRTL ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="size-3.5 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
