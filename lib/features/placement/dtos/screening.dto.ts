import { ReferenceCheckStatus, ScreeningStatus } from '@prisma/client';
import { z } from 'zod';

export const screeningStatusEnum = z.nativeEnum(ScreeningStatus);
export const referenceCheckStatusEnum = z.nativeEnum(ReferenceCheckStatus);

export const updateApplicantScreeningSchema = z
  .object({
    creditCheckStatus: screeningStatusEnum.optional(),
    affordabilityStatus: screeningStatusEnum.optional(),
    employerReferenceStatus: referenceCheckStatusEnum.optional(),
    landlordReferenceStatus: referenceCheckStatusEnum.optional(),
    ficaStatus: screeningStatusEnum.optional(),
    declaredMonthlyIncome: z.number().nonnegative().nullable().optional(),
    riskScore: z.number().int().min(0).max(100).nullable().optional(),
    consentReceived: z.boolean().optional(),
    notes: z.string().max(5000).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one screening field is required',
  });

export type UpdateApplicantScreeningDTO = z.infer<typeof updateApplicantScreeningSchema>;
