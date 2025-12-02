import { scheduledMessageRepository } from '../repositories/scheduled-message.repository';
import { automationRepository } from '../repositories/automation.repository';
import { AutomationTrigger, ScheduledMessageStatus } from '@prisma/client';
import { templateEngineService } from './template-engine.service';
import { deliveryProviderService } from '../utils/delivery-provider';
import { prisma } from '@/lib/db';

export class MessageSchedulerService {
  /**
   * Called when a booking is created/updated to schedule automation messages
   */
  async scheduleForBooking(bookingId: string, userId: string, trigger: AutomationTrigger) {
    // Get booking with property
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { property: true },
    });

    if (!booking) return;

    // Find active automations for this trigger
    const automations = await automationRepository.findActive(userId, trigger);

    for (const automation of automations) {
      // Check if automation applies to this property
      if (automation.propertyIds) {
        const propertyIds = JSON.parse(automation.propertyIds as string);
        if (!propertyIds.includes(booking.propertyId)) continue;
      }

      // Check rental type filter
      if (automation.applyToRentalType && automation.applyToRentalType !== booking.bookingType) {
        continue;
      }

      // Calculate scheduled time
      const scheduledFor = this.calculateScheduledTime(
        trigger,
        booking,
        automation.triggerOffset,
        automation.triggerTimeOfDay
      );

      // Prepare context for template rendering
      const context = {
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
        numberOfGuests: booking.numberOfGuests.toString(),
        numberOfNights: booking.numberOfNights.toString(),
      };

      // Render message body
      const renderedBody = templateEngineService.render(automation.bodyTemplate, context);
      const renderedSubject = automation.subject
        ? templateEngineService.render(automation.subject, context)
        : '';

      // Create scheduled message
      await scheduledMessageRepository.create(userId, {
        automationId: automation.id,
        bookingId: booking.id,
        recipientEmail: booking.guestEmail || undefined,
        recipientPhone: booking.guestPhone || undefined,
        recipientName: booking.guestName,
        messageType: automation.messageType,
        subject: renderedSubject,
        body: renderedBody,
        scheduledFor,
      });
    }
  }

  /**
   * Process pending messages (called by cron job)
   */
  async processPending() {
    const now = new Date();
    const pendingMessages = await scheduledMessageRepository.findPendingMessages(now);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
    };

    for (const message of pendingMessages) {
      results.processed++;

      try {
        // Update to SENDING status
        await scheduledMessageRepository.updateStatus(message.id, ScheduledMessageStatus.SENDING);

        // Send message
        await deliveryProviderService.send({
          type: message.messageType,
          recipient: message.recipientEmail || message.recipientPhone || '',
          subject: message.subject || undefined,
          body: message.body,
        });

        // Update to SENT
        await scheduledMessageRepository.updateStatus(message.id, ScheduledMessageStatus.SENT);

        // Increment automation analytics
        if (message.automationId) {
          await automationRepository.incrementAnalytics(message.automationId, 'totalSent');
        }

        results.succeeded++;
      } catch (error) {
        // Update to FAILED with error
        await scheduledMessageRepository.updateStatus(
          message.id,
          ScheduledMessageStatus.FAILED,
          error instanceof Error ? error.message : 'Unknown error'
        );

        results.failed++;
      }
    }

    return results;
  }

  private calculateScheduledTime(
    trigger: AutomationTrigger,
    booking: any,
    offset?: number | null,
    timeOfDay?: string | null
  ): Date {
    let baseDate: Date;

    // Determine base date from trigger
    switch (trigger) {
      case AutomationTrigger.BOOKING_CREATED:
      case AutomationTrigger.BOOKING_CONFIRMED:
        baseDate = new Date();
        break;
      case AutomationTrigger.CHECK_IN_REMINDER:
      case AutomationTrigger.CHECK_IN_INSTRUCTIONS:
        baseDate = new Date(booking.checkInDate);
        break;
      case AutomationTrigger.CHECK_OUT_REMINDER:
      case AutomationTrigger.CHECK_OUT_INSTRUCTIONS:
        baseDate = new Date(booking.checkOutDate);
        break;
      case AutomationTrigger.REVIEW_REQUEST:
      case AutomationTrigger.BOOKING_COMPLETED:
        baseDate = new Date(booking.checkOutDate);
        break;
      default:
        baseDate = new Date();
    }

    // Apply offset (in hours)
    if (offset) {
      baseDate.setHours(baseDate.getHours() + offset);
    }

    // Apply specific time of day
    if (timeOfDay) {
      const [hours, minutes] = timeOfDay.split(':').map(Number);
      baseDate.setHours(hours, minutes, 0, 0);
    }

    return baseDate;
  }
}

export const messageSchedulerService = new MessageSchedulerService();
