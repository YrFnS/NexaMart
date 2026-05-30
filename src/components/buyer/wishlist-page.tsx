'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Plus,
  FolderOpen,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  MoreVertical,
  FolderPlus,
  Check,
  X,
  Loader2,
  Share2,
  ArrowUpDown,
  GripVertical,
  Bell,
  BellRing,
  TrendingDown,
  Package,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useCartStore } from '@/stores/cart-store';
import { useUserStore } from '@/stores/user-store';
import { toast } from 'sonner';
import { getPlaceholderImage } from '@/lib/placeholder-image';

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  nameAr?: string;
  price: number;
  originalPrice?: number;
  image: string;
  storeName: string;
  storeId: string;
  rating: number;
  reviewCount: number;
  stock: number;
  collection?: string;
  addedAt: string;
}

interface Collection {
  id: string;
  name: string;
  nameAr?: string;
  count: number;
}

type SortOption = 'date' | 'price-low' | 'price-high' | 'name';

const DEFAULT_COLLECTIONS: Collection[] = [
  { id: 'all', name: 'All Items', nameAr: 'جميع المنتجات', count: 0 },
  { id: 'favorites', name: 'Favorites', nameAr: 'المفضلة', count: 0 },
  { id: 'gift-ideas', name: 'Gift Ideas', nameAr: 'أفكار هدايا', count: 0 },
  { id: 'watch-later', name: 'Watch Later', nameAr: 'شاهد لاحقاً', count: 0 },
];

const SORT_OPTIONS: { id: SortOption; label: string; labelAr: string }[] = [
  { id: 'date', label: 'Date Added', labelAr: 'تاريخ الإضافة' },
  { id: 'price-low', label: 'Price: Low-High', labelAr: 'السعر: الأقل أولاً' },
  { id: 'price-high', label: 'Price: High-Low', labelAr: 'السعر: الأعلى أولاً' },
  { id: 'name', label: 'Name A-Z', labelAr: 'الاسم أ-ي' },
];

export function WishlistPage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const addItem = useCartStore((s) => s.addItem);
  const { user } = useUserStore();
  const isRTL = locale === 'ar';

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCollection, setActiveCollection] = useState('all');
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [removeAllTarget, setRemoveAllTarget] = useState(false);
  const [collections, setCollections] = useState<Collection[]>(DEFAULT_COLLECTIONS);
  const [showNewCollection, setShowNewCollection] = useState(false);
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionNameAr, setNewCollectionNameAr] = useState('');
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [priceDropAlerts, setPriceDropAlerts] = useState<Set<string>>(new Set());
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    const fetchWishlist = async () => {
      const userId = user?.id;
      if (!userId) {
        setWishlistItems([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/wishlist?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setWishlistItems(Array.isArray(data) ? data : data.items || []);
        } else {
          setWishlistItems([]);
        }
      } catch {
        setWishlistItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWishlist();
  }, [user?.id]);

  // Update collection counts when items change
  useEffect(() => {
    setCollections((prev) =>
      prev.map((c) => ({
        ...c,
        count: c.id === 'all'
          ? wishlistItems.length
          : wishlistItems.filter((i) => i.collection === c.id).length,
      }))
    );
  }, [wishlistItems]);

  const filteredItems = useMemo(() => {
    let items = activeCollection === 'all' ? wishlistItems : wishlistItems.filter((item) => item.collection === activeCollection);
    switch (sortBy) {
      case 'price-low':
        return [...items].sort((a, b) => a.price - b.price);
      case 'price-high':
        return [...items].sort((a, b) => b.price - a.price);
      case 'name':
        return [...items].sort((a, b) => a.name.localeCompare(b.name));
      case 'date':
      default:
        return [...items].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    }
  }, [wishlistItems, activeCollection, sortBy]);

  const handleRemoveItem = async (itemId: string) => {
    const userId = user?.id;
    if (!userId) return;
    try {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', itemId, userId }),
      });
    } catch {
      // Continue with local state update
    }
    setWishlistItems((prev) => prev.filter((i) => i.id !== itemId));
    setRemoveTarget(null);
  };

  const handleRemoveAll = () => {
    const itemsToRemove = activeCollection === 'all' ? wishlistItems : wishlistItems.filter((i) => i.collection === activeCollection);
    const removeIds = new Set(itemsToRemove.map((i) => i.id));
    setWishlistItems((prev) => prev.filter((i) => !removeIds.has(i.id)));
    setRemoveAllTarget(false);
  };

  const handleAddToCart = async (item: WishlistItem) => {
    setAddingToCart(item.id);
    addItem({
      productId: item.productId,
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice,
      image: item.image,
      quantity: 1,
      storeId: item.storeId,
      storeName: item.storeName,
    });
    setTimeout(() => setAddingToCart(null), 600);
  };

  const handleAddAllToCart = () => {
    filteredItems.forEach((item) => {
      if (item.stock > 0) {
        addItem({
          productId: item.productId,
          name: item.name,
          price: item.price,
          originalPrice: item.originalPrice,
          image: item.image,
          quantity: 1,
          storeId: item.storeId,
          storeName: item.storeName,
        });
      }
    });
    nav.setView('cart');
  };

  const handleCreateCollection = () => {
    const name = newCollectionName.trim();
    if (!name) return;
    const newCol: Collection = {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      nameAr: newCollectionNameAr.trim() || name,
      count: 0,
    };
    setCollections((prev) => [...prev, newCol]);
    setNewCollectionName('');
    setNewCollectionNameAr('');
    setShowNewCollectionDialog(false);
  };

  const handleMoveToCollection = (itemId: string, collectionId: string) => {
    setWishlistItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, collection: collectionId === 'all' ? undefined : collectionId } : item
      )
    );
    toast.success(t('itemMoved'));
  };

  const handleShareWishlist = () => {
    const shareText = isRTL
      ? `قائمة أمنياتي على NexaMart - ${wishlistItems.length} منتجات`
      : `My NexaMart Wishlist - ${wishlistItems.length} items`;
    if (navigator.share) {
      navigator.share({
        title: isRTL ? 'قائمة أمنياتي' : 'My Wishlist',
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t('linkCopied'));
    }
  };

  const togglePriceDropAlert = (itemId: string) => {
    setPriceDropAlerts((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 animate-pulse" />
          <div className="h-8 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <div className="aspect-square bg-muted rounded-lg animate-pulse mb-3" />
                <div className="h-4 w-3/4 bg-muted rounded animate-pulse mb-2" />
                <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto text-center space-y-6">
          <div className="w-32 h-32 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
            <Heart className="size-16 text-emerald-300 dark:text-emerald-700" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">{t('emptyWishlist')}</h1>
          <p className="text-muted-foreground">
            {isRTL
              ? 'احفظ المنتجات التي تعجبك لتجدها لاحقاً!'
              : 'Save products you love to find them later!'}
          </p>
          <Button
            size="lg"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => nav.setView('shop')}
          >
            <ShoppingBag className="size-4 me-2" />
            {t('continueShopping')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900">
            <Heart className="size-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t('wishlist')}</h1>
            <p className="text-sm text-muted-foreground">
              {wishlistItems.length} {t('b_items')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 gap-1.5"
            onClick={handleShareWishlist}
          >
            <Share2 className="size-3.5" />
            {t('shareWishlist')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 gap-1.5"
            onClick={handleAddAllToCart}
          >
            <ShoppingCart className="size-3.5" />
            {isRTL ? 'أضف الكل للسلة' : 'Add All to Cart'}
          </Button>
        </div>
      </div>

      {/* Collection Tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
        {collections.map((col) => (
          <Button
            key={col.id}
            variant={activeCollection === col.id ? 'default' : 'outline'}
            size="sm"
            className={`shrink-0 text-xs rounded-full ${
              activeCollection === col.id
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
            }`}
            onClick={() => setActiveCollection(col.id)}
          >
            {col.id !== 'all' && <FolderOpen className="size-3 me-1" />}
            {isRTL && col.nameAr ? col.nameAr : col.name}
            <Badge variant="secondary" className="ms-1.5 text-[10px] px-1 py-0">
              {col.count}
            </Badge>
          </Button>
        ))}

        {/* New Collection Button */}
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 text-xs rounded-full border-dashed"
          onClick={() => setShowNewCollectionDialog(true)}
        >
          <FolderPlus className="size-3 me-1" />
          {t('b_newCollection')}
        </Button>
      </div>

      {/* Sort + Actions Bar */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <ArrowUpDown className="size-3 me-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {isRTL ? opt.labelAr : opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-red-500 hover:text-red-600"
            onClick={() => setRemoveAllTarget(true)}
          >
            <Trash2 className="size-3 me-1" />
            {t('removeAll')}
          </Button>
        </div>
      </div>

      {/* Wishlist Grid */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen className="size-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">
            {t('b_noItemsInCollection')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filteredItems.map((item) => {
            const displayName = isRTL && item.nameAr ? item.nameAr : item.name;
            const discount = item.originalPrice
              ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
              : 0;

            return (
              <Card
                key={item.id}
                className="group relative overflow-hidden hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-300"
              >
                <CardContent className="p-0">
                  {/* Image */}
                  <div
                    className="relative aspect-square overflow-hidden bg-muted cursor-pointer"
                    onClick={() => nav.selectProduct(item.productId)}
                  >
                    <Image
                      src={item.image}
                      alt={displayName}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (!img.dataset.retried) {
                          img.dataset.retried = 'true';
                          img.src = getPlaceholderImage('electronics', displayName, 400, 400);
                        }
                      }}
                    />

                    {/* Discount Badge */}
                    {discount > 0 && (
                      <Badge className="absolute top-2 start-2 bg-red-500 text-white text-[10px] px-1.5 py-0">
                        -{discount}%
                      </Badge>
                    )}

                    {/* Stock Status Badge */}
                    {item.stock === 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Badge className="bg-red-600 text-white">{t('outOfStock')}</Badge>
                      </div>
                    )}
                    {item.stock > 0 && item.stock <= 5 && (
                      <Badge className="absolute top-2 end-2 bg-amber-500 text-white text-[10px] px-1.5 py-0 z-10">
                        {isRTL ? 'مخزون قليل' : 'Low Stock'}
                      </Badge>
                    )}
                    {item.stock > 5 && item.stock <= 20 && (
                      <Badge className="absolute top-2 end-2 bg-emerald-500 text-white text-[10px] px-1.5 py-0 z-10">
                        <Package className="size-2 me-0.5" />{isRTL ? 'متوفر' : 'In Stock'}
                      </Badge>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

                    {/* Action buttons on hover */}
                    <div className="absolute bottom-2 start-2 end-2 flex gap-1.5 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                        disabled={item.stock === 0}
                      >
                        {addingToCart === item.id ? (
                          <Check className="size-3.5 me-1" />
                        ) : (
                          <ShoppingCart className="size-3.5 me-1" />
                        )}
                        {addingToCart === item.id
                          ? t('b_added')
                          : t('addToCart')}
                      </Button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3 space-y-1.5">
                    <p className="text-[10px] text-muted-foreground truncate">{item.storeName}</p>
                    <h3
                      className="text-sm font-medium line-clamp-2 min-h-[2.5rem] cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      onClick={() => nav.selectProduct(item.productId)}
                    >
                      {displayName}
                    </h3>

                    {/* Price */}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {formatPrice(item.price)}
                      </span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(item.originalPrice)}
                        </span>
                      )}
                    </div>

                    {/* Price Drop Alert Toggle */}
                    <button
                      onClick={(e) => { e.stopPropagation(); togglePriceDropAlert(item.id); }}
                      className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${
                        priceDropAlerts.has(item.id)
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400'
                      }`
                    }
                    >
                      {priceDropAlerts.has(item.id) ? (
                        <BellRing className="size-3" />
                      ) : (
                        <Bell className="size-3" />
                      )}
                      {priceDropAlerts.has(item.id)
                        ? (isRTL ? 'تنبيه السعر مفعّل' : 'Price alert on')
                        : (isRTL ? 'تنبيه انخفاض السعر' : 'Price drop alert')
                      }
                    </button>

                    {/* Actions Row */}
                    <div className="flex items-center justify-between pt-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7 text-muted-foreground">
                            <MoreVertical className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                          {collections
                            .filter((c) => c.id !== 'all' && c.id !== item.collection)
                            .map((col) => (
                              <DropdownMenuItem
                                key={col.id}
                                onClick={() => handleMoveToCollection(item.id, col.id)}
                              >
                                <FolderOpen className="size-3.5 me-2" />
                                {isRTL && col.nameAr ? col.nameAr : col.name}
                              </DropdownMenuItem>
                            ))}
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setRemoveTarget(item.id)}
                          >
                            <Trash2 className="size-3.5 me-2" />
                            {t('b_removeFromWishlist')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-red-500 hover:text-red-600"
                        onClick={() => setRemoveTarget(item.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Continue Shopping */}
      <div className="text-center mt-8">
        <Button
          variant="ghost"
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
          onClick={() => nav.setView('shop')}
        >
          {isRTL ? <ArrowRight className="size-4 me-1" /> : <ArrowLeft className="size-4 me-1" />}
          {t('continueShopping')}
        </Button>
      </div>

      {/* Remove Single Item Confirmation */}
      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('b_removeFromWishlistQ')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? 'هل أنت متأكد من إزالة هذا المنتج من قائمة المفضلة؟'
                : 'Are you sure you want to remove this item from your wishlist?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeTarget && handleRemoveItem(removeTarget)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t('b_remove')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove All Confirmation */}
      <AlertDialog open={removeAllTarget} onOpenChange={setRemoveAllTarget}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('removeAllItems')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeCollection === 'all'
                ? isRTL
                  ? 'هل أنت متأكد من إزالة جميع المنتجات من قائمة المفضلة؟ لا يمكن التراجع عن هذا الإجراء.'
                  : 'Are you sure you want to remove all items from your wishlist? This action cannot be undone.'
                : isRTL
                  ? 'هل أنت متأكد من إزالة جميع المنتجات من هذه المجموعة؟'
                  : 'Are you sure you want to remove all items from this collection?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveAll}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {t('removeAll')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Collection Dialog */}
      <Dialog open={showNewCollectionDialog} onOpenChange={setShowNewCollectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FolderPlus className="size-5 text-emerald-600" />
              {t('createCollection')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">{t('b_collectionNameEn')}</label>
              <Input
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder={t('b_egBirthdayGifts')}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">{t('collectionNameAr')}</label>
              <Input
                value={newCollectionNameAr}
                onChange={(e) => setNewCollectionNameAr(e.target.value)}
                placeholder="مثال: هدايا عيد الميلاد"
                dir="rtl"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCollectionDialog(false)}>
              {t('cancel')}
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim()}
            >
              {t('b_create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
