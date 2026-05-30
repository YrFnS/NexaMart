'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Percent,
  Wallet,
  Flag,
  AlertTriangle,
  Bell,
  Settings,
  Menu,
  ChevronRight,
  ChevronLeft,
  ArrowRightLeft,
  Shield,
  ShoppingCart,
  Package,
  Store,
  FolderTree,
  Ticket,
  BarChart3,
  Image,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { AdminLoginGate } from '@/components/admin/admin-login-gate';
import { useI18n } from '@/lib/i18n';
import { useUserStore } from '@/stores/user-store';
import { adminFetch } from '@/lib/admin-api';

interface NavItem {
  href: string;
  icon: React.ElementType;
  labelKey: string;
  badgeKey?: string; // key to look up dynamic badge count
}

const navItems: NavItem[] = [
  { href: '/admin', icon: LayoutDashboard, labelKey: 'adminNavDashboard' },
  { href: '/admin/analytics', icon: BarChart3, labelKey: 'adminNavAnalytics' },
  { href: '/admin/orders', icon: ShoppingCart, labelKey: 'orderManagement' },
  { href: '/admin/products', icon: Package, labelKey: 'productList' },
  { href: '/admin/categories', icon: FolderTree, labelKey: 'adminNavCategories' },
  { href: '/admin/stores', icon: Store, labelKey: 'adminStore' },
  { href: '/admin/banners', icon: Image, labelKey: 'adminNavBanners' },
  { href: '/admin/coupons', icon: Ticket, labelKey: 'adminNavCoupons' },
  { href: '/admin/users', icon: Users, labelKey: 'adminNavUsers' },
  { href: '/admin/kyc', icon: ShieldCheck, labelKey: 'adminNavKYC', badgeKey: 'kyc' },
  { href: '/admin/commission', icon: Percent, labelKey: 'adminNavCommission' },
  { href: '/admin/payouts', icon: Wallet, labelKey: 'adminNavPayouts', badgeKey: 'payouts' },
  { href: '/admin/content', icon: Flag, labelKey: 'adminNavContent', badgeKey: 'content' },
  { href: '/admin/disputes', icon: AlertTriangle, labelKey: 'adminNavDisputes', badgeKey: 'disputes' },
  { href: '/admin/push', icon: Bell, labelKey: 'adminNavPush' },
  { href: '/admin/settings', icon: Settings, labelKey: 'adminNavSettings' },
];

function SidebarContent({
  isCollapsed,
  onClose,
  badgeCounts,
}: {
  isCollapsed: boolean;
  onClose?: () => void;
  badgeCounts: Record<string, number>;
}) {
  const { t, dir } = useI18n();
  const pathname = usePathname();
  const isRTL = dir() === 'rtl';

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full bg-card border-border">
      {/* Logo / Admin Brand */}
      {!isCollapsed && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <Shield className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm truncate">NexaMart Admin</h2>
              <p className="text-xs text-muted-foreground truncate">{t('adminPanel')}</p>
            </div>
          </div>
        </div>
      )}
      {isCollapsed && (
        <div className="p-3 border-b border-border flex justify-center">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
            <Shield className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const badge = item.badgeKey ? badgeCounts[item.badgeKey] : 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose?.()}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200 relative group
                  ${active
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }
                  ${isCollapsed ? 'justify-center px-2' : ''}
                `}
                title={isCollapsed ? t(item.labelKey) : undefined}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-start truncate">{t(item.labelKey)}</span>
                    {badge > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-rose-500 text-white hover:bg-rose-600">
                        {badge}
                      </Badge>
                    )}
                    {active && (
                      <div className={`absolute top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-emerald-500 ${isRTL ? 'right-0' : 'left-0'}`} />
                    )}
                  </>
                )}
                {isCollapsed && badge > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] bg-rose-500 text-white hover:bg-rose-600">
                    {badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Section */}
      {!isCollapsed && (
        <div className="p-3 border-t border-border">
          <div className="rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">System Health</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-1">All systems operational</p>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">99.9% uptime</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, dir } = useI18n();
  const router = useRouter();
  const { user } = useUserStore();
  const pathname = usePathname();
  const isRTL = dir() === 'rtl';
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({
    kyc: 0,
    payouts: 0,
    content: 0,
    disputes: 0,
  });

  const fetchBadgeCounts = useCallback(async () => {
    try {
      const [kycRes, payoutsRes, contentRes, disputesRes] = await Promise.allSettled([
        adminFetch('/api/admin/kyc?status=pending'),
        adminFetch('/api/admin/payouts?status=pending'),
        adminFetch('/api/admin/content?status=pending'),
        adminFetch('/api/admin/disputes?status=open'),
      ]);

      const counts: Record<string, number> = { kyc: 0, payouts: 0, content: 0, disputes: 0 };

      if (kycRes.status === 'fulfilled' && kycRes.value.ok) {
        const json = await kycRes.value.json();
        counts.kyc = json.documents?.length || json.total || 0;
      }
      if (payoutsRes.status === 'fulfilled' && payoutsRes.value.ok) {
        const json = await payoutsRes.value.json();
        counts.payouts = json.payouts?.length || json.total || 0;
      }
      if (contentRes.status === 'fulfilled' && contentRes.value.ok) {
        const json = await contentRes.value.json();
        counts.content = json.items?.length || json.total || 0;
      }
      if (disputesRes.status === 'fulfilled' && disputesRes.value.ok) {
        const json = await disputesRes.value.json();
        counts.disputes = json.disputes?.length || json.total || 0;
      }

      setBadgeCounts(counts);
    } catch {
      // keep existing counts
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [kycRes, payoutsRes, contentRes, disputesRes] = await Promise.allSettled([
          adminFetch('/api/admin/kyc?status=pending'),
          adminFetch('/api/admin/payouts?status=pending'),
          adminFetch('/api/admin/content?status=pending'),
          adminFetch('/api/admin/disputes?status=open'),
        ]);

        if (cancelled) return;

        const counts: Record<string, number> = { kyc: 0, payouts: 0, content: 0, disputes: 0 };

        if (kycRes.status === 'fulfilled' && kycRes.value.ok) {
          const json = await kycRes.value.json();
          if (!cancelled) counts.kyc = json.documents?.length || json.total || 0;
        }
        if (payoutsRes.status === 'fulfilled' && payoutsRes.value.ok) {
          const json = await payoutsRes.value.json();
          if (!cancelled) counts.payouts = json.payouts?.length || json.total || 0;
        }
        if (contentRes.status === 'fulfilled' && contentRes.value.ok) {
          const json = await contentRes.value.json();
          if (!cancelled) counts.content = json.items?.length || json.total || 0;
        }
        if (disputesRes.status === 'fulfilled' && disputesRes.value.ok) {
          const json = await disputesRes.value.json();
          if (!cancelled) counts.disputes = json.disputes?.length || json.total || 0;
        }

        if (!cancelled) setBadgeCounts(counts);
      } catch {
        // keep existing counts
      }
    };

    load();
    const interval = setInterval(fetchBadgeCounts, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [fetchBadgeCounts]);

  // Determine active nav label for the page title
  const activeNavItem = navItems.find(item => {
    if (item.href === '/admin') return pathname === '/admin';
    return pathname.startsWith(item.href);
  });

  return (
    <AdminLoginGate>
    <div dir={dir()} className="h-screen flex bg-background text-foreground overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`
          hidden md:flex flex-col border-border
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-[68px]' : 'w-60'}
          ${isRTL ? 'border-l' : 'border-r'}
        `}
      >
        <SidebarContent
          isCollapsed={sidebarCollapsed}
          badgeCounts={badgeCounts}
        />
        {/* Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex items-center justify-center h-8 border-t border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {sidebarCollapsed ? (
            isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side={isRTL ? 'right' : 'left'}
          className="w-64 p-0"
        >
          <SheetTitle className="sr-only">{t('adminPanel')}</SheetTitle>
          <SidebarContent
            isCollapsed={false}
            onClose={() => setMobileOpen(false)}
            badgeCounts={badgeCounts}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 border-b border-border bg-card/95 backdrop-blur-sm flex items-center px-4 gap-3 shrink-0">
          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Page Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate">
              {t(activeNavItem?.labelKey || 'adminNavDashboard')}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Admin Badge */}
            <Badge className="hidden sm:flex bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800 border-0 text-[11px] px-2.5 py-0.5 font-medium">
              <Shield className="h-3 w-3 me-1" />
              Admin
            </Badge>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-rose-500 rounded-full" />
            </Button>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs">
                      {user?.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">
                    {user?.name || 'Admin'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48">
                <DropdownMenuItem>
                  <Shield className="h-4 w-4 me-2" />
                  {t('adminPanel')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/')}>
                  <ArrowRightLeft className="h-4 w-4 me-2" />
                  {t('switchToShopping')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Switch to Shopping */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/')}
              className="hidden sm:flex h-8 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            >
              <ArrowRightLeft className="h-3.5 w-3.5 me-1.5" />
              {t('switchToShopping')}
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
    </AdminLoginGate>
  );
}
