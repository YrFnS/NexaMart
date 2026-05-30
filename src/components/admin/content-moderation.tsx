'use client';

import React, { useState, useEffect } from 'react';
import {
  Flag,
  Eye,
  Trash2,
  XCircle,
  AlertTriangle,
  Shield,
  Search,
  CheckSquare,
  Square,
  LayoutDashboard,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { useI18n } from '@/lib/i18n';
import { adminFetch } from '@/lib/admin-api';

interface FlaggedItem {
  id: string;
  product: string;
  store: string;
  reporter: string;
  reason: 'Fake Item' | 'Illegal Content' | 'Prohibited Words' | 'Copyright' | 'AI Flag';
  date: string;
  status: 'pending' | 'removed' | 'dismissed';
  productId: string;
}

const reasonIcon: Record<string, React.ElementType> = {
  'Fake Item': AlertTriangle,
  'Illegal Content': Shield,
  'Prohibited Words': Flag,
  'Copyright': Shield,
  'AI Flag': AlertTriangle,
};

const reasonBadge: Record<string, string> = {
  'Fake Item': 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
  'Illegal Content': 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  'Prohibited Words': 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  'Copyright': 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  'AI Flag': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
};

export function ContentModeration() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const [items, setItems] = useState<FlaggedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [removeDialog, setRemoveDialog] = useState<FlaggedItem | null>(null);
  const [dismissDialog, setDismissDialog] = useState<FlaggedItem | null>(null);
  const [bulkAction, setBulkAction] = useState<'remove' | 'dismiss' | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await adminFetch('/api/admin/content?status=pending');
        if (res.ok) {
          const json = await res.json();
          if (json.items && Array.isArray(json.items)) {
            setItems(json.items);
          }
        }
      } catch {
        // keep empty
      }
      setLoading(false);
    };
    fetchContent();
  }, []);

  const pendingItems = items.filter(i => i.status === 'pending' &&
    (i.product.toLowerCase().includes(search.toLowerCase()) || i.store.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === pendingItems.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingItems.map(i => i.id)));
    }
  };

  const handleRemove = (item: FlaggedItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'removed' as const } : i));
    setRemoveDialog(null);
  };

  const handleDismiss = (item: FlaggedItem) => {
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'dismissed' as const } : i));
    setDismissDialog(null);
  };

  const handleBulkAction = () => {
    if (!bulkAction) return;
    setItems(prev => prev.map(i => selected.has(i.id) ? { ...i, status: bulkAction === 'remove' ? 'removed' as const : 'dismissed' as const } : i));
    setSelected(new Set());
    setBulkAction(null);
  };

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
          <Flag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-semibold">{t('contentModeration')}</h2>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
          <Input
            placeholder="Search flagged items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 border-0">
          {pendingItems.length} Pending Review
        </Badge>
        <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300 border-0">
          {items.filter(i => i.status === 'removed').length} Removed
        </Badge>
        <Badge className="bg-muted text-muted-foreground border-0">
          {items.filter(i => i.status === 'dismissed').length} Dismissed
        </Badge>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/30">
          <CardContent className="p-3 flex items-center gap-3">
            <span className="text-xs font-medium">{selected.size} selected</span>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950 px-2"
              onClick={() => setBulkAction('remove')}
            >
              <Trash2 className="h-3 w-3 me-1" />
              {t('adminRemoveAll')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] px-2"
              onClick={() => setBulkAction('dismiss')}
            >
              <XCircle className="h-3 w-3 me-1" />
              {t('adminDismissAll')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Flagged Items Table */}
      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Flag className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">{t('noResults')}</p>
              <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
            </div>
          ) : pendingItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <CheckSquare className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">{isRTL ? 'تمت مراجعة جميع العناصر' : 'All items reviewed'}</p>
              <p className="text-sm">{isRTL ? 'لا توجد عناصر معلقة' : 'No pending flagged items'}</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <button onClick={toggleSelectAll} className="flex items-center">
                      {selected.size === pendingItems.length && pendingItems.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs">Product</TableHead>
                  <TableHead className="text-xs">{t('adminStore')}</TableHead>
                  <TableHead className="text-xs">{t('adminReporter')}</TableHead>
                  <TableHead className="text-xs">{t('adminReason')}</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs text-end">{t('adminActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingItems.map((item) => {
                  const ReasonIcon = reasonIcon[item.reason] || Flag;
                  return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <button onClick={() => toggleSelect(item.id)} className="flex items-center">
                          {selected.has(item.id) ? (
                            <CheckSquare className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium">{item.product}</span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.store}</TableCell>
                      <TableCell className="text-xs">{item.reporter}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] px-1.5 py-0 border-0 ${reasonBadge[item.reason] || ''}`}>
                          <ReasonIcon className="h-3 w-3 me-1" />
                          {item.reason}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.date}</TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" title={t('adminViewProduct')}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950"
                            onClick={() => setRemoveDialog(item)}
                            title={t('adminRemoveProduct')}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:bg-muted"
                            onClick={() => setDismissDialog(item)}
                            title={t('adminDismissFlag')}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Remove Confirmation */}
      <Dialog open={!!removeDialog} onOpenChange={() => setRemoveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('adminRemoveProduct')}</DialogTitle>
            <DialogDescription>
              Remove <strong>{removeDialog?.product}</strong> from <strong>{removeDialog?.store}</strong>? This action will take down the product listing.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveDialog(null)}>{t('cancel')}</Button>
            <Button onClick={() => removeDialog && handleRemove(removeDialog)} className="bg-rose-600 hover:bg-rose-700 text-white">
              <Trash2 className="h-4 w-4 me-1.5" />
              Remove Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dismiss Confirmation */}
      <Dialog open={!!dismissDialog} onOpenChange={() => setDismissDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('adminDismissFlag')}</DialogTitle>
            <DialogDescription>
              Dismiss the flag on <strong>{dismissDialog?.product}</strong>? The product will remain listed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDismissDialog(null)}>{t('cancel')}</Button>
            <Button onClick={() => dismissDialog && handleDismiss(dismissDialog)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Dismiss Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirmation */}
      <Dialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{bulkAction === 'remove' ? t('adminRemoveAll') : t('adminDismissAll')}</DialogTitle>
            <DialogDescription>
              {bulkAction === 'remove'
                ? `Remove ${selected.size} products from the platform? This will take down all selected listings.`
                : `Dismiss flags on ${selected.size} items? The products will remain listed.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAction(null)}>{t('cancel')}</Button>
            <Button
              onClick={handleBulkAction}
              className={bulkAction === 'remove' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
            >
              Confirm ({selected.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
