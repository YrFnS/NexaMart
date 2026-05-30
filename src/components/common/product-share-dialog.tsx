'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  Share2,
  MessageCircle,
  ExternalLink,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { APP_URL, SOCIAL_SHARE } from '@/lib/config';

interface ProductShareDialogProps {
  productName: string;
  productUrl?: string;
  children?: React.ReactNode;
}

export function ProductShareDialog({
  productName,
  productUrl = `${APP_URL}/product/example`,
  children,
}: ProductShareDialogProps) {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'hover:bg-green-50 dark:hover:bg-green-950 hover:border-green-300 dark:hover:border-green-700',
      url: SOCIAL_SHARE.whatsapp(`${productName} - ${productUrl}`),
    },
    {
      name: 'Twitter / X',
      icon: Share2,
      color: 'hover:bg-sky-50 dark:hover:bg-sky-950 hover:border-sky-300 dark:hover:border-sky-700',
      url: SOCIAL_SHARE.twitter(productName, productUrl),
    },
    {
      name: 'Facebook',
      icon: ExternalLink,
      color: 'hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300 dark:hover:border-blue-700',
      url: SOCIAL_SHARE.facebook(productUrl),
    },
    {
      name: isRTL ? 'البريد الإلكتروني' : 'Email',
      icon: Mail,
      color: 'hover:bg-amber-50 dark:hover:bg-amber-950 hover:border-amber-300 dark:hover:border-amber-700',
      url: SOCIAL_SHARE.email(productName, productUrl),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Share2 className="size-4" />
            {isRTL ? 'مشاركة' : 'Share'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogTitle>
          {isRTL ? `مشاركة "${productName}"` : `Share "${productName}"`}
        </DialogTitle>
        <div className="space-y-5 mt-3">
          {/* Copy Link */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {isRTL ? 'رابط المنتج' : 'Product Link'}
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm truncate">
                {productUrl}
              </div>
              <Button
                variant={copied ? 'default' : 'outline'}
                size="sm"
                className={`shrink-0 gap-1.5 ${copied ? 'bg-emerald-600 text-white' : ''}`}
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <Check className="size-3.5" />
                    {isRTL ? 'تم النسخ!' : 'Copied!'}
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    {isRTL ? 'نسخ' : 'Copy'}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              {isRTL ? 'مشاركة عبر' : 'Share via'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {shareLinks.map((link) => (
                <Button
                  key={link.name}
                  variant="outline"
                  className={`h-14 flex-col gap-1 text-xs ${link.color} transition-colors`}
                  onClick={() => {
                    window.open(link.url, '_blank', 'noopener,noreferrer');
                    setOpen(false);
                  }}
                >
                  <link.icon className="size-5" />
                  {link.name}
                </Button>
              ))}
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <div className="w-28 h-28 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <div className="w-20 h-20 rounded-lg bg-white/90 dark:bg-white/80 flex items-center justify-center">
                <div className="grid grid-cols-4 gap-[2px]">
                  {Array.from({ length: 16 }, (_, i) => (
                    <div
                      key={i}
                      className={`size-2 rounded-[1px] ${
                        (i + Math.floor(i / 4)) % 3 === 0
                          ? 'bg-emerald-700'
                          : 'bg-emerald-200'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {isRTL ? 'امسح رمز QR للمشاركة' : 'Scan QR code to share'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
