import { Server as SocketIOServer } from 'socket.io';
import { NextResponse } from 'next/server';

// Extend the global type to include our socket server
declare global {
  // eslint-disable-next-line no-var
  var _io: SocketIOServer | undefined;
}

interface OnlineUser {
  id: string;
  username: string;
  avatar: string;
  role: 'buyer' | 'seller';
}

interface ChatMessage {
  id: string;
  conversationId: string;
  sender: string;
  senderName: string;
  text: string;
  time: string;
  read: boolean;
  status: 'sent' | 'delivered' | 'read';
}

// In-memory stores
const onlineUsers = new Map<string, OnlineUser>();
const roomMessages = new Map<string, ChatMessage[]>();

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function getRoomMessages(roomId: string): ChatMessage[] {
  return roomMessages.get(roomId) || [];
}

function addRoomMessage(roomId: string, message: ChatMessage): void {
  const msgs = roomMessages.get(roomId) || [];
  msgs.push(message);
  if (msgs.length > 50) {
    roomMessages.set(roomId, msgs.slice(-50));
  } else {
    roomMessages.set(roomId, msgs);
  }
}

// Auto-reply bot for demo conversations
const sellerBots: Record<string, { name: string; responses: string[] }> = {
  'default': {
    name: 'NexaMart Seller',
    responses: [
      'Thank you for reaching out! Let me check that for you.',
      'Your order is being processed. Is there anything else I can help with?',
      'We appreciate your patience. I\'ll update you shortly.',
      'Great news! Your item has been shipped.',
      'Is there anything else you\'d like to know?',
    ],
  },
};

function getIO(): SocketIOServer {
  if (global._io) return global._io;

  // Create the Socket.IO server attached to the HTTP server
  // In Next.js, we need to attach it to the running server
  const io = new SocketIOServer({
    path: '/api/socket/io',
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    console.log(`[Chat] User connected: ${socket.id}`);

    socket.on('user:join', (data: { userId: string; username: string; avatar?: string; role?: 'buyer' | 'seller' }) => {
      const user: OnlineUser = {
        id: data.userId || socket.id,
        username: data.username,
        avatar: data.avatar || '',
        role: data.role || 'buyer',
      };
      onlineUsers.set(socket.id, user);
      io.emit('user:online', { userId: user.id, username: user.username });
      console.log(`[Chat] ${user.username} joined (${user.role})`);
    });

    socket.on('room:join', (data: { conversationId: string }) => {
      socket.join(data.conversationId);
      const messages = getRoomMessages(data.conversationId);
      socket.emit('room:history', { conversationId: data.conversationId, messages });

      // Mark messages as read
      const msgs = roomMessages.get(data.conversationId) || [];
      const updatedMsgs = msgs.map((m) => ({ ...m, read: true, status: 'read' as const }));
      roomMessages.set(data.conversationId, updatedMsgs);

      socket.to(data.conversationId).emit('messages:read', {
        conversationId: data.conversationId,
        readBy: onlineUsers.get(socket.id)?.id || socket.id,
      });
    });

    socket.on('room:leave', (data: { conversationId: string }) => {
      socket.leave(data.conversationId);
    });

    socket.on('message:send', (data: { conversationId: string; text: string; sender: string; senderName: string }) => {
      const message: ChatMessage = {
        id: generateId(),
        conversationId: data.conversationId,
        sender: data.sender,
        senderName: data.senderName,
        text: data.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
        status: 'sent',
      };

      addRoomMessage(data.conversationId, message);
      io.to(data.conversationId).emit('message:new', message);
      socket.emit('message:sent', { messageId: message.id, conversationId: data.conversationId });

      // Simulate seller auto-reply
      const bot = sellerBots['default'];
      if (bot) {
        const delay = 1500 + Math.random() * 3000;
        setTimeout(() => {
          const randomResponse = bot.responses[Math.floor(Math.random() * bot.responses.length)];
          const reply: ChatMessage = {
            id: generateId(),
            conversationId: data.conversationId,
            sender: 'seller-bot',
            senderName: bot.name,
            text: randomResponse,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            read: false,
            status: 'delivered',
          };
          addRoomMessage(data.conversationId, reply);
          io.to(data.conversationId).emit('message:new', reply);
        }, delay);
      }
    });

    socket.on('typing:start', (data: { conversationId: string; userId: string; username: string }) => {
      socket.to(data.conversationId).emit('typing:start', {
        userId: data.userId,
        username: data.username,
        conversationId: data.conversationId,
      });
    });

    socket.on('typing:stop', (data: { conversationId: string; userId: string }) => {
      socket.to(data.conversationId).emit('typing:stop', {
        userId: data.userId,
        conversationId: data.conversationId,
      });
    });

    socket.on('messages:read', (data: { conversationId: string; userId: string }) => {
      const msgs = roomMessages.get(data.conversationId) || [];
      const updatedMsgs = msgs.map((m) => ({ ...m, read: true, status: 'read' as const }));
      roomMessages.set(data.conversationId, updatedMsgs);
      socket.to(data.conversationId).emit('messages:read', {
        conversationId: data.conversationId,
        readBy: data.userId,
      });
    });

    socket.on('disconnect', () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        onlineUsers.delete(socket.id);
        io.emit('user:offline', { userId: user.id, username: user.username });
        console.log(`[Chat] ${user.username} disconnected`);
      } else {
        console.log(`[Chat] User disconnected: ${socket.id}`);
      }
    });
  });

  global._io = io;
  return io;
}

// HTTP route handler that returns the IO server info
export async function GET() {
  const io = getIO();
  return NextResponse.json({
    success: true,
    message: 'Socket.IO server is running',
    path: '/api/socket/io',
    connections: io.of('/').sockets.size,
  });
}
