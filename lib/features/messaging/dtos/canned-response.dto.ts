import { z } from 'zod';

export const createCannedResponseSchema = z.object({
  title: z.string().min(1).max(100),
  shortcut: z.string().max(20).optional(),
  content: z.string().min(1),
  category: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
});

export const updateCannedResponseSchema = createCannedResponseSchema.partial();

export type CreateCannedResponseDto = z.infer<typeof createCannedResponseSchema>;
export type UpdateCannedResponseDto = z.infer<typeof updateCannedResponseSchema>;
