import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  checkApiRateLimit,
  RATE_LIMITS,
  validateCsrf,
  validatePagination,
} from '@/lib/security';

const TICKET_CATEGORIES = [
  'order_issue',
  'return_refund',
  'payment_problem',
  'account_issue',
  'seller_dispute',
  'technical_problem',
  'other',
] as const;

const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

const createTicketSchema = z
  .object({
    category: z.enum(TICKET_CATEGORIES),
    subject: z.string().trim().min(3).max(160),
    description: z.string().trim().min(10).max(5_000),
    priority: z.enum(TICKET_PRIORITIES).default('medium'),
  })
  .strict();

function mapTicket(
  ticket: {
    id: string;
    userId: string;
    subject: string;
    description: string | null;
    category: string | null;
    status: string;
    priority: string;
    createdAt: Date;
    updatedAt: Date;
    user?: { name: string | null; email: string };
  },
  includeOwner: boolean,
) {
  return {
    id: ticket.id,
    category: ticket.category || '',
    subject: ticket.subject,
    subjectAr: '',
    description: ticket.description || '',
    descriptionAr: '',
    status: ticket.status,
    priority: ticket.priority,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    responseCount: 0,
    ...(includeOwner
      ? {
          userId: ticket.userId,
          userName: ticket.user?.name || ticket.user?.email || 'Unknown user',
          userEmail: ticket.user?.email || null,
        }
      : {}),
  };
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const { page, limit } = validatePagination(
    searchParams.get('page'),
    searchParams.get('limit'),
    100,
  );
  const status = searchParams.get('status')?.trim() || undefined;
  const includeOwner = auth.user.role === 'admin';
  const where = {
    ...(includeOwner ? {} : { userId: auth.user.id }),
    ...(status ? { status } : {}),
  };

  try {
    const [tickets, total] = await db.$transaction([
      db.helpTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: includeOwner
          ? { user: { select: { name: true, email: true } } }
          : undefined,
      }),
      db.helpTicket.count({ where }),
    ]);

    const response = NextResponse.json({
      tickets: tickets.map((ticket) => mapTicket(ticket, includeOwner)),
      total,
      page,
      limit,
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('Support tickets GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets.' },
      { status: 500 },
    );
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

  const parsed = createTicketSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Please check the support ticket details.' },
      { status: 400 },
    );
  }

  try {
    const ticket = await db.helpTicket.create({
      data: {
        userId: auth.user.id,
        subject: parsed.data.subject,
        description: parsed.data.description,
        category: parsed.data.category,
        priority: parsed.data.priority,
        status: 'open',
      },
    });

    return NextResponse.json(
      {
        ticket: mapTicket(ticket, false),
        message: 'Ticket submitted successfully. We will get back to you within 24 hours.',
        messageAr: 'تم تقديم التذكرة بنجاح. سنتواصل معك خلال 24 ساعة.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Support tickets POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket.' },
      { status: 500 },
    );
  }
}
