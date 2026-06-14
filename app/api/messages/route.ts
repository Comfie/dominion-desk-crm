import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth-helpers';
import { logAudit } from '@/lib/shared/audit';

const supportedMessageTypes = ['EMAIL', 'IN_APP'] as const;

async function verifyOwnedBooking(bookingId: string, organizationId: string) {
  return prisma.booking.findFirst({
    where: {
      id: bookingId,
      userId: organizationId,
    },
    select: { id: true },
  });
}

async function verifyOwnedTenant(tenantId: string, organizationId: string) {
  return prisma.tenant.findFirst({
    where: {
      id: tenantId,
      userId: organizationId,
    },
    select: { id: true },
  });
}

// GET /api/messages - Get all messages for the user
export async function GET(request: Request) {
  try {
    const session = await requireAuth();

    const { searchParams } = new URL(request.url);
    const direction = searchParams.get('direction');
    const messageType = searchParams.get('type');
    const status = searchParams.get('status');
    const bookingId = searchParams.get('bookingId');
    const tenantId = searchParams.get('tenantId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (
      messageType &&
      !supportedMessageTypes.includes(messageType as (typeof supportedMessageTypes)[number])
    ) {
      return NextResponse.json(
        { error: 'SMS and WhatsApp are temporarily unavailable. Use Email or In-App.' },
        { status: 400 }
      );
    }

    const where = {
      userId: session.user.organizationId,
      ...(direction && { direction: direction as 'INBOUND' | 'OUTBOUND' }),
      ...(messageType && { messageType: messageType as 'EMAIL' | 'IN_APP' }),
      ...(status && { status: status as 'DRAFT' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' }),
      ...(bookingId && { bookingId }),
      ...(tenantId && { tenantId }),
      ...(search && {
        OR: [
          { subject: { contains: search, mode: 'insensitive' as const } },
          { message: { contains: search, mode: 'insensitive' as const } },
          { recipientEmail: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          booking: {
            select: {
              id: true,
              guestName: true,
              property: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.message.count({ where }),
    ]);

    // Get summary statistics
    const [totalMessages, unreadCount, sentToday, failedCount] = await Promise.all([
      prisma.message.count({ where: { userId: session.user.organizationId } }),
      prisma.message.count({
        where: {
          userId: session.user.organizationId,
          direction: 'INBOUND',
          status: { not: 'READ' },
        },
      }),
      prisma.message.count({
        where: {
          userId: session.user.organizationId,
          direction: 'OUTBOUND',
          sentAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.message.count({
        where: {
          userId: session.user.organizationId,
          status: 'FAILED',
        },
      }),
    ]);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        totalMessages,
        unreadCount,
        sentToday,
        failedCount,
      },
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/messages - Create a new message
export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    const data = await request.json();

    // Validate required fields
    if (!data.message || !data.messageType || !data.direction) {
      return NextResponse.json(
        { error: 'Message content, type, and direction are required' },
        { status: 400 }
      );
    }

    if (!supportedMessageTypes.includes(data.messageType)) {
      return NextResponse.json(
        { error: 'SMS and WhatsApp are temporarily unavailable. Use Email or In-App.' },
        { status: 400 }
      );
    }

    // For outbound messages, require recipient info
    if (data.direction === 'OUTBOUND') {
      if (data.messageType === 'EMAIL' && !data.recipientEmail) {
        return NextResponse.json(
          { error: 'Recipient email is required for email messages' },
          { status: 400 }
        );
      }
    }

    if (data.bookingId) {
      const booking = await verifyOwnedBooking(data.bookingId, session.user.organizationId);
      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found or does not belong to you' },
          { status: 404 }
        );
      }
    }

    if (data.tenantId) {
      const tenant = await verifyOwnedTenant(data.tenantId, session.user.organizationId);
      if (!tenant) {
        return NextResponse.json(
          { error: 'Tenant not found or does not belong to you' },
          { status: 404 }
        );
      }
    }

    // Generate thread ID if this is a new conversation
    const threadId =
      data.threadId || `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message = await prisma.message.create({
      data: {
        userId: session.user.organizationId,
        bookingId: data.bookingId || null,
        tenantId: data.tenantId || null,
        subject: data.subject || null,
        message: data.message,
        messageType: data.messageType,
        direction: data.direction,
        recipientEmail: data.recipientEmail || null,
        recipientPhone: data.recipientPhone || null,
        status: data.status || (data.direction === 'OUTBOUND' ? 'SENT' : 'DELIVERED'),
        sentAt: data.direction === 'OUTBOUND' ? new Date() : null,
        deliveredAt: data.direction === 'INBOUND' ? new Date() : null,
        threadId,
        replyTo: data.replyTo || null,
        attachments: data.attachments ? data.attachments : Prisma.JsonNull,
      },
      include: {
        booking: {
          select: {
            id: true,
            guestName: true,
            property: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Audit log
    await logAudit(session, 'created', 'message', message.id, undefined, request);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
