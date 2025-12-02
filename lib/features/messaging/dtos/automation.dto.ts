import { z } from 'zod';
import { AutomationTrigger, MessageType, AiTone, RentalType } from '@prisma/client';

export const createAutomationSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  triggerType: z.nativeEnum(AutomationTrigger),
  triggerOffset: z.number().int().optional(),
  triggerTimeOfDay: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  messageType: z.nativeEnum(MessageType),
  subject: z.string().min(1).max(200).optional(),
  bodyTemplate: z.string().min(1),
  useAiEnhancement: z.boolean().default(false),
  aiTone: z.nativeEnum(AiTone).optional(),
  applyToRentalType: z.nativeEnum(RentalType).optional(),
  propertyIds: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

export const updateAutomationSchema = createAutomationSchema.partial();

export const testAutomationSchema = z.object({
  recipientEmail: z.string().email().optional(),
  recipientPhone: z.string().optional(),
  bookingId: z.string().optional(),
  tenantId: z.string().optional(),
});

export type CreateAutomationDto = z.infer<typeof createAutomationSchema>;
export type UpdateAutomationDto = z.infer<typeof updateAutomationSchema>;
export type TestAutomationDto = z.infer<typeof testAutomationSchema>;
