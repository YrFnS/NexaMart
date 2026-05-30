'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
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
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useI18n } from '@/lib/i18n';
import { adminFetch } from '@/lib/admin-api';

interface KYCApplication {
  id: string;
  storeName: string;
  owner: string;
  documentType: string;
  submittedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  documentPreview?: string;
  rejectionReason?: string;
}

const docTypeIcon: Record<string, React.ElementType> = {
  'Business License': FileText,
  'ID Card': ShieldCheck,
  'Tax Certificate': FileText,
};

export function KYCApproval() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const [applications, setApplications] = useState<KYCApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rejectDialog, setRejectDialog] = useState<KYCApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewDocDialog, setViewDocDialog] = useState<KYCApplication | null>(null);
  const [confirmApprove, setConfirmApprove] = useState<KYCApplication | null>(null);

  useEffect(() => {
    const fetchKYC = async () => {
      try {
        const res = await adminFetch('/api/admin/kyc');
        if (res.ok) {
          const json = await res.json();
          if (json.documents && Array.isArray(json.documents)) {
            setApplications(json.documents);
          }
        }
      } catch {
        // keep empty
      }
      setLoading(false);
    };
    fetchKYC();
  }, []);

  const pendingApps = applications.filter(a => a.status === 'pending' && 
    (a.storeName.toLowerCase().includes(search.toLowerCase()) || a.owner.toLowerCase().includes(search.toLowerCase()))
  );
  const approvedApps = applications.filter(a => a.status === 'approved');
  const rejectedApps = applications.filter(a => a.status === 'rejected');

  const handleApprove = (app: KYCApplication) => {
    setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: 'approved' as const } : a));
    setConfirmApprove(null);
  };

  const handleReject = () => {
    if (!rejectDialog || !rejectReason.trim()) return;
    setApplications(prev => prev.map(a => a.id === rejectDialog.id ? { ...a, status: 'rejected' as const, rejectionReason: rejectReason } : a));
    setRejectDialog(null);
    setRejectReason('');
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
      approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
      rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
    };
    return map[status] || '';
  };

  const renderTable = (apps: KYCApplication[], showActions: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">{t('adminStore')}</TableHead>
          <TableHead className="text-xs">Owner</TableHead>
          <TableHead className="text-xs">{t('adminDocumentType')}</TableHead>
          <TableHead className="text-xs">{t('adminSubmittedDate')}</TableHead>
          <TableHead className="text-xs">{t('adminStatus')}</TableHead>
          <TableHead className="text-xs text-end">{t('adminActions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {apps.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
              {t('noResults')}
            </TableCell>
          </TableRow>
        ) : (
          apps.map((app) => {
            const DocIcon = docTypeIcon[app.documentType] || FileText;
            return (
              <TableRow key={app.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                        {app.storeName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{app.storeName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs">{app.owner}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <DocIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs">{app.documentType}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{app.submittedDate}</TableCell>
                <TableCell>
                  <Badge className={`text-[10px] px-1.5 py-0 border-0 capitalize ${statusBadge(app.status)}`}>
                    {app.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-end">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewDocDialog(app)}>
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {showActions && app.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 px-2"
                          onClick={() => setConfirmApprove(app)}
                        >
                          <CheckCircle className="h-3.5 w-3.5 me-1" />
                          {t('adminApprove')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[11px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 px-2"
                          onClick={() => setRejectDialog(app)}
                        >
                          <XCircle className="h-3.5 w-3.5 me-1" />
                          {t('adminReject')}
                        </Button>
                      </>
                    )}
                    {app.status === 'rejected' && app.rejectionReason && (
                      <span className="text-[11px] text-rose-600 dark:text-rose-400">{app.rejectionReason}</span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="grid grid-cols-3 gap-3">
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-lg font-semibold">{t('kycApproval')}</h2>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
          <Input
            placeholder="Search stores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="h-8 w-8 mx-auto rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-lg font-bold">{pendingApps.length}</p>
            <p className="text-[11px] text-muted-foreground">{t('adminKYCPending')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="h-8 w-8 mx-auto rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-lg font-bold">{approvedApps.length}</p>
            <p className="text-[11px] text-muted-foreground">{t('adminKYCApproved')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="h-8 w-8 mx-auto rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center mb-1">
              <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <p className="text-lg font-bold">{rejectedApps.length}</p>
            <p className="text-[11px] text-muted-foreground">{t('adminKYCRejected')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs defaultValue="pending">
          <CardHeader className="pb-0 px-4 pt-4">
            <TabsList className="h-8">
              <TabsTrigger value="pending" className="text-xs">
                {t('adminKYCPending')} ({pendingApps.length})
              </TabsTrigger>
              <TabsTrigger value="approved" className="text-xs">
                {t('adminKYCApproved')} ({approvedApps.length})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs">
                {t('adminKYCRejected')} ({rejectedApps.length})
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="p-0 pt-2">
            <TabsContent value="pending" className="m-0">
              <div className="overflow-x-auto">
                {renderTable(pendingApps, true)}
              </div>
            </TabsContent>
            <TabsContent value="approved" className="m-0">
              <div className="overflow-x-auto">
                {renderTable(approvedApps, false)}
              </div>
            </TabsContent>
            <TabsContent value="rejected" className="m-0">
              <div className="overflow-x-auto">
                {renderTable(rejectedApps, false)}
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Approve Confirmation */}
      <Dialog open={!!confirmApprove} onOpenChange={() => setConfirmApprove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('adminApprove')} KYC Application</DialogTitle>
            <DialogDescription>
              Approve KYC for <strong>{confirmApprove?.storeName}</strong> ({confirmApprove?.owner})?
              This will verify their store and grant full seller privileges.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmApprove(null)}>{t('cancel')}</Button>
            <Button onClick={() => confirmApprove && handleApprove(confirmApprove)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle className="h-4 w-4 me-1.5" />
              {t('adminApprove')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={() => { setRejectDialog(null); setRejectReason(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('adminReject')} KYC Application</DialogTitle>
            <DialogDescription>
              Reject KYC for <strong>{rejectDialog?.storeName}</strong> ({rejectDialog?.owner}). Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t('adminRejectionReason')}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[80px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectReason(''); }}>{t('cancel')}</Button>
            <Button onClick={handleReject} disabled={!rejectReason.trim()} className="bg-rose-600 hover:bg-rose-700 text-white">
              <XCircle className="h-4 w-4 me-1.5" />
              {t('adminReject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={!!viewDocDialog} onOpenChange={() => setViewDocDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          {viewDocDialog && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    {viewDocDialog.storeName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-sm">{viewDocDialog.storeName}</h4>
                  <p className="text-xs text-muted-foreground">Owner: {viewDocDialog.owner}</p>
                </div>
              </div>
              <div className="border border-dashed border-border rounded-lg p-8 text-center bg-muted/30">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm font-medium">{viewDocDialog.documentType}</p>
                <p className="text-xs text-muted-foreground mt-1">Submitted: {viewDocDialog.submittedDate}</p>
                <Button variant="outline" size="sm" className="mt-3 text-xs h-7">
                  Download Document
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
