import { createServer } from 'http'
import { Server, Socket } from 'socket.io'

const httpServer = createServer()
const io = new Server(httpServer, {
  // DO NOT change the path, it is used by Caddy to forward the request to the correct port
  path: '/',
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
})

// Types
interface OnlineUser {
  id: string
  username: string
  avatar: string
  role: 'buyer' | 'seller'
}

interface ChatMessage {
  id: string
  conversationId: string
  sender: string
  senderName: string
  text: string
  time: string
  read: boolean
  status: 'sent' | 'delivered' | 'read'
}

interface TypingUser {
  userId: string
  username: string
  conversationId: string
}

// In-memory stores
const onlineUsers = new Map<string, OnlineUser>()
const roomMessages = new Map<string, ChatMessage[]>()
const typingUsers = new Map<string, TypingUser>()

// Helper: generate message ID
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

// Helper: get messages for a room (last 50)
const getRoomMessages = (roomId: string): ChatMessage[] => {
  return roomMessages.get(roomId) || []
}

// Helper: add message to room (keep last 50)
const addRoomMessage = (roomId: string, message: ChatMessage) => {
  const msgs = roomMessages.get(roomId) || []
  msgs.push(message)
  if (msgs.length > 50) {
    roomMessages.set(roomId, msgs.slice(-50))
  } else {
    roomMessages.set(roomId, msgs)
  }
}

// Seed some initial messages for demo conversations
const seedMessages = () => {
  const now = new Date()
  const fmt = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const c1Messages: ChatMessage[] = [
    { id: generateId(), conversationId: 'c1', sender: 'buyer-1', senderName: 'You', text: 'Hi, I wanted to check on my order #1234', time: fmt(new Date(now.getTime() - 30 * 60000)), read: true, status: 'read' },
    { id: generateId(), conversationId: 'c1', sender: 'seller-1', senderName: 'TechStore Pro', text: 'Hello! Let me check that for you right away', time: fmt(new Date(now.getTime() - 29 * 60000)), read: true, status: 'read' },
    { id: generateId(), conversationId: 'c1', sender: 'seller-1', senderName: 'TechStore Pro', text: 'Your order is currently being processed and will be shipped today', time: fmt(new Date(now.getTime() - 28 * 60000)), read: true, status: 'read' },
    { id: generateId(), conversationId: 'c1', sender: 'buyer-1', senderName: 'You', text: 'Great, when can I expect delivery?', time: fmt(new Date(now.getTime() - 25 * 60000)), read: true, status: 'read' },
    { id: generateId(), conversationId: 'c1', sender: 'seller-1', senderName: 'TechStore Pro', text: 'Estimated delivery is 3-5 business days', time: fmt(new Date(now.getTime() - 24 * 60000)), read: true, status: 'read' },
    { id: generateId(), conversationId: 'c1', sender: 'seller-1', senderName: 'TechStore Pro', text: 'Your order has been shipped!', time: fmt(new Date(now.getTime() - 2 * 60000)), read: false, status: 'delivered' },
    { id: generateId(), conversationId: 'c1', sender: 'seller-1', senderName: 'TechStore Pro', text: 'Tracking number: NX-2024-5678', time: fmt(new Date(now.getTime() - 1 * 60000)), read: false, status: 'delivered' },
  ]

  const c2Messages: ChatMessage[] = [
    { id: generateId(), conversationId: 'c2', sender: 'buyer-1', senderName: 'You', text: 'Do you have this dress in size M?', time: fmt(new Date(now.getTime() - 60 * 60000)), read: true, status: 'read' },
    { id: generateId(), conversationId: 'c2', sender: 'seller-2', senderName: 'Fashion Hub', text: 'Yes! We have it in stock. Would you like me to reserve one for you?', time: fmt(new Date(now.getTime() - 55 * 60000)), read: true, status: 'read' },
    { id: generateId(), conversationId: 'c2', sender: 'buyer-1', senderName: 'You', text: 'Yes please! In black if possible', time: fmt(new Date(now.getTime() - 50 * 60000)), read: true, status: 'read' },
    { id: generateId(), conversationId: 'c2', sender: 'seller-2', senderName: 'Fashion Hub', text: 'We have new arrivals in stock', time: fmt(new Date(now.getTime() - 45 * 60000)), read: true, status: 'read' },
  ]

  const c3Messages: ChatMessage[] = [
    { id: generateId(), conversationId: 'c3', sender: 'buyer-1', senderName: 'You', text: 'Can I see more photos of the lamp?', time: fmt(new Date(now.getTime() - 180 * 60000)), read: true, status: 'read' },
    { id: generateId(), conversationId: 'c3', sender: 'seller-3', senderName: 'Home Decor Plus', text: 'Can you send more photos?', time: fmt(new Date(now.getTime() - 150 * 60000)), read: false, status: 'delivered' },
  ]

  roomMessages.set('c1', c1Messages)
  roomMessages.set('c2', c2Messages)
  roomMessages.set('c3', c3Messages)
}

seedMessages()

// Simulated seller bots that auto-respond
const sellerBots: Record<string, { name: string; responses: string[] }> = {
  'c1': {
    name: 'TechStore Pro',
    responses: [
      'Thank you for reaching out! Let me check that for you.',
      'Your order is being processed. Is there anything else I can help with?',
      'We appreciate your patience. I\'ll update you shortly.',
      'Great news! Your item has been shipped.',
      'Is there anything else you\'d like to know about our products?',
    ]
  },
  'c2': {
    name: 'Fashion Hub',
    responses: [
      'Absolutely! We have that in stock.',
      'Let me check our latest collection for you.',
      'We offer free returns within 30 days!',
      'That\'s a great choice! Very popular this season.',
      'Would you like to see our new arrivals?',
    ]
  },
  'c3': {
    name: 'Home Decor Plus',
    responses: [
      'Of course! I\'ll send more photos right away.',
      'We have similar items you might like.',
      'This piece comes with a 1-year warranty.',
      'Free delivery on orders over $50!',
      'Let me know if you need any measurements.',
    ]
  },
  'c4': {
    name: 'Global Supply Co',
    responses: [
      'The bulk price is confirmed for your order.',
      'We can offer additional discounts for larger quantities.',
      'Shipping will be arranged within 48 hours.',
      'Our quality assurance team has verified the shipment.',
    ]
  },
  'c5': {
    name: 'StyleZone',
    responses: [
      'Thank you for your purchase! Hope you love it.',
      'We\'d love to hear your feedback!',
      'Check out our latest sale items!',
      'Follow our store for exclusive deals.',
    ]
  },
}

io.on('connection', (socket: Socket) => {
  console.log(`[Chat] User connected: ${socket.id}`)

  // ========== Authentication / User Setup ==========
  socket.on('user:join', (data: { userId: string; username: string; avatar?: string; role?: 'buyer' | 'seller' }) => {
    const user: OnlineUser = {
      id: data.userId || socket.id,
      username: data.username,
      avatar: data.avatar || '',
      role: data.role || 'buyer',
    }
    onlineUsers.set(socket.id, user)

    // Broadcast online status
    io.emit('user:online', { userId: user.id, username: user.username })
    console.log(`[Chat] ${user.username} joined (${user.role})`)
  })

  // ========== Room Management ==========
  socket.on('room:join', (data: { conversationId: string }) => {
    socket.join(data.conversationId)
    console.log(`[Chat] ${socket.id} joined room: ${data.conversationId}`)

    // Send last 50 messages for this room
    const messages = getRoomMessages(data.conversationId)
    socket.emit('room:history', { conversationId: data.conversationId, messages })

    // Mark messages as read
    const msgs = roomMessages.get(data.conversationId) || []
    const updatedMsgs = msgs.map(m => ({ ...m, read: true, status: 'read' as const }))
    roomMessages.set(data.conversationId, updatedMsgs)

    // Notify sender that messages were read
    socket.to(data.conversationId).emit('messages:read', {
      conversationId: data.conversationId,
      readBy: onlineUsers.get(socket.id)?.id || socket.id,
    })
  })

  socket.on('room:leave', (data: { conversationId: string }) => {
    socket.leave(data.conversationId)
    console.log(`[Chat] ${socket.id} left room: ${data.conversationId}`)
  })

  // ========== Send Message ==========
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
    }

    // Store message
    addRoomMessage(data.conversationId, message)

    // Broadcast to room
    io.to(data.conversationId).emit('message:new', message)

    // Acknowledge to sender
    socket.emit('message:sent', { messageId: message.id, conversationId: data.conversationId })

    // Clear typing indicator for this user
    typingUsers.delete(socket.id)
    socket.to(data.conversationId).emit('typing:stop', {
      userId: data.sender,
      conversationId: data.conversationId,
    })

    // Simulate seller auto-reply after a delay
    const bot = sellerBots[data.conversationId]
    if (bot && data.sender !== `seller-${data.conversationId.charAt(1)}`) {
      const delay = 1500 + Math.random() * 3000
      setTimeout(() => {
        const sellerId = `seller-${data.conversationId.charAt(1)}`
        const randomResponse = bot.responses[Math.floor(Math.random() * bot.responses.length)]
        const reply: ChatMessage = {
          id: generateId(),
          conversationId: data.conversationId,
          sender: sellerId,
          senderName: bot.name,
          text: randomResponse,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          read: false,
          status: 'delivered',
        }
        addRoomMessage(data.conversationId, reply)
        io.to(data.conversationId).emit('message:new', reply)
      }, delay)
    }
  })

  // ========== Typing Indicator ==========
  socket.on('typing:start', (data: { conversationId: string; userId: string; username: string }) => {
    typingUsers.set(socket.id, {
      userId: data.userId,
      username: data.username,
      conversationId: data.conversationId,
    })
    socket.to(data.conversationId).emit('typing:start', {
      userId: data.userId,
      username: data.username,
      conversationId: data.conversationId,
    })
  })

  socket.on('typing:stop', (data: { conversationId: string; userId: string }) => {
    typingUsers.delete(socket.id)
    socket.to(data.conversationId).emit('typing:stop', {
      userId: data.userId,
      conversationId: data.conversationId,
    })
  })

  // ========== Read Receipts ==========
  socket.on('messages:read', (data: { conversationId: string; userId: string }) => {
    const msgs = roomMessages.get(data.conversationId) || []
    const updatedMsgs = msgs.map(m => ({ ...m, read: true, status: 'read' as const }))
    roomMessages.set(data.conversationId, updatedMsgs)

    // Notify other users in the room
    socket.to(data.conversationId).emit('messages:read', {
      conversationId: data.conversationId,
      readBy: data.userId,
    })
  })

  // ========== Online Status ==========
  socket.on('status:request', () => {
    const users = Array.from(onlineUsers.values())
    socket.emit('status:online', { users })
  })

  // ========== Disconnection ==========
  socket.on('disconnect', () => {
    const user = onlineUsers.get(socket.id)
    if (user) {
      onlineUsers.delete(socket.id)
      typingUsers.delete(socket.id)

      // Broadcast offline status
      io.emit('user:offline', { userId: user.id, username: user.username })
      console.log(`[Chat] ${user.username} disconnected`)
    } else {
      console.log(`[Chat] User disconnected: ${socket.id}`)
    }
  })

  socket.on('error', (error) => {
    console.error(`[Chat] Socket error (${socket.id}):`, error)
  })
})

const PORT = 3003
httpServer.listen(PORT, () => {
  console.log(`[Chat] NexaMart Chat WebSocket server running on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Chat] Received SIGTERM, shutting down...')
  io.close()
  httpServer.close(() => {
    console.log('[Chat] Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('[Chat] Received SIGINT, shutting down...')
  io.close()
  httpServer.close(() => {
    console.log('[Chat] Server closed')
    process.exit(0)
  })
})
