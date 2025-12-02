import { prisma } from '@/lib/db';
import { CreateAutomationDto, UpdateAutomationDto } from '../dtos/automation.dto';
import { AutomationTrigger } from '@prisma/client';

export class AutomationRepository {
  async findAll(userId: string) {
    return prisma.messageAutomation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(userId: string, triggerType?: AutomationTrigger) {
    return prisma.messageAutomation.findMany({
      where: {
        userId,
        isActive: true,
        ...(triggerType && { triggerType }),
      },
    });
  }

  async findById(id: string, userId: string) {
    return prisma.messageAutomation.findFirst({
      where: { id, userId },
    });
  }

  async create(userId: string, data: CreateAutomationDto) {
    return prisma.messageAutomation.create({
      data: {
        ...data,
        userId,
        propertyIds: data.propertyIds ? JSON.stringify(data.propertyIds) : undefined,
      },
    });
  }

  async update(id: string, userId: string, data: UpdateAutomationDto) {
    return prisma.messageAutomation.updateMany({
      where: { id, userId },
      data: {
        ...data,
        propertyIds: data.propertyIds ? JSON.stringify(data.propertyIds) : undefined,
      },
    });
  }

  async delete(id: string, userId: string) {
    return prisma.messageAutomation.deleteMany({
      where: { id, userId },
    });
  }

  async toggleActive(id: string, userId: string, isActive: boolean) {
    return prisma.messageAutomation.updateMany({
      where: { id, userId },
      data: { isActive },
    });
  }

  async incrementAnalytics(id: string, field: 'totalSent' | 'totalOpened' | 'totalClicked') {
    return prisma.messageAutomation.update({
      where: { id },
      data: { [field]: { increment: 1 } },
    });
  }
}

export const automationRepository = new AutomationRepository();
