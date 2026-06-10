import { z } from 'zod';
import { MaintenanceStatus, Priority, MaintenanceCategory } from '@prisma/client';

export const maintenanceImageSchema = z.object({
  url: z.string().url(),
  name: z.string().min(1).max(255),
  size: z
    .number()
    .int()
    .positive()
    .max(8 * 1024 * 1024),
  type: z.string().startsWith('image/'),
});

/**
 * Create Maintenance Request DTO
 */
export const createMaintenanceSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  tenantId: z.string().min(1).optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  category: z.nativeEnum(MaintenanceCategory),
  priority: z.nativeEnum(Priority).default('NORMAL'),
  scheduledDate: z.coerce.date().optional(),
  estimatedCost: z.number().min(0).optional(),
  images: z.array(maintenanceImageSchema).max(5, 'Maximum 5 photos allowed').optional(),
});

export type CreateMaintenanceDTO = z.infer<typeof createMaintenanceSchema>;
export type MaintenanceImageDTO = z.infer<typeof maintenanceImageSchema>;

/**
 * Update Maintenance Request DTO
 */
export const updateMaintenanceSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  category: z.nativeEnum(MaintenanceCategory).optional(),
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(MaintenanceStatus).optional(),
  scheduledDate: z.coerce.date().optional(),
  completedDate: z.coerce.date().optional(),
  estimatedCost: z.number().min(0).optional(),
  actualCost: z.number().min(0).optional(),
  assignedTo: z.string().max(200).optional(),
  resolutionNotes: z.string().max(2000).optional(),
});

export type UpdateMaintenanceDTO = z.infer<typeof updateMaintenanceSchema>;

/**
 * List Maintenance Requests Query DTO
 */
export const listMaintenanceSchema = z.object({
  propertyId: z.string().min(1).optional(),
  status: z.nativeEnum(MaintenanceStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  category: z.nativeEnum(MaintenanceCategory).optional(),
  search: z.string().max(200).optional(),
});

export type ListMaintenanceDTO = z.infer<typeof listMaintenanceSchema>;

/**
 * Maintenance Request ID Param DTO
 */
export const maintenanceIdSchema = z.object({
  id: z.string().min(1, 'Maintenance request ID is required'),
});

export type MaintenanceIdDTO = z.infer<typeof maintenanceIdSchema>;

/**
 * Update Status DTO
 */
export const updateMaintenanceStatusSchema = z.object({
  status: z.nativeEnum(MaintenanceStatus),
  resolutionNotes: z.string().max(2000).optional(),
});

export type UpdateMaintenanceStatusDTO = z.infer<typeof updateMaintenanceStatusSchema>;

/**
 * Assign Maintenance DTO
 */
export const assignMaintenanceSchema = z.object({
  assignedTo: z.string().min(2).max(200),
});

export type AssignMaintenanceDTO = z.infer<typeof assignMaintenanceSchema>;
