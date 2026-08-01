'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowDownAZ,
  Heart,
  Loader2,
  RefreshCw,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parseVariationOptions } from '@/lib/checkout-authority';
import { formatPrice } from '@/lib/currency';
import { useI18n } from '@/lib/i18n';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useAppStore } from '@/stores/app-store';
import { useCartStore } from '@/stores/cart-store';
import { useUserStore } from '@/stores/user-store';
import {
  useWishlistStore,
  type WishlistEntry,
} from '@/stores/wishlist-store';

type SortOption = 'newest' | 'price-low' | 'price-high' | 'name';

function parseImages(images: string): string[] {
  try {
    const parsed = JSON.parse(images) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (value): value is string =>
        typeof value === 'string' &&
        (value.startsWith('/') ||
          value.startsWith('https://') ||
          value.startsWith('http://')),
    );
  } catch {
    return [];
  }
}

export function WishlistPage() {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  const nav = useAppNavigation();
  const currency = useAppStore((state) => state.currency);
  const addItem = useCartStore((state) => state.addItem);
  const user = useUserStore((state) => state.user);
  const isHydrated = useUserStore((state) => state.isHydrated);
  const items = useWishlistStore((state) => state.items);
  const loading = useWishlistStore((state) => state.loading);
  const loaded = useWishlistStore((state) => state.loaded);
  const error = useWishlistStore((state) => state.error);
  const pendingProductIds = useWishlistStore(
    (state) => state.pendingProductIds,
  );
  const hydrate = useWishlistStore((state) => state.hydrate);
  const remove = useWishlistStore((state) => state.remove);
  const removeAll = useWishlistStore((state) => state.removeAll);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    void hydrate(user?.id || null);
  }, [hydrate, isHydrated, user?.id]);

  const sortedItems = useMemo(() => {
    const next = [...items];
    if (sortBy === 'price-low') {
      return next.sort((a, b) => a.product.price - b.product.price);
    }
    if (sortBy === 'price-high') {
      return next.sort((a, b) => b.product.price - a.product.price);
    }
    if (sortBy === 'name') {
      return next.sort((a, b) => a.product.name.localeCompare(b.product.name));
    }
    return next.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [items, sortBy]);

  function productName(item: WishlistEntry) {
    return isRTL && item.product.nameAr
      ? item.product.nameAr
      : item.product.name;
  }

  function storeName(item: WishlistEntry) {
    return isRTL && item.product.store?.nameAr
      ? item.product.store.nameAr
      : item.product.store?.name || '';
  }

  function imageFor(item: WishlistEntry) {
    return parseImages(item.product.images)[0] || '/placeholder-product.svg';
  }

  function requiresOptions(item: WishlistEntry) {
    return (
      Object.keys(parseVariationOptions(item.product.variations || '{}'))
        .length > 0
    );
  }

  function addToCart(item: WishlistEntry) {
    if (requiresOptions(item)) {
      toast.info(
        isRTL
          ? 'اختر خيارات المنتج قبل إضافته إلى السلة.'
          : 'Choose product options before adding it to your cart.',
      );
      nav.selectProduct(item.productId);
      return;
    }
    if (item.product.stock <= 0) return;

    addItem({
      productId: item.productId,
      name: item.product.name,
      price: item.product.price,
      originalPrice: item.product.originalPrice ?? undefined,
      image: imageFor(item),
      quantity: 1,
      storeId: item.product.storeId,
      storeName: item.product.store?.name || '',
      hasFreeShipping: item.product.hasFreeShipping,
    });
    toast.success(isRTL ? 'تمت الإضافة إلى السلة.' : 'Added to cart.');
  }

  function addAvailableToCart() {
    let added = 0;
    let requiresSelection = 0;
    for (const item of sortedItems) {
      if (item.product.stock <= 0) continue;
      if (requiresOptions(item)) {
        requiresSelection += 1;
        continue;
      }
      addItem({
        productId: item.productId,
        name: item.product.name,
        price: item.product.price,
        originalPrice: item.product.originalPrice ?? undefined,
        image: imageFor(item),
        quantity: 1,
        storeId: item.product.storeId,
        storeName: item.product.store?.name || '',
        hasFreeShipping: item.product.hasFreeShipping,
      });
      added += 1;
    }

    if (added > 0) {
      toast.success(
        isRTL
          ? `تمت إضافة ${added} منتج إلى السلة.`
          : `${added} item${added === 1 ? '' : 's'} added to cart.`,
      );
      nav.setView('cart');
    }
    if (requiresSelection > 0) {
      toast.info(
        isRTL
          ? `${requiresSelection} منتج يحتاج إلى اختيار الخيارات أولاً.`
          : `${requiresSelection} item${
              requiresSelection === 1 ? '' : 's'
            } require option selection first.`,
      );
    }
  }

  async function removeItem(item: WishlistEntry) {
    if (!user) return;
    const success = await remove(user.id, item.id, item.productId);
    if (success) {
      toast.success(
        isRTL ? 'تمت الإزالة من المفضلة.' : 'Removed from your wishlist.',
      );
    } else {
      toast.error(
        useWishlistStore.getState().error ||
          (isRTL ? 'تعذر تحديث المفضلة.' : 'Could not update wishlist.'),
      );
    }
  }

  async function clearWishlist() {
    if (!user) return;
    setClearing(true);
    const success = await removeAll(user.id);
    setClearing(false);
    if (success) {
      setClearOpen(false);
      toast.success(isRTL ? 'تم مسح المفضلة.' : 'Wishlist cleared.');
    } else {
      toast.error(
        useWishlistStore.getState().error ||
          (isRTL ? 'تعذر مسح المفضلة.' : 'Could not clear wishlist.'),
      );
    }
  }

  async function shareWishlist() {
    const text = isRTL
      ? `قائمة مفضلتي على NexaMart (${items.length} منتجات)`
      : `My NexaMart wishlist (${items.length} items)`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: isRTL ? 'قائمة مفضلتي' : 'My wishlist',
          text,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success(isRTL ? 'تم نسخ الرابط.' : 'Link copied.');
      }
    } catch {
      // The native share dialog may be dismissed without an error to display.
    }
  }

  if (!isHydrated || (loading && !loaded)) {
    return (
      <div className="container mx-auto flex min-h-72 items-center justify-center px-4 py-10">
        <Loader2 className="size-8 animate-spin text-amber-600" />
        <span className="sr-only">
          {isRTL ? 'جاري تحميل المفضلة' : 'Loading wishlist'}
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-14">
        <Card className="mx-auto max-w-lg border-amber-200 dark:border-amber-900">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950">
              <Heart className="size-10 text-amber-700 dark:text-amber-300" />
            </div>
            <h1 className="text-2xl font-bold">
              {isRTL ? 'احفظ منتجاتك المفضلة' : 'Save your favorite products'}
            </h1>
            <p className="text-muted-foreground">
              {isRTL
                ? 'سجّل الدخول لمزامنة المفضلة بين الصفحات والأجهزة.'
                : 'Sign in to keep your wishlist synchronized across pages and devices.'}
            </p>
            <Button
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => nav.setView('auth')}
            >
              {isRTL ? 'تسجيل الدخول' : 'Sign in'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className="container mx-auto space-y-5 px-4 py-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950">
            <Heart className="size-5 fill-amber-600 text-amber-700 dark:text-amber-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {isRTL ? 'المفضلة' : 'Wishlist'}
            </h1>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {isRTL
                ? `${items.length} منتج محفوظ`
                : `${items.length} saved item${items.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => void shareWishlist()}
            >
              <Share2 className="me-2 size-4" aria-hidden="true" />
              {isRTL ? 'مشاركة' : 'Share'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={addAvailableToCart}
            >
              <ShoppingCart className="me-2 size-4" aria-hidden="true" />
              {isRTL ? 'أضف المتاح للسلة' : 'Add available'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
              onClick={() => setClearOpen(true)}
            >
              <Trash2 className="me-2 size-4" aria-hidden="true" />
              {isRTL ? 'مسح الكل' : 'Clear all'}
            </Button>
          </div>
        )}
      </header>

      {error && (
        <div
          className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          <span className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            {error}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void hydrate(user.id, true)}
          >
            <RefreshCw className="me-1.5 size-4" />
            {isRTL ? 'إعادة المحاولة' : 'Retry'}
          </Button>
        </div>
      )}

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <div className="flex size-24 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/50">
              <Heart className="size-12 text-amber-300 dark:text-amber-800" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {isRTL ? 'لا توجد منتجات محفوظة' : 'Your wishlist is empty'}
              </h2>
              <p className="mt-1 text-muted-foreground">
                {isRTL
                  ? 'استخدم زر القلب في بطاقات المنتجات لحفظها هنا.'
                  : 'Use the heart button on any product card to save it here.'}
              </p>
            </div>
            <Button
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => nav.setView('shop')}
            >
              <ShoppingBag className="me-2 size-4" aria-hidden="true" />
              {isRTL ? 'تصفح المنتجات' : 'Browse products'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {isRTL
                  ? 'المفضلة متزامنة مع حسابك وتُحدّث من جميع صفحات المنتجات.'
                  : 'This list is synchronized with your account and updates from every product page.'}
              </p>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as SortOption)}
              >
                <SelectTrigger className="w-full sm:w-52" aria-label={isRTL ? 'ترتيب المنتجات' : 'Sort products'}>
                  <ArrowDownAZ className="me-2 size-4" aria-hidden="true" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">
                    {isRTL ? 'الأحدث إضافة' : 'Recently added'}
                  </SelectItem>
                  <SelectItem value="price-low">
                    {isRTL ? 'السعر: الأقل أولاً' : 'Price: low to high'}
                  </SelectItem>
                  <SelectItem value="price-high">
                    {isRTL ? 'السعر: الأعلى أولاً' : 'Price: high to low'}
                  </SelectItem>
                  <SelectItem value="name">
                    {isRTL ? 'الاسم' : 'Name'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedItems.map((item) => {
              const name = productName(item);
              const image = imageFor(item);
              const optionsRequired = requiresOptions(item);
              const pending = Boolean(pendingProductIds[item.productId]);
              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-border bg-card"
                >
                  <Link
                    href={`/product/${item.productId}`}
                    className="relative block aspect-square overflow-hidden bg-muted"
                    aria-label={
                      isRTL ? `عرض تفاصيل ${name}` : `View ${name} details`
                    }
                  >
                    <Image
                      src={image}
                      alt={name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      loading="lazy"
                      className="object-cover transition-transform duration-200 hover:scale-[1.03]"
                    />
                  </Link>

                  <div className="space-y-3 p-4">
                    <div className="min-w-0">
                      {storeName(item) && (
                        <p className="truncate text-xs text-muted-foreground">
                          {storeName(item)}
                        </p>
                      )}
                      <h2 className="mt-1 min-h-10 font-semibold leading-5">
                        <Link
                          href={`/product/${item.productId}`}
                          className="line-clamp-2 hover:text-amber-700 dark:hover:text-amber-300"
                        >
                          {name}
                        </Link>
                      </h2>
                    </div>

                    <div className="flex items-end justify-between gap-2">
                      <div>
                        <p className="font-bold text-amber-700 dark:text-amber-300">
                          {formatPrice(item.product.price, currency)}
                        </p>
                        {item.product.originalPrice &&
                          item.product.originalPrice > item.product.price && (
                            <p className="text-xs text-muted-foreground line-through">
                              {formatPrice(
                                item.product.originalPrice,
                                currency,
                              )}
                            </p>
                          )}
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          item.product.stock <= 0
                            ? 'border-red-200 text-red-700 dark:border-red-900 dark:text-red-300'
                            : 'border-amber-200 text-amber-700 dark:border-amber-900 dark:text-amber-300'
                        }
                      >
                        {item.product.stock <= 0
                          ? isRTL
                            ? 'غير متوفر'
                            : 'Out of stock'
                          : optionsRequired
                            ? isRTL
                              ? 'خيارات مطلوبة'
                              : 'Options required'
                            : isRTL
                              ? 'متوفر'
                              : 'In stock'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <Button
                        type="button"
                        className="h-10 bg-amber-600 text-white hover:bg-amber-700"
                        onClick={() => addToCart(item)}
                        disabled={item.product.stock <= 0}
                      >
                        <ShoppingCart className="me-2 size-4" aria-hidden="true" />
                        {optionsRequired
                          ? isRTL
                            ? 'اختر الخيارات'
                            : 'Choose options'
                          : isRTL
                            ? 'أضف للسلة'
                            : 'Add to cart'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-10 border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
                        onClick={() => void removeItem(item)}
                        disabled={pending}
                        aria-label={
                          isRTL
                            ? `إزالة ${name} من المفضلة`
                            : `Remove ${name} from wishlist`
                        }
                      >
                        {pending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRTL ? 'مسح قائمة المفضلة؟' : 'Clear your wishlist?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? 'سيتم حذف جميع المنتجات المحفوظة من حسابك. لا يمكن التراجع عن هذا الإجراء.'
                : 'All saved products will be removed from your account. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearing}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void clearWishlist();
              }}
              disabled={clearing}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {clearing && <Loader2 className="me-2 size-4 animate-spin" />}
              {isRTL ? 'مسح الكل' : 'Clear all'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
