import { AvailabilityError, NotFoundError, ValidationError } from '@/lib/shared/errors/app-error';
import { viewingRepository } from '../repositories/viewing.repository';
import type { CreateViewingDTO, ListViewingsDTO, UpdateViewingDTO } from '../dtos/viewing.dto';

export class ViewingService {
  async createViewing(userId: string, data: CreateViewingDTO) {
    const property = await viewingRepository.findPropertyForUser(userId, data.propertyId);

    if (!property) {
      throw new NotFoundError('Property', data.propertyId);
    }

    if (data.inquiryId) {
      const inquiry = await viewingRepository.findInquiryForUser(userId, data.inquiryId);

      if (!inquiry) {
        throw new NotFoundError('Inquiry', data.inquiryId);
      }

      if (inquiry.propertyId && inquiry.propertyId !== data.propertyId) {
        throw new ValidationError('Inquiry is linked to a different property', {
          inquiryId: data.inquiryId,
          inquiryPropertyId: inquiry.propertyId,
          viewingPropertyId: data.propertyId,
        });
      }
    }

    if (data.rentalApplicationId) {
      const application = await viewingRepository.findRentalApplicationForUser(
        userId,
        data.rentalApplicationId
      );

      if (!application) {
        throw new NotFoundError('RentalApplication', data.rentalApplicationId);
      }

      if (application.propertyId !== data.propertyId) {
        throw new ValidationError('Application is linked to a different property', {
          rentalApplicationId: data.rentalApplicationId,
          applicationPropertyId: application.propertyId,
          viewingPropertyId: data.propertyId,
        });
      }
    }

    const conflict = await viewingRepository.findConflictingViewing(
      userId,
      data.propertyId,
      new Date(data.scheduledFor),
      data.durationMinutes
    );

    if (conflict) {
      throw new AvailabilityError('A viewing is already scheduled for this property at that time', {
        viewingId: conflict.id,
      });
    }

    return viewingRepository.create(userId, data);
  }

  async updateViewing(userId: string, viewingId: string, data: UpdateViewingDTO) {
    const viewing = await viewingRepository.findByIdForUser(userId, viewingId);

    if (!viewing) {
      throw new NotFoundError('Viewing', viewingId);
    }

    if (data.scheduledFor || data.durationMinutes) {
      const scheduledFor = data.scheduledFor ? new Date(data.scheduledFor) : viewing.scheduledFor;
      const durationMinutes = data.durationMinutes || viewing.durationMinutes;
      const conflict = await viewingRepository.findConflictingViewing(
        userId,
        viewing.propertyId,
        scheduledFor,
        durationMinutes,
        viewingId
      );

      if (conflict) {
        throw new AvailabilityError(
          'A viewing is already scheduled for this property at that time',
          {
            viewingId: conflict.id,
          }
        );
      }
    }

    const attendedAt =
      data.status === 'ATTENDED' || data.status === 'COMPLETED'
        ? data.attendedAt || new Date()
        : data.attendedAt;

    return viewingRepository.update(viewingId, {
      ...data,
      attendedAt,
    });
  }

  async list(userId: string, filters: ListViewingsDTO) {
    return viewingRepository.list(userId, filters);
  }
}

export const viewingService = new ViewingService();
