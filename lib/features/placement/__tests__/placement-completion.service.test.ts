import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError, ValidationError } from '@/lib/shared/errors/app-error';
import type { CompletePlacementDTO } from '../dtos/placement-completion.dto';
import { placementCompletionRepository } from '../repositories/placement-completion.repository';
import { PlacementCompletionService } from '../services/placement-completion.service';

vi.mock('../repositories/placement-completion.repository', () => ({
  placementCompletionRepository: {
    findApplication: vi.fn(),
    complete: vi.fn(),
  },
}));

describe('PlacementCompletionService', () => {
  const userId = 'agency-1';
  const applicationId = 'application-1';
  const data: CompletePlacementDTO = {
    leaseStartDate: '2026-08-01',
    leaseEndDate: '2027-07-31',
    monthlyRent: 14500,
    depositPaid: 14500,
    moveInDate: '2026-08-01',
    unitLabel: null,
  };
  let service: PlacementCompletionService;

  beforeEach(() => {
    service = new PlacementCompletionService();
    vi.clearAllMocks();
  });

  it('rejects applications outside the agency workspace', async () => {
    vi.mocked(placementCompletionRepository.findApplication).mockResolvedValue(null);

    await expect(service.completePlacement(userId, applicationId, data)).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(placementCompletionRepository.complete).not.toHaveBeenCalled();
  });

  it('requires passed screening', async () => {
    vi.mocked(placementCompletionRepository.findApplication).mockResolvedValue({
      id: applicationId,
      status: 'APPROVED',
      screening: { overallStatus: 'NEEDS_REVIEW' },
    } as never);

    await expect(service.completePlacement(userId, applicationId, data)).rejects.toThrow(
      'Applicant screening must be passed before placement'
    );
    expect(placementCompletionRepository.complete).not.toHaveBeenCalled();
  });

  it.each(['PLACED', 'REJECTED', 'WITHDRAWN'] as const)(
    'rejects applications in the %s state',
    async (status) => {
      vi.mocked(placementCompletionRepository.findApplication).mockResolvedValue({
        id: applicationId,
        status,
        screening: { overallStatus: 'PASSED' },
      } as never);

      await expect(service.completePlacement(userId, applicationId, data)).rejects.toBeInstanceOf(
        ValidationError
      );
      expect(placementCompletionRepository.complete).not.toHaveBeenCalled();
    }
  );

  it('delegates eligible applications to the transactional repository', async () => {
    const completed = {
      application: { id: applicationId, status: 'PLACED', tenantId: 'tenant-1' },
      tenant: {
        id: 'tenant-1',
        firstName: 'Lerato',
        lastName: 'Mokoena',
        email: 'lerato@example.com',
      },
      tenantResolution: 'CREATED',
      portalAccessActive: false,
      nextAction: 'ACTIVATE_PORTAL',
    };

    vi.mocked(placementCompletionRepository.findApplication).mockResolvedValue({
      id: applicationId,
      status: 'APPROVED',
      screening: { overallStatus: 'PASSED' },
    } as never);
    vi.mocked(placementCompletionRepository.complete).mockResolvedValue(completed as never);

    await expect(service.completePlacement(userId, applicationId, data)).resolves.toEqual(
      completed
    );
    expect(placementCompletionRepository.complete).toHaveBeenCalledWith(
      userId,
      applicationId,
      data
    );
  });
});
