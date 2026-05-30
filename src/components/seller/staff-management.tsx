'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Edit3,
  Trash2,
  Copy,
  Shield,
  Check,
  X,
  Mail,
  Clock,
  Package,
  ShoppingCart,
  BarChart3,
  Megaphone,
  Settings,
  Link,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useI18n } from '@/lib/i18n';
import { APP_URL } from '@/lib/config';

type StaffRole = 'admin' | 'manager' | 'support' | 'viewer';
type StaffStatus = 'active' | 'invited' | 'suspended';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  status: StaffStatus;
  lastActive: string;
  avatar?: string;
  permissions: string[];
  joinDate: string;
}

interface ActivityLog {
  id: string;
  staffId: string;
  staffName: string;
  action: string;
  actionEn: string;
  actionAr: string;
  target: string;
  timestamp: string;
}

const permissionOptions = [
  { id: 'products', labelEn: 'Products', labelAr: 'المنتجات', icon: Package },
  { id: 'orders', labelEn: 'Orders', labelAr: 'الطلبات', icon: ShoppingCart },
  { id: 'analytics', labelEn: 'Analytics', labelAr: 'التحليلات', icon: BarChart3 },
  { id: 'marketing', labelEn: 'Marketing', labelAr: 'التسويق', icon: Megaphone },
  { id: 'settings', labelEn: 'Settings', labelAr: 'الإعدادات', icon: Settings },
];



function RoleBadge({ role, isRTL }: { role: StaffRole; isRTL: boolean }) {
  const styles: Record<StaffRole, string> = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    manager: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    support: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    viewer: 'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400',
  };
  const labels: Record<StaffRole, { en: string; ar: string }> = {
    admin: { en: 'Admin', ar: 'مدير' },
    manager: { en: 'Manager', ar: 'مشرف' },
    support: { en: 'Support', ar: 'دعم' },
    viewer: { en: 'Viewer', ar: 'مشاهد' },
  };
  return (
    <Badge variant="secondary" className={`text-[11px] capitalize ${styles[role]}`}>
      <Shield className="h-3 w-3 me-1" />
      {isRTL ? labels[role].ar : labels[role].en}
    </Badge>
  );
}

function StatusBadge({ status, isRTL }: { status: StaffStatus; isRTL: boolean }) {
  const styles: Record<StaffStatus, string> = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    invited: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  const labels: Record<StaffStatus, { en: string; ar: string }> = {
    active: { en: 'Active', ar: 'نشط' },
    invited: { en: 'Invited', ar: 'مدعو' },
    suspended: { en: 'Suspended', ar: 'معلق' },
  };
  return (
    <Badge variant="secondary" className={`text-[11px] ${styles[status]}`}>
      {status === 'active' && <Check className="h-3 w-3 me-1" />}
      {status === 'invited' && <Mail className="h-3 w-3 me-1" />}
      {status === 'suspended' && <X className="h-3 w-3 me-1" />}
      {isRTL ? labels[status].ar : labels[status].en}
    </Badge>
  );
}

interface StaffFormData {
  email: string;
  role: StaffRole;
  permissions: string[];
}

export function StaffManagement() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const [formData, setFormData] = useState<StaffFormData>({
    email: '',
    role: 'viewer',
    permissions: [],
  });

  useEffect(() => {
    async function fetchStaff() {
      try {
        const res = await fetch('/api/seller/staff?storeId=techstore-pro');
        if (res.ok) {
          const json = await res.json();
          setStaff(json.staff || []);
          setActivityLog(json.activityLog || []);
        }
      } catch {
        // API not available — leave empty
      } finally {
        setLoading(false);
      }
    }
    fetchStaff();
  }, []);

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const handleAddStaff = () => {
    const newStaff: StaffMember = {
      id: `staff-${Date.now()}`,
      name: formData.email.split('@')[0],
      email: formData.email,
      role: formData.role,
      status: 'invited',
      lastActive: 'Never',
      permissions: formData.permissions,
      joinDate: new Date().toISOString().split('T')[0],
    };
    setStaff([newStaff, ...staff]);
    setShowAddDialog(false);
    setFormData({ email: '', role: 'viewer', permissions: [] });
  };

  const handleEditStaff = () => {
    if (!editId) return;
    setStaff(staff.map(s => {
      if (s.id !== editId) return s;
      return { ...s, role: formData.role, permissions: formData.permissions };
    }));
    setShowEditDialog(false);
    setEditId(null);
    setFormData({ email: '', role: 'viewer', permissions: [] });
  };

  const handleDelete = () => {
    if (deleteTarget) {
      setStaff(staff.filter(s => s.id !== deleteTarget));
    }
    setDeleteTarget(null);
    setShowDeleteDialog(false);
  };

  const openEdit = (member: StaffMember) => {
    setEditId(member.id);
    setFormData({
      email: member.email,
      role: member.role,
      permissions: member.permissions,
    });
    setShowEditDialog(true);
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${APP_URL}/invite/staff-xK9m2p`).catch(() => {});
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const activeCount = staff.filter(s => s.status === 'active').length;
  const invitedCount = staff.filter(s => s.status === 'invited').length;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
            <Users className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold">{isRTL ? 'إدارة الموظفين' : 'Staff Management'}</h2>
            <p className="text-sm text-muted-foreground">
              {staff.length} {isRTL ? 'أعضاء' : 'members'} · {activeCount} {isRTL ? 'نشط' : 'active'} · {invitedCount} {isRTL ? 'مدعو' : 'invited'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-xs gap-1.5 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950"
            onClick={copyInviteLink}
          >
            {inviteCopied ? <Check className="h-3.5 w-3.5" /> : <Link className="h-3.5 w-3.5" />}
            {inviteCopied
              ? isRTL ? 'تم النسخ!' : 'Copied!'
              : isRTL ? 'نسخ رابط الدعوة' : 'Copy Invite Link'
            }
          </Button>
          <Button
            size="sm"
            className="h-9 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => {
              setFormData({ email: '', role: 'viewer', permissions: [] });
              setShowAddDialog(true);
            }}
          >
            <UserPlus className="h-3.5 w-3.5" />
            {isRTL ? 'إضافة موظف' : 'Add Staff'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { labelEn: 'Total Staff', labelAr: 'إجمالي الموظفين', value: staff.length, icon: Users, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
          { labelEn: 'Active', labelAr: 'نشط', value: activeCount, icon: Check, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/50' },
          { labelEn: 'Invited', labelAr: 'مدعو', value: invitedCount, icon: Mail, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50' },
          { labelEn: 'Suspended', labelAr: 'معلق', value: staff.filter(s => s.status === 'suspended').length, icon: X, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/50' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-[11px] text-muted-foreground">{isRTL ? stat.labelAr : stat.labelEn}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search & Activity Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground start-3" />
          <Input
            placeholder={isRTL ? 'ابحث بالاسم أو البريد الإلكتروني...' : 'Search by name or email...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-9 h-9 text-sm"
          />
        </div>
        <Button
          variant={showActivityLog ? 'default' : 'outline'}
          size="sm"
          className={`h-9 text-xs gap-1.5 ${showActivityLog ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-emerald-200 dark:border-emerald-800'}`}
          onClick={() => setShowActivityLog(!showActivityLog)}
        >
          <Clock className="h-3.5 w-3.5" />
          {isRTL ? 'سجل النشاط' : 'Activity Log'}
        </Button>
      </div>

      {/* Staff Table */}
      {!showActivityLog ? (
        loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">{t('noResults')}</p>
            <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No staff members yet'}</p>
          </div>
        ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{isRTL ? 'العضو' : 'Member'}</TableHead>
                    <TableHead className="text-xs">{isRTL ? 'الدور' : 'Role'}</TableHead>
                    <TableHead className="text-xs">{isRTL ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead className="text-xs">{isRTL ? 'آخر نشاط' : 'Last Active'}</TableHead>
                    <TableHead className="text-xs">{isRTL ? 'الصلاحيات' : 'Permissions'}</TableHead>
                    <TableHead className="text-xs text-end">{isRTL ? 'إجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                        <p className="text-sm text-muted-foreground">{isRTL ? 'لا توجد نتائج' : 'No results found'}</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((member) => (
                      <TableRow key={member.id} className="group">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className={`text-xs font-medium ${
                                member.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                member.role === 'manager' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                member.role === 'support' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' :
                                'bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400'
                              }`}>
                                {member.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{member.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><RoleBadge role={member.role} isRTL={isRTL} /></TableCell>
                        <TableCell><StatusBadge status={member.status} isRTL={isRTL} /></TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">{member.lastActive}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {member.permissions.slice(0, 3).map(perm => {
                              const permInfo = permissionOptions.find(p => p.id === perm);
                              if (!permInfo) return null;
                              return (
                                <Badge key={perm} variant="secondary" className="text-[10px] h-5">
                                  {isRTL ? permInfo.labelAr : permInfo.labelEn}
                                </Badge>
                              );
                            })}
                            {member.permissions.length > 3 && (
                              <Badge variant="secondary" className="text-[10px] h-5">
                                +{member.permissions.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                              <DropdownMenuItem onClick={() => openEdit(member)}>
                                <Edit3 className="h-3.5 w-3.5 me-2" /> {isRTL ? 'تعديل الدور' : 'Edit Role'}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Mail className="h-3.5 w-3.5 me-2" /> {isRTL ? 'إعادة إرسال الدعوة' : 'Resend Invite'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 dark:text-red-400"
                                onClick={() => { setDeleteTarget(member.id); setShowDeleteDialog(true); }}
                              >
                                <Trash2 className="h-3.5 w-3.5 me-2" /> {isRTL ? 'إزالة' : 'Remove'}
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
          </CardContent>
        </Card>
        )
      ) : (
        /* Activity Log */
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{isRTL ? 'سجل النشاط' : 'Activity Log'}</CardTitle>
              <Badge variant="secondary" className="text-[10px]">{activityLog.length} {isRTL ? 'إدخالات' : 'entries'}</Badge>
            </div>
            <CardDescription className="text-xs">{isRTL ? 'آخر إجراءات فريقك' : 'Recent actions by your team'}</CardDescription>
          </CardHeader>
          <CardContent className="pb-4">
            {activityLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Clock className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm font-medium">{isRTL ? 'لا توجد أنشطة' : 'No activity yet'}</p>
                <p className="text-xs">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
              </div>
            ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-1">
                {activityLog.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{entry.staffName.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{entry.staffName}</span>{' '}
                        <span className="text-muted-foreground">{isRTL ? entry.actionAr : entry.actionEn}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">{entry.target}</span>
                        <span className="text-[10px] text-muted-foreground">· {entry.timestamp}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-emerald-600" />
              {isRTL ? 'إضافة موظف جديد' : 'Add New Staff Member'}
            </DialogTitle>
            <DialogDescription>
              {isRTL ? 'أدخل البريد الإلكتروني وحدد الدور والصلاحيات' : 'Enter email and assign role & permissions'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm">{isRTL ? 'البريد الإلكتروني *' : 'Email *'}</Label>
              <Input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={isRTL ? 'email@example.com' : 'email@example.com'}
                type="email"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{isRTL ? 'الدور *' : 'Role *'}</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v as StaffRole })}
              >
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{isRTL ? 'مدير - وصول كامل' : 'Admin — Full access'}</SelectItem>
                  <SelectItem value="manager">{isRTL ? 'مشرف - إدارة معظم الأقسام' : 'Manager — Manage most sections'}</SelectItem>
                  <SelectItem value="support">{isRTL ? 'دعم - التعامل مع الطلبات' : 'Support — Handle orders'}</SelectItem>
                  <SelectItem value="viewer">{isRTL ? 'مشاهد - عرض فقط' : 'Viewer — Read only'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{isRTL ? 'الصلاحيات' : 'Permissions'}</Label>
              <div className="grid grid-cols-1 gap-2">
                {permissionOptions.map((perm) => {
                  const Icon = perm.icon;
                  const isChecked = formData.permissions.includes(perm.id);
                  return (
                    <label
                      key={perm.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <Icon className={`h-4 w-4 ${isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                      <span className="text-sm">{isRTL ? perm.labelAr : perm.labelEn}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="h-9">
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleAddStaff}
              disabled={!formData.email}
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Mail className="h-3.5 w-3.5 me-1.5" />
              {isRTL ? 'إرسال دعوة' : 'Send Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-emerald-600" />
              {isRTL ? 'تعديل الموظف' : 'Edit Staff Member'}
            </DialogTitle>
            <DialogDescription>
              {isRTL ? 'تحديث الدور والصلاحيات' : 'Update role and permissions'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm">{isRTL ? 'البريد الإلكتروني' : 'Email'}</Label>
              <Input value={formData.email} disabled className="h-10 bg-muted" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{isRTL ? 'الدور' : 'Role'}</Label>
              <Select
                value={formData.role}
                onValueChange={(v) => setFormData({ ...formData, role: v as StaffRole })}
              >
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{isRTL ? 'مدير' : 'Admin'}</SelectItem>
                  <SelectItem value="manager">{isRTL ? 'مشرف' : 'Manager'}</SelectItem>
                  <SelectItem value="support">{isRTL ? 'دعم' : 'Support'}</SelectItem>
                  <SelectItem value="viewer">{isRTL ? 'مشاهد' : 'Viewer'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">{isRTL ? 'الصلاحيات' : 'Permissions'}</Label>
              <div className="grid grid-cols-1 gap-2">
                {permissionOptions.map((perm) => {
                  const Icon = perm.icon;
                  const isChecked = formData.permissions.includes(perm.id);
                  return (
                    <label
                      key={perm.id}
                      className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                      }`}
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={() => togglePermission(perm.id)}
                      />
                      <Icon className={`h-4 w-4 ${isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                      <span className="text-sm">{isRTL ? perm.labelAr : perm.labelEn}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="h-9">
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              onClick={handleEditStaff}
              className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isRTL ? 'حفظ التغييرات' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRTL ? 'إزالة الموظف؟' : 'Remove Staff Member?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? 'سيتم إزالة هذا العضو من فريقك. يمكن إعادة دعوته لاحقاً.'
                : 'This member will be removed from your team. They can be re-invited later.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">
              {isRTL ? 'إزالة' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
