'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  Download,
  Edit3,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import { formatPrice } from '@/lib/currency';
import { useI18n } from '@/lib/i18n';

interface CategoryOption {
  id: string;
  name: string;
  nameAr?: string | null;
}

interface StoreOption {
  id: string;
  name: string;
}

interface VariantSku {
  id?: string;
  sku: string;
  attributes: Record<string, string>;
  price: number;
  originalPrice?: number | null;
  stock: number;
  isActive: boolean;
}

interface SellerProduct {
  id: string;
  name: string;
  nameAr?: string | null;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  stock: number;
  status: 'active' | 'draft' | 'archived';
  sku?: string | null;
  categoryId: string;
  storeId: string;
  images: string[];
  tags: string[];
  hasFreeShipping: boolean;
  isB2b: boolean;
  soldCount: number;
  updatedAt: string;
  category: CategoryOption;
  store: StoreOption;
  variantSkus: VariantSku[];
}

interface VariantDraft {
  id?: string;
  sku: string;
  attributesText: string;
  price: string;
  originalPrice: string;
  stock: string;
  isActive: boolean;
}

interface ProductDraft {
  storeId: string;
  name: string;
  nameAr: string;
  description: string;
  categoryId: string;
  imagesText: string;
  tagsText: string;
  status: 'active' | 'draft' | 'archived';
  hasFreeShipping: boolean;
  isB2b: boolean;
  sku: string;
  price: string;
  originalPrice: string;
  stock: string;
  variants: VariantDraft[];
}

const emptyDraft: ProductDraft = {
  storeId: '',
  name: '',
  nameAr: '',
  description: '',
  categoryId: '',
  imagesText: '',
  tagsText: '',
  status: 'draft',
  hasFreeShipping: false,
  isB2b: false,
  sku: '',
  price: '',
  originalPrice: '',
  stock: '',
  variants: [],
};

function attributesToText(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
}

function parseAttributes(value: string): Record<string, string> {
  const entries = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separator = part.indexOf('=');
      if (separator <= 0 || separator === part.length - 1) {
        throw new Error('Use option=value pairs, for example color=Black, size=M.');
      }
      return [part.slice(0, separator).trim(), part.slice(separator + 1).trim()] as const;
    });
  const attributes = Object.fromEntries(entries);
  if (Object.keys(attributes).length === 0) {
    throw new Error('Every SKU needs at least one option.');
  }
  return attributes;
}

function productToDraft(product: SellerProduct): ProductDraft {
  return {
    storeId: product.storeId,
    name: product.name,
    nameAr: product.nameAr || '',
    description: product.description || '',
    categoryId: product.categoryId,
    imagesText: product.images.join(String.fromCharCode(10)),
    tagsText: product.tags.join(', '),
    status: product.status,
    hasFreeShipping: product.hasFreeShipping,
    isB2b: product.isB2b,
    sku: product.sku || '',
    price: String(product.price),
    originalPrice: product.originalPrice == null ? '' : String(product.originalPrice),
    stock: String(product.stock),
    variants: product.variantSkus.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      attributesText: attributesToText(variant.attributes),
      price: String(variant.price),
      originalPrice:
        variant.originalPrice == null ? '' : String(variant.originalPrice),
      stock: String(variant.stock),
      isActive: variant.isActive,
    })),
  };
}

function StatusBadge({ status }: { status: SellerProduct['status'] }) {
  const classes =
    status === 'active'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      : status === 'draft'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
        : 'bg-muted text-muted-foreground';
  return <Badge className={classes}>{status}</Badge>;
}

export function ProductManagement() {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);

  const copy = isRTL
    ? {
        title: 'المنتجات والمخزون',
        subtitle: 'إدارة المنتجات ووحدات SKU والأسعار والمخزون الحقيقي.',
        add: 'إضافة منتج',
        search: 'ابحث بالمنتج أو SKU',
        all: 'كل الحالات',
        name: 'المنتج',
        price: 'السعر',
        stock: 'المخزون',
        variants: 'وحدات SKU',
        status: 'الحالة',
        actions: 'الإجراءات',
        noProducts: 'لا توجد منتجات مطابقة.',
        edit: 'تعديل',
        archive: 'أرشفة',
        export: 'تصدير CSV',
        createTitle: 'إضافة منتج',
        editTitle: 'تعديل المنتج ووحدات SKU',
        save: 'حفظ',
        cancel: 'إلغاء',
        optionsHint: 'استخدم صيغة الخيار=القيمة، مثال: color=Black, size=M',
      }
    : {
        title: 'Products & inventory',
        subtitle: 'Manage persistent products, SKUs, prices, and real inventory.',
        add: 'Add product',
        search: 'Search product or SKU',
        all: 'All statuses',
        name: 'Product',
        price: 'Price',
        stock: 'Stock',
        variants: 'SKUs',
        status: 'Status',
        actions: 'Actions',
        noProducts: 'No matching products.',
        edit: 'Edit',
        archive: 'Archive',
        export: 'Export CSV',
        createTitle: 'Add product',
        editTitle: 'Edit product & SKUs',
        save: 'Save',
        cancel: 'Cancel',
        optionsHint: 'Use option=value pairs, for example color=Black, size=M',
      };

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [productsResponse, categoriesResponse] = await Promise.all([
        fetch('/api/seller/products?limit=100', {
          credentials: 'same-origin',
          cache: 'no-store',
        }),
        fetch('/api/categories', { cache: 'no-store' }),
      ]);
      const productPayload = await productsResponse.json();
      const categoryPayload = await categoriesResponse.json();
      if (!productsResponse.ok) {
        throw new Error(productPayload.error || 'Failed to load products.');
      }
      setProducts(productPayload.products || []);
      setStores(productPayload.stores || []);
      setCategories(Array.isArray(categoryPayload) ? categoryPayload : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadProducts]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesStatus = status === 'all' || product.status === status;
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        (product.sku || '').toLowerCase().includes(query) ||
        product.variantSkus.some((variant) =>
          variant.sku.toLowerCase().includes(query),
        );
      return matchesStatus && matchesSearch;
    });
  }, [products, search, status]);

  function openCreate() {
    setEditingId(null);
    setDraft({
      ...emptyDraft,
      storeId: stores.length === 1 ? stores[0].id : '',
      categoryId: categories[0]?.id || '',
    });
    setError('');
    setDialogOpen(true);
  }

  function openEdit(product: SellerProduct) {
    setEditingId(product.id);
    setDraft(productToDraft(product));
    setError('');
    setDialogOpen(true);
  }

  function addVariant() {
    setDraft((current) => ({
      ...current,
      variants: [
        ...current.variants,
        {
          sku: '',
          attributesText: '',
          price: current.price || '',
          originalPrice: current.originalPrice,
          stock: '0',
          isActive: true,
        },
      ],
    }));
  }

  function updateVariant(index: number, patch: Partial<VariantDraft>) {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, variantIndex) =>
        variantIndex === index ? { ...variant, ...patch } : variant,
      ),
    }));
  }

  function removeVariant(index: number) {
    setDraft((current) => ({
      ...current,
      variants: current.variants.filter((_, variantIndex) => variantIndex !== index),
    }));
  }

  function buildPayload() {
    const variants = draft.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      attributes: parseAttributes(variant.attributesText),
      price: Number(variant.price),
      originalPrice: variant.originalPrice ? Number(variant.originalPrice) : null,
      stock: Number(variant.stock),
      isActive: variant.isActive,
    }));
    return {
      ...(editingId ? { productId: editingId } : {}),
      storeId: draft.storeId || undefined,
      name: draft.name,
      nameAr: draft.nameAr || null,
      description: draft.description || null,
      categoryId: draft.categoryId,
      images: draft.imagesText
        .split(',')
        .flatMap((value) => value.split(String.fromCharCode(10)))
        .map((value) => value.trim())
        .filter(Boolean),
      tags: draft.tagsText
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      status: draft.status,
      hasFreeShipping: draft.hasFreeShipping,
      isB2b: draft.isB2b,
      sku: variants.length > 0 ? null : draft.sku,
      price: variants.length > 0 ? undefined : Number(draft.price),
      originalPrice:
        variants.length > 0 || !draft.originalPrice
          ? null
          : Number(draft.originalPrice),
      stock: variants.length > 0 ? undefined : Number(draft.stock),
      variants,
    };
  }

  async function saveProduct() {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/seller/products', {
        method: editingId ? 'PUT' : 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to save product.');
      setDialogOpen(false);
      await loadProducts();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  }

  async function archiveProduct(productId: string) {
    setError('');
    try {
      const response = await fetch(`/api/seller/products?id=${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Failed to archive product.');
      await loadProducts();
    } catch (archiveError) {
      setError(
        archiveError instanceof Error
          ? archiveError.message
          : 'Failed to archive product.',
      );
    }
  }

  function exportCsv() {
    const rows = [
      ['Product', 'Store', 'Status', 'Parent stock', 'SKU', 'Options', 'Price', 'SKU stock'],
      ...products.flatMap((product) =>
        product.variantSkus.length > 0
          ? product.variantSkus.map((variant) => [
              product.name,
              product.store.name,
              product.status,
              String(product.stock),
              variant.sku,
              attributesToText(variant.attributes),
              String(variant.price),
              String(variant.stock),
            ])
          : [[
              product.name,
              product.store.name,
              product.status,
              String(product.stock),
              product.sku || '',
              '',
              String(product.price),
              String(product.stock),
            ]],
      ),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join(String.fromCharCode(10));
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'nexamart-products.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{copy.title}</h2>
          <p className="text-sm text-muted-foreground">{copy.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="me-2 size-4" />
            {copy.export}
          </Button>
          <Button onClick={openCreate} className="bg-amber-600 text-white hover:bg-amber-700">
            <Plus className="me-2 size-4" />
            {copy.add}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300" role="alert">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={copy.search}
              className="ps-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{copy.all}</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.name}</TableHead>
                  <TableHead>{copy.price}</TableHead>
                  <TableHead>{copy.stock}</TableHead>
                  <TableHead>{copy.variants}</TableHead>
                  <TableHead>{copy.status}</TableHead>
                  <TableHead className="text-end">{copy.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                      <Package className="mx-auto mb-2 size-8 opacity-40" />
                      {copy.noProducts}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <p className="font-medium">{isRTL && product.nameAr ? product.nameAr : product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.store.name}</p>
                      </TableCell>
                      <TableCell>{formatPrice(product.price)}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {product.variantSkus.length || 1}
                        </Badge>
                      </TableCell>
                      <TableCell><StatusBadge status={product.status} /></TableCell>
                      <TableCell className="text-end">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(product)} aria-label={copy.edit}>
                          <Edit3 className="size-4" />
                        </Button>
                        {product.status !== 'archived' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600"
                            onClick={() => void archiveProduct(product.id)}
                            aria-label={copy.archive}
                          >
                            <Archive className="size-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? copy.editTitle : copy.createTitle}</DialogTitle>
            <DialogDescription>{copy.subtitle}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-3">
            {stores.length > 1 && (
              <div className="space-y-2">
                <Label>Store</Label>
                <Select value={draft.storeId} onValueChange={(value) => setDraft({ ...draft, storeId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Product name</Label>
                <Input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Arabic name</Label>
                <Input value={draft.nameAr} onChange={(event) => setDraft({ ...draft, nameAr: event.target.value })} dir="rtl" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={draft.categoryId} onValueChange={(value) => setDraft({ ...draft, categoryId: value })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {isRTL && category.nameAr ? category.nameAr : category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={draft.status} onValueChange={(value) => setDraft({ ...draft, status: value as ProductDraft['status'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tags</Label>
                <Input value={draft.tagsText} onChange={(event) => setDraft({ ...draft, tagsText: event.target.value })} placeholder="wireless, premium" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image URLs (one per line)</Label>
              <Textarea rows={2} value={draft.imagesText} onChange={(event) => setDraft({ ...draft, imagesText: event.target.value })} />
            </div>

            <div className="flex flex-wrap gap-5 rounded-xl border p-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={draft.hasFreeShipping} onCheckedChange={(checked) => setDraft({ ...draft, hasFreeShipping: checked === true })} />
                Free shipping
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={draft.isB2b} onCheckedChange={(checked) => setDraft({ ...draft, isB2b: checked === true })} />
                B2B product
              </label>
            </div>

            {draft.variants.length === 0 ? (
              <div className="grid gap-4 rounded-xl border p-4 md:grid-cols-4">
                <div className="space-y-2"><Label>SKU</Label><Input value={draft.sku} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} /></div>
                <div className="space-y-2"><Label>Price</Label><Input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} /></div>
                <div className="space-y-2"><Label>Original price</Label><Input type="number" min="0" step="0.01" value={draft.originalPrice} onChange={(event) => setDraft({ ...draft, originalPrice: event.target.value })} /></div>
                <div className="space-y-2"><Label>Stock</Label><Input type="number" min="0" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: event.target.value })} /></div>
              </div>
            ) : null}

            <div className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Variant SKUs</h3>
                  <p className="text-xs text-muted-foreground">{copy.optionsHint}</p>
                </div>
                <Button type="button" variant="outline" onClick={addVariant}>
                  <Plus className="me-2 size-4" /> Add SKU
                </Button>
              </div>

              {draft.variants.map((variant, index) => (
                <div key={variant.id || index} className="grid gap-3 rounded-xl bg-muted/40 p-3 lg:grid-cols-[1fr_1.5fr_0.8fr_0.8fr_auto_auto]">
                  <div className="space-y-1"><Label className="text-xs">SKU</Label><Input value={variant.sku} onChange={(event) => updateVariant(index, { sku: event.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Options</Label><Input value={variant.attributesText} onChange={(event) => updateVariant(index, { attributesText: event.target.value })} placeholder="color=Black, size=M" /></div>
                  <div className="space-y-1"><Label className="text-xs">Price</Label><Input type="number" min="0" step="0.01" value={variant.price} onChange={(event) => updateVariant(index, { price: event.target.value })} /></div>
                  <div className="space-y-1"><Label className="text-xs">Stock</Label><Input type="number" min="0" value={variant.stock} onChange={(event) => updateVariant(index, { stock: event.target.value })} /></div>
                  <label className="flex items-center gap-2 self-end pb-2 text-xs"><Checkbox checked={variant.isActive} onCheckedChange={(checked) => updateVariant(index, { isActive: checked === true })} /> Active</label>
                  <Button type="button" variant="ghost" size="icon" className="self-end text-red-600" onClick={() => removeVariant(index)} aria-label="Remove SKU"><Trash2 className="size-4" /></Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{copy.cancel}</Button>
            <Button
              onClick={() => void saveProduct()}
              disabled={saving || !draft.name || !draft.categoryId || (stores.length > 1 && !draft.storeId)}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {saving && <Loader2 className="me-2 size-4 animate-spin" />}
              {copy.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
