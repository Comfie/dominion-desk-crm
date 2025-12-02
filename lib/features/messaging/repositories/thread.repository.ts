import { prisma } from '@/lib/db';
import { CreateThreadDto, UpdateThreadDto } from '../dtos/thread.dto';

export class ThreadRepository {
  async findAll(userId: string, options?: { isArchived?: boolean; limit?: number }) {
    return prisma.messageThread.findMany({
      where: {
        userId,
        ...(options?.isArchived !== undefined && { isArchived: options.isArchived }),
      },
      orderBy: { lastMessageAt: 'desc' },
      take: options?.limit,
      include: {
        booking: { select: { bookingReference: true, guestName: true } },
        tenant: { select: { firstName: true, lastName: true } },
        property: { select: { name: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findUnread(userId: string) {
    return prisma.messageThread.findMany({
      where: {
        userId,
        isRead: false,
        isArchived: false,
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async findById(id: string, userId: string) {
    return prisma.messageThread.findFirst({
      where: { id, userId },
      include: {
        booking: true,
        tenant: true,
        property: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  async create(userId: string, data: CreateThreadDto) {
    const { initialMessage, ...threadData } = data;

    return prisma.messageThread.create({
      data: {
        ...threadData,
        userId,
        lastMessagePreview: initialMessage.substring(0, 200),
      },
    });
  }

  async update(id: string, userId: string, data: UpdateThreadDto) {
    return prisma.messageThread.updateMany({
      where: { id, userId },
      data: {
        ...data,
        tags: data.tags ? JSON.stringify(data.tags) : undefined,
      },
    });
  }

  async updateLastMessage(id: string, messagePreview: string) {
    return prisma.messageThread.update({
      where: { id },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: messagePreview.substring(0, 200),
        isRead: false,
      },
    });
  }

  async markAsRead(id: string, userId: string) {
    return prisma.messageThread.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async delete(id: string, userId: string) {
    return prisma.messageThread.deleteMany({
      where: { id, userId },
    });
  }
}

export const threadRepository = new ThreadRepository();
