import { z } from 'zod';
import { MessageType, ScheduledMessageStatus } from '@prisma/client';

export const createScheduledMessageSchema = z.object({
  automationId: z.string().optional(),
  bookingId: z.string().optional(),
  tenantId: z.string().optional(),
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().optional(),
  recipientName: z.string().min(1),
  messageType: z.nativeEnum(MessageType),
  subject: z.string().optional(),
  body: z.string().min(1),
  scheduledFor: z.coerce.date(),
});

export const updateScheduledMessageSchema = z.object({
  scheduledFor: z.coerce.date().optional(),
  status: z.nativeEnum(ScheduledMessageStatus).optional(),
});

export type CreateScheduledMessageDto = z.infer<typeof createScheduledMessageSchema>;
export type UpdateScheduledMessageDto = z.infer<typeof updateScheduledMessageSchema>;
