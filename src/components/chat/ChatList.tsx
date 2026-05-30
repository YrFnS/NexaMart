'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

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

interface ChatListProps {
  conversations: Conversation[];
  selectedId: string | null;
  searchQuery: string;
  onlineStatus: Record<string, boolean>;
  isLoading: boolean;
  onSelect: (id: string) => void;
  onSearch: (query: string) => void;
}

export function ChatList({
  conversations,
  selectedId,
  searchQuery,
  onlineStatus,
  isLoading,
  onSelect,
  onSearch,
}: ChatListProps) {
  const { locale } = useI18n();
  const isRTL = locale === 'ar';

  const filtered = conversations.filter(
    (c) =>
      c.storeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.storeNameAr.includes(searchQuery)
  );

  return (
    <div className="flex flex-col w-full md:w-80 lg:w-96 border-e border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            💬 {isRTL ? 'المحادثات' : 'Chats'}
            <Badge variant="secondary" className="text-[10px]">{conversations.length}</Badge>
          </h2>
        </div>
        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 size-4 text-muted-foreground ${isRTL ? 'right-3' : 'left-3'}`} />
          <Input
            placeholder={isRTL ? 'بحث في المحادثات...' : 'Search conversations...'}
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className={isRTL ? 'pr-9' : 'pl-9'}
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
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
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-3xl mb-3">💬</p>
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'لا توجد محادثات بعد' : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((conv) => {
              const isOnline = onlineStatus[conv.sellerId] ?? conv.online;
              return (
                <div
                  key={conv.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedId === conv.id ? 'bg-emerald-50 dark:bg-emerald-950/30' : ''
                  }`}
                  onClick={() => onSelect(conv.id)}
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
  );
}
