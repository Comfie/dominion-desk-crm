import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '@/lib/shared/errors/app-error';
import { mandateRepository } from '../repositories/mandate.repository';
import { MandateService } from '../services/mandate.service';
import type { CreateLandlordOwnerDTO, CreateRentalMandateDTO } from '../dtos/mandate.dto';

vi.mock('../repositories/mandate.repository', () => ({
  mandateRepository: {
    createLandlordOwner: vi.fn(),
    listLandlordOwners: vi.fn(),
    findLandlordOwnerForUser: vi.fn(),
    updateLandlordOwner: vi.fn(),
    findPropertyForUser: vi.fn(),
    createRentalMandate: vi.fn(),
    findRentalMandateForUser: vi.fn(),
    updateRentalMandate: vi.fn(),
    listRentalMandates: vi.fn(),
  },
}));

describe('MandateService', () => {
  const userId = 'agency-1';
  let service: MandateService;

  const landlordData: CreateLandlordOwnerDTO = {
    firstName: 'Ayesha',
    lastName: 'Khan',
    email: 'ayesha@example.com',
    vatRegistered: true,
    status: 'ACTIVE',
  };

  const mandateData: CreateRentalMandateDTO = {
    propertyId: 'property-1',
    landlordOwnerId: 'landlord-1',
    mandateType: 'MANAGED_RENTAL',
    exclusivity: 'SOLE',
    status: 'ACTIVE',
    startDate: '2026-08-01',
    endDate: '2027-07-31',
    placementFeePercentage: 6.5,
    managementFeePercentage: 8,
    vatApplicable: true,
  };

  beforeEach(() => {
    service = new MandateService();
    vi.clearAllMocks();
  });

  it('creates a landlord owner for the agency workspace', async () => {
    const createdLandlord = { id: 'landlord-1', userId, ...landlordData };

    vi.mocked(mandateRepository.createLandlordOwner).mockResolvedValue(createdLandlord as never);

    const result = await service.createLandlordOwner(userId, landlordData);

    expect(result).toEqual(createdLandlord);
    expect(mandateRepository.createLandlordOwner).toHaveBeenCalledWith(userId, landlordData);
  });

  it('creates a mandate after validating property and landlord ownership', async () => {
    const createdMandate = { id: 'mandate-1', userId, ...mandateData };

    vi.mocked(mandateRepository.findPropertyForUser).mockResolvedValue({
      id: 'property-1',
      userId,
    } as never);
    vi.mocked(mandateRepository.findLandlordOwnerForUser).mockResolvedValue({
      id: 'landlord-1',
      userId,
    } as never);
    vi.mocked(mandateRepository.createRentalMandate).mockResolvedValue(createdMandate as never);

    const result = await service.createRentalMandate(userId, mandateData);

    expect(result).toEqual(createdMandate);
    expect(mandateRepository.createRentalMandate).toHaveBeenCalledWith(userId, mandateData);
  });

  it('rejects mandates for properties outside the agency workspace', async () => {
    vi.mocked(mandateRepository.findPropertyForUser).mockResolvedValue(null);

    await expect(service.createRentalMandate(userId, mandateData)).rejects.toBeInstanceOf(
      NotFoundError
    );

    expect(mandateRepository.createRentalMandate).not.toHaveBeenCalled();
  });

  it('rejects mandates linked to landlords outside the agency workspace', async () => {
    vi.mocked(mandateRepository.findPropertyForUser).mockResolvedValue({
      id: 'property-1',
      userId,
    } as never);
    vi.mocked(mandateRepository.findLandlordOwnerForUser).mockResolvedValue(null);

    await expect(service.createRentalMandate(userId, mandateData)).rejects.toBeInstanceOf(
      NotFoundError
    );

    expect(mandateRepository.createRentalMandate).not.toHaveBeenCalled();
  });

  it('updates a landlord owner after validating ownership', async () => {
    vi.mocked(mandateRepository.findLandlordOwnerForUser).mockResolvedValue({
      id: 'landlord-1',
      userId,
    } as never);
    vi.mocked(mandateRepository.updateLandlordOwner).mockResolvedValue({
      id: 'landlord-1',
      phone: '0837654321',
    } as never);

    await service.updateLandlordOwner(userId, 'landlord-1', { phone: '0837654321' });

    expect(mandateRepository.updateLandlordOwner).toHaveBeenCalledWith('landlord-1', {
      phone: '0837654321',
    });
  });

  it('updates a mandate after validating mandate, property, and landlord ownership', async () => {
    vi.mocked(mandateRepository.findRentalMandateForUser).mockResolvedValue({
      id: 'mandate-1',
      userId,
    } as never);
    vi.mocked(mandateRepository.findPropertyForUser).mockResolvedValue({
      id: 'property-1',
      userId,
    } as never);
    vi.mocked(mandateRepository.findLandlordOwnerForUser).mockResolvedValue({
      id: 'landlord-1',
      userId,
    } as never);
    vi.mocked(mandateRepository.updateRentalMandate).mockResolvedValue({
      id: 'mandate-1',
      status: 'ACTIVE',
    } as never);

    await service.updateRentalMandate(userId, 'mandate-1', {
      propertyId: 'property-1',
      landlordOwnerId: 'landlord-1',
      status: 'ACTIVE',
    });

    expect(mandateRepository.updateRentalMandate).toHaveBeenCalledWith('mandate-1', {
      propertyId: 'property-1',
      landlordOwnerId: 'landlord-1',
      status: 'ACTIVE',
    });
  });
});
