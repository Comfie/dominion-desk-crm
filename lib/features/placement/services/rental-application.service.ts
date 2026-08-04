import { NotFoundError, ValidationError } from '@/lib/shared/errors/app-error';
import { rentalApplicationRepository } from '../repositories/rental-application.repository';
import type {
  CreateRentalApplicationDTO,
  ListRentalApplicationsDTO,
} from '../dtos/rental-application.dto';

export class RentalApplicationService {
  async createRentalApplication(userId: string, data: CreateRentalApplicationDTO) {
    const property = await rentalApplicationRepository.findPropertyForUser(userId, data.propertyId);

    if (!property) {
      throw new NotFoundError('Property', data.propertyId);
    }

    if (data.inquiryId) {
      const inquiry = await rentalApplicationRepository.findInquiryForUser(userId, data.inquiryId);

      if (!inquiry) {
        throw new NotFoundError('Inquiry', data.inquiryId);
      }

      if (inquiry.propertyId && inquiry.propertyId !== data.propertyId) {
        throw new ValidationError('Inquiry is linked to a different property', {
          inquiryId: data.inquiryId,
          inquiryPropertyId: inquiry.propertyId,
          applicationPropertyId: data.propertyId,
        });
      }
    }

    if (data.tenantId) {
      const tenant = await rentalApplicationRepository.findTenantForUser(userId, data.tenantId);

      if (!tenant) {
        throw new NotFoundError('Tenant', data.tenantId);
      }
    }

    return rentalApplicationRepository.createWithScreening(userId, {
      ...data,
      status: 'APPLICATION_RECEIVED',
    });
  }

  async list(userId: string, filters: ListRentalApplicationsDTO) {
    return rentalApplicationRepository.list(userId, filters);
  }
}

export const rentalApplicationService = new RentalApplicationService();
