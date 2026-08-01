'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  CircleHelp,
  Heart,
  Languages,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Package,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Sun,
  User,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useI18n } from '@/lib/i18n';
import { useCartStore } from '@/stores/cart-store';
import { useUserStore } from '@/stores/user-store';
import { useWishlistStore } from '@/stores/wishlist-store';

const primaryLinks = [
  { href: '/', en: 'Home', ar: 'الرئيسية' },
  { href: '/shop', en: 'Shop', ar: 'التسوق' },
  { href: '/deals', en: 'Deals', ar: 'العروض' },
  { href: '/stores', en: 'Stores', ar: 'المتاجر' },
] as const;

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale } = useI18n();
  const isRTL = locale === 'ar';
  const { theme, setTheme } = useTheme();
  const user = useUserStore((state) => state.user);
  const isHydrated = useUserStore((state) => state.isHydrated);
  const logout = useUserStore((state) => state.logout);
  const itemCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const wishlistCount = useWishlistStore((state) => state.items.length);
  const hydrateWishlist = useWishlistStore((state) => state.hydrate);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    void hydrateWishlist(user?.id || null);
  }, [hydrateWishlist, isHydrated, user?.id]);

  function label(en: string, ar: string) {
    return isRTL ? ar : en;
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setMobileSearchOpen(false);
    setMenuOpen(false);
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      useWishlistStore.getState().reset();
      setMenuOpen(false);
      router.push('/');
      toast.success(label('Signed out.', 'تم تسجيل الخروج.'));
    } finally {
      setLoggingOut(false);
    }
  }

  const initials = user?.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const roleLink = user
    ? user.role === 'admin'
      ? { href: '/admin', icon: ShieldCheck, en: 'Admin workspace', ar: 'لوحة الإدارة' }
      : user.role === 'seller'
        ? { href: '/seller/dashboard', icon: Store, en: 'Seller workspace', ar: 'لوحة البائع' }
        : { href: '/seller/onboarding', icon: Store, en: 'Start selling', ar: 'ابدأ البيع' }
    : null;

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/85">
      <div className="container mx-auto flex h-16 items-center gap-2 px-4">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-10 lg:hidden"
              aria-label={label('Open navigation menu', 'فتح قائمة التنقل')}
            >
              <Menu className="size-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side={isRTL ? 'right' : 'left'}
            className="w-[min(22rem,90vw)] overflow-y-auto"
          >
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-start">
                <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                NexaMart
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              {user ? (
                <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
                  <Avatar className="size-11">
                    <AvatarImage src={user.avatar} alt="" />
                    <AvatarFallback className="bg-amber-600 text-white">
                      {initials || <User className="size-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
              ) : (
                <Button asChild className="w-full bg-amber-600 text-white hover:bg-amber-700">
                  <Link href="/auth" onClick={() => setMenuOpen(false)}>
                    <LogIn className="me-2 size-4" aria-hidden="true" />
                    {label('Sign in', 'تسجيل الدخول')}
                  </Link>
                </Button>
              )}

              <nav aria-label={label('Mobile navigation', 'التنقل على الهاتف')}>
                <ul className="space-y-1">
                  {primaryLinks.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        aria-current={isActive(link.href) ? 'page' : undefined}
                        className={`flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors ${
                          isActive(link.href)
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                            : 'hover:bg-muted'
                        }`}
                      >
                        {label(link.en, link.ar)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              {user && (
                <div className="space-y-1 border-t pt-4">
                  <Link
                    href="/orders"
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-muted"
                  >
                    <Package className="size-4" aria-hidden="true" />
                    {label('My orders', 'طلباتي')}
                  </Link>
                  <Link
                    href="/wishlist"
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-muted"
                  >
                    <Heart className="size-4" aria-hidden="true" />
                    {label('Wishlist', 'المفضلة')}
                    {wishlistCount > 0 && (
                      <Badge className="ms-auto bg-amber-600 text-white">
                        {wishlistCount > 99 ? '99+' : wishlistCount}
                      </Badge>
                    )}
                  </Link>
                  <Link
                    href="/returns"
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-muted"
                  >
                    <RotateCcw className="size-4" aria-hidden="true" />
                    {label('Returns', 'الإرجاعات')}
                  </Link>
                  {roleLink && (
                    <Link
                      href={roleLink.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-muted"
                    >
                      <roleLink.icon className="size-4" aria-hidden="true" />
                      {label(roleLink.en, roleLink.ar)}
                    </Link>
                  )}
                </div>
              )}

              <div className="space-y-1 border-t pt-4">
                <Link
                  href="/help"
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm hover:bg-muted"
                >
                  <CircleHelp className="size-4" aria-hidden="true" />
                  {label('Help center', 'مركز المساعدة')}
                </Link>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm hover:bg-muted"
                  onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
                >
                  <Languages className="size-4" aria-hidden="true" />
                  {locale === 'ar' ? 'English' : 'العربية'}
                </button>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm hover:bg-muted"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? (
                    <Sun className="size-4" aria-hidden="true" />
                  ) : (
                    <Moon className="size-4" aria-hidden="true" />
                  )}
                  {theme === 'dark'
                    ? label('Light theme', 'الوضع الفاتح')
                    : label('Dark theme', 'الوضع الداكن')}
                </button>
                {user && (
                  <button
                    type="button"
                    className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950"
                    onClick={() => void handleLogout()}
                    disabled={loggingOut}
                  >
                    <LogOut className="size-4" aria-hidden="true" />
                    {label('Sign out', 'تسجيل الخروج')}
                  </button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-md"
          aria-label={label('NexaMart home', 'الصفحة الرئيسية لنكسا مارت')}
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-sm">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <span className="hidden text-lg font-bold sm:inline">
            <span className="text-amber-700 dark:text-amber-300">Nexa</span>
            <span>Mart</span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label={label('Primary navigation', 'التنقل الرئيسي')}
        >
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {label(link.en, link.ar)}
            </Link>
          ))}
        </nav>

        <form
          onSubmit={submitSearch}
          role="search"
          className="relative mx-auto hidden max-w-xl flex-1 md:block"
        >
          <Search
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={label('Search products and stores', 'ابحث عن المنتجات والمتاجر')}
            className="h-10 rounded-xl bg-muted/60 ps-10 pe-4"
            aria-label={label('Search marketplace', 'البحث في السوق')}
          />
        </form>

        <div className="ms-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 md:hidden"
            onClick={() => setMobileSearchOpen((open) => !open)}
            aria-label={
              mobileSearchOpen
                ? label('Close search', 'إغلاق البحث')
                : label('Open search', 'فتح البحث')
            }
            aria-expanded={mobileSearchOpen}
          >
            {mobileSearchOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Search className="size-5" aria-hidden="true" />
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden size-10 sm:inline-flex"
            onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            aria-label={
              locale === 'ar'
                ? 'Switch language to English'
                : 'تغيير اللغة إلى العربية'
            }
          >
            <Languages className="size-5" aria-hidden="true" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden size-10 sm:inline-flex"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={
              theme === 'dark'
                ? label('Use light theme', 'استخدام الوضع الفاتح')
                : label('Use dark theme', 'استخدام الوضع الداكن')
            }
          >
            {theme === 'dark' ? (
              <Sun className="size-5" aria-hidden="true" />
            ) : (
              <Moon className="size-5" aria-hidden="true" />
            )}
          </Button>

          {user && (
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="relative hidden size-10 sm:inline-flex"
            >
              <Link
                href="/wishlist"
                aria-label={label('Open wishlist', 'فتح المفضلة')}
              >
                <Heart className="size-5" aria-hidden="true" />
                {wishlistCount > 0 && (
                  <Badge className="absolute -end-1 -top-1 flex size-5 items-center justify-center bg-amber-600 p-0 text-[10px] text-white">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </Badge>
                )}
              </Link>
            </Button>
          )}

          <Button
            asChild
            variant="ghost"
            size="icon"
            className="relative size-10"
          >
            <Link href="/cart" aria-label={label('Open cart', 'فتح السلة')}>
              <ShoppingCart className="size-5" aria-hidden="true" />
              {itemCount > 0 && (
                <Badge className="absolute -end-1 -top-1 flex size-5 items-center justify-center bg-amber-600 p-0 text-[10px] text-white">
                  {itemCount > 9 ? '9+' : itemCount}
                </Badge>
              )}
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-10"
                  aria-label={label('Open account menu', 'فتح قائمة الحساب')}
                >
                  <Avatar className="size-8">
                    <AvatarImage src={user.avatar} alt="" />
                    <AvatarFallback className="bg-amber-600 text-xs text-white">
                      {initials || <User className="size-4" />}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isRTL ? 'start' : 'end'}
                className="w-60"
              >
                <DropdownMenuLabel>
                  <span className="block truncate">{user.name}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {user.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="size-4" />
                    {label('Profile', 'الملف الشخصي')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/orders">
                    <Package className="size-4" />
                    {label('My orders', 'طلباتي')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/wishlist">
                    <Heart className="size-4" />
                    {label('Wishlist', 'المفضلة')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/returns">
                    <RotateCcw className="size-4" />
                    {label('Returns', 'الإرجاعات')}
                  </Link>
                </DropdownMenuItem>
                {roleLink && (
                  <DropdownMenuItem asChild>
                    <Link href={roleLink.href}>
                      <roleLink.icon className="size-4" />
                      {label(roleLink.en, roleLink.ar)}
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/help">
                    <CircleHelp className="size-4" />
                    {label('Help center', 'مركز المساعدة')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-700 focus:bg-red-50 focus:text-red-700 dark:text-red-300 dark:focus:bg-red-950 dark:focus:text-red-300"
                  onClick={() => void handleLogout()}
                  disabled={loggingOut}
                >
                  <LogOut className="size-4" />
                  {label('Sign out', 'تسجيل الخروج')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              asChild
              size="sm"
              className="hidden bg-amber-600 text-white hover:bg-amber-700 sm:inline-flex"
            >
              <Link href="/auth">{label('Sign in', 'تسجيل الدخول')}</Link>
            </Button>
          )}
        </div>
      </div>

      {mobileSearchOpen && (
        <form
          onSubmit={submitSearch}
          role="search"
          className="container mx-auto border-t px-4 py-3 md:hidden"
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={label('Search products and stores', 'ابحث عن المنتجات والمتاجر')}
              className="h-11 ps-10"
              autoFocus
              aria-label={label('Search marketplace', 'البحث في السوق')}
            />
          </div>
        </form>
      )}
    </header>
  );
}
