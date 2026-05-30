'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Search,
  Package,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n';
import { adminFetch } from '@/lib/admin-api';

interface CategoryItem {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  icon: string | null;
  image: string | null;
  parentId: string | null;
  productCount: number;
  childCount: number;
  children?: CategoryItem[];
  createdAt: string;
}

interface CategoryFormData {
  name: string;
  nameAr: string;
  slug: string;
  icon: string;
  image: string;
  parentId: string;
}

const emptyForm: CategoryFormData = {
  name: '',
  nameAr: '',
  slug: '',
  icon: '',
  image: '',
  parentId: '',
};

export function CategoryManagement() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [hierarchical, setHierarchical] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Dialog states
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<CategoryItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<CategoryItem | null>(null);
  const [form, setForm] = useState<CategoryFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/categories');
      if (res.ok) {
        const json = await res.json();
        setCategories(json.categories || []);
        setHierarchical(json.hierarchical || []);
        const parentIds = new Set<string>();
        (json.categories || []).forEach((c: CategoryItem) => {
          if (c.childCount > 0) parentIds.add(c.id);
        });
        setExpandedIds(parentIds);
      }
    } catch {
      // use empty
    }
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      await fetchCategories();
    };
    load();
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleFormChange = (field: keyof CategoryFormData, value: string) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'name') {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const handleAdd = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          nameAr: form.nameAr || undefined,
          slug: form.slug || generateSlug(form.name),
          icon: form.icon || undefined,
          image: form.image || undefined,
          parentId: form.parentId || undefined,
        }),
      });
      if (res.ok) {
        setAddDialog(false);
        setForm(emptyForm);
        fetchCategories();
      }
    } catch {
      // error
    }
    setSubmitting(false);
  };

  const handleEdit = async () => {
    if (!editDialog || !form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: editDialog.id,
          name: form.name,
          nameAr: form.nameAr || null,
          icon: form.icon || null,
          image: form.image || null,
          parentId: form.parentId || null,
        }),
      });
      if (res.ok) {
        setEditDialog(null);
        setForm(emptyForm);
        fetchCategories();
      }
    } catch {
      // error
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/categories?id=${deleteDialog.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteDialog(null);
        fetchCategories();
      }
    } catch {
      // error
    }
    setSubmitting(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openEditDialog = (cat: CategoryItem) => {
    setForm({
      name: cat.name,
      nameAr: cat.nameAr || '',
      slug: cat.slug,
      icon: cat.icon || '',
      image: cat.image || '',
      parentId: cat.parentId || '',
    });
    setEditDialog(cat);
  };

  // Get all parent categories for dropdown (exclude current category if editing)
  const parentOptions = categories.filter(c => !c.parentId && (!editDialog || c.id !== editDialog.id));

  // Filter categories by search
  const filteredHierarchical = search.trim()
    ? hierarchical.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        (c.nameAr && c.nameAr.includes(search)) ||
        c.slug.toLowerCase().includes(search.toLowerCase())
      )
    : hierarchical;

  const renderCategoryRow = (cat: CategoryItem, depth: number = 0) => {
    const hasChildren = cat.childCount > 0 || (cat.children && cat.children.length > 0);
    const isExpanded = expandedIds.has(cat.id);

    return (
      <React.Fragment key={cat.id}>
        <TableRow className="hover:bg-muted/50">
          <TableCell>
            <div className="flex items-center gap-2" style={{ paddingInlineStart: `${depth * 24}px` }}>
              {/* Drag handle */}
              <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />

              {/* Expand/collapse */}
              {hasChildren ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => toggleExpand(cat.id)}
                >
                  {isExpanded
                    ? <ChevronDown className="h-3.5 w-3.5" />
                    : <ChevronRight className="h-3.5 w-3.5" />
                  }
                </Button>
              ) : (
                <span className="w-6" />
              )}

              {/* Icon */}
              {cat.icon ? (
                <span className="text-base">{cat.icon}</span>
              ) : (
                <FolderTree className="h-4 w-4 text-muted-foreground" />
              )}

              {/* Name */}
              <div>
                <span className="text-xs font-medium">{cat.name}</span>
                {cat.nameAr && (
                  <span className="text-[11px] text-muted-foreground ms-2">({cat.nameAr})</span>
                )}
              </div>
            </div>
          </TableCell>
          <TableCell className="text-xs text-muted-foreground font-mono">{cat.slug}</TableCell>
          <TableCell>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              <Package className="h-3 w-3 me-1" />
              {cat.productCount}
            </Badge>
          </TableCell>
          <TableCell className="text-end">
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => openEditDialog(cat)}
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                onClick={() => setDeleteDialog(cat)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </TableCell>
        </TableRow>

        {/* Children */}
        {hasChildren && isExpanded && cat.children?.map(child =>
          renderCategoryRow(child, depth + 1)
        )}
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-9 w-full mb-4" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FolderTree className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-semibold">{t('categoryManagement')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={fetchCategories}
          >
            <RefreshCw className="h-3.5 w-3.5 me-1.5" />
            {t('adminRefresh')}
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => { setForm(emptyForm); setAddDialog(true); }}
          >
            <Plus className="h-3.5 w-3.5 me-1.5" />
            {t('adminAddCategory')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
            <Input
              placeholder={t('adminSearchCategories')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9 h-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Category Tree */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {t('categoryTree')} ({categories.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t('adminCategoryName')}</TableHead>
                  <TableHead className="text-xs">Slug</TableHead>
                  <TableHead className="text-xs">{t('adminProductCount')}</TableHead>
                  <TableHead className="text-xs text-end">{t('adminActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHierarchical.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-8">
                      {t('noResults')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHierarchical.map(cat => renderCategoryRow(cat))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Category Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('adminAddCategory')}</DialogTitle>
            <DialogDescription>{t('adminAddCategoryDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminCategoryName')} *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Electronics"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminCategoryNameAr')}</Label>
                <Input
                  value={form.nameAr}
                  onChange={(e) => handleFormChange('nameAr', e.target.value)}
                  placeholder="إلكترونيات"
                  dir="rtl"
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Slug</Label>
              <Input
                value={form.slug}
                onChange={(e) => handleFormChange('slug', e.target.value)}
                placeholder="electronics"
                className="h-9 text-sm font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminCategoryIcon')}</Label>
                <Input
                  value={form.icon}
                  onChange={(e) => handleFormChange('icon', e.target.value)}
                  placeholder="📱"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminParentCategory')}</Label>
                <Select value={form.parentId} onValueChange={(v) => handleFormChange('parentId', v === '__none__' ? '' : v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder={t('adminNone')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('adminNone')} ({t('topLevel')})</SelectItem>
                    {parentOptions.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('adminImageURL')}</Label>
              <Input
                value={form.image}
                onChange={(e) => handleFormChange('image', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="h-9 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)} className="text-xs h-8">
              {t('cancel')}
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!form.name.trim() || submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
            >
              {submitting ? t('loading') : t('adminAddCategory')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => { setEditDialog(null); setForm(emptyForm); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('adminEditCategory')}</DialogTitle>
            <DialogDescription>{t('adminEditCategoryDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminCategoryName')} *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Electronics"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminCategoryNameAr')}</Label>
                <Input
                  value={form.nameAr}
                  onChange={(e) => handleFormChange('nameAr', e.target.value)}
                  placeholder="إلكترونيات"
                  dir="rtl"
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminCategoryIcon')}</Label>
                <Input
                  value={form.icon}
                  onChange={(e) => handleFormChange('icon', e.target.value)}
                  placeholder="📱"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminParentCategory')}</Label>
                <Select value={form.parentId || '__none__'} onValueChange={(v) => handleFormChange('parentId', v === '__none__' ? '' : v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder={t('adminNone')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('adminNone')} ({t('topLevel')})</SelectItem>
                    {parentOptions.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('adminImageURL')}</Label>
              <Input
                value={form.image}
                onChange={(e) => handleFormChange('image', e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="h-9 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialog(null); setForm(emptyForm); }} className="text-xs h-8">
              {t('cancel')}
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!form.name.trim() || submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
            >
              {submitting ? t('loading') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('adminDeleteCategory')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog && (
                <>
                  {t('adminDeleteCategoryConfirm')} <strong>{deleteDialog.name}</strong>?
                  {deleteDialog.childCount > 0 && (
                    <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
                      ⚠️ {t('adminDeleteCategoryChildren')} ({deleteDialog.childCount} {t('adminChildCategories')})
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={submitting}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8"
            >
              {submitting ? t('loading') : t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
