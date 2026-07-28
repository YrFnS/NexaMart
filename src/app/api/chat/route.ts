import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser, type AuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
} from '@/lib/security';

const conversationSchema = z.object({
  conversationId: z.string().min(1).max(64),
  peerId: z.string().min(1).max(64).optional(),
});

const sendSchema = conversationSchema.extend({
  text: z.string().trim().min(1).max(2_000),
});

class ChatError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

async function resolvePeer(
  tx: Prisma.TransactionClient | typeof db,
  user: AuthenticatedUser,
  conversationId: string,
  requestedPeerId?: string,
) {
  const store = await tx.store.findUnique({
    where: { id: conversationId },
    select: { id: true, ownerId: true },
  });
  if (!store) throw new ChatError('Conversation store not found.', 404);

  if (store.ownerId !== user.id) {
    return { storeId: store.id, peerId: store.ownerId };
  }

  if (!requestedPeerId || requestedPeerId === user.id) {
    throw new ChatError('A buyer must be selected for seller conversations.', 400);
  }

  const [existingMessage, existingOrder, peer] = await Promise.all([
    tx.chatMessage.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: requestedPeerId },
          { senderId: requestedPeerId, receiverId: user.id },
        ],
      },
      select: { id: true },
    }),
    tx.order.findFirst({
      where: { storeId: store.id, userId: requestedPeerId },
      select: { id: true },
    }),
    tx.user.findFirst({
      where: { id: requestedPeerId, isBanned: false },
      select: { id: true },
    }),
  ]);

  if (!peer) throw new ChatError('Chat participant not found.', 404);
  if (!existingMessage && !existingOrder) {
    throw new ChatError('This buyer is not authorized for the store conversation.', 403);
  }

  return { storeId: store.id, peerId: requestedPeerId };
}

async function mapMessages(
  conversationId: string,
  messages: Array<{
    id: string;
    senderId: string;
    receiverId: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
  }>,
) {
  const userIds = [...new Set(messages.flatMap((item) => [item.senderId, item.receiverId]))];
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const names = new Map(
    users.map((user) => [user.id, user.name?.trim() || user.email.split('@')[0]]),
  );

  return messages.map((item) => ({
    id: item.id,
    conversationId,
    sender: item.senderId,
    senderName: names.get(item.senderId) || 'NexaMart user',
    text: item.message,
    time: item.createdAt.toISOString(),
    read: item.isRead,
    status: item.isRead ? ('read' as const) : ('delivered' as const),
  }));
}

export async function GET(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.general);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  const parsed = conversationSchema.safeParse({
    conversationId: new URL(request.url).searchParams.get('conversationId'),
    peerId: new URL(request.url).searchParams.get('peerId') || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'Conversation id is required.' }, { status: 400 });
  }

  try {
    const { peerId } = await resolvePeer(
      db,
      auth.user,
      parsed.data.conversationId,
      parsed.data.peerId,
    );
    const records = await db.chatMessage.findMany({
      where: {
        OR: [
          { senderId: auth.user.id, receiverId: peerId },
          { senderId: peerId, receiverId: auth.user.id },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    records.reverse();

    return NextResponse.json({
      conversationId: parsed.data.conversationId,
      peerId,
      messages: await mapMessages(parsed.data.conversationId, records),
    });
  } catch (error) {
    if (error instanceof ChatError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Chat GET error:', error);
    return NextResponse.json({ error: 'Failed to load messages.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Invalid request origin.' },
      { status: 403 },
    );
  }

  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  const parsed = sendSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid chat message.' }, { status: 400 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const { peerId } = await resolvePeer(
        tx,
        auth.user,
        parsed.data.conversationId,
        parsed.data.peerId,
      );
      const receiver = await tx.user.findFirst({
        where: { id: peerId, isBanned: false },
        select: { id: true },
      });
      if (!receiver) throw new ChatError('Chat participant not found.', 404);

      const message = await tx.chatMessage.create({
        data: {
          senderId: auth.user.id,
          receiverId: peerId,
          message: parsed.data.text,
          isRead: false,
        },
      });
      return { peerId, message };
    });

    const [message] = await mapMessages(parsed.data.conversationId, [result.message]);
    return NextResponse.json({ message, peerId: result.peerId }, { status: 201 });
  } catch (error) {
    if (error instanceof ChatError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Chat POST error:', error);
    return NextResponse.json({ error: 'Failed to send message.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const rateLimit = checkApiRateLimit(request, RATE_LIMITS.write);
  if (!rateLimit.allowed && rateLimit.response) return rateLimit.response;

  const csrf = validateCsrf(request);
  if (!csrf.valid) {
    return NextResponse.json(
      { error: csrf.error || 'Invalid request origin.' },
      { status: 403 },
    );
  }

  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  const parsed = conversationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Conversation id is required.' }, { status: 400 });
  }

  try {
    const { peerId } = await resolvePeer(
      db,
      auth.user,
      parsed.data.conversationId,
      parsed.data.peerId,
    );
    const updated = await db.chatMessage.updateMany({
      where: {
        senderId: peerId,
        receiverId: auth.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true, updated: updated.count });
  } catch (error) {
    if (error instanceof ChatError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Chat PATCH error:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read.' }, { status: 500 });
  }
}
