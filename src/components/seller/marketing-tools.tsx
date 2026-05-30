'use client';

import React, { useState, useEffect } from 'react';
import {
  Tag,
  Zap,
  Rocket,
  Target,
  Plus,
  Edit3,
  Trash2,
  Clock,
  Percent,
  DollarSign,
  Calendar,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';

interface Coupon {
  id: string;
  code: string;
  type: string;
  discount: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
}

interface FlashSale {
  id: string;
  title: string;
  discount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  products: string[];
}



interface CouponFormData {
  code: string;
  type: string;
  discount: string;
  minOrder: string;
  maxDiscount: string;
  usageLimit: string;
  expiresAt: string;
}

const emptyCouponForm: CouponFormData = {
  code: '',
  type: 'percentage',
  discount: '',
  minOrder: '0',
  maxDiscount: '',
  usageLimit: '',
  expiresAt: '',
};

interface FlashSaleFormData {
  title: string;
  discount: string;
  startDate: string;
  endDate: string;
  products: string;
}

const emptyFlashSaleForm: FlashSaleFormData = {
  title: '',
  discount: '',
  startDate: '',
  endDate: '',
  products: '',
};

export function MarketingTools() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [showFlashSaleDialog, setShowFlashSaleDialog] = useState(false);
  const [couponForm, setCouponForm] = useState<CouponFormData>(emptyCouponForm);
  const [flashSaleForm, setFlashSaleForm] = useState<FlashSaleFormData>(emptyFlashSaleForm);

  useEffect(() => {
    async function fetchData() {
      try {
        const [couponsRes, flashSalesRes] = await Promise.all([
          fetch('/api/seller/coupons?storeId=techstore-pro'),
          fetch('/api/flash-sales'),
        ]);
        if (couponsRes.ok) {
          const json = await couponsRes.json();
          setCoupons(json.coupons || []);
        }
        if (flashSalesRes.ok) {
          const json = await flashSalesRes.json();
          setFlashSales(Array.isArray(json) ? json : json.flashSales || []);
        }
      } catch {
        // API not available — leave empty
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleCreateCoupon = () => {
    const newCoupon: Coupon = {
      id: `c-${Date.now()}`,
      code: couponForm.code.toUpperCase(),
      type: couponForm.type,
      discount: parseFloat(couponForm.discount) || 0,
      minOrder: parseFloat(couponForm.minOrder) || 0,
      maxDiscount: couponForm.maxDiscount ? parseFloat(couponForm.maxDiscount) : null,
      usageLimit: couponForm.usageLimit ? parseInt(couponForm.usageLimit) : null,
      usedCount: 0,
      expiresAt: couponForm.expiresAt || null,
      isActive: true,
    };
    setCoupons([newCoupon, ...coupons]);
    setShowCouponDialog(false);
    setCouponForm(emptyCouponForm);
  };

  const handleCreateFlashSale = () => {
    const newSale: FlashSale = {
      id: `fs-${Date.now()}`,
      title: flashSaleForm.title,
      discount: parseInt(flashSaleForm.discount) || 0,
      startDate: flashSaleForm.startDate,
      endDate: flashSaleForm.endDate,
      isActive: true,
      products: flashSaleForm.products.split(',').map(p => p.trim()).filter(Boolean),
    };
    setFlashSales([newSale, ...flashSales]);
    setShowFlashSaleDialog(false);
    setFlashSaleForm(emptyFlashSaleForm);
  };

  const toggleCouponActive = (id: string) => {
    setCoupons(coupons.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c));
  };

  const deleteCoupon = (id: string) => {
    setCoupons(coupons.filter(c => c.id !== id));
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold">{t('marketing')}</h2>
        <p className="text-sm text-muted-foreground">{t('sellerMarketingDesc')}</p>
      </div>

      <Tabs defaultValue="coupons">
        <TabsList className="h-9 bg-muted/50">
          <TabsTrigger value="coupons" className="text-xs">
            <Tag className="h-3.5 w-3.5 me-1.5" /> {t('mktCoupons')}
          </TabsTrigger>
          <TabsTrigger value="flash-sales" className="text-xs">
            <Zap className="h-3.5 w-3.5 me-1.5" /> {t('mktFlashSales')}
          </TabsTrigger>
          <TabsTrigger value="boost" className="text-xs">
            <Rocket className="h-3.5 w-3.5 me-1.5" /> {t('mktProductBoost')}
          </TabsTrigger>
          <TabsTrigger value="ppc" className="text-xs">
            <Target className="h-3.5 w-3.5 me-1.5" /> {t('mktPPCAds')}
          </TabsTrigger>
        </TabsList>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{coupons.length} {t('mktActiveCoupons')}</p>
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowCouponDialog(true)}>
              <Plus className="h-3.5 w-3.5 me-1.5" />
              {t('sellerCreateCoupon')}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Tag className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">{t('noResults')}</p>
              <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No coupons yet'}</p>
            </div>
          ) : (
            <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t('mktCode')}</TableHead>
                    <TableHead className="text-xs">{t('mktType')}</TableHead>
                    <TableHead className="text-xs">{t('mktDiscount')}</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">{t('mktMinOrder')}</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">{t('mktUsage')}</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">{t('mktExpires')}</TableHead>
                    <TableHead className="text-xs">{t('mktStatus')}</TableHead>
                    <TableHead className="text-xs text-end">{t('adminActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="text-xs font-mono font-bold">{coupon.code}</TableCell>
                      <TableCell className="text-xs capitalize">{coupon.type}</TableCell>
                      <TableCell className="text-xs font-semibold">
                        {coupon.type === 'percentage' ? `${coupon.discount}%` : formatPrice(coupon.discount)}
                      </TableCell>
                      <TableCell className="text-xs hidden sm:table-cell">{formatPrice(coupon.minOrder)}</TableCell>
                      <TableCell className="text-xs hidden md:table-cell">
                        {coupon.usedCount}/{coupon.usageLimit || '∞'}
                      </TableCell>
                      <TableCell className="text-xs hidden md:table-cell text-muted-foreground">
                        {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : t('mktNever')}
                      </TableCell>
                      <TableCell>
                        <button onClick={() => toggleCouponActive(coupon.id)}>
                          <Badge variant="secondary" className={`text-[11px] cursor-pointer ${coupon.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400'}`}>
                            {coupon.isActive ? t('adminActive') : t('mktInactive')}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => deleteCoupon(coupon.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          )}
        </TabsContent>

        {/* Flash Sales Tab */}
        <TabsContent value="flash-sales" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{flashSales.length} {t('mktFlashSalesCount')}</p>
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setShowFlashSaleDialog(true)}>
              <Plus className="h-3.5 w-3.5 me-1.5" />
              {t('mktCreateFlashSale')}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
          ) : flashSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">{t('noResults')}</p>
              <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No flash sales yet'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flashSales.map((sale) => (
              <Card key={sale.id} className="overflow-hidden">
                <div className={`h-1.5 ${sale.isActive ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-300 dark:bg-gray-700'}`} />
                <CardHeader className="pb-2 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{sale.title}</CardTitle>
                    <Badge variant="secondary" className={`text-[11px] ${sale.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-600'}`}>
                      {sale.isActive ? t('adminActive') : t('mktInactive')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-lg font-bold text-amber-600">{sale.discount}% {t('off')}</span>
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(sale.startDate).toLocaleDateString()} — {new Date(sale.endDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Tag className="h-3 w-3" />
                      <span>{sale.products.length} {sale.products.length !== 1 ? t('mktProducts') : t('mktProduct')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {sale.products.slice(0, 2).map((p, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{p}</Badge>
                    ))}
                    {sale.products.length > 2 && (
                      <Badge variant="outline" className="text-[10px]">+{sale.products.length - 2} {t('mktMore')}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </TabsContent>

        {/* Product Boost Tab */}
        <TabsContent value="boost" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Rocket className="h-4 w-4 text-emerald-600" /> {t('mktProductBoost')}
              </CardTitle>
              <CardDescription className="text-xs">{t('mktBoostDesc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { tier: t('mktBasic'), price: 5, duration: t('mktDays3'), features: [t('mktSearchBoost'), t('mktCategoryHighlight')] },
                  { tier: t('mktPro'), price: 15, duration: t('mktDays7'), features: [t('mktSearchBoost'), t('mktCategoryHighlight'), t('mktHomepageFeatured'), t('mktEmailBlast')] },
                  { tier: t('mktPremium'), price: 30, duration: t('mktDays14'), features: [t('mktAllProFeatures'), t('mktPushNotification'), t('mktSocialMediaShare'), t('mktAiRecommendationBoost')] },
                ].map((plan, i) => (
                  <div key={i} className={`border rounded-xl p-4 space-y-3 ${i === 1 ? 'border-emerald-400 dark:border-emerald-600 ring-1 ring-emerald-400/20' : 'border-border'}`}>
                    {i === 1 && <Badge className="bg-emerald-500 text-white text-[10px]">{t('mostPopular')}</Badge>}
                    <h3 className="font-semibold text-sm">{plan.tier}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold">${plan.price}</span>
                      <span className="text-xs text-muted-foreground">{t('mktForDuration', { duration: plan.duration })}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {plan.features.map((f, j) => (
                        <li key={j} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="h-1 w-1 rounded-full bg-emerald-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button size="sm" className={`w-full h-8 text-xs ${i === 1 ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`} variant={i === 1 ? 'default' : 'outline'}>
                      {t('mktBoostNow')}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PPC Ads Tab */}
        <TabsContent value="ppc" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-600" /> {t('mktPPCAdsTitle')}
              </CardTitle>
              <CardDescription className="text-xs">{t('mktPPCAdsDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
                <h3 className="font-semibold text-sm mb-1">{t('mktNoActiveCampaigns')}</h3>
                <p className="text-xs text-muted-foreground mb-4">{t('mktCreateFirstCampaign')}</p>
                <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="h-3.5 w-3.5 me-1.5" />
                  {t('mktCreateCampaign')}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="border rounded-lg p-4 text-center">
                  <DollarSign className="h-5 w-5 mx-auto text-emerald-500 mb-2" />
                  <p className="text-xs font-medium">{t('mktSetBudget')}</p>
                  <p className="text-[11px] text-muted-foreground">{t('mktControlSpend')}</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <Target className="h-5 w-5 mx-auto text-teal-500 mb-2" />
                  <p className="text-xs font-medium">{t('mktTargetAudience')}</p>
                  <p className="text-[11px] text-muted-foreground">{t('mktReachBuyers')}</p>
                </div>
                <div className="border rounded-lg p-4 text-center">
                  <Calendar className="h-5 w-5 mx-auto text-cyan-500 mb-2" />
                  <p className="text-xs font-medium">{t('mktSchedule')}</p>
                  <p className="text-[11px] text-muted-foreground">{t('mktChooseSchedule')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Coupon Dialog */}
      <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('sellerCreateCoupon')}</DialogTitle>
            <DialogDescription>{t('mktCreateCouponDesc')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('mktCouponCode')} *</Label>
                <Input
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SUMMER25"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('mktDiscountType')}</Label>
                <Select value={couponForm.type} onValueChange={(v) => setCouponForm({ ...couponForm, type: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{t('mktPercentage')}</SelectItem>
                    <SelectItem value="fixed">{t('mktFixedAmount')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('mktDiscountValue')} *</Label>
                <Input
                  type="number"
                  value={couponForm.discount}
                  onChange={(e) => setCouponForm({ ...couponForm, discount: e.target.value })}
                  placeholder="0"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('mktMinOrderAmount')}</Label>
                <Input
                  type="number"
                  value={couponForm.minOrder}
                  onChange={(e) => setCouponForm({ ...couponForm, minOrder: e.target.value })}
                  placeholder="0"
                  className="h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('mktMaxDiscount')}</Label>
                <Input
                  type="number"
                  value={couponForm.maxDiscount}
                  onChange={(e) => setCouponForm({ ...couponForm, maxDiscount: e.target.value })}
                  placeholder={t('mktNoLimit')}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('mktUsageLimit')}</Label>
                <Input
                  type="number"
                  value={couponForm.usageLimit}
                  onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                  placeholder={t('mktUnlimited')}
                  className="h-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{t('mktExpiryDate')}</Label>
              <Input
                type="date"
                value={couponForm.expiresAt}
                onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
                className="h-9"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCouponDialog(false)} className="h-9">{t('cancel')}</Button>
            <Button onClick={handleCreateCoupon} disabled={!couponForm.code || !couponForm.discount} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
              {t('mktCreateCouponBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Flash Sale Dialog */}
      <Dialog open={showFlashSaleDialog} onOpenChange={setShowFlashSaleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('mktCreateFlashSale')}</DialogTitle>
            <DialogDescription>{t('mktFlashSaleDesc')}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm">{t('mktSaleTitle')} *</Label>
              <Input
                value={flashSaleForm.title}
                onChange={(e) => setFlashSaleForm({ ...flashSaleForm, title: e.target.value })}
                placeholder="e.g. Spring Electronics Sale"
                className="h-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('mktDiscountPercent')} *</Label>
                <Input
                  type="number"
                  value={flashSaleForm.discount}
                  onChange={(e) => setFlashSaleForm({ ...flashSaleForm, discount: e.target.value })}
                  placeholder="e.g. 30"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('mktProductsComma')}</Label>
                <Input
                  value={flashSaleForm.products}
                  onChange={(e) => setFlashSaleForm({ ...flashSaleForm, products: e.target.value })}
                  placeholder="e.g. Earbuds, Watch"
                  className="h-9"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">{t('mktStartDate')}</Label>
                <Input
                  type="datetime-local"
                  value={flashSaleForm.startDate}
                  onChange={(e) => setFlashSaleForm({ ...flashSaleForm, startDate: e.target.value })}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{t('mktEndDate')}</Label>
                <Input
                  type="datetime-local"
                  value={flashSaleForm.endDate}
                  onChange={(e) => setFlashSaleForm({ ...flashSaleForm, endDate: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlashSaleDialog(false)} className="h-9">{t('cancel')}</Button>
            <Button onClick={handleCreateFlashSale} disabled={!flashSaleForm.title || !flashSaleForm.discount} className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white">
              {t('mktCreateFlashSale')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
