'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Megaphone,
  Sparkles,
  Users,
  Settings,
  Bell,
  Menu,
  Store,
  ArrowRightLeft,
  ChevronRight,
  ChevronLeft,
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
import { useI18n } from '@/lib/i18n';
import { useUserStore } from '@/stores/user-store';

interface NavItem {
  href: string;
  icon: React.ElementType;
  labelKey: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { href: '/seller/dashboard', icon: LayoutDashboard, labelKey: 'sellerNavOverview' },
  { href: '/seller/dashboard/products', icon: Package, labelKey: 'sellerNavProducts' },
  { href: '/seller/dashboard/orders', icon: ShoppingCart, labelKey: 'sellerNavOrders', badge: 5 },
  { href: '/seller/dashboard/analytics', icon: BarChart3, labelKey: 'sellerNavAnalytics' },
  { href: '/seller/dashboard/marketing', icon: Megaphone, labelKey: 'sellerNavMarketing' },
  { href: '/seller/dashboard/ai-tools', icon: Sparkles, labelKey: 'sellerNavAITools' },
  { href: '/seller/dashboard/staff', icon: Users, labelKey: 'sellerNavStaff' },
  { href: '/seller/dashboard/settings', icon: Settings, labelKey: 'sellerNavSettings' },
];

function SidebarContent({
  isCollapsed,
  onClose,
}: {
  isCollapsed: boolean;
  onClose?: () => void;
}) {
  const { t, dir } = useI18n();
  const pathname = usePathname();
  const isRTL = dir() === 'rtl';

  const isActive = (href: string) => {
    if (href === '/seller/dashboard') return pathname === '/seller/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Logo / Store Name */}
      {!isCollapsed && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              N
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm truncate">NexaMart Seller</h2>
              <p className="text-xs text-muted-foreground truncate">TechStore Pro</p>
            </div>
          </div>
        </div>
      )}
      {isCollapsed && (
        <div className="p-3 border-b border-border flex justify-center">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
            N
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <ScrollArea className="flex-1 px-2 py-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
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
                    {item.badge && (
                      <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-emerald-500 text-white hover:bg-emerald-600">
                        {item.badge}
                      </Badge>
                    )}
                    {active && (
                      <div className={`absolute top-1/2 -translate-y-1/2 h-5 w-1 rounded-full bg-emerald-500 ${isRTL ? 'right-0' : 'left-0'}`} />
                    )}
                  </>
                )}
                {isCollapsed && item.badge && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] bg-emerald-500 text-white hover:bg-emerald-600">
                    {item.badge}
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
              <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Pro Plan</span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-2">Unlock advanced analytics & AI tools</p>
            <Button size="sm" className="w-full h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
              Upgrade
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SellerDashboardLayout({
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

  // Determine active nav label for the page title
  const activeNavItem = navItems.find(item => {
    if (item.href === '/seller/dashboard') return pathname === '/seller/dashboard';
    return pathname.startsWith(item.href);
  });

  return (
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
          <SheetTitle className="sr-only">{t('sellerDashboard')}</SheetTitle>
          <SidebarContent
            isCollapsed={false}
            onClose={() => setMobileOpen(false)}
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
              {t(activeNavItem?.labelKey || 'sellerNavOverview')}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full" />
            </Button>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 text-xs">
                      {user?.name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">
                    {user?.name || 'Seller'}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48">
                <DropdownMenuItem>
                  <Store className="h-4 w-4 me-2" />
                  {t('myStore')}
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
  );
}
