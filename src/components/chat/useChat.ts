'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  conversationId: string;
  sender: string;
  senderName: string;
  text: string;
  time: string;
  read: boolean;
  status: 'sent' | 'delivered' | 'read';
  translated?: string;
}

interface UseChatOptions {
  userId: string;
  username: string;
  role: 'buyer' | 'seller';
  avatar?: string;
}

export function useChat({ userId, username, role, avatar }: UseChatOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = io({
      path: '/api/socket/io',
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('user:join', { userId, username, role, avatar });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('message:new', (msg: ChatMessage) => {
      setMessages((prev) => ({
        ...prev,
        [msg.conversationId]: [...(prev[msg.conversationId] || []), msg],
      }));
    });

    socket.on('message:sent', (data: { messageId: string; conversationId: string }) => {
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

    socket.on('room:history', (data: { conversationId: string; messages: Array<Omit<ChatMessage, 'sender'> & { sender: string }> }) => {
      setMessages((prev) => ({
        ...prev,
        [data.conversationId]: data.messages.map((m) => ({
          ...m,
          sender: (m.sender === userId || m.sender === 'buyer' ? 'buyer' : 'seller') as 'buyer' | 'seller',
        })),
      }));
    });

    socket.on('typing:start', (data: { userId: string; username: string; conversationId: string }) => {
      setTypingUsers((prev) => ({
        ...prev,
        [data.conversationId]: [...(prev[data.conversationId] || []).filter((u) => u !== data.username), data.username],
      }));
    });

    socket.on('typing:stop', (data: { userId: string; conversationId: string }) => {
      setTypingUsers((prev) => {
        const users = prev[data.conversationId] || [];
        return {
          ...prev,
          [data.conversationId]: users.slice(0, -1),
        };
      });
    });

    socket.on('user:online', (data: { userId: string; username: string }) => {
      setOnlineStatus((prev) => ({ ...prev, [data.userId]: true }));
    });

    socket.on('user:offline', (data: { userId: string; username: string }) => {
      setOnlineStatus((prev) => ({ ...prev, [data.userId]: false }));
    });

    socket.on('messages:read', (data: { conversationId: string; readBy: string }) => {
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
      socket.disconnect();
    };
  }, [userId, username, role, avatar]);

  const joinRoom = useCallback((conversationId: string) => {
    socketRef.current?.emit('room:join', { conversationId });
  }, []);

  const leaveRoom = useCallback((conversationId: string) => {
    socketRef.current?.emit('room:leave', { conversationId });
  }, []);

  const sendMessage = useCallback((conversationId: string, text: string) => {
    const socket = socketRef.current;
    if (!socket || !text.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      sender: 'buyer',
      senderName: username,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      status: 'sent',
    };

    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMsg],
    }));

    socket.emit('message:send', {
      conversationId,
      text,
      sender: userId,
      senderName: username,
    });
  }, [userId, username]);

  const startTyping = useCallback((conversationId: string) => {
    socketRef.current?.emit('typing:start', {
      conversationId,
      userId,
      username,
    });
  }, [userId, username]);

  const stopTyping = useCallback((conversationId: string) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socketRef.current?.emit('typing:stop', {
      conversationId,
      userId,
    });
  }, [userId]);

  const markAsRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('messages:read', {
      conversationId,
      userId,
    });
  }, [userId]);

  return {
    isConnected,
    messages,
    typingUsers,
    onlineStatus,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
  };
}
