import { automationRepository } from '../repositories/automation.repository';
import {
  CreateAutomationDto,
  UpdateAutomationDto,
  TestAutomationDto,
} from '../dtos/automation.dto';
import { templateEngineService } from './template-engine.service';
import { deliveryProviderService } from '../utils/delivery-provider';
import { prisma } from '@/lib/db';

export class AutomationService {
  async getAll(organizationId: string) {
    return automationRepository.findAll(organizationId);
  }

  async getById(organizationId: string, id: string) {
    const automation = await automationRepository.findById(id, organizationId);
    if (!automation) {
      throw new Error(`Automation with id ${id} not found`);
    }
    return automation;
  }

  async create(organizationId: string, data: CreateAutomationDto) {
    // Business validation: ensure propertyIds belong to organization
    if (data.propertyIds && data.propertyIds.length > 0) {
      const validProperties = await prisma.property.count({
        where: {
          userId: organizationId,
          id: { in: data.propertyIds },
        },
      });

      if (validProperties !== data.propertyIds.length) {
        throw new Error('Some property IDs are invalid or do not belong to your organization');
      }
    }

    return automationRepository.create(organizationId, data);
  }

  async update(organizationId: string, id: string, data: UpdateAutomationDto) {
    await this.getById(organizationId, id); // Verify ownership

    // Same validation as create
    if (data.propertyIds && data.propertyIds.length > 0) {
      const validProperties = await prisma.property.count({
        where: {
          userId: organizationId,
          id: { in: data.propertyIds },
        },
      });

      if (validProperties !== data.propertyIds.length) {
        throw new Error('Some property IDs are invalid');
      }
    }

    await automationRepository.update(id, organizationId, data);
    return this.getById(organizationId, id);
  }

  async delete(organizationId: string, id: string) {
    await this.getById(organizationId, id); // Verify ownership
    await automationRepository.delete(id, organizationId);
  }

  async toggle(organizationId: string, id: string, isActive: boolean) {
    await this.getById(organizationId, id);
    await automationRepository.toggleActive(id, organizationId, isActive);
    return this.getById(organizationId, id);
  }

  async testAutomation(organizationId: string, id: string, testData: TestAutomationDto) {
    const automation = await this.getById(organizationId, id);

    // Get context data for variable replacement
    let context: Record<string, any> = {
      guestName: 'Test Guest',
      propertyName: 'Test Property',
      checkInDate: new Date().toLocaleDateString(),
      checkOutDate: new Date(Date.now() + 86400000).toLocaleDateString(),
    };

    if (testData.bookingId) {
      const booking = await prisma.booking.findFirst({
        where: { id: testData.bookingId, userId: organizationId },
        include: { property: true },
      });

      if (booking) {
        context = {
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          guestPhone: booking.guestPhone,
          propertyName: booking.property.name,
          propertyAddress: booking.property.address,
          checkInDate: booking.checkInDate.toLocaleDateString(),
          checkInTime: booking.property.checkInTime || '15:00',
          checkOutDate: booking.checkOutDate.toLocaleDateString(),
          checkOutTime: booking.property.checkOutTime || '11:00',
          totalAmount: booking.totalAmount.toString(),
          bookingReference: booking.bookingReference,
          numberOfGuests: booking.numberOfGuests,
          numberOfNights: booking.numberOfNights,
        };
      }
    }

    const renderedBody = templateEngineService.render(automation.bodyTemplate, context);
    const renderedSubject = automation.subject
      ? templateEngineService.render(automation.subject, context)
      : undefined;

    // Send test message
    const recipient = testData.recipientEmail || testData.recipientPhone;
    if (!recipient) {
      throw new Error('Either recipientEmail or recipientPhone is required for test');
    }

    await deliveryProviderService.send({
      type: automation.messageType,
      recipient,
      subject: renderedSubject,
      body: renderedBody,
    });

    return { success: true, message: 'Test message sent successfully' };
  }
}

export const automationService = new AutomationService();
