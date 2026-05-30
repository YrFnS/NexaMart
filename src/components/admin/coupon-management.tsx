'use client';

import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Tag,
  DollarSign,
  Percent,
  Calendar,
  ShoppingBag,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { formatPrice } from '@/lib/currency';
import { adminFetch } from '@/lib/admin-api';

interface CouponItem {
  id: string;
  code: string;
  discount: number;
  type: string;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  storeId: string | null;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

interface CouponFormData {
  code: string;
  discountType: string;
  discountValue: string;
  minOrderAmount: string;
  maxDiscount: string;
  usageLimit: string;
  storeId: string;
  expiresAt: string;
}

const emptyForm: CouponFormData = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxDiscount: '',
  usageLimit: '',
  storeId: '',
  expiresAt: '',
};



export function CouponManagement() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';

  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Dialog states
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<CouponItem | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<CouponItem | null>(null);
  const [form, setForm] = useState<CouponFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/coupons');
      if (res.ok) {
        const json = await res.json();
        if (json.coupons && Array.isArray(json.coupons)) {
          setCoupons(json.coupons);
        }
      }
    } catch {
      // keep empty
    }
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      await fetchCoupons();
    };
    load();
  }, []);

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleFormChange('code', code);
  };

  const handleFormChange = (field: keyof CouponFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAdd = async () => {
    if (!form.code.trim() || !form.discountValue) return;
    setSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code.toUpperCase(),
          discount: parseFloat(form.discountValue),
          type: form.discountType,
          minOrder: form.minOrderAmount ? parseFloat(form.minOrderAmount) : 0,
          maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
          usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
          storeId: form.storeId || null,
          isActive: true,
          expiresAt: form.expiresAt || null,
        }),
      });
      if (res.ok) {
        setAddDialog(false);
        setForm(emptyForm);
        fetchCoupons();
      }
    } catch {
      // error
    }
    setSubmitting(false);
  };

  const handleEdit = async () => {
    if (!editDialog || !form.discountValue) return;
    setSubmitting(true);
    try {
      const res = await adminFetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponId: editDialog.id,
          discount: parseFloat(form.discountValue),
          type: form.discountType,
          minOrder: form.minOrderAmount ? parseFloat(form.minOrderAmount) : 0,
          maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
          usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
          expiresAt: form.expiresAt || null,
        }),
      });
      if (res.ok) {
        setEditDialog(null);
        setForm(emptyForm);
        fetchCoupons();
      }
    } catch {
      // error
    }
    setSubmitting(false);
  };

  const handleToggleActive = async (coupon: CouponItem) => {
    try {
      await adminFetch('/api/admin/coupons', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          couponId: coupon.id,
          isActive: !coupon.isActive,
        }),
      });
      setCoupons(prev => prev.map(c =>
        c.id === coupon.id ? { ...c, isActive: !c.isActive } : c
      ));
    } catch {
      // error
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setSubmitting(true);
    try {
      const res = await adminFetch(`/api/admin/coupons?id=${deleteDialog.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setDeleteDialog(null);
        fetchCoupons();
      }
    } catch {
      // error
    }
    setSubmitting(false);
  };

  const openEditDialog = (coupon: CouponItem) => {
    setForm({
      code: coupon.code,
      discountType: coupon.type,
      discountValue: String(coupon.discount),
      minOrderAmount: String(coupon.minOrder),
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : '',
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
      storeId: coupon.storeId || '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : '',
    });
    setEditDialog(coupon);
  };

  // Filtered coupons
  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.code.toLowerCase().includes(search.toLowerCase());
    const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
    const actualActive = c.isActive && !isExpired;
    if (filterStatus === 'active') return matchesSearch && actualActive;
    if (filterStatus === 'expired') return matchesSearch && (isExpired || !c.isActive);
    return matchesSearch;
  });

  // Summary stats
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => {
    const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
    return c.isActive && !isExpired;
  }).length;
  const expiredCoupons = coupons.filter(c => {
    const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
    return isExpired || !c.isActive;
  }).length;
  const totalUsage = coupons.reduce((sum, c) => sum + c.usedCount, 0);

  const discountBadge = (coupon: CouponItem) => {
    if (coupon.type === 'percentage') {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0 text-[10px] px-1.5 py-0">
          <Percent className="h-3 w-3 me-0.5" />
          {coupon.discount}%
        </Badge>
      );
    }
    return (
      <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 border-0 text-[10px] px-1.5 py-0">
        <DollarSign className="h-3 w-3 me-0.5" />
        {formatPrice(coupon.discount)}
      </Badge>
    );
  };

  const statusBadge = (coupon: CouponItem) => {
    const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
    if (isExpired || !coupon.isActive) {
      return (
        <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-0 text-[10px] px-1.5 py-0">
          {t('adminExpired')}
        </Badge>
      );
    }
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0 text-[10px] px-1.5 py-0">
        {t('adminActive')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-semibold">{t('couponManagement')}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={fetchCoupons}>
            <RefreshCw className="h-3.5 w-3.5 me-1.5" />
            {t('adminRefresh')}
          </Button>
          <Button
            size="sm"
            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => { setForm(emptyForm); setAddDialog(true); }}
          >
            <Plus className="h-3.5 w-3.5 me-1.5" />
            {t('adminAddCoupon')}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="h-8 w-8 mx-auto rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mb-1">
              <Tag className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-lg font-bold">{totalCoupons}</p>
            <p className="text-[11px] text-muted-foreground">{t('adminTotalCoupons')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="h-8 w-8 mx-auto rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center mb-1">
              <Ticket className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
            <p className="text-lg font-bold">{activeCoupons}</p>
            <p className="text-[11px] text-muted-foreground">{t('adminActive')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="h-8 w-8 mx-auto rounded-lg bg-gray-50 dark:bg-gray-950/50 flex items-center justify-center mb-1">
              <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <p className="text-lg font-bold">{expiredCoupons}</p>
            <p className="text-[11px] text-muted-foreground">{t('adminExpired')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="h-8 w-8 mx-auto rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center mb-1">
              <ShoppingBag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-lg font-bold">{totalUsage.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">{t('adminTotalUsage')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
              <Input
                placeholder={t('adminSearchCoupons')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9 h-9 text-sm"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
                <SelectValue placeholder={t('adminFilterStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allOrders')}</SelectItem>
                <SelectItem value="active">{t('adminActive')}</SelectItem>
                <SelectItem value="expired">{t('adminExpired')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Coupons Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t('adminCouponCode')}</TableHead>
                  <TableHead className="text-xs">{t('discount')}</TableHead>
                  <TableHead className="text-xs">{t('adminMinOrder')}</TableHead>
                  <TableHead className="text-xs">{t('adminUsage')}</TableHead>
                  <TableHead className="text-xs">{t('adminStatus')}</TableHead>
                  <TableHead className="text-xs">{t('adminStore')}</TableHead>
                  <TableHead className="text-xs">{t('adminExpires')}</TableHead>
                  <TableHead className="text-xs text-end">{t('adminActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCoupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <Ticket className="h-12 w-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">{t('noResults')}</p>
                        <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCoupons.map(coupon => (
                    <TableRow key={coupon.id}>
                      <TableCell>
                        <span className="text-xs font-mono font-semibold uppercase tracking-wider bg-muted px-2 py-1 rounded">
                          {coupon.code}
                        </span>
                      </TableCell>
                      <TableCell>{discountBadge(coupon)}</TableCell>
                      <TableCell className="text-xs">
                        {coupon.minOrder > 0 ? formatPrice(coupon.minOrder) : '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {coupon.usageLimit
                          ? <span>{coupon.usedCount} / {coupon.usageLimit}</span>
                          : <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t('adminUnlimited')}</Badge>
                        }
                      </TableCell>
                      <TableCell>{statusBadge(coupon)}</TableCell>
                      <TableCell className="text-xs">
                        {coupon.storeId
                          ? <span className="text-muted-foreground">{coupon.storeId}</span>
                          : <Badge variant="outline" className="text-[10px] px-1.5 py-0">{t('adminPlatformWide')}</Badge>
                        }
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {coupon.expiresAt
                          ? new Date(coupon.expiresAt).toLocaleDateString()
                          : <span className="text-emerald-600 dark:text-emerald-400">{t('adminNever')}</span>
                        }
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openEditDialog(coupon)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleToggleActive(coupon)}
                            title={coupon.isActive ? t('adminDeactivate') : t('adminActivate')}
                          >
                            {coupon.isActive
                              ? <span className="block h-3.5 w-3.5 rounded-full bg-emerald-500" />
                              : <span className="block h-3.5 w-3.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                            onClick={() => setDeleteDialog(coupon)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Coupon Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('adminAddCoupon')}</DialogTitle>
            <DialogDescription>{t('adminAddCouponDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('adminCouponCode')} *</Label>
              <div className="flex gap-2">
                <Input
                  value={form.code}
                  onChange={(e) => handleFormChange('code', e.target.value.toUpperCase())}
                  placeholder="WELCOME20"
                  className="h-9 text-sm font-mono uppercase"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs shrink-0"
                  onClick={generateCode}
                >
                  {t('adminAutoGenerate')}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminDiscountType')}</Label>
                <Select value={form.discountType} onValueChange={(v) => handleFormChange('discountType', v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{t('adminPercentage')}</SelectItem>
                    <SelectItem value="fixed">{t('adminFixedAmount')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminDiscountValue')} *</Label>
                <Input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => handleFormChange('discountValue', e.target.value)}
                  placeholder={form.discountType === 'percentage' ? '20' : '50'}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminMinOrderAmount')}</Label>
                <Input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) => handleFormChange('minOrderAmount', e.target.value)}
                  placeholder="0"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminMaxDiscount')}</Label>
                <Input
                  type="number"
                  value={form.maxDiscount}
                  onChange={(e) => handleFormChange('maxDiscount', e.target.value)}
                  placeholder={t('adminUnlimited')}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminUsageLimit')}</Label>
                <Input
                  type="number"
                  value={form.usageLimit}
                  onChange={(e) => handleFormChange('usageLimit', e.target.value)}
                  placeholder={t('adminUnlimited')}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminExpiryDate')}</Label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => handleFormChange('expiresAt', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('adminStore')} ({t('optional')})</Label>
              <Input
                value={form.storeId}
                onChange={(e) => handleFormChange('storeId', e.target.value)}
                placeholder={t('adminPlatformWideIfEmpty')}
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
              disabled={!form.code.trim() || !form.discountValue || submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
            >
              {submitting ? t('loading') : t('adminAddCoupon')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Coupon Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => { setEditDialog(null); setForm(emptyForm); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('adminEditCoupon')}</DialogTitle>
            <DialogDescription>
              {t('adminEditingCoupon')} <span className="font-mono font-semibold">{editDialog?.code}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminDiscountType')}</Label>
                <Select value={form.discountType} onValueChange={(v) => handleFormChange('discountType', v)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{t('adminPercentage')}</SelectItem>
                    <SelectItem value="fixed">{t('adminFixedAmount')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminDiscountValue')} *</Label>
                <Input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) => handleFormChange('discountValue', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminMinOrderAmount')}</Label>
                <Input
                  type="number"
                  value={form.minOrderAmount}
                  onChange={(e) => handleFormChange('minOrderAmount', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminMaxDiscount')}</Label>
                <Input
                  type="number"
                  value={form.maxDiscount}
                  onChange={(e) => handleFormChange('maxDiscount', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminUsageLimit')}</Label>
                <Input
                  type="number"
                  value={form.usageLimit}
                  onChange={(e) => handleFormChange('usageLimit', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminExpiryDate')}</Label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => handleFormChange('expiresAt', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
            {editDialog && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <Switch
                  checked={editDialog.isActive}
                  onCheckedChange={(checked) => {
                    setEditDialog(prev => prev ? { ...prev, isActive: checked } : null);
                  }}
                />
                <span className="text-xs">{editDialog.isActive ? t('adminActive') : t('adminInactive')}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialog(null); setForm(emptyForm); }} className="text-xs h-8">
              {t('cancel')}
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!form.discountValue || submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
            >
              {submitting ? t('loading') : t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('adminDeleteCoupon')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('adminDeleteCouponConfirm')} <span className="font-mono font-semibold">{deleteDialog?.code}</span>?
              {t('adminDeleteCouponWarning')}
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
