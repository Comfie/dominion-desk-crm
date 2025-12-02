import { prisma } from '@/lib/db';
import { CreateCannedResponseDto, UpdateCannedResponseDto } from '../dtos/canned-response.dto';

export class CannedResponseRepository {
  async findAll(userId: string, activeOnly: boolean = true) {
    return prisma.cannedResponse.findMany({
      where: {
        userId,
        ...(activeOnly && { isActive: true }),
      },
      orderBy: { useCount: 'desc' },
    });
  }

  async findById(id: string, userId: string) {
    return prisma.cannedResponse.findFirst({
      where: { id, userId },
    });
  }

  async findByShortcut(shortcut: string, userId: string) {
    return prisma.cannedResponse.findFirst({
      where: { shortcut, userId, isActive: true },
    });
  }

  async create(userId: string, data: CreateCannedResponseDto) {
    return prisma.cannedResponse.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async update(id: string, userId: string, data: UpdateCannedResponseDto) {
    return prisma.cannedResponse.updateMany({
      where: { id, userId },
      data,
    });
  }

  async incrementUseCount(id: string) {
    return prisma.cannedResponse.update({
      where: { id },
      data: {
        useCount: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });
  }

  async delete(id: string, userId: string) {
    return prisma.cannedResponse.deleteMany({
      where: { id, userId },
    });
  }
}

export const cannedResponseRepository = new CannedResponseRepository();
