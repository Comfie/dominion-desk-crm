import { NotFoundError } from '@/lib/shared/errors/app-error';
import type {
  CreateLandlordOwnerDTO,
  CreateRentalMandateDTO,
  ListLandlordOwnersDTO,
  ListRentalMandatesDTO,
  UpdateLandlordOwnerDTO,
  UpdateRentalMandateDTO,
} from '../dtos/mandate.dto';
import { mandateRepository } from '../repositories/mandate.repository';

export class MandateService {
  async createLandlordOwner(userId: string, data: CreateLandlordOwnerDTO) {
    return mandateRepository.createLandlordOwner(userId, data);
  }

  async listLandlordOwners(userId: string, filters: ListLandlordOwnersDTO) {
    return mandateRepository.listLandlordOwners(userId, filters);
  }

  async updateLandlordOwner(userId: string, landlordOwnerId: string, data: UpdateLandlordOwnerDTO) {
    const landlord = await mandateRepository.findLandlordOwnerForUser(userId, landlordOwnerId);

    if (!landlord) {
      throw new NotFoundError('LandlordOwner', landlordOwnerId);
    }

    return mandateRepository.updateLandlordOwner(landlordOwnerId, data);
  }

  async createRentalMandate(userId: string, data: CreateRentalMandateDTO) {
    const property = await mandateRepository.findPropertyForUser(userId, data.propertyId);

    if (!property) {
      throw new NotFoundError('Property', data.propertyId);
    }

    if (data.landlordOwnerId) {
      const landlord = await mandateRepository.findLandlordOwnerForUser(
        userId,
        data.landlordOwnerId
      );

      if (!landlord) {
        throw new NotFoundError('LandlordOwner', data.landlordOwnerId);
      }
    }

    return mandateRepository.createRentalMandate(userId, data);
  }

  async listRentalMandates(userId: string, filters: ListRentalMandatesDTO) {
    return mandateRepository.listRentalMandates(userId, filters);
  }

  async updateRentalMandate(userId: string, rentalMandateId: string, data: UpdateRentalMandateDTO) {
    const mandate = await mandateRepository.findRentalMandateForUser(userId, rentalMandateId);

    if (!mandate) {
      throw new NotFoundError('RentalMandate', rentalMandateId);
    }

    if (data.propertyId) {
      const property = await mandateRepository.findPropertyForUser(userId, data.propertyId);

      if (!property) {
        throw new NotFoundError('Property', data.propertyId);
      }
    }

    if (data.landlordOwnerId) {
      const landlord = await mandateRepository.findLandlordOwnerForUser(
        userId,
        data.landlordOwnerId
      );

      if (!landlord) {
        throw new NotFoundError('LandlordOwner', data.landlordOwnerId);
      }
    }

    return mandateRepository.updateRentalMandate(rentalMandateId, data);
  }
}

export const mandateService = new MandateService();
