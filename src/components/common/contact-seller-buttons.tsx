'use client';

import React, { useState } from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { BRAND_COLORS } from '@/lib/theme';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { DEFAULT_SELLER_PHONE, SOCIAL_SHARE, APP_NAME } from '@/lib/config';

interface ContactSellerButtonsProps {
  phone?: string;
  storeName?: string;
  productId?: string;
}

export function ContactSellerButtons({
  phone = DEFAULT_SELLER_PHONE,
  storeName,
  productId,
}: ContactSellerButtonsProps) {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const isRTL = locale === 'ar';
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleWhatsApp = () => {
    const message = isRTL
      ? `مرحباً، أنا مهتم بمنتجكم على ${APP_NAME}`
      : `Hi, I'm interested in your product on ${APP_NAME}`;
    window.open(SOCIAL_SHARE.whatsappDirect(phone, message), '_blank');
  };

  const handleChat = () => {
    if (productId) {
      nav.selectProduct(productId);
    }
    nav.setView('chat');
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Call Button */}
        <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white gap-2 h-11">
              <Phone className="size-4" />
              {t('callSeller')}
            </Button>
          </DialogTrigger>
          <DialogContent className={`sm:max-w-sm ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Phone className="size-5 text-green-600" />
                {t('callSeller')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {storeName && (
                <p className="text-sm text-muted-foreground">
                  {isRTL ? 'بائع: ' : 'Seller: '}{storeName}
                </p>
              )}
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 rounded-xl border border-green-200 dark:border-green-800">
                <Phone className="size-5 text-green-600 shrink-0" />
                <span className="text-lg font-bold text-green-700 dark:text-green-300 tracking-wide" dir="ltr">
                  {phone}
                </span>
              </div>
              <Button
                onClick={handleCopyNumber}
                variant="outline"
                className="w-full gap-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-950"
              >
                {copied ? (
                  <>{isRTL ? 'تم النسخ!' : t('numberCopied')}</>
                ) : (
                  <>
                    <Phone className="size-4" />
                    {t('copyNumber')}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* WhatsApp Button */}
        <Button
          onClick={handleWhatsApp}
          style={{ backgroundColor: BRAND_COLORS.whatsapp }}
          className="hover:opacity-90 text-white gap-2 h-11"
        >
          <svg viewBox="0 0 24 24" className="size-4 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          {t('whatsappSeller')}
        </Button>

        {/* Chat Button */}
        <Button
          onClick={handleChat}
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11"
        >
          <MessageCircle className="size-4" />
          {t('chatWithSeller')}
        </Button>
      </div>
    </div>
  );
}
