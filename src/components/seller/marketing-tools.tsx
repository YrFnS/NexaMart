'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatPrice } from '@/lib/currency';
import { useI18n } from '@/lib/i18n';
import { getLocale } from '@/lib/utils';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  discount: number;
  currency: string;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  storeId: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface StoreOption {
  id: string;
  name: string;
}

interface CouponFormData {
  storeId: string;
  code: string;
  type: 'percentage' | 'fixed';
  discount: string;
  minOrder: string;
  maxDiscount: string;
  usageLimit: string;
  expiresAt: string;
}

const emptyCouponForm: CouponFormData = {
  storeId: '',
  code: '',
  type: 'percentage',
  discount: '',
  minOrder: '0',
  maxDiscount: '',
  usageLimit: '',
  expiresAt: '',
};

function numeric(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function MarketingTools() {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingCouponId, setPendingCouponId] = useState('');
  const [form, setForm] = useState<CouponFormData>(emptyCouponForm);

  const loadMarketing = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError('');
    try {
      const [couponResponse, productResponse] = await Promise.all([
        fetch('/api/seller/coupons', {
          credentials: 'same-origin',
          cache: 'no-store',
          signal,
        }),
        fetch('/api/seller/products?limit=1', {
          credentials: 'same-origin',
          cache: 'no-store',
          signal,
        }),
      ]);

      const couponPayload = (await couponResponse.json().catch(() => ({}))) as {
        coupons?: Coupon[];
        error?: string;
      };
      if (!couponResponse.ok) {
        throw new Error(couponPayload.error || 'Failed to load coupons.');
      }

      const productPayload = (await productResponse.json().catch(() => ({}))) as {
        stores?: StoreOption[];
        error?: string;
      };
      if (!productResponse.ok) {
        throw new Error(
          productPayload.error || 'Failed to load authorized stores.',
        );
      }

      const nextStores = productPayload.stores || [];
      setCoupons(couponPayload.coupons || []);
      setStores(nextStores);
      setForm((current) => ({
        ...current,
        storeId:
          current.storeId &&
          nextStores.some((store) => store.id === current.storeId)
            ? current.storeId
            : nextStores[0]?.id || '',
      }));
    } catch (loadError) {
      if (loadError instanceof Error && loadError.name === 'AbortError') return;
      const message =
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load seller marketing.';
      setCoupons([]);
      setStores([]);
      setError(message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(
      () => void loadMarketing(controller.signal),
      0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadMarketing]);

  const stats = useMemo(
    () => ({
      total: coupons.length,
      active: coupons.filter((coupon) => coupon.isActive).length,
      used: coupons.reduce((sum, coupon) => sum + coupon.usedCount, 0),
    }),
    [coupons],
  );
  const storeById = useMemo(
    () => new Map(stores.map((store) => [store.id, store.name])),
    [stores],
  );

  function openCreateDialog() {
    setForm({
      ...emptyCouponForm,
      storeId: stores[0]?.id || '',
    });
    setDialogOpen(true);
  }

  async function createCoupon() {
    const discount = numeric(form.discount);
    const minOrder = numeric(form.minOrder);
    const maxDiscount = form.maxDiscount
      ? numeric(form.maxDiscount)
      : null;
    const usageLimit = form.usageLimit
      ? Math.trunc(numeric(form.usageLimit))
      : null;

    if (!form.storeId || form.code.trim().length < 2 || discount <= 0) {
      toast.error(
        isRTL
          ? 'اختر المتجر وأدخل رمزاً وقيمة خصم صالحة.'
          : 'Choose a store and enter a valid code and discount.',
      );
      return;
    }
    if (form.type === 'percentage' && discount > 100) {
      toast.error(
        isRTL
          ? 'لا يمكن أن يتجاوز الخصم المئوي 100٪.'
          : 'Percentage discount cannot exceed 100%.',
      );
      return;
    }

    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/seller/coupons', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: form.storeId,
          code: form.code.trim().toUpperCase(),
          type: form.type,
          discount,
          minOrder,
          maxDiscount:
            maxDiscount !== null && maxDiscount > 0 ? maxDiscount : null,
          usageLimit:
            usageLimit !== null && usageLimit > 0 ? usageLimit : null,
          expiresAt: form.expiresAt
            ? new Date(`${form.expiresAt}T23:59:59`).toISOString()
            : null,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        coupon?: Coupon;
        error?: string;
      };
      if (!response.ok || !payload.coupon) {
        throw new Error(payload.error || 'Coupon could not be created.');
      }

      setCoupons((current) => [
        payload.coupon!,
        ...current.filter((coupon) => coupon.id !== payload.coupon!.id),
      ]);
      setDialogOpen(false);
      setForm({ ...emptyCouponForm, storeId: stores[0]?.id || '' });
      toast.success(
        isRTL ? 'تم إنشاء الكوبون.' : 'Coupon created successfully.',
      );
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : 'Coupon could not be created.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function setCouponActive(coupon: Coupon, isActive: boolean) {
    setPendingCouponId(coupon.id);
    setError('');
    try {
      const response = await fetch('/api/seller/coupons', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId: coupon.id, isActive }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        coupon?: Coupon;
        error?: string;
      };
      if (!response.ok || !payload.coupon) {
        throw new Error(payload.error || 'Coupon could not be updated.');
      }
      const updated = payload.coupon;
      setCoupons((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(
        isActive
          ? isRTL
            ? 'تم تفعيل الكوبون.'
            : 'Coupon activated.'
          : isRTL
            ? 'تم تعطيل الكوبون.'
            : 'Coupon deactivated.',
      );
    } catch (updateError) {
      const message =
        updateError instanceof Error
          ? updateError.message
          : 'Coupon could not be updated.';
      setError(message);
      toast.error(message);
    } finally {
      setPendingCouponId('');
    }
  }

  return (
    <main
      className="space-y-5 p-4 md:p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Tag className="size-5 text-amber-600" aria-hidden="true" />
            {isRTL ? 'كوبونات المتجر' : 'Store coupons'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRTL
              ? 'أنشئ رموز خصم حقيقية للمتاجر التي تملكها أو تديرها.'
              : 'Create real discount codes for stores you own or manage.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadMarketing()}
            disabled={loading || saving || Boolean(pendingCouponId)}
          >
            <RefreshCw
              className={`me-2 size-4 ${loading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            {isRTL ? 'تحديث' : 'Refresh'}
          </Button>
          <Button
            type="button"
            className="bg-amber-600 text-white hover:bg-amber-700"
            onClick={openCreateDialog}
            disabled={stores.length === 0 || loading}
          >
            <Plus className="me-2 size-4" aria-hidden="true" />
            {isRTL ? 'كوبون جديد' : 'New coupon'}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <ShieldCheck className="me-2 inline size-4" aria-hidden="true" />
        {isRTL
          ? 'معاينة الكوبون والطلب النهائي تستخدمان نفس خدمة التسعير على الخادم. حملات Flash Sale والإعلانات المدفوعة وBoost غير متاحة في هذا الإصدار، لذلك أزيلت عناصر التحكم المؤقتة.'
          : 'Coupon preview and final order placement use the same server pricing authority. Flash-sale campaigns, paid ads, and product boosts are not available in this release, so their simulated controls have been removed.'}
      </div>

      {error && (
        <div
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
          role="alert"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'إجمالي الكوبونات' : 'Total coupons'}
            </p>
            <p className="mt-1 text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'كوبونات نشطة' : 'Active coupons'}
            </p>
            <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">
              {stats.active}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'مرات الاستخدام' : 'Recorded uses'}
            </p>
            <p className="mt-1 text-2xl font-bold">{stats.used}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {isRTL ? 'الرموز المحفوظة' : 'Saved coupon codes'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && coupons.length === 0 ? (
            <div
              className="flex min-h-48 items-center justify-center"
              aria-busy="true"
            >
              <Loader2
                className="size-8 animate-spin text-amber-600"
                aria-hidden="true"
              />
            </div>
          ) : stores.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              <Tag className="mx-auto mb-3 size-10 opacity-40" aria-hidden="true" />
              <p className="font-medium">
                {isRTL
                  ? 'لا يوجد متجر مخول لإدارة الكوبونات.'
                  : 'No authorized store is available for coupon management.'}
              </p>
            </div>
          ) : coupons.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
              <Tag className="mx-auto mb-3 size-10 opacity-40" aria-hidden="true" />
              <p className="font-medium">
                {isRTL ? 'لم تنشئ كوبوناً بعد.' : 'No coupons have been created yet.'}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={openCreateDialog}
              >
                <Plus className="me-2 size-4" aria-hidden="true" />
                {isRTL ? 'إنشاء أول كوبون' : 'Create first coupon'}
              </Button>
            </div>
          ) : (
            coupons.map((coupon) => {
              const expired = Boolean(
                coupon.expiresAt &&
                  new Date(coupon.expiresAt).getTime() < Date.now(),
              );
              return (
                <article
                  key={coupon.id}
                  className="grid gap-4 rounded-xl border p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="rounded-md bg-amber-100 px-2 py-1 text-sm font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        {coupon.code}
                      </code>
                      <Badge
                        className={
                          coupon.isActive && !expired
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {expired
                          ? isRTL
                            ? 'منتهي'
                            : 'Expired'
                          : coupon.isActive
                            ? isRTL
                              ? 'نشط'
                              : 'Active'
                            : isRTL
                              ? 'غير نشط'
                              : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {storeById.get(coupon.storeId || '') ||
                          (isRTL ? 'متجر' : 'Store')}
                      </Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                      <span className="font-semibold">
                        {coupon.type === 'percentage'
                          ? `${coupon.discount}%`
                          : formatPrice(coupon.discount)}{' '}
                        {isRTL ? 'خصم' : 'off'}
                      </span>
                      <span className="text-muted-foreground">
                        {isRTL ? 'الحد الأدنى' : 'Minimum'}:{' '}
                        {formatPrice(coupon.minOrder)}
                      </span>
                      {coupon.maxDiscount !== null && (
                        <span className="text-muted-foreground">
                          {isRTL ? 'أقصى خصم' : 'Maximum discount'}:{' '}
                          {formatPrice(coupon.maxDiscount)}
                        </span>
                      )}
                      <span className="text-muted-foreground">
                        {coupon.usedCount}/
                        {coupon.usageLimit === null ? '∞' : coupon.usageLimit}{' '}
                        {isRTL ? 'استخدام' : 'uses'}
                      </span>
                    </div>

                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="size-3.5" aria-hidden="true" />
                      {coupon.expiresAt
                        ? `${isRTL ? 'ينتهي' : 'Expires'} ${new Date(
                            coupon.expiresAt,
                          ).toLocaleDateString(getLocale(isRTL), {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}`
                        : isRTL
                          ? 'بلا تاريخ انتهاء'
                          : 'No expiration date'}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={pendingCouponId === coupon.id || expired}
                    aria-pressed={coupon.isActive}
                    onClick={() =>
                      void setCouponActive(coupon, !coupon.isActive)
                    }
                  >
                    {pendingCouponId === coupon.id ? (
                      <Loader2
                        className="me-2 size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <CheckCircle2
                        className="me-2 size-4"
                        aria-hidden="true"
                      />
                    )}
                    {coupon.isActive
                      ? isRTL
                        ? 'تعطيل'
                        : 'Deactivate'
                      : isRTL
                        ? 'تفعيل'
                        : 'Activate'}
                  </Button>
                </article>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {isRTL ? 'إنشاء كوبون متجر' : 'Create store coupon'}
            </DialogTitle>
            <DialogDescription>
              {isRTL
                ? 'تتحقق خدمة الطلب من نطاق المتجر والحد الأدنى والاستخدام والانتهاء عند المعاينة وعند إنشاء الطلب.'
                : 'The order authority validates store scope, minimum value, usage, and expiration during preview and final order placement.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="coupon-store">
                {isRTL ? 'المتجر' : 'Store'}
              </Label>
              <Select
                value={form.storeId}
                onValueChange={(storeId) =>
                  setForm((current) => ({ ...current, storeId }))
                }
              >
                <SelectTrigger id="coupon-store" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coupon-code">
                  {isRTL ? 'الرمز' : 'Code'}
                </Label>
                <Input
                  id="coupon-code"
                  value={form.code}
                  maxLength={50}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      code: event.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="WELCOME10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-type">
                  {isRTL ? 'نوع الخصم' : 'Discount type'}
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(type) =>
                    setForm((current) => ({
                      ...current,
                      type: type as CouponFormData['type'],
                    }))
                  }
                >
                  <SelectTrigger id="coupon-type" className="min-h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">
                      {isRTL ? 'نسبة مئوية' : 'Percentage'}
                    </SelectItem>
                    <SelectItem value="fixed">
                      {isRTL ? 'مبلغ ثابت' : 'Fixed amount'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coupon-discount">
                  {isRTL ? 'قيمة الخصم' : 'Discount value'}
                </Label>
                <Input
                  id="coupon-discount"
                  type="number"
                  min="0.01"
                  max={form.type === 'percentage' ? '100' : undefined}
                  step="0.01"
                  value={form.discount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      discount: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-minimum">
                  {isRTL ? 'الحد الأدنى للطلب' : 'Minimum order'}
                </Label>
                <Input
                  id="coupon-minimum"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minOrder}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      minOrder: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="coupon-maximum">
                  {isRTL ? 'أقصى خصم (اختياري)' : 'Maximum discount (optional)'}
                </Label>
                <Input
                  id="coupon-maximum"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.maxDiscount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      maxDiscount: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coupon-usage">
                  {isRTL ? 'حد الاستخدام (اختياري)' : 'Usage limit (optional)'}
                </Label>
                <Input
                  id="coupon-usage"
                  type="number"
                  min="1"
                  step="1"
                  value={form.usageLimit}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      usageLimit: event.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-expiry">
                {isRTL ? 'تاريخ الانتهاء (اختياري)' : 'Expiration date (optional)'}
              </Label>
              <Input
                id="coupon-expiry"
                type="date"
                value={form.expiresAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    expiresAt: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="button"
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => void createCoupon()}
              disabled={saving || !form.storeId || !form.code || !form.discount}
            >
              {saving && (
                <Loader2
                  className="me-2 size-4 animate-spin"
                  aria-hidden="true"
                />
              )}
              {isRTL ? 'إنشاء الكوبون' : 'Create coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
