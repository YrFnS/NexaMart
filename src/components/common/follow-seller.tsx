'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, UserMinus, Store, BadgeCheck, Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useI18n } from '@/lib/i18n';
import { LS_KEYS } from '@/lib/config';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';

interface FollowedStore {
  id: string;
  nameEn: string;
  nameAr: string;
  initials: string;
  isVerified: boolean;
  productCount: number;
  followerCount: number;
  newProductsCount: number;
  notificationsEnabled: boolean;
  gradient: string;
}

const STORAGE_KEY = LS_KEYS.followedStores;

export function FollowSeller({ storeId, storeName, storeNameAr }: {
  storeId: string;
  storeName: string;
  storeNameAr: string;
}) {
  const { dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const [isFollowing, setIsFollowing] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        return ids.includes(storeId);
      }
    } catch {
      // localStorage not available
    }
    return false;
  });

  const handleToggle = () => {
    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const ids: string[] = saved ? JSON.parse(saved) : [];

      if (newFollowing) {
        if (!ids.includes(storeId)) ids.push(storeId);
      } else {
        const idx = ids.indexOf(storeId);
        if (idx !== -1) ids.splice(idx, 1);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // localStorage not available
    }
  };

  return (
    <Button
      onClick={handleToggle}
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      className={
        isFollowing
          ? 'border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
          : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700'
      }
    >
      {isFollowing ? (
        <>
          <UserMinus className="size-4 me-1" />
          {isRTL ? 'إلغاء المتابعة' : 'Unfollow'}
        </>
      ) : (
        <>
          <UserPlus className="size-4 me-1" />
          {isRTL ? 'متابعة' : 'Follow'}
        </>
      )}
    </Button>
  );
}

export function FollowedStoresPanel() {
  const { dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const nav = useAppNavigation();

  const [followedIds, setFollowedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // localStorage not available
    }
    return [];
  });
  const [notificationsMap, setNotificationsMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const ids: string[] = JSON.parse(saved);
        const notifMap: Record<string, boolean> = {};
        ids.forEach(id => { notifMap[id] = true; });
        return notifMap;
      }
    } catch {
      // localStorage not available
    }
    return {};
  });
  const [stores, setStores] = useState<FollowedStore[]>([]);
  const [loading, setLoading] = useState(true);

  const saveIds = useCallback((ids: string[]) => {
    setFollowedIds(ids);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // localStorage not available
    }
  }, []);

  useEffect(() => {
    async function fetchStores() {
      if (followedIds.length === 0) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/followed-stores');
        if (res.ok) {
          const json = await res.json();
          const allStores: FollowedStore[] = Array.isArray(json) ? json : json.stores || [];
          setStores(allStores.filter(s => followedIds.includes(s.id)));
        }
      } catch {
        // API not available — leave empty
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, [followedIds]);

  const handleUnfollow = (storeId: string) => {
    const updated = followedIds.filter(id => id !== storeId);
    saveIds(updated);
    setStores(prev => prev.filter(s => s.id !== storeId));
  };

  const toggleNotifications = (storeId: string) => {
    setNotificationsMap(prev => ({
      ...prev,
      [storeId]: !prev[storeId],
    }));
  };

  const handleViewStore = (storeId: string) => {
    nav.selectStore(storeId);
    nav.setView('store-profile');
  };

  const followedStores = stores;
  const totalNewProducts = followedStores.reduce((sum, s) => sum + (s.newProductsCount || 0), 0);

  return (
    <Card className="border-emerald-200 dark:border-emerald-800/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="size-4 text-emerald-500" />
            {isRTL ? 'المتاجر المتابعة' : 'Following'}
            {totalNewProducts > 0 && (
              <Badge className="bg-emerald-500 text-white border-0 text-[10px]">
                {totalNewProducts} {isRTL ? 'جديد' : 'new'}
              </Badge>
            )}
          </CardTitle>
          <Badge variant="secondary" className="text-[10px]">
            {followedStores.length} {isRTL ? 'متجر' : 'stores'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : followedStores.length === 0 ? (
          <div className="text-center py-6">
            <Store className="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'لا تتابع أي متاجر' : 'Not following any stores yet'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isRTL ? 'تابع المتاجر لتلقي إشعارات عند إضافة منتجات جديدة' : 'Follow stores to get notified about new products'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
            {followedStores.map((store) => (
              <div
                key={store.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <button onClick={() => handleViewStore(store.id)} className="shrink-0">
                  <Avatar className="size-9 border border-border">
                    <AvatarFallback className={`bg-gradient-to-br ${store.gradient} text-white text-xs`}>
                      {store.initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <button
                  onClick={() => handleViewStore(store.id)}
                  className="flex-1 min-w-0 text-start"
                >
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium truncate">
                      {isRTL ? store.nameAr : store.nameEn}
                    </span>
                    {store.isVerified && (
                      <BadgeCheck className="size-3.5 text-emerald-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {store.productCount} {isRTL ? 'منتج' : 'products'}
                    </span>
                    {store.newProductsCount > 0 && (
                      <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[9px] shrink-0">
                        +{store.newProductsCount} {isRTL ? 'جديد' : 'new'}
                      </Badge>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => toggleNotifications(store.id)}
                    className="size-7 rounded-md hover:bg-muted flex items-center justify-center"
                  >
                    {notificationsMap[store.id] ? (
                      <Bell className="size-3.5 text-emerald-500" />
                    ) : (
                      <BellOff className="size-3.5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => handleUnfollow(store.id)}
                    className="size-7 rounded-md hover:bg-red-50 dark:hover:bg-red-950 flex items-center justify-center"
                  >
                    <UserMinus className="size-3.5 text-red-500" />
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
