import { prisma } from '@/lib/db';
import { ScheduledMessageStatus } from '@prisma/client';
import { CreateScheduledMessageDto } from '../dtos/scheduled-message.dto';

export class ScheduledMessageRepository {
  async findPendingMessages(beforeTime: Date) {
    return prisma.scheduledMessage.findMany({
      where: {
        status: ScheduledMessageStatus.PENDING,
        scheduledFor: { lte: beforeTime },
      },
      include: {
        booking: true,
        tenant: true,
        automation: true,
      },
    });
  }

  async findByUser(userId: string, limit: number = 50) {
    return prisma.scheduledMessage.findMany({
      where: { userId },
      orderBy: { scheduledFor: 'desc' },
      take: limit,
      include: {
        automation: { select: { name: true } },
        booking: { select: { bookingReference: true, guestName: true } },
      },
    });
  }

  async findById(id: string, userId: string) {
    return prisma.scheduledMessage.findFirst({
      where: { id, userId },
      include: {
        automation: true,
        booking: true,
        tenant: true,
      },
    });
  }

  async create(userId: string, data: CreateScheduledMessageDto) {
    return prisma.scheduledMessage.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async updateStatus(id: string, status: ScheduledMessageStatus, errorMessage?: string) {
    return prisma.scheduledMessage.update({
      where: { id },
      data: {
        status,
        errorMessage,
        ...(status === ScheduledMessageStatus.SENT && { sentAt: new Date() }),
        ...(status === ScheduledMessageStatus.DELIVERED && { deliveredAt: new Date() }),
      },
    });
  }

  async markOpened(id: string) {
    return prisma.scheduledMessage.update({
      where: { id },
      data: { openedAt: new Date() },
    });
  }

  async markClicked(id: string) {
    return prisma.scheduledMessage.update({
      where: { id },
      data: { clickedAt: new Date() },
    });
  }

  async cancel(id: string, userId: string) {
    return prisma.scheduledMessage.updateMany({
      where: { id, userId, status: ScheduledMessageStatus.PENDING },
      data: { status: ScheduledMessageStatus.CANCELLED },
    });
  }

  async delete(id: string, userId: string) {
    return prisma.scheduledMessage.deleteMany({
      where: { id, userId },
    });
  }
}

export const scheduledMessageRepository = new ScheduledMessageRepository();
