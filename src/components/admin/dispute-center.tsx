'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Eye,
  DollarSign,
  User,
  Store,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { adminFetch } from '@/lib/admin-api';

interface Dispute {
  id: string;
  orderNum: string;
  buyer: string;
  seller: string;
  reason: string;
  date: string;
  status: 'open' | 'under_review' | 'resolved';
  amount: number;
  aiSummary?: string;
  aiSuggestedResolution?: string;
}

export function DisputeCenter() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [detailDialog, setDetailDialog] = useState<Dispute | null>(null);
  const [resolutionDialog, setResolutionDialog] = useState<{ dispute: Dispute; action: string } | null>(null);

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const res = await adminFetch('/api/admin/disputes');
        if (res.ok) {
          const json = await res.json();
          if (json.disputes && Array.isArray(json.disputes)) {
            setDisputes(json.disputes);
          }
        }
      } catch {
        // keep empty
      }
      setLoading(false);
    };
    fetchDisputes();
  }, []);

  const openDisputes = disputes.filter(d => d.status === 'open');
  const underReviewDisputes = disputes.filter(d => d.status === 'under_review');
  const resolvedDisputes = disputes.filter(d => d.status === 'resolved');

  const filteredDisputes = (list: Dispute[]) => list.filter(d =>
    d.orderNum.toLowerCase().includes(search.toLowerCase()) ||
    d.buyer.toLowerCase().includes(search.toLowerCase()) ||
    d.seller.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      under_review: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      resolved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    };
    return map[status] || '';
  };

  const handleResolution = () => {
    if (!resolutionDialog) return;
    setDisputes(prev => prev.map(d =>
      d.id === resolutionDialog.dispute.id ? { ...d, status: 'resolved' as const } : d
    ));
    setResolutionDialog(null);
    setDetailDialog(null);
  };

  const renderTable = (list: Dispute[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">{t('adminOrderNum')}</TableHead>
          <TableHead className="text-xs">{t('adminBuyer')}</TableHead>
          <TableHead className="text-xs">{t('adminSeller')}</TableHead>
          <TableHead className="text-xs">{t('adminReason')}</TableHead>
          <TableHead className="text-xs">Date</TableHead>
          <TableHead className="text-xs">{t('adminStatus')}</TableHead>
          <TableHead className="text-xs text-end">{t('adminActions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {list.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
              {t('noResults')}
            </TableCell>
          </TableRow>
        ) : (
          list.map((dispute) => (
            <TableRow key={dispute.id}>
              <TableCell className="text-xs font-medium">{dispute.orderNum}</TableCell>
              <TableCell className="text-xs">{dispute.buyer}</TableCell>
              <TableCell className="text-xs">{dispute.seller}</TableCell>
              <TableCell className="text-xs max-w-[150px] truncate">{dispute.reason}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{dispute.date}</TableCell>
              <TableCell>
                <Badge className={`text-[10px] px-1.5 py-0 border-0 capitalize ${statusBadge(dispute.status)}`}>
                  {dispute.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setDetailDialog(dispute)}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="h-8 w-48 rounded bg-muted animate-pulse" />
        <div className="h-96 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-semibold">{t('disputeCenter')}</h2>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0">
            {openDisputes.length} {t('adminDisputeOpen')}
          </Badge>
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-0">
            {underReviewDisputes.length} {t('adminDisputeUnderReview')}
          </Badge>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
        <Input
          placeholder="Search disputes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-9 h-9 text-sm"
        />
      </div>

      {/* Tabs */}
      <Card>
        <Tabs defaultValue="open">
          <CardHeader className="pb-0 px-4 pt-4">
            <TabsList className="h-8">
              <TabsTrigger value="open" className="text-xs">
                {t('adminDisputeOpen')} ({filteredDisputes(openDisputes).length})
              </TabsTrigger>
              <TabsTrigger value="under_review" className="text-xs">
                {t('adminDisputeUnderReview')} ({filteredDisputes(underReviewDisputes).length})
              </TabsTrigger>
              <TabsTrigger value="resolved" className="text-xs">
                {t('adminDisputeResolved')} ({filteredDisputes(resolvedDisputes).length})
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <TabsContent value="open" className="m-0">
              <div className="overflow-x-auto">{renderTable(filteredDisputes(openDisputes))}</div>
            </TabsContent>
            <TabsContent value="under_review" className="m-0">
              <div className="overflow-x-auto">{renderTable(filteredDisputes(underReviewDisputes))}</div>
            </TabsContent>
            <TabsContent value="resolved" className="m-0">
              <div className="overflow-x-auto">{renderTable(filteredDisputes(resolvedDisputes))}</div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Dispute Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dispute - {detailDialog?.orderNum}</DialogTitle>
          </DialogHeader>
          {detailDialog && (
            <div className="space-y-4">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t('adminBuyer')}</span>
                  </div>
                  <p className="text-sm font-medium">{detailDialog.buyer}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Store className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t('adminSeller')}</span>
                  </div>
                  <p className="text-sm font-medium">{detailDialog.seller}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-sm font-bold">{formatPrice(detailDialog.amount)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-medium">{detailDialog.date}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">{t('adminStatus')}</p>
                  <Badge className={`text-[10px] px-1.5 py-0 border-0 capitalize ${statusBadge(detailDialog.status)}`}>
                    {detailDialog.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">{t('adminReason')}</p>
                <p className="text-sm">{detailDialog.reason}</p>
              </div>

              {/* AI Summary */}
              {detailDialog.aiSummary && (
                <div className="p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">{t('adminAISummary')}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{detailDialog.aiSummary}</p>
                </div>
              )}

              {/* AI Suggested Resolution */}
              {detailDialog.aiSuggestedResolution && (
                <div className="p-3 rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border border-teal-200 dark:border-teal-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">{t('adminAISuggestedResolution')}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{detailDialog.aiSuggestedResolution}</p>
                </div>
              )}

              {/* Resolution Actions */}
              {detailDialog.status !== 'resolved' && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-semibold mb-3">Resolve Dispute</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                        onClick={() => setResolutionDialog({ dispute: detailDialog, action: 'refund_buyer' })}
                      >
                        <DollarSign className="h-3.5 w-3.5 me-1" />
                        {t('adminRefundBuyer')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950"
                        onClick={() => setResolutionDialog({ dispute: detailDialog, action: 'pay_seller' })}
                      >
                        <Store className="h-3.5 w-3.5 me-1" />
                        {t('adminPaySeller')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950"
                        onClick={() => setResolutionDialog({ dispute: detailDialog, action: 'split_refund' })}
                      >
                        <DollarSign className="h-3.5 w-3.5 me-1" />
                        {t('adminSplitRefund')}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Resolution Confirmation Dialog */}
      <Dialog open={!!resolutionDialog} onOpenChange={() => setResolutionDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {resolutionDialog?.action === 'refund_buyer' ? t('adminRefundBuyer') :
               resolutionDialog?.action === 'pay_seller' ? t('adminPaySeller') :
               t('adminSplitRefund')}
            </DialogTitle>
            <DialogDescription>
              {resolutionDialog?.action === 'refund_buyer'
                ? `Full refund of ${formatPrice(resolutionDialog?.dispute.amount || 0)} will be issued to ${resolutionDialog?.dispute.buyer}.`
                : resolutionDialog?.action === 'pay_seller'
                ? `Full amount of ${formatPrice(resolutionDialog?.dispute.amount || 0)} will be released to ${resolutionDialog?.dispute.seller}.`
                : `50% refund to buyer, 50% to seller for order ${resolutionDialog?.dispute.orderNum}.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolutionDialog(null)}>{t('cancel')}</Button>
            <Button onClick={handleResolution} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Confirm Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
