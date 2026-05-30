'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SHIPPING_CONFIG } from '@/lib/config';
import {
  MessageCircle, Send, Image as ImageIcon, Languages, Search,
  ArrowLeft, Phone, MoreVertical, Check, CheckCheck, Wifi, WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useI18n } from '@/lib/i18n';
import { useAppStore } from '@/stores/app-store';
import { useAppNavigation } from '@/lib/use-app-navigation';
import { useUserStore } from '@/stores/user-store';

interface Conversation {
  id: string;
  storeName: string;
  storeNameAr: string;
  storeAvatar: string;
  lastMessage: string;
  lastMessageAr: string;
  time: string;
  unread: number;
  online: boolean;
  sellerId: string;
}

interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'buyer' | 'seller';
  text: string;
  textAr?: string;
  time: string;
  read: boolean;
  status: 'sent' | 'delivered' | 'read';
  translated?: string;
}


export function ChatPage() {
  const { t, locale } = useI18n();
  const nav = useAppNavigation();
  const { user } = useUserStore();
  const isRTL = locale === 'ar';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch conversations from API
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoadingConversations(true);
      try {
        const res = await fetch('/api/stores?limit=10');
        if (res.ok) {
          const data = await res.json();
          const storeList = data.stores || data || [];
          setConversations(storeList.map((s: Record<string, unknown>, i: number) => ({
            id: (s.id as string) || `c-${i}`,
            storeName: (s.name as string) || 'Store',
            storeNameAr: (s.nameAr as string) || (s.name as string) || 'متجر',
            storeAvatar: (s.logo as string) || '',
            lastMessage: '',
            lastMessageAr: '',
            time: '',
            unread: 0,
            online: false,
            sellerId: (s.ownerId as string) || `seller-${i}`,
          })));
        }
      } catch {
        // API error — leave conversations empty
      } finally {
        setIsLoadingConversations(false);
      }
    };
    fetchConversations();
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const socketInstance = io(`/?XTransformPort=${SHIPPING_CONFIG.chatServicePort}`, {
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      setIsConnected(true);
      // Authenticate with the server
      socketInstance.emit('user:join', {
        userId: user?.id || '',
        username: user?.name || 'You',
        role: 'buyer',
      });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Receive new message
    socketInstance.on('message:new', (msg: ChatMessage) => {
      setMessages((prev) => ({
        ...prev,
        [msg.conversationId]: [...(prev[msg.conversationId] || []), msg],
      }));
    });

    // Receive message sent acknowledgment
    socketInstance.on('message:sent', (data: { messageId: string; conversationId: string }) => {
      setMessages((prev) => {
        const convMsgs = prev[data.conversationId] || [];
        return {
          ...prev,
          [data.conversationId]: convMsgs.map((m) =>
            m.id === data.messageId ? { ...m, status: 'delivered' as const } : m
          ),
        };
      });
    });

    // Receive room history
    socketInstance.on('room:history', (data: { conversationId: string; messages: Array<Omit<ChatMessage, 'sender'> & { sender: string }> }) => {
      setMessages((prev) => ({
        ...prev,
        [data.conversationId]: data.messages.map((m) => ({
          ...m,
          sender: (m.sender === (user?.id || '') || m.sender === 'buyer' || m.sender === 'buyer-1' ? 'buyer' : 'seller') as 'buyer' | 'seller',
        })),
      }));
    });

    // Typing indicator
    socketInstance.on('typing:start', (data: { userId: string; username: string; conversationId: string }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.conversationId]: [...(prev[data.conversationId] || []).filter(u => u !== data.username), data.username],
      }));
    });

    socketInstance.on('typing:stop', (data: { userId: string; conversationId: string }) => {
      setTypingUsers((prev) => {
        const users = prev[data.conversationId] || [];
        return {
          ...prev,
          [data.conversationId]: users.slice(0, -1),
        };
      });
    });

    // Online status updates
    socketInstance.on('user:online', (data: { userId: string; username: string }) => {
      setOnlineStatus((prev) => ({ ...prev, [data.userId]: true }));
    });

    socketInstance.on('user:offline', (data: { userId: string; username: string }) => {
      setOnlineStatus((prev) => ({ ...prev, [data.userId]: false }));
    });

    // Read receipts
    socketInstance.on('messages:read', (data: { conversationId: string; readBy: string }) => {
      setMessages((prev) => {
        const convMsgs = prev[data.conversationId] || [];
        return {
          ...prev,
          [data.conversationId]: convMsgs.map((m) =>
            m.sender === 'buyer' ? { ...m, read: true, status: 'read' as const } : m
          ),
        };
      });
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Join room when selecting a conversation
  useEffect(() => {
    const socket = socketRef.current;
    if (socket && selectedConv && isConnected) {
      socket.emit('room:join', { conversationId: selectedConv });
      return () => {
        socket.emit('room:leave', { conversationId: selectedConv });
      };
    }
  }, [selectedConv, isConnected]);

  const filteredConversations = conversations.filter(
    (c) => c.storeName.toLowerCase().includes(searchQuery.toLowerCase()) || c.storeNameAr.includes(searchQuery)
  );

  const currentMessages = selectedConv ? (messages[selectedConv] || []) : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  const handleSendMessage = useCallback(() => {
    const socket = socketRef.current;
    if (!messageInput.trim() || !selectedConv || !socket) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: selectedConv,
      sender: 'buyer',
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      status: 'sent',
    };

    // Optimistically add message
    setMessages((prev) => ({
      ...prev,
      [selectedConv]: [...(prev[selectedConv] || []), newMsg],
    }));

    // Send via WebSocket
    socket.emit('message:send', {
      conversationId: selectedConv,
      text: messageInput,
      sender: user?.id || '',
      senderName: user?.name || 'You',
    });

    setMessageInput('');

    // Stop typing
    socket.emit('typing:stop', {
      conversationId: selectedConv,
      userId: 'buyer-1',
    });
  }, [messageInput, selectedConv]);

  const handleInputChange = useCallback((value: string) => {
    const socket = socketRef.current;
    setMessageInput(value);

    // Emit typing indicator
    if (socket && selectedConv && value.trim()) {
      socket.emit('typing:start', {
        conversationId: selectedConv,
        userId: user?.id || '',
        username: user?.name || 'You',
      });

      // Auto-stop typing after 3 seconds of inactivity
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', {
          conversationId: selectedConv,
          userId: user?.id || '',
        });
      }, 3000);
    }
  }, [selectedConv]);

  const handleTranslate = useCallback(async (msg: ChatMessage) => {
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg.text, targetLang: isRTL ? 'ar' : 'en' }),
      });
      const data = await res.json();
      if (data.translated) {
        setMessages((prev) => ({
          ...prev,
          [msg.conversationId]: (prev[msg.conversationId] || []).map((m) =>
            m.id === msg.id ? { ...m, translated: data.translated } : m
          ),
        }));
      }
    } catch {
      // fallback: show original
    }
  }, [isRTL]);

  // Get typing indicator text for current conversation
  const typingUsersList = selectedConv ? (typingUsers[selectedConv] || []) : [];
  const typingText = typingUsersList.length > 0
    ? typingUsersList.length === 1
      ? `${typingUsersList[0]} ${isRTL ? 'يكتب...' : 'is typing...'}`
      : `${typingUsersList.length} ${isRTL ? 'أشخاص يكتبون...' : 'people typing...'}`
    : '';

  // Mobile: show conversation list or chat window
  const showChatOnMobile = !!selectedConv;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <Card className="border-0 shadow-md overflow-hidden" style={{ height: 'calc(100vh - 120px)' }}>
          <div className="flex h-full">
            {/* Conversation List */}
            <div className={`${showChatOnMobile ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-e border-border`}>
              {/* List Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MessageCircle className="size-5 text-emerald-600" />
                    {t('chat')}
                    {/* Connection status indicator */}
                    {isConnected ? (
                      <Wifi className="size-3.5 text-emerald-500" />
                    ) : (
                      <WifiOff className="size-3.5 text-red-400" />
                    )}
                  </h2>
                  <Badge variant="secondary" className="text-[10px]">{conversations.length}</Badge>
                </div>
                <div className="relative">
                  <Search className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
                  <Input
                    placeholder={isRTL ? 'بحث في المحادثات...' : 'Search conversations...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={isRTL ? 'pr-9' : 'pl-9'}
                  />
                </div>
              </div>

              {/* Conversation Items */}
              <ScrollArea className="flex-1">
                {isLoadingConversations ? (
                  <div className="p-4 space-y-3">
                    {Array.from({ length: 4 }, (_, i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="size-11 rounded-full bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-24 bg-muted rounded" />
                          <div className="h-2 w-32 bg-muted rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="size-10 mx-auto text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? 'لا توجد محادثات بعد' : 'No conversations yet'}
                    </p>
                  </div>
                ) : (
                <div className="divide-y divide-border">
                  {filteredConversations.map((conv) => {
                    // Merge online status with real-time status
                    const isOnline = onlineStatus[conv.sellerId] ?? conv.online;
                    return (
                      <div
                        key={conv.id}
                        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedConv === conv.id ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''
                        }`}
                        onClick={() => setSelectedConv(conv.id)}
                      >
                        <div className="relative">
                          <Avatar className="size-11">
                            <AvatarImage src={conv.storeAvatar} />
                            <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 text-sm font-semibold">
                              {(isRTL ? conv.storeNameAr : conv.storeName).charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute bottom-0 ${isRTL ? 'left-0' : 'right-0'} size-3 rounded-full border-2 border-background ${
                            isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate">
                              {isRTL ? conv.storeNameAr : conv.storeName}
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0">{conv.time}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {isRTL ? conv.lastMessageAr : conv.lastMessage}
                            </p>
                            {conv.unread > 0 && (
                              <Badge className="bg-emerald-500 text-white text-[10px] size-5 flex items-center justify-center p-0">
                                {conv.unread}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                )}
              </ScrollArea>
            </div>

            {/* Chat Window */}
            <div className={`${showChatOnMobile ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
              {selectedConv ? (
                <>
                  {/* Chat Header */}
                  <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden size-8"
                        onClick={() => setSelectedConv(null)}
                      >
                        <ArrowLeft className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
                      </Button>
                      <Avatar className="size-9">
                        <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-600 text-xs font-semibold">
                          {(isRTL
                            ? conversations.find((c) => c.id === selectedConv)?.storeNameAr
                            : conversations.find((c) => c.id === selectedConv)?.storeName
                          )?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {isRTL
                            ? conversations.find((c) => c.id === selectedConv)?.storeNameAr
                            : conversations.find((c) => c.id === selectedConv)?.storeName}
                        </p>
                        <p className="text-[10px] flex items-center gap-1">
                          {(() => {
                            const conv = conversations.find((c) => c.id === selectedConv);
                            const isOnline = conv ? (onlineStatus[conv.sellerId] ?? conv.online) : false;
                            return (
                              <>
                                <span className={`size-1.5 rounded-full ${
                                  isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                                }`} />
                                <span className={isOnline ? 'text-emerald-600' : 'text-muted-foreground'}>
                                  {isOnline ? t('online') : t('offline')}
                                </span>
                              </>
                            );
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Languages className="size-3.5" />
                        <span className="hidden sm:inline">{isRTL ? 'ترجمة' : 'Translate'}</span>
                      </div>
                      <Switch checked={autoTranslate} onCheckedChange={setAutoTranslate} className="scale-75" />
                      <Button variant="ghost" size="icon" className="size-8 hidden sm:flex"><Phone className="size-4" /></Button>
                      <Button variant="ghost" size="icon" className="size-8 hidden sm:flex"><MoreVertical className="size-4" /></Button>
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
                      {currentMessages.map((msg) => {
                        const isBuyer = msg.sender === 'buyer';
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isBuyer ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}
                          >
                            <div className={`max-w-[75%] ${isBuyer ? 'order-1' : 'order-1'}`}>
                              <div
                                className={`rounded-2xl px-4 py-2.5 text-sm ${
                                  isBuyer
                                    ? 'bg-emerald-600 text-white rounded-ee-sm'
                                    : 'bg-muted rounded-es-sm'
                                }`}
                              >
                                <p>{msg.text}</p>
                                {msg.translated && (
                                  <p className={`mt-1 pt-1 border-t text-xs ${
                                    isBuyer ? 'border-emerald-500 text-emerald-100' : 'border-border text-muted-foreground'
                                  }`}>
                                    🌐 {msg.translated}
                                  </p>
                                )}
                              </div>
                              <div className={`flex items-center gap-1 mt-0.5 ${isBuyer ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}>
                                <span className="text-[10px] text-muted-foreground">{msg.time}</span>
                                {isBuyer && (
                                  msg.status === 'read' ? <CheckCheck className="size-3 text-emerald-500" /> :
                                  msg.status === 'delivered' ? <CheckCheck className="size-3 text-muted-foreground" /> :
                                  <Check className="size-3 text-muted-foreground" />
                                )}
                              </div>
                              {!isBuyer && autoTranslate && !msg.translated && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-[10px] text-emerald-600 h-auto p-0 mt-0.5"
                                  onClick={() => handleTranslate(msg)}
                                >
                                  <Languages className="size-3 me-0.5" />
                                  {isRTL ? 'ترجم' : 'Translate'}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {/* Typing indicator */}
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

                  {/* Message Input */}
                  <div className="p-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="size-9 shrink-0">
                        <ImageIcon className="size-4 text-muted-foreground" />
                      </Button>
                      <Input
                        placeholder={t('typeMessage')}
                        value={messageInput}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        className="size-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || !isConnected}
                      >
                        <Send className={`size-4 ${isRTL ? 'rotate-180' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                /* Empty State */
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <MessageCircle className="size-16 mx-auto text-muted-foreground/20" />
                    <p className="text-lg font-medium text-muted-foreground">{t('selectConversation')}</p>
                    <p className="text-sm text-muted-foreground/60">
                      {isRTL ? 'اختر محادثة من القائمة للبدء' : 'Choose a conversation from the list to start chatting'}
                    </p>
                    {/* Connection status */}
                    <div className="flex items-center justify-center gap-2 text-xs">
                      {isConnected ? (
                        <>
                          <Wifi className="size-3.5 text-emerald-500" />
                          <span className="text-emerald-600">{isRTL ? 'متصل بالخادم' : 'Connected to server'}</span>
                        </>
                      ) : (
                        <>
                          <WifiOff className="size-3.5 text-red-400" />
                          <span className="text-red-500">{isRTL ? 'غير متصل' : 'Disconnected'}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
