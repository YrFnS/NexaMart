'use client';

import { Check, CheckCheck, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface ChatMessageProps {
  text: string;
  time: string;
  isOwn: boolean;
  status?: 'sent' | 'delivered' | 'read';
  read?: boolean;
  translated?: string;
  onTranslate?: () => void;
  showTranslate?: boolean;
}

export function ChatMessage({
  text,
  time,
  isOwn,
  status,
  read,
  translated,
  onTranslate,
  showTranslate,
}: ChatMessageProps) {
  const { locale, dir } = useI18n();
  const isRTL = locale === 'ar';

  return (
    <div className={`flex ${isOwn ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}>
      <div className="max-w-[75%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm ${
            isOwn
              ? 'bg-emerald-600 text-white rounded-ee-sm'
              : 'bg-muted rounded-es-sm'
          }`}
        >
          <p>{text}</p>
          {translated && (
            <p className={`mt-1 pt-1 border-t text-xs ${
              isOwn ? 'border-emerald-500 text-emerald-100' : 'border-border text-muted-foreground'
            }`}>
              🌐 {translated}
            </p>
          )}
        </div>
        <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}>
          <span className="text-[10px] text-muted-foreground">{time}</span>
          {isOwn && (
            read || status === 'read' ? (
              <CheckCheck className="size-3 text-emerald-500" />
            ) : status === 'delivered' ? (
              <CheckCheck className="size-3 text-muted-foreground" />
            ) : (
              <Check className="size-3 text-muted-foreground" />
            )
          )}
        </div>
        {!isOwn && showTranslate && !translated && onTranslate && (
          <Button
            variant="link"
            size="sm"
            className="text-[10px] text-emerald-600 h-auto p-0 mt-0.5"
            onClick={onTranslate}
          >
            <Languages className="size-3 me-0.5" />
            {isRTL ? 'ترجم' : 'Translate'}
          </Button>
        )}
      </div>
    </div>
  );
}
