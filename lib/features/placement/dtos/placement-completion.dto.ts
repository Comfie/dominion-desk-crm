import { z } from 'zod';

import { isValidLeaseDateRange, LEASE_END_DATE_ERROR } from '@/lib/features/tenants/lease-dates';

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? null : value),
  z.string().trim().min(1).nullable().optional()
);

export const completePlacementSchema = z
  .object({
    leaseStartDate: z.string().min(1, 'Lease start date is required'),
    leaseEndDate: optionalTrimmedString,
    monthlyRent: z.number().positive('Monthly rent must be positive'),
    depositPaid: z.number().min(0, 'Deposit paid cannot be negative').default(0),
    moveInDate: optionalTrimmedString,
    unitLabel: optionalTrimmedString,
  })
  .superRefine((data, ctx) => {
    if (data.leaseEndDate && !isValidLeaseDateRange(data.leaseStartDate, data.leaseEndDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: LEASE_END_DATE_ERROR,
        path: ['leaseEndDate'],
      });
    }
  });

export type CompletePlacementDTO = z.infer<typeof completePlacementSchema>;
