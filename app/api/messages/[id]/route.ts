import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

// GET /api/messages/[id] - Get a single message
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const message = await prisma.message.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        booking: {
          select: {
            id: true,
            guestName: true,
            guestEmail: true,
            guestPhone: true,
            checkInDate: true,
            checkOutDate: true,
            property: {
              select: {
                id: true,
                name: true,
                address: true,
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
            phone: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Mark as read if it's an inbound message
    if (message.direction === 'INBOUND' && message.status !== 'READ') {
      await prisma.message.update({
        where: { id },
        data: {
          status: 'READ',
          readAt: new Date(),
        },
      });
    }

    // Get thread messages if this message has a threadId
    let threadMessages: (typeof message)[] = [];
    if (message.threadId) {
      threadMessages = await prisma.message.findMany({
        where: {
          threadId: message.threadId,
          userId: session.user.id,
          id: { not: id },
        },
        include: {
          booking: {
            select: {
              id: true,
              guestName: true,
              guestEmail: true,
              guestPhone: true,
              checkInDate: true,
              checkOutDate: true,
              property: {
                select: {
                  id: true,
                  name: true,
                  address: true,
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
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    return NextResponse.json({
      ...message,
      threadMessages,
    });
  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json({ error: 'Failed to fetch message' }, { status: 500 });
  }
}

// PUT /api/messages/[id] - Update a message
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    // Check if message exists and belongs to user
    const existingMessage = await prisma.message.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Update status timestamps based on status change
    let statusUpdates = {};
    if (data.status && data.status !== existingMessage.status) {
      if (data.status === 'SENT') {
        statusUpdates = { sentAt: new Date() };
      } else if (data.status === 'DELIVERED') {
        statusUpdates = { deliveredAt: new Date() };
      } else if (data.status === 'READ') {
        statusUpdates = { readAt: new Date() };
      }
    }

    const message = await prisma.message.update({
      where: { id },
      data: {
        subject: data.subject,
        message: data.message,
        recipientEmail: data.recipientEmail,
        recipientPhone: data.recipientPhone,
        status: data.status,
        attachments: data.attachments ? data.attachments : Prisma.JsonNull,
        ...statusUpdates,
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

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}

// DELETE /api/messages/[id] - Delete a message
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if message exists and belongs to user
    const existingMessage = await prisma.message.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    await prisma.message.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
