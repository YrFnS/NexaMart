'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/lib/i18n';
import { ChatMessage } from './ChatMessage';

interface ChatMessageData {
  id: string;
  conversationId: string;
  sender: 'buyer' | 'seller';
  text: string;
  time: string;
  read: boolean;
  status: 'sent' | 'delivered' | 'read';
  translated?: string;
}

interface ChatWindowProps {
  conversationId: string;
  conversationName: string;
  conversationNameAr: string;
  messages: ChatMessageData[];
  isConnected: boolean;
  typingText: string;
  autoTranslate: boolean;
  onBack: () => void;
  onSendMessage: (text: string) => void;
  onTypingChange: (text: string) => void;
  onAutoTranslateChange: (value: boolean) => void;
  onTranslate: (msg: ChatMessageData) => void;
}

export function ChatWindow({
  conversationId,
  conversationName,
  conversationNameAr,
  messages,
  isConnected,
  typingText,
  autoTranslate,
  onBack,
  onSendMessage,
  onTypingChange,
  onAutoTranslateChange,
  onTranslate,
}: ChatWindowProps) {
  const { t, locale } = useI18n();
  const isRTL = locale === 'ar';
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!messageInput.trim() || !isConnected) return;
    onSendMessage(messageInput);
    setMessageInput('');
    onTypingChange('');
  }, [messageInput, isConnected, onSendMessage, onTypingChange]);

  const handleInputChange = useCallback((value: string) => {
    setMessageInput(value);
    onTypingChange(value);
  }, [onTypingChange]);

  const displayName = isRTL ? conversationNameAr : conversationName;

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden size-8" onClick={onBack}>
            <ArrowLeft className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
          <Avatar className="size-9">
            <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 text-xs font-semibold">
              {displayName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{displayName}</p>
            <p className="text-[10px] flex items-center gap-1">
              {isConnected ? (
                <Wifi className="size-3 text-emerald-500" />
              ) : (
                <WifiOff className="size-3 text-red-400" />
              )}
              <span className={isConnected ? 'text-emerald-600' : 'text-muted-foreground'}>
                {isConnected ? (isRTL ? 'متصل' : 'Online') : (isRTL ? 'غير متصل' : 'Offline')}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>🌐</span>
            <span className="hidden sm:inline">{isRTL ? 'ترجمة' : 'Translate'}</span>
          </div>
          <Switch checked={autoTranslate} onCheckedChange={onAutoTranslateChange} className="scale-75" />
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {!isConnected && (
            <div className="flex items-center justify-center gap-2 py-2 px-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-xs text-amber-600 dark:text-amber-400">
              <WifiOff className="size-3.5" />
              {isRTL ? 'غير متصل - محاولة إعادة الاتصال...' : 'Disconnected - Reconnecting...'}
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              text={msg.text}
              time={msg.time}
              isOwn={msg.sender === 'buyer'}
              status={msg.status}
              read={msg.read}
              translated={msg.translated}
              showTranslate={autoTranslate}
              onTranslate={() => onTranslate(msg)}
            />
          ))}
          {typingText && (
            <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
              <div className="bg-muted rounded-2xl px-4 py-2.5 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="size-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-muted-foreground">{typingText}</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <Input
            placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
            value={messageInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            className="flex-1"
          />
          <Button
            size="icon"
            className="size-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
            onClick={handleSend}
            disabled={!messageInput.trim() || !isConnected}
          >
            <Send className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
