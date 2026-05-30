'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Bell,
  Package,
  TrendingDown,
  Zap,
  MessageSquare,
  AlertTriangle,
  Megaphone,
  Check,
  CheckCheck,
  Settings,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useI18n } from '@/lib/i18n';
import { getViewUrl } from '@/lib/use-app-navigation';
import { useUserStore } from '@/stores/user-store';

interface NotificationFromAPI {
  id: string;
  userId: string;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

type NotificationType = 'order' | 'price-drop' | 'flash-sale' | 'seller-message' | 'system-alert' | 'promotion';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  timestamp: Date;
  read: boolean;
}

function getRelativeTime(date: Date, t: (key: string, params?: Record<string, string | number>) => string): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return t('justNow');
  if (diffMins < 60) return t('minutesAgo', { count: diffMins });
  if (diffHours === 1) return t('hoursAgo', { count: 1 });
  if (diffHours < 24) return t('hoursAgoPlural', { count: diffHours });
  if (diffDays === 1) return t('daysAgo', { count: 1 });
  return t('daysAgoPlural', { count: diffDays });
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'order':
      return <Package className="size-4" />;
    case 'price-drop':
      return <TrendingDown className="size-4" />;
    case 'flash-sale':
      return <Zap className="size-4" />;
    case 'seller-message':
      return <MessageSquare className="size-4" />;
    case 'system-alert':
      return <AlertTriangle className="size-4" />;
    case 'promotion':
      return <Megaphone className="size-4" />;
  }
}

function getNotificationIconBg(type: NotificationType) {
  switch (type) {
    case 'order':
      return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400';
    case 'price-drop':
      return 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400';
    case 'flash-sale':
      return 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400';
    case 'seller-message':
      return 'bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400';
    case 'system-alert':
      return 'bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400';
    case 'promotion':
      return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400';
  }
}

function getNotificationTypeLabel(type: NotificationType, isRTL: boolean) {
  switch (type) {
    case 'order':
      return isRTL ? 'طلب' : 'Order';
    case 'price-drop':
      return isRTL ? 'انخفاض سعر' : 'Price Drop';
    case 'flash-sale':
      return isRTL ? 'عرض فلاش' : 'Flash Sale';
    case 'seller-message':
      return isRTL ? 'رسالة بائع' : 'Message';
    case 'system-alert':
      return isRTL ? 'تنبيه نظام' : 'System';
    case 'promotion':
      return isRTL ? 'ترويج' : 'Promo';
  }
}

function getDateGroup(date: Date): 'today' | 'yesterday' | 'earlier' {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const notifDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (notifDate.getTime() >= today.getTime()) return 'today';
  if (notifDate.getTime() >= yesterday.getTime()) return 'yesterday';
  return 'earlier';
}

export function NotificationPanel() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const { user } = useUserStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotifications() {
      const userId = user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/notifications?userId=${userId}`);
        if (res.ok) {
          const json: NotificationFromAPI[] = await res.json();
          const mapped: Notification[] = json.map((n) => ({
            id: n.id,
            type: (n.type === 'order' ? 'order' : n.type === 'promotion' ? 'promotion' : n.type === 'system' ? 'system-alert' : n.type === 'price-drop' ? 'price-drop' : 'seller-message') as NotificationType,
            title: n.title,
            titleAr: n.titleAr || n.title,
            description: n.message,
            descriptionAr: n.messageAr || n.message,
            timestamp: new Date(n.createdAt),
            read: n.isRead,
          }));
          setNotifications(mapped);
        }
      } catch {
        // API not available — leave empty
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, [user?.id]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const groupedNotifications = useMemo(() => {
    const groups: Record<string, Notification[]> = { today: [], yesterday: [], earlier: [] };
    for (const notif of notifications) {
      const group = getDateGroup(notif.timestamp);
      groups[group].push(notif);
    }
    return groups;
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getGroupLabel = (group: string) => {
    switch (group) {
      case 'today': return t('notifToday');
      case 'yesterday': return t('notifYesterday');
      case 'earlier': return t('notifEarlier');
      default: return group;
    }
  };

  const renderNotificationItem = (notif: Notification) => (
    <div
      key={notif.id}
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
        !notif.read ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
      }`}
      onClick={() => markAsRead(notif.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') markAsRead(notif.id);
      }}
    >
      {/* Icon */}
      <div className={`shrink-0 flex items-center justify-center size-9 rounded-full ${getNotificationIconBg(notif.type)}`}>
        {getNotificationIcon(notif.type)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${!notif.read ? 'font-semibold' : 'font-medium'} text-foreground`}>
            {isRTL ? notif.titleAr : notif.title}
          </p>
          {!notif.read && (
            <div className="shrink-0 size-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mt-1.5" />
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {isRTL ? notif.descriptionAr : notif.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground/70">
            {getRelativeTime(notif.timestamp, t)}
          </span>
          <Badge
            variant="secondary"
            className="text-[8px] px-1 py-0 h-3.5 leading-none"
          >
            {getNotificationTypeLabel(notif.type, isRTL)}
          </Badge>
        </div>
      </div>

      {/* Read/unread toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 size-7 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          markAsRead(notif.id);
        }}
        aria-label={notif.read ? t('markAsUnread') : t('markAsRead')}
      >
        {notif.read ? (
          <Check className="size-3.5" />
        ) : (
          <CheckCheck className="size-3.5" />
        )}
      </Button>
    </div>
  );

  const hasNotifications = notifications.length > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t('notifications')}>
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge
              className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} min-w-[16px] h-4 px-0.5 flex items-center justify-center text-[10px] bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isRTL ? 'start' : 'end'}
        className="w-80 sm:w-96 p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{t('notifications')}</span>
            {unreadCount > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
              >
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                onClick={markAllAsRead}
              >
                <CheckCheck className="size-3.5 me-1" />
                {t('markAllRead')}
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : hasNotifications ? (
          <ScrollArea className="max-h-96">
            <div className="px-2 py-1">
              {(['today', 'yesterday', 'earlier'] as const).map((group) => {
                const items = groupedNotifications[group];
                if (items.length === 0) return null;
                return (
                  <div key={group}>
                    <div className="px-2 py-1.5">
                      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        {getGroupLabel(group)}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      {items.map(renderNotificationItem)}
                    </div>
                    {group !== 'earlier' && items.length > 0 && (
                      <Separator className="my-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 px-4">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Bell className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{t('noNotifications')}</p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              {t('noNotificationsDesc')}
            </p>
          </div>
        )}

        {/* Footer */}
        <Separator />
        <div className="px-3 py-2 flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="flex-1 justify-center text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
          >
            <Link href={getViewUrl('orders')}>
              <ExternalLink className="size-3 me-1" />
              {isRTL ? 'عرض جميع الإشعارات' : 'View All Notifications'}
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="ghost"
            size="sm"
            className="justify-center text-xs text-muted-foreground hover:text-foreground"
          >
            <Settings className="size-3.5 me-1" />
            {t('notifPreferences')}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
