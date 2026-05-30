'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Store as StoreIcon,
  BadgeCheck,
  XCircle,
  Crown,
  Clock,
  MoreHorizontal,
  Eye,
  CheckCircle,
  ShieldCheck,
  ShieldX,
  Percent,
  RefreshCw,
  Star,
  ChevronLeft,
  ChevronRight,
  Package,
  DollarSign,
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
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { adminFetch } from '@/lib/admin-api';

interface AdminStore {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  productCount: number;
  tier: string;
  commission: number;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerWalletBalance?: number;
  orderCount: number;
  actualProductCount: number;
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

export function StoreManagement() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';

  const [stores, setStores] = useState<AdminStore[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Dialogs
  const [detailStore, setDetailStore] = useState<AdminStore | null>(null);
  const [verifyDialog, setVerifyDialog] = useState<AdminStore | null>(null);
  const [commissionDialog, setCommissionDialog] = useState<AdminStore | null>(null);
  const [tierDialog, setTierDialog] = useState<AdminStore | null>(null);
  const [commissionValue, setCommissionValue] = useState(10);
  const [selectedTier, setSelectedTier] = useState('free');
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (tierFilter !== 'all') params.set('tier', tierFilter);
        if (verifiedFilter !== 'all') params.set('verified', verifiedFilter);

        const res = await adminFetch(`/api/admin/stores?${params}`);
        if (res.ok && !cancelled) {
          const json = await res.json();
          setStores(json.stores || []);
          setTotal(json.total || 0);
        }
      } catch {
        // fallback
      }
      if (!cancelled) setLoading(false);
    };
    fetchData();
    return () => { cancelled = true; };
  }, [search, tierFilter, verifiedFilter, refreshKey]);

  // Compute summary
  const summary = useMemo(() => {
    let verified = 0;
    let freeTier = 0;
    let proTier = 0;
    let pendingVerification = 0;
    stores.forEach(s => {
      if (s.isVerified) verified++;
      else pendingVerification++;
      if (s.tier === 'pro') proTier++;
      else freeTier++;
    });
    return { total, verified, freeTier, proTier, pendingVerification };
  }, [stores, total]);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
  const paginatedStores = stores.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleStoreAction = async (storeId: string, action: string, value?: string) => {
    setSaving(true);
    try {
      const res = await adminFetch('/api/admin/stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId, action, value }),
      });
      if (res.ok) {
        setStores(prev => prev.map(s => {
          if (s.id !== storeId) return s;
          if (action === 'verify') return { ...s, isVerified: true };
          if (action === 'unverify') return { ...s, isVerified: false };
          if (action === 'set_tier') return { ...s, tier: value || s.tier };
          if (action === 'set_commission') return { ...s, commission: parseFloat(value || '10') };
          return s;
        }));
      }
    } catch {
      // error
    }
    setSaving(false);
  };

  const handleVerify = async () => {
    if (!verifyDialog) return;
    const action = verifyDialog.isVerified ? 'unverify' : 'verify';
    await handleStoreAction(verifyDialog.id, action);
    setVerifyDialog(null);
  };

  const handleSetCommission = async () => {
    if (!commissionDialog) return;
    await handleStoreAction(commissionDialog.id, 'set_commission', String(commissionValue));
    setCommissionDialog(null);
  };

  const handleSetTier = async () => {
    if (!tierDialog) return;
    await handleStoreAction(tierDialog.id, 'set_tier', selectedTier);
    setTierDialog(null);
  };

  const tierBadge = (tier: string) => {
    const map: Record<string, string> = {
      free: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      pro: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    };
    return map[tier?.toLowerCase()] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
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
    { label: 'Total Stores', value: summary.total, icon: StoreIcon, color: 'emerald' },
    { label: 'Verified', value: summary.verified, icon: BadgeCheck, color: 'emerald' },
    { label: 'Free Tier', value: summary.freeTier, icon: Clock, color: 'gray' },
    { label: 'Pro Tier', value: summary.proTier, icon: Crown, color: 'amber' },
    { label: 'Pending Verification', value: summary.pendingVerification, icon: XCircle, color: 'rose' },
  ];

  const colorMap: Record<string, { bg: string; icon: string; darkBg: string; darkIcon: string }> = {
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', darkBg: 'dark:bg-emerald-950/50', darkIcon: 'dark:text-emerald-400' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', darkBg: 'dark:bg-amber-950/50', darkIcon: 'dark:text-amber-400' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', darkBg: 'dark:bg-rose-950/50', darkIcon: 'dark:text-rose-400' },
    gray: { bg: 'bg-gray-50', icon: 'text-gray-600', darkBg: 'dark:bg-gray-800/50', darkIcon: 'dark:text-gray-400' },
  };

  if (loading && stores.length === 0) {
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
        <h2 className="text-lg font-semibold">Store Management</h2>
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
                placeholder="Search stores..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="ps-9 h-9 text-sm"
              />
            </div>
            <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[140px] h-9 text-xs">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="pro">Pro</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={(v) => { setVerifiedFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs">
                <SelectValue placeholder="Verification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="true">Verified</SelectItem>
                <SelectItem value="false">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stores Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Store</TableHead>
                  <TableHead className="text-xs">Owner</TableHead>
                  <TableHead className="text-xs text-center">Products</TableHead>
                  <TableHead className="text-xs">Rating</TableHead>
                  <TableHead className="text-xs">Tier</TableHead>
                  <TableHead className="text-xs text-center">Commission</TableHead>
                  <TableHead className="text-xs text-center">Verified</TableHead>
                  <TableHead className="text-xs text-end">{t('adminActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedStores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      No stores found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {store.logo ? (
                            <img
                              src={store.logo}
                              alt={store.name}
                              className="h-8 w-8 rounded-md object-cover border border-border"
                            />
                          ) : (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                                {store.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div>
                            <p className="text-xs font-medium">{store.name}</p>
                            <p className="text-[10px] text-muted-foreground">{store.slug}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-xs font-medium">{store.ownerName}</p>
                          <p className="text-[11px] text-muted-foreground">{store.ownerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-center">{store.actualProductCount || store.productCount}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-0.5 text-xs">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                          <span className="font-medium">{store.rating?.toFixed(1) || '0.0'}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] px-1.5 py-0 border-0 capitalize ${tierBadge(store.tier)}`}>
                          {store.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-center">{store.commission}%</TableCell>
                      <TableCell className="text-center">
                        {store.isVerified ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                        ) : (
                          <XCircle className="h-4 w-4 text-rose-400 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-48">
                            <DropdownMenuItem onClick={() => setDetailStore(store)}>
                              <Eye className="h-3.5 w-3.5 me-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setVerifyDialog(store)}>
                              {store.isVerified ? (
                                <>
                                  <ShieldX className="h-3.5 w-3.5 me-2 text-rose-500" />
                                  Unverify Store
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-3.5 w-3.5 me-2 text-emerald-500" />
                                  Verify Store
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setTierDialog(store); setSelectedTier(store.tier || 'free'); }}>
                              <Crown className="h-3.5 w-3.5 me-2 text-amber-500" />
                              Set Tier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setCommissionDialog(store); setCommissionValue(store.commission || 10); }}>
                              <Percent className="h-3.5 w-3.5 me-2 text-blue-500" />
                              Set Commission
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {total} stores
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

      {/* Store Detail Dialog */}
      <Dialog open={!!detailStore} onOpenChange={() => setDetailStore(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StoreIcon className="h-5 w-5 text-emerald-600" />
              Store Details
            </DialogTitle>
            <DialogDescription>Full store information</DialogDescription>
          </DialogHeader>
          {detailStore && (
            <div className="space-y-4">
              {/* Logo & Name */}
              <div className="flex gap-4">
                {detailStore.logo ? (
                  <img
                    src={detailStore.logo}
                    alt={detailStore.name}
                    className="h-16 w-16 rounded-xl object-cover border border-border"
                  />
                ) : (
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="text-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      {detailStore.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold">{detailStore.name}</h3>
                  <p className="text-xs text-muted-foreground">@{detailStore.slug}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-[10px] px-1.5 py-0 border-0 capitalize ${tierBadge(detailStore.tier)}`}>
                      {detailStore.tier}
                    </Badge>
                    {detailStore.isVerified ? (
                      <Badge className="text-[10px] px-1.5 py-0 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        <BadgeCheck className="h-3 w-3 me-0.5" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="text-[10px] px-1.5 py-0 border-0 bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300">
                        Unverified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {detailStore.description && (
                <>
                  <Separator />
                  <p className="text-xs text-muted-foreground">{detailStore.description}</p>
                </>
              )}

              <Separator />

              {/* Owner Info */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Owner Information</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">{detailStore.ownerName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{detailStore.ownerEmail}</p>
                  </div>
                  {detailStore.ownerWalletBalance !== undefined && (
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Wallet Balance</p>
                      <p className="font-medium">{formatPrice(detailStore.ownerWalletBalance)}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Store Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <Package className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Products</p>
                  <p className="text-sm font-semibold">{detailStore.actualProductCount || detailStore.productCount}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <DollarSign className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="text-sm font-semibold">{detailStore.orderCount}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <Star className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="text-sm font-semibold">{detailStore.rating?.toFixed(1) || '0.0'}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <Percent className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <p className="text-xs text-muted-foreground">Commission</p>
                  <p className="text-sm font-semibold">{detailStore.commission}%</p>
                </div>
              </div>

              <Separator />

              {/* Dates */}
              <div className="text-xs text-muted-foreground">
                Created: {formatDate(detailStore.createdAt)}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Verify/Unverify Dialog */}
      <Dialog open={!!verifyDialog} onOpenChange={() => setVerifyDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {verifyDialog?.isVerified ? 'Unverify Store' : 'Verify Store'}
            </DialogTitle>
            <DialogDescription>
              {verifyDialog?.isVerified
                ? `Are you sure you want to remove verification from "${verifyDialog?.name}"?`
                : `Are you sure you want to verify "${verifyDialog?.name}"?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialog(null)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleVerify}
              disabled={saving}
              className={verifyDialog?.isVerified
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }
            >
              {saving ? 'Processing...' : verifyDialog?.isVerified ? 'Unverify' : 'Verify'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Commission Dialog */}
      <Dialog open={!!commissionDialog} onOpenChange={() => setCommissionDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Commission Rate</DialogTitle>
            <DialogDescription>
              Set commission for &quot;{commissionDialog?.name}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Commission Rate: {commissionValue}%
              </label>
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={commissionValue}
                onChange={(e) => setCommissionValue(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-emerald-200 dark:bg-emerald-900 accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={commissionValue}
                onChange={(e) => setCommissionValue(Math.min(50, Math.max(0, parseFloat(e.target.value) || 0)))}
                className="w-24 h-9 text-sm"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommissionDialog(null)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSetCommission}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? 'Saving...' : 'Set Commission'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Set Tier Dialog */}
      <Dialog open={!!tierDialog} onOpenChange={() => setTierDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Store Tier</DialogTitle>
            <DialogDescription>
              Set tier for &quot;{tierDialog?.name}&quot;
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div
              className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedTier === 'free'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50'
                  : 'border-border hover:border-muted-foreground/50'
              }`}
              onClick={() => setSelectedTier('free')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Free Tier</p>
                  <p className="text-xs text-muted-foreground">Basic features, standard commission rates</p>
                </div>
                <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-0">Free</Badge>
              </div>
            </div>
            <div
              className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedTier === 'pro'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50'
                  : 'border-border hover:border-muted-foreground/50'
              }`}
              onClick={() => setSelectedTier('pro')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Pro Tier</p>
                  <p className="text-xs text-muted-foreground">Advanced analytics, lower commission, priority support</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-0">Pro</Badge>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTierDialog(null)}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSetTier}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving ? 'Saving...' : 'Set Tier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
