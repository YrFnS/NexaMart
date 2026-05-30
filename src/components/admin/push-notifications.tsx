'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useI18n } from '@/lib/i18n';
import { adminFetch } from '@/lib/admin-api';

interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  target: string;
  type: string;
  sentAt: string;
  sentBy: string;
}

interface NotifForm {
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
  target: string;
  type: string;
}

export function PushNotifications() {
  const { t, locale, dir } = useI18n();
  const isRTL = dir() === 'rtl';
  const [form, setForm] = useState<NotifForm>({
    titleEn: '',
    titleAr: '',
    messageEn: '',
    messageAr: '',
    target: 'all',
    type: 'system',
  });
  const [recent, setRecent] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await adminFetch('/api/admin/push');
        if (res.ok) {
          const json = await res.json();
          if (json.notifications && Array.isArray(json.notifications)) {
            setRecent(json.notifications);
          }
        }
      } catch {
        // keep empty
      }
      setLoading(false);
    };
    fetchRecent();
  }, []);

  const updateForm = (field: keyof NotifForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await adminFetch('/api/admin/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleEn: form.titleEn,
          titleAr: form.titleAr,
          messageEn: form.messageEn,
          messageAr: form.messageAr,
          target: form.target,
          type: form.type,
        }),
      });
      if (res.ok) {
        const newNotif: NotificationRecord = {
          id: String(Date.now()),
          title: form.titleEn,
          message: form.messageEn,
          target: form.target === 'all' ? 'All Users' : form.target === 'buyers' ? 'Buyers Only' : form.target === 'sellers' ? 'Sellers Only' : 'Specific User',
          type: form.type === 'promotion' ? 'Promotion' : form.type === 'system' ? 'System' : 'Order',
          sentAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          sentBy: 'Admin',
        };
        setRecent(prev => [newNotif, ...prev]);
        setForm({ titleEn: '', titleAr: '', messageEn: '', messageAr: '', target: 'all', type: 'system' });
      }
    } catch {
      // error
    }
    setSending(false);
    setConfirmDialog(false);
  };

  const targetLabel = (target: string) => {
    const map: Record<string, string> = {
      'All Users': t('adminAllUsers'),
      'Buyers Only': t('adminBuyersOnly'),
      'Sellers Only': t('adminSellersOnly'),
    };
    return map[target] || target;
  };

  const typeBadge = (type: string) => {
    const map: Record<string, string> = {
      Promotion: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
      System: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      Order: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    };
    return map[type] || '';
  };

  const hasContent = form.titleEn.trim() || form.messageEn.trim();

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
        <h2 className="text-lg font-semibold">{t('pushNotifications')}</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t('adminSendNotification')}</CardTitle>
              <CardDescription className="text-xs">Compose a push notification with bilingual content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title EN */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminNotifTitle')} (English)</Label>
                <Input
                  placeholder="Enter title in English..."
                  value={form.titleEn}
                  onChange={(e) => updateForm('titleEn', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              {/* Title AR */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminNotifTitle')} (Arabic)</Label>
                <Input
                  placeholder="أدخل العنوان بالعربية..."
                  value={form.titleAr}
                  onChange={(e) => updateForm('titleAr', e.target.value)}
                  className="h-9 text-sm"
                  dir="rtl"
                />
              </div>

              {/* Message EN */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminNotifMessage')} (English)</Label>
                <Textarea
                  placeholder="Enter message in English..."
                  value={form.messageEn}
                  onChange={(e) => updateForm('messageEn', e.target.value)}
                  className="min-h-[80px] text-sm"
                />
              </div>

              {/* Message AR */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('adminNotifMessage')} (Arabic)</Label>
                <Textarea
                  placeholder="أدخل الرسالة بالعربية..."
                  value={form.messageAr}
                  onChange={(e) => updateForm('messageAr', e.target.value)}
                  className="min-h-[80px] text-sm"
                  dir="rtl"
                />
              </div>

              {/* Target & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('adminTargetAudience')}</Label>
                  <Select value={form.target} onValueChange={(v) => updateForm('target', v)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('adminAllUsers')}</SelectItem>
                      <SelectItem value="buyers">{t('adminBuyersOnly')}</SelectItem>
                      <SelectItem value="sellers">{t('adminSellersOnly')}</SelectItem>
                      <SelectItem value="specific">{t('adminSpecificUser')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('adminNotifType')}</Label>
                  <Select value={form.type} onValueChange={(v) => updateForm('type', v)}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promotion">{t('adminPromotion')}</SelectItem>
                      <SelectItem value="system">{t('adminSystem')}</SelectItem>
                      <SelectItem value="order">{t('orders')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.target === 'specific' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">User ID or Email</Label>
                  <Input
                    placeholder="Enter user ID or email..."
                    className="h-9 text-sm"
                  />
                </div>
              )}

              {/* Send Button */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setConfirmDialog(true)}
                  disabled={!hasContent || sending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9"
                >
                  <Send className="h-3.5 w-3.5 me-1.5" />
                  {t('adminSendNotification')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{t('adminPreview')}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Phone Preview */}
              <div className="mx-auto max-w-[260px]">
                <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-lg">
                  {/* Phone notch */}
                  <div className="h-6 bg-muted/50 flex items-center justify-center">
                    <div className="h-2 w-12 rounded-full bg-muted" />
                  </div>
                  {/* Notification card */}
                  <div className="p-3 bg-card">
                    <div className="rounded-xl bg-muted/50 p-3 shadow-sm">
                      <div className="flex items-start gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                          <Bell className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {form.titleEn || 'Notification Title'}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                            {form.messageEn || 'Notification message will appear here...'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className="text-[9px] px-1 py-0 border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                          {form.type === 'promotion' ? t('adminPromotion') : form.type === 'system' ? t('adminSystem') : t('orders')}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground">Just now</span>
                      </div>
                    </div>
                  </div>
                  {/* Phone bottom bar */}
                  <div className="h-4 bg-muted/50" />
                </div>
              </div>

              {/* Desktop Preview */}
              <div className="mt-4">
                <p className="text-[11px] text-muted-foreground text-center mb-2">Desktop Preview</p>
                <div className="rounded-lg border border-border bg-card p-2.5 shadow-sm max-w-[260px] mx-auto">
                  <div className="flex items-start gap-2">
                    <div className="h-6 w-6 rounded bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                      <Bell className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold truncate">{form.titleEn || 'Notification Title'}</p>
                      <p className="text-[10px] text-muted-foreground line-clamp-2">{form.messageEn || 'Notification message...'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Notifications */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('adminRecentNotifications')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <div className="h-12 w-12 mb-4 rounded-full bg-muted animate-pulse" />
              <p className="text-sm">{t('loading')}</p>
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">{t('noResults')}</p>
              <p className="text-sm">{isRTL ? 'لا توجد بيانات' : 'No data available'}</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t('adminNotifTitle')}</TableHead>
                  <TableHead className="text-xs">{t('adminNotifMessage')}</TableHead>
                  <TableHead className="text-xs">{t('adminTargetAudience')}</TableHead>
                  <TableHead className="text-xs">{t('adminNotifType')}</TableHead>
                  <TableHead className="text-xs">Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((notif) => (
                  <TableRow key={notif.id}>
                    <TableCell className="text-xs font-medium">{notif.title}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{notif.message}</TableCell>
                    <TableCell className="text-xs">{targetLabel(notif.target)}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] px-1.5 py-0 border-0 ${typeBadge(notif.type)}`}>
                        {notif.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{notif.sentAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Send Confirmation Dialog */}
      <Dialog open={confirmDialog} onOpenChange={setConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Notification</DialogTitle>
            <DialogDescription>
              Send this notification to <strong>{
                form.target === 'all' ? t('adminAllUsers') :
                form.target === 'buyers' ? t('adminBuyersOnly') :
                form.target === 'sellers' ? t('adminSellersOnly') :
                t('adminSpecificUser')
              }</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">{form.titleEn}</p>
            <p className="text-xs text-muted-foreground mt-1">{form.messageEn}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(false)}>{t('cancel')}</Button>
            <Button
              onClick={handleSend}
              disabled={sending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {sending ? 'Sending...' : <><Send className="h-4 w-4 me-1.5" />Send</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
