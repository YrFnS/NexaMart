'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Gift,
  Search,
  TrendingUp,
  Package,
  Minus,
  ShoppingCart,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickSuggestions = [
  { icon: Gift, key: 'deals', text: 'Find deals', textAr: 'البحث عن عروض' },
  { icon: Package, key: 'order', text: 'Track my order', textAr: 'تتبع طلبي' },
  { icon: Search, key: 'choose', text: 'Help me choose', textAr: 'ساعدني في الاختيار' },
  { icon: TrendingUp, key: 'trending', text: "What's trending?", textAr: 'ما الأكثر رواجاً؟' },
  { icon: ShoppingCart, key: 'cart', text: 'Cart suggestions', textAr: 'اقتراحات السلة' },
  { icon: HelpCircle, key: 'help', text: 'Get help', textAr: 'احصل على مساعدة' },
];

// Typing indicator dots component
function TypingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="size-1.5 rounded-full bg-emerald-500 animate-[bounce_1.4s_ease-in-out_0s_infinite]" />
      <span className="size-1.5 rounded-full bg-emerald-500 animate-[bounce_1.4s_ease-in-out_0.2s_infinite]" />
      <span className="size-1.5 rounded-full bg-emerald-500 animate-[bounce_1.4s_ease-in-out_0.4s_infinite]" />
    </div>
  );
}

export function AIChatWidget() {
  const { t, dir } = useI18n();
  const isRTL = dir() === 'rtl';

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessagesLengthRef = useRef(0);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isMinimized, scrollToBottom]);

  // Track unread messages when chat is closed
  useEffect(() => {
    if (!isOpen && messages.length > prevMessagesLengthRef.current) {
      const newMessages = messages.length - prevMessagesLengthRef.current;
      // Only count assistant messages as unread
      const latestMsgs = messages.slice(prevMessagesLengthRef.current);
      const assistantMsgs = latestMsgs.filter((m) => m.role === 'assistant').length;
      if (assistantMsgs > 0) {
        setUnreadCount((prev) => prev + assistantMsgs);
      }
    }
    if (isOpen) {
      setUnreadCount(0);
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages.length, isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Add welcome message when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: isRTL
            ? 'مرحباً! 👋 أنا مساعدك الذكي للتسوق. كيف يمكنني مساعدتك اليوم؟'
            : t('aiAssistant') + '! 👋 How can I help you today?',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length, t, isRTL]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const response = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text.trim() }),
        });

        const data = await response.json();

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: data.reply || "I'm having trouble right now. Please try again!",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: "I'm having trouble connecting. Please try again!",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, t]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickSuggestion = (suggestion: typeof quickSuggestions[number]) => {
    sendMessage(suggestion.text);
  };

  const handleToggleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleRestore = () => {
    setIsMinimized(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  return (
    <>
      {/* Floating Button */}
      {(!isOpen || isMinimized) && (
        <Button
          onClick={isMinimized ? handleRestore : handleToggleOpen}
          className={`
            fixed z-50 size-14 rounded-full shadow-xl
            bg-gradient-to-br from-emerald-500 to-teal-600
            hover:from-emerald-600 hover:to-teal-700
            shadow-emerald-500/30 hover:shadow-emerald-500/50
            transition-all duration-300 hover:scale-110
            ${isRTL ? 'bottom-24 left-4' : 'bottom-24 right-4'}
            md:${isRTL ? 'bottom-8 left-4' : 'bottom-8 right-4'}
          `}
          size="icon"
        >
          {isMinimized ? (
            <MessageCircle className="size-6 text-white" />
          ) : (
            <MessageCircle className="size-6 text-white" />
          )}
          <span className="sr-only">{t('aiAssistant')}</span>
          {/* Pulse animation */}
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20" />
          {/* Unread badge */}
          {unreadCount > 0 && (
            <Badge
              className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} min-w-[20px] h-5 px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white border-2 border-background animate-bounce`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className={`
            fixed z-50 flex flex-col
            bg-background border border-border rounded-2xl shadow-2xl
            transition-all duration-300 ease-out
            ${
              isMinimized
                ? 'scale-75 opacity-0 pointer-events-none translate-y-4'
                : 'scale-100 opacity-100 translate-y-0'
            }
            ${
              isRTL
                ? 'bottom-20 left-4 right-4 md:left-auto md:right-auto md:left-4 md:w-96'
                : 'bottom-20 right-4 left-4 md:right-4 md:left-auto md:w-96'
            }
            md:bottom-8
            max-h-[70vh] md:max-h-[500px]
          `}
          dir={dir()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-9 rounded-xl bg-white/20 backdrop-blur-sm">
                <Sparkles className="size-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">
                  {t('aiAssistant')}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-emerald-300 animate-pulse" />
                  <span className="text-xs text-emerald-100">
                    {t('online')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMinimize}
                className="text-white/80 hover:text-white hover:bg-white/10 size-7"
              >
                <Minus className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-white/80 hover:text-white hover:bg-white/10 size-7"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimized && (
            <>
              <ScrollArea className="flex-1 p-4 min-h-0" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center size-7 rounded-full shrink-0 ${
                          message.role === 'assistant'
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                            : 'bg-muted'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <Bot className="size-3.5 text-white" />
                        ) : (
                          <User className="size-3.5 text-muted-foreground" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          message.role === 'assistant'
                            ? 'bg-muted text-foreground rounded-tl-sm'
                            : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-tr-sm'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator with animated dots */}
                  {isLoading && (
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center size-7 rounded-full shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600">
                        <Bot className="size-3.5 text-white" />
                      </div>
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                        <TypingDots />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Quick Suggestion Chips */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    {isRTL ? 'اقتراحات سريعة:' : 'Quick suggestions:'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickSuggestions.map((s) => (
                      <Button
                        key={s.key}
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs gap-1 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all duration-200 hover:shadow-sm"
                        onClick={() => handleQuickSuggestion(s)}
                        disabled={isLoading}
                      >
                        <s.icon className="size-3" />
                        {isRTL ? s.textAr : s.text}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-3 border-t">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('typeMessage')}
                    disabled={isLoading}
                    className="flex-1 h-9 text-sm bg-muted/50 border-transparent focus-visible:border-emerald-500/50"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="size-9 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shrink-0 transition-all duration-200 hover:shadow-md hover:shadow-emerald-500/20"
                  >
                    <Send className="size-4" />
                  </Button>
                </form>
                <div className="flex items-center justify-center mt-1.5">
                  <Badge
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 gap-1"
                  >
                    <Sparkles className="size-2.5" />
                    AI Powered
                  </Badge>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
