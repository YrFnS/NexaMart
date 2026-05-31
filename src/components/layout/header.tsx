'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Search,
  ShoppingCart,
  Heart,
  Moon,
  Sun,
  Globe,
  Menu,
  User,
  Package,
  Settings,
  LogOut,
  Store,
  ShieldCheck,
  Sparkles,
  Command,
  X,
  ChevronRight,
  ChevronDown,
  Zap,
  CreditCard,
  Play,
  Building2,
  Briefcase,
  Megaphone,
  Car,
  Shield,
  Wrench,
  RotateCcw,
  Ship,
  MapPin,
  Bell,
  Grid3X3,
  LifeBuoy,
} from 'lucide-react';
import { NotificationPanel } from '@/components/common/notification-panel';
import { MegaMenu } from '@/components/common/mega-menu';
import { CountrySelector } from '@/components/common/country-selector';
import { CurrencySelector } from '@/components/common/currency-selector';
import { AUTH_CONFIG, APP_SUPPORT_EMAIL } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation, getViewUrl } from '@/lib/use-app-navigation';
import { useCartStore } from '@/stores/cart-store';
import { useUserStore } from '@/stores/user-store';
import { formatPrice, CURRENCIES } from '@/lib/currency';

export function Header() {
  const { t, locale, setLocale, dir } = useI18n();
  const { setTheme, theme } = useTheme();
  const { setSearchQuery, searchQuery, currency } = useAppStore();
  const pathname = usePathname();
  const nav = useAppNavigation();
  const { getItemCount } = useCartStore();
  const { user, setUser } = useUserStore();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const headerRef = React.useRef<HTMLElement>(null);
  const megaMenuTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const isRTL = dir() === 'rtl';
  const itemCount = getItemCount();

  // Cart badge pulse when items change
  useEffect(() => {
    if (itemCount > 0) {
      const timer = setTimeout(() => {
        setCartPulse(true);
        setTimeout(() => setCartPulse(false), 400);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  // Scroll detection for shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cmd+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        nav.setView('search');
        setIsSearchOpen(false);
      }
    },
    [searchQuery, nav]
  );

  const handleDemoLogin = useCallback(() => {
    setUser({
      id: AUTH_CONFIG.demoUser.id,
      email: AUTH_CONFIG.demoUser.email,
      name: AUTH_CONFIG.demoUser.name,
      role: AUTH_CONFIG.demoUser.role,
      loyaltyTier: AUTH_CONFIG.demoUser.loyaltyTier,
      loyaltyPoints: AUTH_CONFIG.demoUser.loyaltyPoints,
      walletBalance: AUTH_CONFIG.demoUser.walletBalance,
      aiCredits: AUTH_CONFIG.demoUser.aiCredits,
      isVerified: AUTH_CONFIG.demoUser.isVerified,
    });
    nav.setView('home');
  }, [setUser, nav]);

  const handleLogout = useCallback(() => {
    setUser(null);
    nav.setView('home');
  }, [setUser, nav]);

  const navLinks = [
    { key: 'home', view: 'home' as const, label: t('home') },
    { key: 'shop', view: 'shop' as const, label: t('shop') },
    { key: 'deals', view: 'deals' as const, label: t('deals') },
    { key: 'categories', view: 'shop' as const, label: t('categories') },
    { key: 'aiTools', view: 'ai-tools' as const, label: t('aiTools') },
  ];

  // More links shown in dropdown on desktop
  const moreLinks = [
    { key: 'installments', view: 'installments' as const, label: isRTL ? 'أقساط' : 'Installments', icon: '💳' },
    { key: 'reels', view: 'reels' as const, label: isRTL ? 'ريلز' : 'Reels', icon: '🎬' },
    { key: 'properties', view: 'properties' as const, label: isRTL ? 'عقارات' : 'Properties', icon: '🏠' },
    { key: 'jobs', view: 'jobs' as const, label: isRTL ? 'وظائف' : 'Jobs', icon: '💼' },
    { key: 'cars', view: 'cars' as const, label: isRTL ? 'سيارات' : 'Cars', icon: '🚗' },
    { key: 'services', view: 'services' as const, label: isRTL ? 'خدمات' : 'Services', icon: '🔧' },
    { key: 'auctions', view: 'auctions' as const, label: isRTL ? 'المزادات' : 'Auctions', icon: '🏷️' },
    { key: 'wholesale', view: 'wholesale' as const, label: isRTL ? 'الجملة' : 'Wholesale', icon: '📦' },
    { key: 'subscriptions', view: 'subscriptions-loyalty' as const, label: isRTL ? 'الولاء' : 'Loyalty', icon: '⭐' },
    { key: 'appMarketplace', view: 'app-marketplace' as const, label: isRTL ? 'التطبيقات' : 'Apps', icon: '🧩' },
    { key: 'compare', view: 'compare' as const, label: isRTL ? 'مقارنة' : 'Compare', icon: '⚖️' },
    { key: 'safetyTips', view: 'safety-tips' as const, label: isRTL ? 'نصائح السلامة' : 'Safety Tips', icon: '🛡️' },
    { key: 'shipping', view: 'shipping' as const, label: isRTL ? 'الشحن' : 'Shipping', icon: '🚢' },
    { key: 'returns', view: 'returns' as const, label: isRTL ? 'الإرجاعات' : 'Returns', icon: '↩️' },
    { key: 'nearMe', view: 'near-me' as const, label: isRTL ? 'بالقرب مني' : 'Near Me', icon: '📍' },
    { key: 'priceAlerts', view: 'price-alerts' as const, label: isRTL ? 'تنبيهات الأسعار' : 'Price Alerts', icon: '🔔' },
    { key: 'helpCenter', view: 'help-center' as const, label: isRTL ? 'مركز المساعدة' : 'Help Center', icon: '💡' },
  ];

  return (
    <header
      ref={headerRef}
      dir={dir()}
      className={`sticky top-0 z-50 w-full max-w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-background/80 backdrop-blur-md shadow-md shadow-black/5 border-b border-border/50'
          : 'bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 border-b border-border'
      }`}
    >
      {/* Top gradient accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-yellow-500 to-sky-500" />

      {/* Main header content */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            <Link
              href="/"
              className="flex items-center gap-2 group"
            >
              <div className="relative flex items-center justify-center size-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-shadow animate-[bounce_0.6s_ease-in-out_1]">
                <Sparkles className="size-5 text-white group-hover:animate-pulse" />
              </div>
              <span className="text-xl font-bold tracking-tight hidden sm:inline">
                <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  Nexa
                </span>
                <span className="text-foreground">Mart</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              // Categories button triggers mega menu
              if (link.key === 'categories') {
                return (
                  <div
                    key={link.key}
                    className="relative"
                    onMouseEnter={() => {
                      if (megaMenuTimeoutRef.current) {
                        clearTimeout(megaMenuTimeoutRef.current);
                        megaMenuTimeoutRef.current = null;
                      }
                      setShowMegaMenu(true);
                    }}
                    onMouseLeave={() => {
                      megaMenuTimeoutRef.current = setTimeout(() => {
                        setShowMegaMenu(false);
                      }, 300);
                    }}
                  >
                    <Button
                      variant={showMegaMenu ? 'secondary' : 'ghost'}
                      size="sm"
                      className={showMegaMenu ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : ''}
                      onClick={() => {
                        nav.setView('shop');
                        setShowMegaMenu(false);
                      }}
                    >
                      {link.label}
                      <ChevronRight className={`size-3 ms-0.5 transition-transform duration-200 ${showMegaMenu ? 'rotate-180' : 'rotate-90'}`} />
                    </Button>
                    <MegaMenu isOpen={showMegaMenu} onClose={() => setShowMegaMenu(false)} headerRef={headerRef} onEnter={() => {
                      if (megaMenuTimeoutRef.current) {
                        clearTimeout(megaMenuTimeoutRef.current);
                        megaMenuTimeoutRef.current = null;
                      }
                    }} onLeave={() => {
                      megaMenuTimeoutRef.current = setTimeout(() => {
                        setShowMegaMenu(false);
                      }, 300);
                    }} />
                  </div>
                );
              }
              const linkUrl = getViewUrl(link.view);
              const isActive = pathname === linkUrl || (linkUrl !== '/' && pathname.startsWith(linkUrl));
              return (
                <Button
                  key={link.key}
                  asChild
                  variant={isActive ? 'secondary' : 'ghost'}
                  size="sm"
                  className={
                    isActive
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900'
                      : ''
                  }
                >
                  <Link href={linkUrl}>{link.label}</Link>
                </Button>
              );
            })}
            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={moreLinks.some(l => { const u = getViewUrl(l.view); return pathname === u || (u !== '/' && pathname.startsWith(u)); }) ? 'secondary' : 'ghost'}
                  size="sm"
                  className={moreLinks.some(l => { const u = getViewUrl(l.view); return pathname === u || (u !== '/' && pathname.startsWith(u)); }) ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : ''}
                >
                  {isRTL ? 'المزيد' : 'More'}
                  <ChevronDown className="size-3 ms-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48">
                {moreLinks.map((link) => {
                  const linkUrl = getViewUrl(link.view);
                  const isActive = pathname === linkUrl || (linkUrl !== '/' && pathname.startsWith(linkUrl));
                  return (
                    <DropdownMenuItem
                      key={link.key}
                      asChild
                      className={isActive ? 'bg-amber-50 dark:bg-amber-950' : ''}
                    >
                      <Link href={linkUrl}>
                        <span className="me-2">{link.icon}</span>
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Search Bar - wider with glow effect + search suggestions */}
          <div className="flex-1 max-w-lg hidden md:flex relative">
            <form onSubmit={handleSearch} className="relative w-full search-glow rounded-xl">
              <Search className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                type="search"
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchSuggestions(true);
                }}
                onFocus={() => setShowSearchSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                className={`${isRTL ? 'ps-9 pe-16' : 'ps-9 pe-16'} h-10 bg-muted/50 border-transparent focus-visible:border-amber-500/50 focus-visible:ring-2 focus-visible:ring-amber-500/30 rounded-xl text-sm transition-all duration-300`}
              />
              <kbd className={`pointer-events-none absolute top-1/2 -translate-y-1/2 hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ${isRTL ? 'left-2' : 'right-2'}`}>
                <Command className="size-2.5" />K
              </kbd>
            </form>
            {/* Search Suggestions Dropdown */}
            {showSearchSuggestions && (
              <div className={`absolute top-full mt-1 ${isRTL ? 'right-0' : 'left-0'} w-full bg-card border border-border rounded-xl shadow-lg z-50 animate-dropdown overflow-hidden`}>
                <div className="p-3">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                    {isRTL ? 'عمليات بحث حديثة' : 'Recent Searches'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(isRTL ? ['سماعات', 'ساعات ذكية', 'أحذية'] : ['Wireless Headphones', 'Smart Watch', 'Running Shoes']).map((term) => (
                      <button
                        key={term}
                        className="text-xs px-2.5 py-1 rounded-full bg-muted/50 hover:bg-amber-100 dark:hover:bg-amber-900 text-muted-foreground hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                        onMouseDown={() => {
                          setSearchQuery(term);
                          nav.setView('search');
                          setShowSearchSuggestions(false);
                        }}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="p-3 border-t border-border">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-2">
                    {isRTL ? 'الأكثر رواجاً' : 'Trending'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(isRTL ? ['أجهزة لوحية', 'مكياج', 'حقائب'] : ['Laptops', 'Skincare', 'Gaming']).map((term) => (
                      <button
                        key={term}
                        className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950 text-muted-foreground hover:text-amber-700 dark:hover:text-amber-300 transition-colors flex items-center gap-1"
                        onMouseDown={() => {
                          setSearchQuery(term);
                          nav.setView('search');
                          setShowSearchSuggestions(false);
                        }}
                      >
                        <Zap className="size-2.5 text-amber-500" />
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Sell on NexaMart CTA - desktop only */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden xl:flex gap-1.5 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 text-xs"
            >
              <Link href={getViewUrl('seller-dashboard')}>
                <Store className="size-3.5" />
                {t('sellOnPlatform')}
              </Link>
            </Button>

            {/* Post Free Ad CTA - desktop only */}
            <Button
              asChild
              size="sm"
              className="hidden lg:flex gap-1.5 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20 text-xs"
            >
              <Link href={getViewUrl('quick-post')}>
                <Megaphone className="size-3.5" />
                {t('postFreeAd')}
              </Link>
            </Button>

            {/* Search toggle (mobile) */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="size-5" />
            </Button>

            {/* Country Selector */}
            <CountrySelector />

            {/* Currency Selector */}
            <CurrencySelector />

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                  <Globe className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                <DropdownMenuItem
                  onClick={() => setLocale('en')}
                  className={locale === 'en' ? 'bg-amber-50 dark:bg-amber-950' : ''}
                >
                  🇺🇸 English
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocale('ar')}
                  className={locale === 'ar' ? 'bg-amber-50 dark:bg-amber-950' : ''}
                >
                  🇸🇦 العربية
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="hidden sm:flex"
            >
              <Sun className="size-4 hidden dark:block" />
              <Moon className="size-4 block dark:hidden" />
            </Button>

            {/* Wishlist */}
            <Button asChild variant="ghost" size="icon" className="hidden sm:flex">
              <Link href={getViewUrl('wishlist')}>
                <Heart className="size-4" />
              </Link>
            </Button>

            {/* Notifications */}
            <NotificationPanel />

            {/* Cart with pulse badge + mini cart preview */}
            <div
              className="relative"
              onMouseEnter={() => itemCount > 0 && setShowMiniCart(true)}
              onMouseLeave={() => setShowMiniCart(false)}
            >
              <Button asChild variant="ghost" size="icon">
                <Link href={getViewUrl('cart')}>
                  <ShoppingCart className="size-4" />
                  {itemCount > 0 && (
                    <Badge className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} size-4 p-0 flex items-center justify-center text-[10px] bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 ${cartPulse ? 'animate-badge-pulse' : ''}`}>
                      {itemCount > 99 ? '99+' : itemCount}
                    </Badge>
                  )}
                </Link>
              </Button>
              {/* Mini Cart Preview */}
              {showMiniCart && itemCount > 0 && (
                <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-2 w-72 bg-card border border-border rounded-xl shadow-xl z-50 animate-mini-cart`}>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">{isRTL ? 'السلة' : 'Cart'} ({itemCount})</span>
                      <Button asChild variant="ghost" size="sm" className="text-xs text-amber-600">
                        <Link href={getViewUrl('cart')}>
                          {isRTL ? 'عرض الكل' : 'View All'}
                        </Link>
                      </Button>
                    </div>
                    {useCartStore.getState().items.slice(0, 3).map((item) => (
                      <div key={item.productId} className="flex items-center gap-2 py-1.5">
                        <div className="w-8 h-8 rounded bg-muted flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate">{item.name}</p>
                          <p className="text-[10px] text-amber-600 font-medium">{formatPrice(item.price, currency)} × {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                    {itemCount > 3 && (
                      <p className="text-[10px] text-muted-foreground text-center mt-1">
                        +{itemCount - 3} {isRTL ? 'منتجات أخرى' : 'more items'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Avatar className="size-8">
                      <AvatarImage
                        src={user.avatar}
                        alt={user.name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-amber-500 to-yellow-600 text-white text-xs">
                        {user.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>
                    {/* Green dot when user is logged in */}
                    <span className={`absolute ${isRTL ? 'left-0' : 'right-0'} bottom-0 size-2.5 rounded-full bg-amber-500 border-2 border-background`} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem asChild>
                      <Link href={getViewUrl('profile')}>
                        <User className="size-4" />
                        {t('profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={getViewUrl('orders')}>
                        <Package className="size-4" />
                        {t('orders')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={getViewUrl('returns')}>
                        <RotateCcw className="size-4" />
                        {t('returnsAndRefunds')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={getViewUrl('wishlist')}>
                        <Heart className="size-4" />
                        {t('wishlist')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={getViewUrl('chat')}>
                        <Sparkles className="size-4" />
                        {t('chat')}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />

                  {/* Role switching */}
                  {user.role === 'buyer' && (
                    <DropdownMenuItem asChild>
                      <Link href={getViewUrl('seller-dashboard')}>
                        <Store className="size-4" />
                        {t('switchToSeller')}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'seller' && (
                    <DropdownMenuItem asChild>
                      <Link href={getViewUrl('home')}>
                        <ShoppingCart className="size-4" />
                        {t('switchToShopping')}
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {(user.role === 'seller' || user.role === 'admin') && (
                    <DropdownMenuItem asChild>
                      <Link href={getViewUrl('admin')}>
                        <ShieldCheck className="size-4" />
                        {t('switchToAdmin')}
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getViewUrl('profile')}>
                      <Settings className="size-4" />
                      {t('settings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleLogout}
                    variant="destructive"
                  >
                    <LogOut className="size-4" />
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
                  <Link href={getViewUrl('auth')}>
                    {t('login')}
                  </Link>
                </Button>
                <Button
                  size="sm"
                  onClick={handleDemoLogin}
                  className="bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-md shadow-amber-500/20"
                >
                  {t('quickDemoLogin')}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden pb-3 animate-in slide-in-from-top-2 duration-200">
            <form onSubmit={handleSearch} className="relative search-glow rounded-xl">
              <Search className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                type="search"
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${isRTL ? 'ps-9 pe-9' : 'ps-9 pe-9'} h-10 bg-muted/50 border-transparent focus-visible:border-amber-500/50 rounded-xl`}
                autoFocus
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`absolute top-1/2 -translate-y-1/2 size-7 ${isRTL ? 'left-1' : 'right-1'}`}
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="size-3.5" />
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu Sheet with backdrop blur and smooth animation */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent
          side={isRTL ? 'right' : 'left'}
          className="w-80 backdrop-blur-xl bg-background/95"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 animate-[bounce_0.6s_ease-in-out_1]">
                <Sparkles className="size-4 text-white" />
              </div>
              <span className="bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent font-bold">
                Nexa
              </span>
              <span>Mart</span>
            </SheetTitle>
          </SheetHeader>

          {/* User info in mobile menu */}
          {user && (
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="relative">
                  <Avatar className="size-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-yellow-600 text-white">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  {/* Green dot for logged in user */}
                  <span className={`absolute ${isRTL ? 'left-0' : 'right-0'} bottom-0 size-2.5 rounded-full bg-amber-500 border-2 border-background`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="p-4 space-y-1">
              {navLinks.map((link) => {
                if (link.key === 'categories') {
                  return (
                    <Button
                      asChild
                      key={link.key}
                      variant="ghost"
                      className="w-full justify-start gap-3 text-amber-600 dark:text-amber-400 font-semibold"
                    >
                      <Link
                        href={getViewUrl('shop')}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <Grid3X3 className="size-4" />
                        {link.label}
                        <ChevronRight className={`size-3 ms-auto ${isRTL ? '-scale-x-100' : ''}`} />
                      </Link>
                    </Button>
                  );
                }
                const linkUrl = getViewUrl(link.view);
                const isActive = pathname === linkUrl || (linkUrl !== '/' && pathname.startsWith(linkUrl));
                return (
                  <Button
                    asChild
                    key={link.key}
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={`w-full justify-start gap-3 ${
                      isActive
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        : ''
                    }`}
                  >
                    <Link
                      href={linkUrl}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </Button>
                );
              })}

              <Separator className="my-2" />

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('cart')} onClick={() => setIsMobileMenuOpen(false)}>
                  <ShoppingCart className="size-4" />
                  {t('cart')}
                  {itemCount > 0 && (
                    <Badge className={`ms-auto bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-0 ${cartPulse ? 'animate-badge-pulse' : ''}`}>
                      {itemCount}
                    </Badge>
                  )}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('wishlist')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Heart className="size-4" />
                  {t('wishlist')}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('orders')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Package className="size-4" />
                  {t('orders')}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('returns')} onClick={() => setIsMobileMenuOpen(false)}>
                  <RotateCcw className="size-4" />
                  {t('returnsAndRefunds')}
                </Link>
              </Button>

              <Separator className="my-2" />

              {/* More Pages */}
              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('installments')} onClick={() => setIsMobileMenuOpen(false)}>
                  <CreditCard className="size-4" />
                  {isRTL ? 'أقساط' : 'Installments'}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('reels')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Play className="size-4" />
                  {isRTL ? 'ريلز' : 'Reels'}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('properties')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Building2 className="size-4" />
                  {isRTL ? 'عقارات' : 'Properties'}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('jobs')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Briefcase className="size-4" />
                  {isRTL ? 'وظائف وخدمات' : 'Jobs & Services'}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('cars')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Car className="size-4" />
                  {isRTL ? 'سيارات' : 'Cars'}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('services')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Wrench className="size-4" />
                  {isRTL ? 'خدمات' : 'Services'}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('auctions')} onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="size-4 text-center">🏷️</span>
                  {isRTL ? 'المزادات' : 'Auctions'}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('wholesale')} onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="size-4 text-center">📦</span>
                  {isRTL ? 'الجملة' : 'Wholesale'}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('subscriptions-loyalty')} onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="size-4 text-center">⭐</span>
                  {isRTL ? 'الولاء والمشتركات' : 'Loyalty & Subscriptions'}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('app-marketplace')} onClick={() => setIsMobileMenuOpen(false)}>
                  <span className="size-4 text-center">🧩</span>
                  {isRTL ? 'سوق التطبيقات' : 'App Marketplace'}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('safety-tips')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Shield className="size-4" />
                  {t('safetyTipsNav')}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('shipping')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Ship className="size-4" />
                  {isRTL ? 'الشحن والتوصيل' : 'Shipping & Delivery'}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('near-me')} onClick={() => setIsMobileMenuOpen(false)}>
                  <MapPin className="size-4" />
                  {isRTL ? 'بالقرب مني' : 'Near Me'}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('price-alerts')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Bell className="size-4" />
                  {isRTL ? 'تنبيهات الأسعار' : 'Price Alerts'}
                </Link>
              </Button>

              <Button asChild variant="ghost" className="w-full justify-start gap-3">
                <Link href={getViewUrl('help-center')} onClick={() => setIsMobileMenuOpen(false)}>
                  <LifeBuoy className="size-4" />
                  {isRTL ? 'مركز المساعدة' : 'Help Center'}
                </Link>
              </Button>

              {/* Sell on NexaMart - mobile */}
              <Button asChild variant="ghost" className="w-full justify-start gap-3 text-amber-600 dark:text-amber-400">
                <Link href={getViewUrl('seller-dashboard')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Store className="size-4" />
                  {t('sellOnPlatform')}
                </Link>
              </Button>

              {/* Post Free Ad - mobile */}
              <Button asChild variant="ghost" className="w-full justify-start gap-3 text-amber-600 dark:text-amber-400 font-semibold">
                <Link href={getViewUrl('quick-post')} onClick={() => setIsMobileMenuOpen(false)}>
                  <Megaphone className="size-4" />
                  {t('postFreeAd')}
                </Link>
              </Button>

              {user && (
                <>
                  <Separator className="my-2" />
                  <Button asChild variant="ghost" className="w-full justify-start gap-3">
                    <Link href={getViewUrl('seller-dashboard')} onClick={() => setIsMobileMenuOpen(false)}>
                      <Store className="size-4" />
                      {t('switchToSeller')}
                    </Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full justify-start gap-3">
                    <Link href={getViewUrl('admin')} onClick={() => setIsMobileMenuOpen(false)}>
                      <ShieldCheck className="size-4" />
                      {t('switchToAdmin')}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </ScrollArea>

          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              >
                <Globe className="size-4" />
                {locale === 'en' ? 'العربية' : 'English'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <Sun className="size-4 hidden dark:block" />
                <Moon className="size-4 block dark:hidden" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
