import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError, ValidationError } from '@/lib/shared/errors/app-error';
import { rentalApplicationRepository } from '../repositories/rental-application.repository';
import { RentalApplicationService } from '../services/rental-application.service';
import type { CreateRentalApplicationDTO } from '../dtos/rental-application.dto';

vi.mock('../repositories/rental-application.repository', () => ({
  rentalApplicationRepository: {
    findPropertyForUser: vi.fn(),
    findInquiryForUser: vi.fn(),
    findTenantForUser: vi.fn(),
    createWithScreening: vi.fn(),
    list: vi.fn(),
  },
}));

describe('RentalApplicationService', () => {
  const userId = 'agency-1';
  let service: RentalApplicationService;

  const validData: CreateRentalApplicationDTO = {
    propertyId: 'property-1',
    inquiryId: 'inquiry-1',
    applicantFirstName: 'Lerato',
    applicantLastName: 'Mokoena',
    applicantEmail: 'lerato@example.com',
    applicantPhone: '0821234567',
    proposedLeaseStartDate: '2026-08-01',
    proposedLeaseEndDate: '2027-07-31',
    proposedMonthlyRent: 14500,
    proposedDeposit: 29000,
  };

  beforeEach(() => {
    service = new RentalApplicationService();
    vi.clearAllMocks();
  });

  it('creates an application with initial screening after validating ownership', async () => {
    const createdApplication = {
      id: 'application-1',
      userId,
      propertyId: validData.propertyId,
      status: 'APPLICATION_RECEIVED',
      applicantEmail: validData.applicantEmail,
      screening: { overallStatus: 'NOT_STARTED' },
    };

    vi.mocked(rentalApplicationRepository.findPropertyForUser).mockResolvedValue({
      id: 'property-1',
      userId,
    } as never);
    vi.mocked(rentalApplicationRepository.findInquiryForUser).mockResolvedValue({
      id: 'inquiry-1',
      propertyId: 'property-1',
      userId,
    } as never);
    vi.mocked(rentalApplicationRepository.createWithScreening).mockResolvedValue(
      createdApplication as never
    );

    const result = await service.createRentalApplication(userId, validData);

    expect(result).toEqual(createdApplication);
    expect(rentalApplicationRepository.createWithScreening).toHaveBeenCalledWith(
      userId,
      expect.objectContaining({
        ...validData,
        status: 'APPLICATION_RECEIVED',
      })
    );
  });

  it('rejects applications for properties outside the agency workspace', async () => {
    vi.mocked(rentalApplicationRepository.findPropertyForUser).mockResolvedValue(null);

    await expect(service.createRentalApplication(userId, validData)).rejects.toBeInstanceOf(
      NotFoundError
    );

    expect(rentalApplicationRepository.createWithScreening).not.toHaveBeenCalled();
  });

  it('rejects inquiries that do not belong to the agency workspace', async () => {
    vi.mocked(rentalApplicationRepository.findPropertyForUser).mockResolvedValue({
      id: 'property-1',
      userId,
    } as never);
    vi.mocked(rentalApplicationRepository.findInquiryForUser).mockResolvedValue(null);

    await expect(service.createRentalApplication(userId, validData)).rejects.toBeInstanceOf(
      NotFoundError
    );

    expect(rentalApplicationRepository.createWithScreening).not.toHaveBeenCalled();
  });

  it('rejects inquiries linked to a different property', async () => {
    vi.mocked(rentalApplicationRepository.findPropertyForUser).mockResolvedValue({
      id: 'property-1',
      userId,
    } as never);
    vi.mocked(rentalApplicationRepository.findInquiryForUser).mockResolvedValue({
      id: 'inquiry-1',
      propertyId: 'other-property',
      userId,
    } as never);

    await expect(service.createRentalApplication(userId, validData)).rejects.toBeInstanceOf(
      ValidationError
    );

    expect(rentalApplicationRepository.createWithScreening).not.toHaveBeenCalled();
  });
});
