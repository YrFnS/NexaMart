'use client';

import React, { useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';

const reportReasons = [
  { id: 'scam-fraud', key: 'scamFraud' },
  { id: 'inappropriate', key: 'inappropriateContent' },
  { id: 'wrong-category', key: 'wrongCategory' },
  { id: 'duplicate', key: 'duplicateListing' },
  { id: 'counterfeit', key: 'counterfeitItem' },
  { id: 'spam', key: 'spam' },
  { id: 'other', key: 'other' },
];

interface ReportListingDialogProps {
  listingId?: string;
  listingTitle?: string;
  trigger?: React.ReactNode;
}

export function ReportListingDialog({ listingTitle, trigger }: ReportListingDialogProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';

  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!reason) return;
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      setReason('');
      setDescription('');
      setAnonymous(true);
    }, 2500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700">
            <Shield className="size-4" />
            {t('reportListing')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={`sm:max-w-md ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-red-500" />
            {t('reportListing')}
          </DialogTitle>
          {listingTitle && (
            <p className="text-sm text-muted-foreground truncate">
              {isRTL ? 'الإعلان: ' : 'Listing: '}{listingTitle}
            </p>
          )}
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-3">
              <Shield className="size-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="font-semibold text-emerald-700 dark:text-emerald-300">{t('reportSubmitted')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Reason */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {t('reportReason')} <span className="text-red-500">*</span>
              </label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="input-emerald">
                  <SelectValue placeholder={isRTL ? 'اختر السبب' : 'Select a reason'} />
                </SelectTrigger>
                <SelectContent>
                  {reportReasons.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {t(r.key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                {t('reportDescription')}
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isRTL ? 'أضف تفاصيل إضافية...' : 'Add any additional details...'}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Anonymous */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="anonymous"
                checked={anonymous}
                onCheckedChange={(checked) => setAnonymous(checked === true)}
              />
              <label htmlFor="anonymous" className="text-sm text-muted-foreground cursor-pointer">
                {t('reportAnonymously')}
              </label>
            </div>

            {/* Submit */}
            <Button
              onClick={handleSubmit}
              disabled={!reason}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              <Shield className="size-4 me-2" />
              {t('submitReport')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
