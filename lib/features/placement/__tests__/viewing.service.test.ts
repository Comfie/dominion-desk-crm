import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AvailabilityError, NotFoundError, ValidationError } from '@/lib/shared/errors/app-error';
import { viewingRepository } from '../repositories/viewing.repository';
import { ViewingService } from '../services/viewing.service';
import type { CreateViewingDTO, UpdateViewingDTO } from '../dtos/viewing.dto';

vi.mock('../repositories/viewing.repository', () => ({
  viewingRepository: {
    findPropertyForUser: vi.fn(),
    findInquiryForUser: vi.fn(),
    findRentalApplicationForUser: vi.fn(),
    findConflictingViewing: vi.fn(),
    create: vi.fn(),
    findByIdForUser: vi.fn(),
    update: vi.fn(),
    list: vi.fn(),
  },
}));

describe('ViewingService', () => {
  const userId = 'agency-1';
  let service: ViewingService;

  const validData: CreateViewingDTO = {
    propertyId: 'property-1',
    inquiryId: 'inquiry-1',
    rentalApplicationId: 'application-1',
    contactName: 'Lerato Mokoena',
    contactEmail: 'lerato@example.com',
    contactPhone: '0821234567',
    scheduledFor: '2026-08-05T10:00:00.000Z',
    durationMinutes: 45,
    assignedTo: 'agent-1',
  };

  beforeEach(() => {
    service = new ViewingService();
    vi.clearAllMocks();
  });

  it('creates a viewing after validating related records and conflicts', async () => {
    const createdViewing = {
      id: 'viewing-1',
      userId,
      propertyId: validData.propertyId,
      status: 'SCHEDULED',
    };

    vi.mocked(viewingRepository.findPropertyForUser).mockResolvedValue({
      id: 'property-1',
      userId,
    } as never);
    vi.mocked(viewingRepository.findInquiryForUser).mockResolvedValue({
      id: 'inquiry-1',
      propertyId: 'property-1',
      userId,
    } as never);
    vi.mocked(viewingRepository.findRentalApplicationForUser).mockResolvedValue({
      id: 'application-1',
      propertyId: 'property-1',
      userId,
    } as never);
    vi.mocked(viewingRepository.findConflictingViewing).mockResolvedValue(null);
    vi.mocked(viewingRepository.create).mockResolvedValue(createdViewing as never);

    const result = await service.createViewing(userId, validData);

    expect(result).toEqual(createdViewing);
    expect(viewingRepository.findConflictingViewing).toHaveBeenCalledWith(
      userId,
      'property-1',
      new Date(validData.scheduledFor),
      validData.durationMinutes
    );
    expect(viewingRepository.create).toHaveBeenCalledWith(userId, validData);
  });

  it('rejects viewings for properties outside the agency workspace', async () => {
    vi.mocked(viewingRepository.findPropertyForUser).mockResolvedValue(null);

    await expect(service.createViewing(userId, validData)).rejects.toBeInstanceOf(NotFoundError);

    expect(viewingRepository.create).not.toHaveBeenCalled();
  });

  it('rejects linked inquiries from a different property', async () => {
    vi.mocked(viewingRepository.findPropertyForUser).mockResolvedValue({
      id: 'property-1',
      userId,
    } as never);
    vi.mocked(viewingRepository.findInquiryForUser).mockResolvedValue({
      id: 'inquiry-1',
      propertyId: 'other-property',
      userId,
    } as never);

    await expect(service.createViewing(userId, validData)).rejects.toBeInstanceOf(ValidationError);

    expect(viewingRepository.create).not.toHaveBeenCalled();
  });

  it('rejects overlapping viewings for the same property', async () => {
    vi.mocked(viewingRepository.findPropertyForUser).mockResolvedValue({
      id: 'property-1',
      userId,
    } as never);
    vi.mocked(viewingRepository.findInquiryForUser).mockResolvedValue({
      id: 'inquiry-1',
      propertyId: 'property-1',
      userId,
    } as never);
    vi.mocked(viewingRepository.findRentalApplicationForUser).mockResolvedValue({
      id: 'application-1',
      propertyId: 'property-1',
      userId,
    } as never);
    vi.mocked(viewingRepository.findConflictingViewing).mockResolvedValue({
      id: 'existing-viewing',
    } as never);

    await expect(service.createViewing(userId, validData)).rejects.toBeInstanceOf(
      AvailabilityError
    );

    expect(viewingRepository.create).not.toHaveBeenCalled();
  });

  it('sets attendedAt when a viewing is marked attended', async () => {
    const update: UpdateViewingDTO = {
      status: 'ATTENDED',
      feedback: 'Strong applicant.',
    };

    vi.mocked(viewingRepository.findByIdForUser).mockResolvedValue({
      id: 'viewing-1',
      propertyId: 'property-1',
      scheduledFor: new Date('2026-08-05T10:00:00.000Z'),
      durationMinutes: 45,
    } as never);
    vi.mocked(viewingRepository.update).mockResolvedValue({
      id: 'viewing-1',
      status: 'ATTENDED',
      attendedAt: new Date('2026-08-05T10:30:00.000Z'),
    } as never);

    await service.updateViewing(userId, 'viewing-1', update);

    expect(viewingRepository.update).toHaveBeenCalledWith(
      'viewing-1',
      expect.objectContaining({
        status: 'ATTENDED',
        attendedAt: expect.any(Date),
        feedback: 'Strong applicant.',
      })
    );
  });
});
