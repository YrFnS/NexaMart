'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Package,
  CheckCircle,
  FileEdit,
  AlertTriangle,
  XCircle,
  MoreHorizontal,
  Eye,
  Flag,
  Archive,
  Check,
  ChevronLeft,
  ChevronRight,
  Star,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { adminFetch } from '@/lib/admin-api';

interface AdminProduct {
  id: string;
  name: string;
  nameAr?: string;
  price: number;
  originalPrice?: number;
  stock: number;
  rating: number;
  reviewCount: number;
  soldCount: number;
  sku?: string;
  status: string;
  isFeatured: boolean;
  isSale?: boolean;
  categoryId: string;
  categoryName: string;
  storeId: string;
  storeName: string;
  images?: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
}

const ITEMS_PER_PAGE = 10;

export function ProductManagement() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('');
  const [page, setPage] = useState(1);

  // Dialogs
  const [detailProduct, setDetailProduct] = useState<AdminProduct | null>(null);
  const [flagDialog, setFlagDialog] = useState<AdminProduct | null>(null);
  const [flagReason, setFlagReason] = useState('');
  const [flagNote, setFlagNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (categoryFilter !== 'all') params.set('category', categoryFilter);
        if (statusFilter !== 'all') params.set('status', statusFilter);
        if (storeFilter) params.set('storeId', storeFilter);
        params.set('page', String(page));
        params.set('limit', String(ITEMS_PER_PAGE));

        const res = await adminFetch(`/api/admin/products?${params}`);
        if (res.ok && !cancelled) {
          const json = await res.json();
          setProducts(json.products || []);
          setTotal(json.total || 0);
        }
      } catch {
        // fallback
      }
      if (!cancelled) setLoading(false);
    };
    fetchData();
    return () => { cancelled = true; };
  }, [search, categoryFilter, statusFilter, storeFilter, page, refreshKey]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) setCategories(json);
          else if (json.categories) setCategories(json.categories);
        }
      } catch {
        // fallback
      }
    };
    fetchCats();
  }, []);

  // Compute summary
  const summary = useMemo(() => {
    let active = 0;
    let draft = 0;
    let flagged = 0;
    let outOfStock = 0;
    products.forEach(p => {
      const s = p.status?.toLowerCase();
      if (s === 'active') active++;
      else if (s === 'draft') draft++;
      if (p.stock <= 0) outOfStock++;
    });
    return { total, active, draft, flagged, outOfStock };
  }, [products, total]);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  const handleProductAction = async (productId: string, action: string) => {
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, action }),
      });
      if (res.ok) {
        const json = await res.json();
        setProducts(prev => prev.map(p => {
          if (p.id === productId) {
            return { ...p, status: json.status || p.status };
          }
          return p;
        }));
      }
    } catch {
      // error
    }
    setSaving(false);
  };

  const handleFlagProduct = async () => {
    if (!flagDialog) return;
    setSaving(true);
    await handleProductAction(flagDialog.id, 'flag');
    setFlagDialog(null);
    setFlagReason('');
    setFlagNote('');
    setSaving(false);
  };

  const productStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
      draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      archived: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    };
    return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  };

  const getThumbnail = (images?: string) => {
    if (!images) return null;
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      if (typeof parsed === 'string') return parsed;
    } catch {
      if (typeof images === 'string' && images.startsWith('http')) return images;
    }
    return null;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const summaryCards = [
    { label: 'Total Products', value: summary.total, icon: Package, color: 'emerald' },
    { label: 'Active', value: summary.active, icon: CheckCircle, color: 'emerald' },
    { label: 'Draft', value: summary.draft, icon: FileEdit, color: 'amber' },
    { label: 'Flagged', value: summary.flagged, icon: AlertTriangle, color: 'orange' },
    { label: 'Out of Stock', value: summary.outOfStock, icon: XCircle, color: 'rose' },
  ];

  const colorMap: Record<string, { bg: string; icon: string; darkBg: string; darkIcon: string }> = {
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', darkBg: 'dark:bg-emerald-950/50', darkIcon: 'dark:text-emerald-400' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', darkBg: 'dark:bg-amber-950/50', darkIcon: 'dark:text-amber-400' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', darkBg: 'dark:bg-orange-950/50', darkIcon: 'dark:text-orange-400' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', darkBg: 'dark:bg-rose-950/50', darkIcon: 'dark:text-rose-400' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', darkBg: 'dark:bg-blue-950/50', darkIcon: 'dark:text-blue-400' },
  };

  if (loading && products.length === 0) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-16 rounded-xl bg-muted animate-pulse" />
        <div className="h-96 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Product Management</h2>
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
          onClick={() => setRefreshKey(k => k + 1)}
        >
          <RefreshCw className="h-3.5 w-3.5 me-1.5" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {summaryCards.map((card, i) => {
          const colors = colorMap[card.color];
          const Icon = card.icon;
          return (
            <Card key={i} className="relative overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">{card.label}</p>
                    <p className="text-lg font-bold">{card.value}</p>
                  </div>
                  <div className={`h-8 w-8 rounded-lg ${colors.bg} ${colors.darkBg} flex items-center justify-center`}>
                    <Icon className={`h-4 w-4 ${colors.icon} ${colors.darkIcon}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="ps-9 h-9 text-sm"
              />
            </div>
            <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Store ID filter"
              value={storeFilter}
              onChange={(e) => { setStoreFilter(e.target.value); setPage(1); }}
              className="w-full sm:w-[140px] h-9 text-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Image</TableHead>
                  <TableHead className="text-xs">Product</TableHead>
                  <TableHead className="text-xs">Store</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs text-end">{t('price')}</TableHead>
                  <TableHead className="text-xs">Stock</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Rating</TableHead>
                  <TableHead className="text-xs text-end">{t('adminActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => {
                    const thumb = getThumbnail(product.images);
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={product.name}
                              className="h-9 w-9 rounded-md object-cover border border-border"
                            />
                          ) : (
                            <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs font-medium line-clamp-1">{product.name}</p>
                            {product.nameAr && (
                              <p className="text-[11px] text-muted-foreground line-clamp-1" dir="rtl">{product.nameAr}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{product.storeName}</TableCell>
                        <TableCell className="text-xs">{product.categoryName}</TableCell>
                        <TableCell className="text-xs text-end">
                          <div>
                            <span className="font-medium">{formatPrice(product.price)}</span>
                            {product.originalPrice && product.originalPrice > product.price && (
                              <p className="text-[10px] text-muted-foreground line-through">{formatPrice(product.originalPrice)}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className={`text-xs ${product.stock < 5 ? 'text-rose-600 dark:text-rose-400 font-semibold' : ''}`}>
                              {product.stock}
                            </span>
                            {product.stock < 5 && product.stock > 0 && (
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                            )}
                            {product.stock <= 0 && (
                              <XCircle className="h-3 w-3 text-rose-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] px-1.5 py-0 border-0 capitalize ${productStatusBadge(product.status)}`}>
                            {product.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-0.5 text-xs">
                            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                            <span className="font-medium">{product.rating?.toFixed(1) || '0.0'}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-44">
                              <DropdownMenuItem onClick={() => setDetailProduct(product)}>
                                <Eye className="h-3.5 w-3.5 me-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => { setFlagDialog(product); setFlagReason(''); setFlagNote(''); }}>
                                <Flag className="h-3.5 w-3.5 me-2 text-orange-500" />
                                Flag Product
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleProductAction(product.id, 'archive')}>
                                <Archive className="h-3.5 w-3.5 me-2 text-gray-500" />
                                Archive
                              </DropdownMenuItem>
                              {product.status !== 'active' && (
                                <DropdownMenuItem onClick={() => handleProductAction(product.id, 'approve')}>
                                  <Check className="h-3.5 w-3.5 me-2 text-emerald-500" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {total} products
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  {isRTL ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const p = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                  if (p < 1 || p > totalPages) return null;
                  return (
                    <Button
                      key={p}
                      variant={p === page ? 'default' : 'outline'}
                      size="icon"
                      className={`h-7 w-7 text-xs ${p === page ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-7 w-7"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  {isRTL ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Detail Dialog */}
      <Dialog open={!!detailProduct} onOpenChange={() => setDetailProduct(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-emerald-600" />
              Product Details
            </DialogTitle>
            <DialogDescription>Full product information</DialogDescription>
          </DialogHeader>
          {detailProduct && (
            <div className="space-y-4">
              {/* Image & Name */}
              <div className="flex gap-4">
                {(() => {
                  const thumb = getThumbnail(detailProduct.images);
                  return thumb ? (
                    <img
                      src={thumb}
                      alt={detailProduct.name}
                      className="h-20 w-20 rounded-lg object-cover border border-border"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  );
                })()}
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">{detailProduct.name}</h3>
                  {detailProduct.nameAr && (
                    <p className="text-xs text-muted-foreground" dir="rtl">{detailProduct.nameAr}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-[10px] px-1.5 py-0 border-0 capitalize ${productStatusBadge(detailProduct.status)}`}>
                      {detailProduct.status}
                    </Badge>
                    {detailProduct.isFeatured && (
                      <Badge className="text-[10px] px-1.5 py-0 border-0 bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Product Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Store</p>
                  <p className="font-medium">{detailProduct.storeName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{detailProduct.categoryName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Price</p>
                  <p className="font-medium">{formatPrice(detailProduct.price)}</p>
                  {detailProduct.originalPrice && detailProduct.originalPrice > detailProduct.price && (
                    <p className="text-muted-foreground line-through">{formatPrice(detailProduct.originalPrice)}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Stock</p>
                  <p className={`font-medium ${detailProduct.stock < 5 ? 'text-rose-600' : ''}`}>
                    {detailProduct.stock} units
                    {detailProduct.stock < 5 && detailProduct.stock > 0 && ' (Low!)'}
                    {detailProduct.stock <= 0 && ' (Out of Stock)'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">SKU</p>
                  <p className="font-medium">{detailProduct.sku || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">{formatDate(detailProduct.createdAt)}</p>
                </div>
              </div>

              <Separator />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="text-sm font-semibold flex items-center justify-center gap-1">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    {detailProduct.rating?.toFixed(1) || '0.0'}
                  </p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Reviews</p>
                  <p className="text-sm font-semibold">{detailProduct.reviewCount || 0}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Sold</p>
                  <p className="text-sm font-semibold">{detailProduct.soldCount || 0}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Flag Product Dialog */}
      <Dialog open={!!flagDialog} onOpenChange={() => { setFlagDialog(null); setFlagReason(''); setFlagNote(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-orange-500" />
              Flag Product
            </DialogTitle>
            <DialogDescription>
              Flag &quot;{flagDialog?.name}&quot; for review
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Reason</label>
              <Select value={flagReason} onValueChange={setFlagReason}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="counterfeit">Counterfeit Item</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="spam">Spam / Misleading</SelectItem>
                  <SelectItem value="wrong_category">Wrong Category</SelectItem>
                  <SelectItem value="price_manipulation">Price Manipulation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Additional Note</label>
              <Textarea
                placeholder="Add details about why this product is being flagged..."
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFlagDialog(null); setFlagReason(''); setFlagNote(''); }}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleFlagProduct}
              disabled={!flagReason || saving}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {saving ? 'Flagging...' : 'Flag Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
