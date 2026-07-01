import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '@/lib/shared/errors/app-error';
import { screeningRepository } from '../repositories/screening.repository';
import { ScreeningService } from '../services/screening.service';

vi.mock('../repositories/screening.repository', () => ({
  screeningRepository: {
    findForApplication: vi.fn(),
    update: vi.fn(),
  },
}));

describe('ScreeningService', () => {
  const userId = 'agency-1';
  const applicationId = 'application-1';
  let service: ScreeningService;

  const currentScreening = {
    id: 'screening-1',
    rentalApplicationId: applicationId,
    overallStatus: 'NOT_STARTED',
    creditCheckStatus: 'NOT_STARTED',
    affordabilityStatus: 'NOT_STARTED',
    employerReferenceStatus: 'NOT_REQUESTED',
    landlordReferenceStatus: 'NOT_REQUESTED',
    ficaStatus: 'NOT_STARTED',
    declaredMonthlyIncome: null,
    rentToIncomeRatio: null,
    riskScore: null,
    consentReceived: false,
    consentReceivedAt: null,
    notes: null,
    rentalApplication: {
      id: applicationId,
      status: 'APPLICATION_RECEIVED',
      proposedMonthlyRent: 12000,
    },
  };

  beforeEach(() => {
    service = new ScreeningService();
    vi.clearAllMocks();
  });

  it('rejects screening updates outside the agency workspace', async () => {
    vi.mocked(screeningRepository.findForApplication).mockResolvedValue(null);

    await expect(
      service.updateScreening(userId, applicationId, { creditCheckStatus: 'PENDING' })
    ).rejects.toBeInstanceOf(NotFoundError);

    expect(screeningRepository.update).not.toHaveBeenCalled();
  });

  it('moves a started checklist to pending and the application to screening', async () => {
    vi.mocked(screeningRepository.findForApplication).mockResolvedValue(currentScreening as never);
    vi.mocked(screeningRepository.update).mockResolvedValue({
      ...currentScreening,
      overallStatus: 'PENDING',
    } as never);

    await service.updateScreening(userId, applicationId, {
      creditCheckStatus: 'PENDING',
    });

    expect(screeningRepository.update).toHaveBeenCalledWith(
      'screening-1',
      expect.objectContaining({
        creditCheckStatus: 'PENDING',
        overallStatus: 'PENDING',
        applicationStatus: 'SCREENING',
      })
    );
  });

  it('marks screening failed when any required check fails', async () => {
    vi.mocked(screeningRepository.findForApplication).mockResolvedValue({
      ...currentScreening,
      creditCheckStatus: 'PASSED',
      affordabilityStatus: 'PASSED',
    } as never);
    vi.mocked(screeningRepository.update).mockResolvedValue({
      ...currentScreening,
      overallStatus: 'FAILED',
    } as never);

    await service.updateScreening(userId, applicationId, {
      landlordReferenceStatus: 'FAILED',
    });

    expect(screeningRepository.update).toHaveBeenCalledWith(
      'screening-1',
      expect.objectContaining({ overallStatus: 'FAILED' })
    );
  });

  it('marks screening passed only when all checks and consent are complete', async () => {
    vi.mocked(screeningRepository.findForApplication).mockResolvedValue({
      ...currentScreening,
      creditCheckStatus: 'PASSED',
      affordabilityStatus: 'PASSED',
      employerReferenceStatus: 'PASSED',
      landlordReferenceStatus: 'PASSED',
      ficaStatus: 'PASSED',
    } as never);
    vi.mocked(screeningRepository.update).mockResolvedValue({
      ...currentScreening,
      overallStatus: 'PASSED',
    } as never);

    await service.updateScreening(userId, applicationId, {
      consentReceived: true,
    });

    expect(screeningRepository.update).toHaveBeenCalledWith(
      'screening-1',
      expect.objectContaining({
        overallStatus: 'PASSED',
        consentReceived: true,
        consentReceivedAt: expect.any(Date),
      })
    );
  });

  it('calculates rent-to-income ratio from the proposed rent and declared income', async () => {
    vi.mocked(screeningRepository.findForApplication).mockResolvedValue(currentScreening as never);
    vi.mocked(screeningRepository.update).mockResolvedValue(currentScreening as never);

    await service.updateScreening(userId, applicationId, {
      declaredMonthlyIncome: 40000,
    });

    expect(screeningRepository.update).toHaveBeenCalledWith(
      'screening-1',
      expect.objectContaining({
        declaredMonthlyIncome: 40000,
        rentToIncomeRatio: 30,
      })
    );
  });
});
