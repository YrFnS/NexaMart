'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Clock,
  CheckCircle,
  TrendingUp,
  DollarSign,
  Search,
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { adminFetch } from '@/lib/admin-api';

interface Payout {
  id: string;
  store: string;
  amount: number;
  method: string;
  requestedDate: string;
  status: 'pending' | 'completed' | 'processed';
}

export function FinancialPayouts() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const [pendingPayouts, setPendingPayouts] = useState<Payout[]>([]);
  const [completedPayouts, setCompletedPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processDialog, setProcessDialog] = useState<Payout | null>(null);

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        const res = await adminFetch('/api/admin/payouts');
        if (res.ok) {
          const json = await res.json();
          if (json.payouts && Array.isArray(json.payouts)) {
            const payouts: Payout[] = json.payouts.map((p: Record<string, unknown>) => ({
              id: p.id as string,
              store: p.store as string,
              amount: p.amount as number,
              method: p.method as string,
              requestedDate: p.requestedDate as string,
              status: (p.status === 'completed' ? 'processed' : p.status) as Payout['status'],
            }));
            setPendingPayouts(payouts.filter((p: Payout) => p.status === 'pending'));
            setCompletedPayouts(payouts.filter((p: Payout) => p.status === 'processed' || p.status === 'completed'));
          }
        }
      } catch {
        // keep empty
      }
      setLoading(false);
    };
    fetchPayouts();
  }, []);

  const totalPending = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
  const totalCompleted = completedPayouts.reduce((sum, p) => sum + p.amount, 0);
  const thisMonth = [...pendingPayouts, ...completedPayouts].reduce((sum, p) => sum + p.amount, 0);

  const handleProcess = () => {
    if (!processDialog) return;
    setPendingPayouts(prev => prev.filter(p => p.id !== processDialog.id));
    setCompletedPayouts(prev => [{ ...processDialog, status: 'processed' as const }, ...prev]);
    setProcessDialog(null);
  };

  const filteredPending = pendingPayouts.filter(p =>
    p.store.toLowerCase().includes(search.toLowerCase()) ||
    p.method.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCompleted = completedPayouts.filter(p =>
    p.store.toLowerCase().includes(search.toLowerCase()) ||
    p.method.toLowerCase().includes(search.toLowerCase())
  );

  const renderTable = (payouts: Payout[], isPending: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">{t('adminStore')}</TableHead>
          <TableHead className="text-xs text-end">{t('adminAmount')}</TableHead>
          <TableHead className="text-xs">{t('adminMethod')}</TableHead>
          <TableHead className="text-xs">{t('adminRequestedDate')}</TableHead>
          <TableHead className="text-xs">{t('adminStatus')}</TableHead>
          <TableHead className="text-xs text-end">{t('adminActions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payouts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
              {t('noResults')}
            </TableCell>
          </TableRow>
        ) : (
          payouts.map((payout) => (
            <TableRow key={payout.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      {payout.store.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{payout.store}</span>
                </div>
              </TableCell>
              <TableCell className="text-xs text-end font-semibold">{formatPrice(payout.amount)}</TableCell>
              <TableCell className="text-xs">{payout.method}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{payout.requestedDate}</TableCell>
              <TableCell>
                <Badge className={`text-[10px] px-1.5 py-0 border-0 ${
                  payout.status === 'pending'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                }`}>
                  {payout.status === 'pending' ? t('adminPending') : t('adminProcessed')}
                </Badge>
              </TableCell>
              <TableCell className="text-end">
                {isPending && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[11px] border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 px-2"
                    onClick={() => setProcessDialog(payout)}
                  >
                    {t('adminMarkProcessed')}
                  </Button>
                )}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-lg font-semibold">{t('financialPayouts')}</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('adminTotalPending')}</p>
              <p className="text-lg font-bold">{formatPrice(totalPending)}</p>
              <p className="text-[11px] text-muted-foreground">{pendingPayouts.length} requests</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('adminTotalCompleted')}</p>
              <p className="text-lg font-bold">{formatPrice(totalCompleted)}</p>
              <p className="text-[11px] text-muted-foreground">{completedPayouts.length} payouts</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('adminThisMonth')}</p>
              <p className="text-lg font-bold">{formatPrice(thisMonth)}</p>
              <p className="text-[11px] text-muted-foreground">{pendingPayouts.length + completedPayouts.length} total</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
        <Input
          placeholder="Search payouts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-9 h-9 text-sm"
        />
      </div>

      {/* Payout Tabs */}
      <Card>
        <Tabs defaultValue="pending">
          <CardHeader className="pb-0 px-4 pt-4">
            <TabsList className="h-8">
              <TabsTrigger value="pending" className="text-xs">
                {t('adminPending')} ({filteredPending.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">
                {t('adminCompleted')} ({filteredCompleted.length})
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <TabsContent value="pending" className="m-0">
              <div className="overflow-x-auto">{renderTable(filteredPending, true)}</div>
            </TabsContent>
            <TabsContent value="completed" className="m-0">
              <div className="overflow-x-auto">{renderTable(filteredCompleted, false)}</div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Process Confirmation Dialog */}
      <Dialog open={!!processDialog} onOpenChange={() => setProcessDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('adminMarkProcessed')}</DialogTitle>
            <DialogDescription>
              Mark payout for <strong>{processDialog?.store}</strong> of <strong>{formatPrice(processDialog?.amount || 0)}</strong> via {processDialog?.method} as processed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProcessDialog(null)}>{t('cancel')}</Button>
            <Button onClick={handleProcess} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle className="h-4 w-4 me-1.5" />
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
