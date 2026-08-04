import { ViewingStatus } from '@prisma/client';
import { z } from 'zod';

export const viewingStatusEnum = z.nativeEnum(ViewingStatus);

function hasContactChannel(data: { contactEmail?: string | null; contactPhone?: string | null }) {
  return Boolean(data.contactEmail?.trim() || data.contactPhone?.trim());
}

export const createViewingSchema = z
  .object({
    propertyId: z.string().min(1, 'Property is required'),
    inquiryId: z.string().optional().nullable(),
    rentalApplicationId: z.string().optional().nullable(),
    contactName: z.string().min(1, 'Contact name is required'),
    contactEmail: z
      .union([z.string().email('Invalid contact email'), z.literal('')])
      .optional()
      .nullable(),
    contactPhone: z.string().optional().nullable(),
    scheduledFor: z.string().min(1, 'Viewing date and time is required'),
    durationMinutes: z
      .number()
      .int()
      .min(15, 'Viewing duration must be at least 15 minutes')
      .max(180, 'Viewing duration cannot exceed 180 minutes')
      .default(30),
    assignedTo: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (!hasContactChannel(data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Contact email or phone is required',
        path: ['contactEmail'],
      });
    }

    const scheduledFor = new Date(data.scheduledFor);
    if (Number.isNaN(scheduledFor.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Viewing date and time is invalid',
        path: ['scheduledFor'],
      });
    }
  });

export type CreateViewingDTO = z.infer<typeof createViewingSchema>;

export const updateViewingSchema = z
  .object({
    scheduledFor: z.string().optional(),
    durationMinutes: z.number().int().min(15).max(180).optional(),
    status: viewingStatusEnum.optional(),
    attendedAt: z.string().optional().nullable(),
    assignedTo: z.string().optional().nullable(),
    feedback: z.string().optional().nullable(),
    followUpNotes: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.scheduledFor) {
      const scheduledFor = new Date(data.scheduledFor);
      if (Number.isNaN(scheduledFor.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Viewing date and time is invalid',
          path: ['scheduledFor'],
        });
      }
    }
  });

export type UpdateViewingDTO = z.infer<typeof updateViewingSchema>;

export const listViewingsSchema = z.object({
  status: viewingStatusEnum.optional(),
  propertyId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ListViewingsDTO = z.infer<typeof listViewingsSchema>;
