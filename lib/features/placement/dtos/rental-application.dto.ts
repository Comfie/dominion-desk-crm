import { RentalApplicationStatus } from '@prisma/client';
import { z } from 'zod';

export const rentalApplicationStatusEnum = z.nativeEnum(RentalApplicationStatus);

export const createRentalApplicationSchema = z
  .object({
    propertyId: z.string().min(1, 'Property is required'),
    inquiryId: z.string().optional().nullable(),
    tenantId: z.string().optional().nullable(),
    applicantFirstName: z.string().min(1, 'Applicant first name is required'),
    applicantLastName: z.string().min(1, 'Applicant last name is required'),
    applicantEmail: z.string().email('Invalid applicant email'),
    applicantPhone: z.string().optional().nullable(),
    idNumber: z.string().optional().nullable(),
    requestedMoveInDate: z.string().optional().nullable(),
    proposedLeaseStartDate: z.string().optional().nullable(),
    proposedLeaseEndDate: z.string().optional().nullable(),
    proposedMonthlyRent: z.number().positive('Proposed monthly rent must be positive').optional(),
    proposedDeposit: z.number().min(0, 'Proposed deposit cannot be negative').optional(),
    assignedTo: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.proposedLeaseStartDate && data.proposedLeaseEndDate) {
      const startDate = new Date(data.proposedLeaseStartDate);
      const endDate = new Date(data.proposedLeaseEndDate);

      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return;
      }

      if (endDate <= startDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Proposed lease end date must be after start date',
          path: ['proposedLeaseEndDate'],
        });
      }
    }
  });

export type CreateRentalApplicationDTO = z.infer<typeof createRentalApplicationSchema>;

export const listRentalApplicationsSchema = z.object({
  status: rentalApplicationStatusEnum.optional(),
  propertyId: z.string().optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ListRentalApplicationsDTO = z.infer<typeof listRentalApplicationsSchema>;
