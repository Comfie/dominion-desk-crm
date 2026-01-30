/**
 * Tenants Feature Module
 * Exports all tenant-related functionality
 */

// Repository
export { tenantRepository, TenantRepository } from './repositories/tenant.repository';

// Service
export { tenantService, TenantService } from './services/tenant.service';

// DTOs and Validators
export {
  // Schemas
  createTenantSchema,
  updateTenantSchema,
  listTenantsSchema,
  tenantIdSchema,
  updateTenantStatusSchema,
  propertyAssignmentSchema,
  // Enums
  employmentStatusEnum,
  tenantTypeEnum,
  tenantStatusEnum,
  // Types
  type CreateTenantDTO,
  type UpdateTenantDTO,
  type ListTenantsDTO,
  type TenantIdDTO,
  type UpdateTenantStatusDTO,
  type PropertyAssignmentDTO,
} from './dtos/tenant.dto';
