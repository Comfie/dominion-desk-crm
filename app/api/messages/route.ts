import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/messages - Get all messages for the user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const where = {
      userId: session.user.id,
      ...(direction && { direction: direction as 'INBOUND' | 'OUTBOUND' }),
      ...(messageType && { messageType: messageType as 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP' }),
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
      prisma.message.count({ where: { userId: session.user.id } }),
      prisma.message.count({
        where: {
          userId: session.user.id,
          direction: 'INBOUND',
          status: { not: 'READ' },
        },
      }),
      prisma.message.count({
        where: {
          userId: session.user.id,
          direction: 'OUTBOUND',
          sentAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.message.count({
        where: {
          userId: session.user.id,
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.message || !data.messageType || !data.direction) {
      return NextResponse.json(
        { error: 'Message content, type, and direction are required' },
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
      if ((data.messageType === 'SMS' || data.messageType === 'WHATSAPP') && !data.recipientPhone) {
        return NextResponse.json(
          { error: 'Recipient phone is required for SMS/WhatsApp messages' },
          { status: 400 }
        );
      }
    }

    // Generate thread ID if this is a new conversation
    const threadId =
      data.threadId || `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const message = await prisma.message.create({
      data: {
        userId: session.user.id,
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

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
