import {
  LandlordOwnerStatus,
  MandateExclusivity,
  MandateStatus,
  MandateType,
} from '@prisma/client';
import { z } from 'zod';

export const landlordOwnerStatusEnum = z.nativeEnum(LandlordOwnerStatus);
export const mandateTypeEnum = z.nativeEnum(MandateType);
export const mandateExclusivityEnum = z.nativeEnum(MandateExclusivity);
export const mandateStatusEnum = z.nativeEnum(MandateStatus);

const landlordOwnerBaseSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  companyName: z.string().optional().nullable(),
  email: z.string().email('Invalid email'),
  phone: z.string().optional().nullable(),
  alternatePhone: z.string().optional().nullable(),
  idNumber: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  vatNumber: z.string().optional().nullable(),
  vatRegistered: z.boolean(),
  status: landlordOwnerStatusEnum,
  notes: z.string().optional().nullable(),
});

export const createLandlordOwnerSchema = landlordOwnerBaseSchema.extend({
  vatRegistered: z.boolean().default(false),
  status: landlordOwnerStatusEnum.default('ACTIVE'),
});

export type CreateLandlordOwnerDTO = z.infer<typeof createLandlordOwnerSchema>;

export const updateLandlordOwnerSchema = landlordOwnerBaseSchema.partial();

export type UpdateLandlordOwnerDTO = z.infer<typeof updateLandlordOwnerSchema>;

export const listLandlordOwnersSchema = z.object({
  status: landlordOwnerStatusEnum.optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ListLandlordOwnersDTO = z.infer<typeof listLandlordOwnersSchema>;

const feePercentageSchema = z
  .number()
  .min(0, 'Fee percentage cannot be negative')
  .max(100, 'Fee percentage cannot exceed 100')
  .optional()
  .nullable();

const rentalMandateBaseSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  landlordOwnerId: z.string().optional().nullable(),
  mandateType: mandateTypeEnum,
  exclusivity: mandateExclusivityEnum,
  status: mandateStatusEnum,
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  placementFeePercentage: feePercentageSchema,
  managementFeePercentage: feePercentageSchema,
  vatApplicable: z.boolean(),
  mandateDocumentUrl: z.string().url('Mandate document URL must be valid').optional().nullable(),
  notes: z.string().optional().nullable(),
});

function validateMandateDateRange(
  data: { startDate?: string | null; endDate?: string | null },
  ctx: z.RefinementCtx
) {
  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return;
    }

    if (endDate <= startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Mandate end date must be after start date',
        path: ['endDate'],
      });
    }
  }
}

export const createRentalMandateSchema = rentalMandateBaseSchema
  .extend({
    exclusivity: mandateExclusivityEnum.default('OPEN'),
    status: mandateStatusEnum.default('DRAFT'),
    vatApplicable: z.boolean().default(true),
  })
  .superRefine(validateMandateDateRange);

export type CreateRentalMandateDTO = z.infer<typeof createRentalMandateSchema>;

export const updateRentalMandateSchema = rentalMandateBaseSchema
  .partial()
  .superRefine(validateMandateDateRange);

export type UpdateRentalMandateDTO = z.infer<typeof updateRentalMandateSchema>;

export const listRentalMandatesSchema = z.object({
  status: mandateStatusEnum.optional(),
  propertyId: z.string().optional(),
  landlordOwnerId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ListRentalMandatesDTO = z.infer<typeof listRentalMandatesSchema>;
