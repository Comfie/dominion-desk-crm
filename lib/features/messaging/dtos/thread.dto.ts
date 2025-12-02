import { z } from 'zod';
import { Priority, MessageType } from '@prisma/client';

export const createThreadSchema = z.object({
  participantName: z.string().min(1),
  participantEmail: z.string().email().optional(),
  participantPhone: z.string().optional(),
  subject: z.string().optional(),
  bookingId: z.string().optional(),
  tenantId: z.string().optional(),
  propertyId: z.string().optional(),
  initialMessage: z.string().min(1),
});

export const updateThreadSchema = z.object({
  isRead: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  priority: z.nativeEnum(Priority).optional(),
  tags: z.array(z.string()).optional(),
});

export const replyToThreadSchema = z.object({
  message: z.string().min(1),
  messageType: z.nativeEnum(MessageType),
});

export type CreateThreadDto = z.infer<typeof createThreadSchema>;
export type UpdateThreadDto = z.infer<typeof updateThreadSchema>;
export type ReplyToThreadDto = z.infer<typeof replyToThreadSchema>;
