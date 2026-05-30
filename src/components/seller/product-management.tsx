'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Trash2,
  Edit3,
  MoreHorizontal,
  Package,
  Loader2,
  Image as ImageIcon,
  X,
  Check,
  Copy,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  stock: number;
  status: string;
  images: string;
  rating: number;
  soldCount: number;
  categoryId: string;
  description?: string;
  tags: string;
  variations: string;
  tieredPricing: string;
}

type FilterStatus = 'all' | 'active' | 'draft' | 'archived';

function StatusBadge({ status, t }: { status: string; t: (key: string, params?: Record<string, string | number>) => string }) {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    draft: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    archived: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
  };
  const statusLabels: Record<string, string> = {
    active: t('adminActive'),
    draft: t('pmDraft'),
    archived: t('pmArchive'),
  };
  return (
    <Badge variant="secondary" className={`text-[11px] ${styles[status] || ''}`}>
      {statusLabels[status] || status}
    </Badge>
  );
}

function StockBadge({ stock, t }: { stock: number; t: (key: string, params?: Record<string, string | number>) => string }) {
  if (stock === 0) return <Badge variant="secondary" className="text-[11px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{t('outOfStock')}</Badge>;
  if (stock < 20) return <Badge variant="secondary" className="text-[11px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{t('pmLowStock')} ({stock})</Badge>;
  return <Badge variant="secondary" className="text-[11px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{stock} {t('inStock')}</Badge>;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  originalPrice: string;
  categoryId: string;
  stock: string;
  status: string;
  tags: string;
}

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  categoryId: '',
  stock: '',
  status: 'draft',
  tags: '',
};

export function ProductManagement() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products?storeId=techstore-pro&limit=50');
        if (res.ok) {
          const json = await res.json();
          setProducts(json.products || []);
        }
      } catch {
        // API not available — leave empty
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const allSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleAddProduct = () => {
    const newProduct: Product = {
      id: `p-${Date.now()}`,
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price) || 0,
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
      stock: parseInt(formData.stock) || 0,
      status: formData.status,
      categoryId: formData.categoryId || 'cat1',
      images: '[]',
      rating: 0,
      soldCount: 0,
      tags: JSON.stringify(formData.tags.split(',').map(t => t.trim()).filter(Boolean)),
      variations: '{}',
      tieredPricing: '[]',
    };
    setProducts([newProduct, ...products]);
    setShowAddDialog(false);
    setFormData(emptyForm);
  };

  const handleEditProduct = () => {
    if (!editId) return;
    setProducts(products.map(p => {
      if (p.id !== editId) return p;
      return {
        ...p,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price) || p.price,
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
        stock: parseInt(formData.stock) || 0,
        status: formData.status,
        categoryId: formData.categoryId || p.categoryId,
        tags: JSON.stringify(formData.tags.split(',').map(t => t.trim()).filter(Boolean)),
      };
    }));
    setShowEditDialog(false);
    setEditId(null);
    setFormData(emptyForm);
  };

  const openEdit = (product: Product) => {
    setEditId(product.id);
    let tagsStr = '';
    try {
      const parsed = JSON.parse(product.tags);
      if (Array.isArray(parsed)) tagsStr = parsed.join(', ');
    } catch { /* ignore */ }
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      categoryId: product.categoryId,
      stock: product.stock.toString(),
      status: product.status,
      tags: tagsStr,
    });
    setShowEditDialog(true);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setProducts(products.filter(p => p.id !== deleteTarget));
    }
    setDeleteTarget(null);
    setShowDeleteDialog(false);
  };

  const handleBulkDelete = () => {
    setProducts(products.filter(p => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
  };

  const handleBulkStatusChange = (status: string) => {
    setProducts(products.map(p => selectedIds.has(p.id) ? { ...p, status } : p));
    setSelectedIds(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{t('productList')}</h2>
          <p className="text-sm text-muted-foreground">{products.length} {t('sellerProductsTotal')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Upload className="h-3.5 w-3.5 me-1.5" />
            {t('sellerImport')}
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="h-3.5 w-3.5 me-1.5" />
            {t('sellerExport')}
          </Button>
          <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => { setFormData(emptyForm); setShowAddDialog(true); }}>
            <Plus className="h-3.5 w-3.5 me-1.5" />
            {t('addProduct')}
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
              <Input
                placeholder={t('sellerSearchProducts')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9 h-9 text-sm"
              />
            </div>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as FilterStatus)}>
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-sm">
                <Filter className="h-3.5 w-3.5 me-1.5" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('pmAllStatus')}</SelectItem>
                <SelectItem value="active">{t('adminActive')}</SelectItem>
                <SelectItem value="draft">{t('pmDraft')}</SelectItem>
                <SelectItem value="archived">{t('pmArchive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{selectedIds.size} {t('pmSelected')}</span>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600 hover:text-red-700" onClick={handleBulkDelete}>
            <Trash2 className="h-3 w-3 me-1" /> {t('delete')}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleBulkStatusChange('active')}>
            <Check className="h-3 w-3 me-1" /> {t('pmSetActive')}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleBulkStatusChange('draft')}>
            {t('pmSetDraft')}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleBulkStatusChange('archived')}>
            {t('pmArchive')}
          </Button>
        </div>
      )}

      {/* Product Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                  </TableHead>
                  <TableHead className="text-xs">{t('sellerProductImage')}</TableHead>
                  <TableHead className="text-xs min-w-[160px]">{t('pmName')}</TableHead>
                  <TableHead className="text-xs">{t('price')}</TableHead>
                  <TableHead className="text-xs">{t('pmStock')}</TableHead>
                  <TableHead className="text-xs">{t('pmStatus')}</TableHead>
                  <TableHead className="text-xs">{t('pmSold')}</TableHead>
                  <TableHead className="text-xs text-end">{t('adminActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <Package className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">{t('noResults')}</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((product) => (
                    <TableRow key={product.id} className={selectedIds.has(product.id) ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''}>
                      <TableCell>
                        <Checkbox checked={selectedIds.has(product.id)} onCheckedChange={() => toggleSelect(product.id)} />
                      </TableCell>
                      <TableCell>
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">{product.name}</p>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <p className="text-[11px] text-muted-foreground line-through">{formatPrice(product.originalPrice)}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold">{formatPrice(product.price)}</TableCell>
                      <TableCell><StockBadge stock={product.stock} t={t} /></TableCell>
                      <TableCell><StatusBadge status={product.status} t={t} /></TableCell>
                      <TableCell className="text-sm">{product.soldCount}</TableCell>
                      <TableCell className="text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                            <DropdownMenuItem onClick={() => openEdit(product)}>
                              <Edit3 className="h-3.5 w-3.5 me-2" /> {t('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-3.5 w-3.5 me-2" /> {t('pmDuplicate')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 dark:text-red-400"
                              onClick={() => { setDeleteTarget(product.id); setShowDeleteDialog(true); }}
                            >
                              <Trash2 className="h-3.5 w-3.5 me-2" /> {t('delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('addProduct')}</DialogTitle>
            <DialogDescription>{t('sellerAddProductDesc')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('pmProductName')} *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Wireless Earbuds Pro" className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('pmCategory')}</Label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder={t('pmSelectCategory')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cat1">{t('pmCatElectronics')}</SelectItem>
                    <SelectItem value="cat2">{t('pmCatAccessories')}</SelectItem>
                    <SelectItem value="cat3">{t('pmCatPhoneCases')}</SelectItem>
                    <SelectItem value="cat4">{t('pmCatAudio')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{t('description')}</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder={t('description') + '...'} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('price')} *</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('pmOriginalPrice')}</Label>
                <Input type="number" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} placeholder="0.00" className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('pmStock')} *</Label>
                <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} placeholder="0" className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('pmStatus')}</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('adminActive')}</SelectItem>
                    <SelectItem value="draft">{t('pmDraft')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('pmTags')}</Label>
                <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="wireless, audio, premium" className="h-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{t('pmProductImages')}</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-emerald-400 dark:hover:border-emerald-600 transition-colors cursor-pointer">
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{t('pmUploadImages')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('pmImageHint')}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="h-9">{t('cancel')}</Button>
            <Button onClick={handleAddProduct} disabled={!formData.name || !formData.price} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
              {t('add')} {t('pmName')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('editProduct')}</DialogTitle>
            <DialogDescription>{t('pmUpdateProductInfo')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('pmProductName')} *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('pmCategory')}</Label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cat1">{t('pmCatElectronics')}</SelectItem>
                    <SelectItem value="cat2">{t('pmCatAccessories')}</SelectItem>
                    <SelectItem value="cat3">{t('pmCatPhoneCases')}</SelectItem>
                    <SelectItem value="cat4">{t('pmCatAudio')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{t('description')}</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('price')} *</Label>
                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('pmOriginalPrice')}</Label>
                <Input type="number" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} className="h-9" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('pmStock')}</Label>
                <Input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('pmStatus')}</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('adminActive')}</SelectItem>
                    <SelectItem value="draft">{t('pmDraft')}</SelectItem>
                    <SelectItem value="archived">{t('pmArchive')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('pmTags')}</Label>
                <Input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="h-9" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="h-9">{t('cancel')}</Button>
            <Button onClick={handleEditProduct} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
              {t('save')} {t('pmChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete')} {t('pmDeleteProduct')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('pmDeleteProductDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
