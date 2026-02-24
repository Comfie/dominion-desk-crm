import { z } from 'zod';
import { TenantStatus, EmploymentStatus, TenantType } from '@prisma/client';

// Employment status enum
export const employmentStatusEnum = z.nativeEnum(EmploymentStatus);

// Tenant type enum
export const tenantTypeEnum = z.nativeEnum(TenantType);

// Tenant status enum
export const tenantStatusEnum = z.nativeEnum(TenantStatus);

/**
 * Create Tenant DTO - includes all fields for tenant creation
 */
export const createTenantSchema = z.object({
  // Required fields
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),

  // Optional personal info
  alternatePhone: z.string().optional().nullable(),
  idNumber: z.string().optional().nullable(),
  idType: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  currentAddress: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),

  // Employment info
  employmentStatus: employmentStatusEnum.optional().nullable(),
  employer: z.string().optional().nullable(),
  employerPhone: z.string().optional().nullable(),
  monthlyIncome: z.number().optional().nullable(),

  // Emergency contact
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),

  // Tenant classification
  tenantType: tenantTypeEnum.default('TENANT'),
  notes: z.string().optional().nullable(),

  // Portal access - when enabled, creates User account with auto-generated password
  createPortalAccess: z.boolean().optional().default(false),

  // Property assignment - optionally link tenant to property
  assignProperty: z.boolean().optional().default(false),
  propertyId: z.string().optional().nullable(),
  leaseStartDate: z.string().optional().nullable(),
  leaseEndDate: z.string().optional().nullable(),
  propertyMonthlyRent: z.number().optional().nullable(),
  propertyDepositPaid: z.number().optional().nullable(),
  propertyMoveInDate: z.string().optional().nullable(),
  propertyUnitLabel: z.string().optional().nullable(),
});

export type CreateTenantDTO = z.infer<typeof createTenantSchema>;

/**
 * Update Tenant DTO - all fields optional
 */
export const updateTenantSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  alternatePhone: z.string().optional().nullable(),
  idNumber: z.string().optional().nullable(),
  idType: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  currentAddress: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  employmentStatus: employmentStatusEnum.optional().nullable(),
  employer: z.string().optional().nullable(),
  employerPhone: z.string().optional().nullable(),
  monthlyIncome: z.number().optional().nullable(),
  emergencyContactName: z.string().optional().nullable(),
  emergencyContactPhone: z.string().optional().nullable(),
  emergencyContactRelation: z.string().optional().nullable(),
  tenantType: tenantTypeEnum.optional(),
  notes: z.string().optional().nullable(),
  status: tenantStatusEnum.optional(),
});

export type UpdateTenantDTO = z.infer<typeof updateTenantSchema>;

/**
 * List Tenants Query DTO
 */
export const listTenantsSchema = z.object({
  search: z.string().optional(),
  status: tenantStatusEnum.optional(),
  type: tenantTypeEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ListTenantsDTO = z.infer<typeof listTenantsSchema>;

/**
 * Tenant ID Param DTO
 */
export const tenantIdSchema = z.object({
  id: z.string().min(1, 'Tenant ID is required'),
});

export type TenantIdDTO = z.infer<typeof tenantIdSchema>;

/**
 * Property Assignment DTO - for linking tenant to property
 */
export const propertyAssignmentSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  leaseStartDate: z.string().min(1, 'Lease start date is required'),
  leaseEndDate: z.string().optional().nullable(),
  monthlyRent: z.number().positive('Monthly rent must be positive'),
  depositPaid: z.number().min(0).optional().default(0),
  moveInDate: z.string().optional().nullable(),
  unitLabel: z.string().optional().nullable(),
});

export type PropertyAssignmentDTO = z.infer<typeof propertyAssignmentSchema>;

/**
 * Update Status DTO
 */
export const updateTenantStatusSchema = z.object({
  status: tenantStatusEnum,
});

export type UpdateTenantStatusDTO = z.infer<typeof updateTenantStatusSchema>;
