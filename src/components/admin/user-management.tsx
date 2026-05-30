'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MoreHorizontal,
  Ban,
  Pause,
  CheckCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Mail,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { formatPrice } from '@/lib/currency';
import { STORE_LIMITS } from '@/lib/config';
import { adminFetch } from '@/lib/admin-api';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin';
  status: 'active' | 'banned' | 'suspended';
  joined: string;
  avatar?: string;
  phone?: string;
  orders?: number;
  revenue?: number;
  walletBalance?: number;
  activityLog?: { action: string; date: string }[];
}

const ITEMS_PER_PAGE = STORE_LIMITS.adminItemsPerPage;

export function UserManagement() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{ type: 'ban' | 'suspend' | 'activate'; user: AdminUser } | null>(null);
  const [reason, setReason] = useState('');
  const [detailsDialog, setDetailsDialog] = useState<AdminUser | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await adminFetch('/api/admin/users');
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json)) setUsers(json);
        }
      } catch {
        // keep empty
      }
      setLoading(false);
    };
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleAction = () => {
    if (!actionDialog) return;
    setUsers(prev => prev.map(u => {
      if (u.id === actionDialog.user.id) {
        if (actionDialog.type === 'ban') return { ...u, status: 'banned' as const };
        if (actionDialog.type === 'suspend') return { ...u, status: 'suspended' as const };
        if (actionDialog.type === 'activate') return { ...u, status: 'active' as const };
      }
      return u;
    }));
    setActionDialog(null);
    setReason('');
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
      banned: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
      suspended: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    };
    return map[status] || '';
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      buyer: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      seller: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      admin: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    };
    return map[role] || '';
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t('adminUserTable')}</h2>
        <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
          <UserPlus className="h-3.5 w-3.5 me-1.5" />
          Add User
        </Button>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
              <Input
                placeholder={t('adminSearchUsers')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="ps-9 h-9 text-sm"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
                <SelectValue placeholder={t('adminFilterRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="buyer">Buyer</SelectItem>
                <SelectItem value="seller">Seller</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
                <SelectValue placeholder={t('adminFilterStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="h-12 w-12 mb-4 rounded-full bg-muted animate-pulse" />
              <p className="text-sm">{t('loading')}</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">{t('noResults')}</p>
              <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">{t('email')}</TableHead>
                  <TableHead className="text-xs">{t('adminRole')}</TableHead>
                  <TableHead className="text-xs">{t('adminStatus')}</TableHead>
                  <TableHead className="text-xs">{t('adminJoined')}</TableHead>
                  <TableHead className="text-xs text-end">{t('adminActions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{user.email}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] px-1.5 py-0 border-0 capitalize ${roleBadge(user.role)}`}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] px-1.5 py-0 border-0 capitalize ${statusBadge(user.status)}`}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{user.joined}</TableCell>
                    <TableCell className="text-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-40">
                          <DropdownMenuItem onClick={() => setDetailsDialog(user)}>
                            <Eye className="h-3.5 w-3.5 me-2" />
                            {t('adminViewDetails')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status !== 'banned' && (
                            <DropdownMenuItem onClick={() => setActionDialog({ type: 'ban', user })}>
                              <Ban className="h-3.5 w-3.5 me-2 text-rose-500" />
                              {t('adminBan')}
                            </DropdownMenuItem>
                          )}
                          {user.status !== 'suspended' && (
                            <DropdownMenuItem onClick={() => setActionDialog({ type: 'suspend', user })}>
                              <Pause className="h-3.5 w-3.5 me-2 text-amber-500" />
                              {t('adminSuspend')}
                            </DropdownMenuItem>
                          )}
                          {user.status !== 'active' && (
                            <DropdownMenuItem onClick={() => setActionDialog({ type: 'activate', user })}>
                              <CheckCircle className="h-3.5 w-3.5 me-2 text-emerald-500" />
                              {t('adminActivate')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Mail className="h-3.5 w-3.5 me-2" />
                            Send Email
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                {filteredUsers.length} users
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <Button
                    key={p}
                    variant={p === page ? 'default' : 'outline'}
                    size="icon"
                    className={`h-7 w-7 text-xs ${p === page ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
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

      {/* Action Dialog (Ban/Suspend) */}
      <Dialog open={!!actionDialog} onOpenChange={() => { setActionDialog(null); setReason(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.type === 'ban' ? t('adminBan') : actionDialog?.type === 'suspend' ? t('adminSuspend') : t('adminActivate')} - {actionDialog?.user.name}
            </DialogTitle>
            <DialogDescription>
              {actionDialog?.type === 'activate'
                ? 'This will reactivate the user account.'
                : 'Please provide a reason for this action.'}
            </DialogDescription>
          </DialogHeader>
          {actionDialog?.type !== 'activate' && (
            <Textarea
              placeholder={actionDialog?.type === 'ban' ? t('adminBanReason') : t('adminSuspendReason')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[80px]"
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setActionDialog(null); setReason(''); }}>
              {t('cancel')}
            </Button>
            <Button
              onClick={handleAction}
              className={
                actionDialog?.type === 'ban'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : actionDialog?.type === 'suspend'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={!!detailsDialog} onOpenChange={() => setDetailsDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('adminUserDetails')}</DialogTitle>
          </DialogHeader>
          {detailsDialog && (
            <div className="space-y-4">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                    {detailsDialog.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{detailsDialog.name}</h3>
                  <p className="text-sm text-muted-foreground">{detailsDialog.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`text-[10px] px-1.5 py-0 border-0 capitalize ${roleBadge(detailsDialog.role)}`}>
                      {detailsDialog.role}
                    </Badge>
                    <Badge className={`text-[10px] px-1.5 py-0 border-0 capitalize ${statusBadge(detailsDialog.status)}`}>
                      {detailsDialog.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Orders</p>
                  <p className="text-sm font-semibold">{detailsDialog.orders}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('revenue')}</p>
                  <p className="text-sm font-semibold">{formatPrice(detailsDialog.revenue || 0)}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">{t('wallet')}</p>
                  <p className="text-sm font-semibold">{formatPrice(detailsDialog.walletBalance || 0)}</p>
                </div>
              </div>

              <Separator />

              {/* Activity Log */}
              <div>
                <h4 className="text-sm font-semibold mb-2">Activity Log</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {detailsDialog.activityLog?.map((log, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span>{log.action}</span>
                      <span className="text-muted-foreground">{log.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
