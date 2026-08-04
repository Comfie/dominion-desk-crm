import { NotFoundError, ValidationError } from '@/lib/shared/errors/app-error';
import type { CompletePlacementDTO } from '../dtos/placement-completion.dto';
import { placementCompletionRepository } from '../repositories/placement-completion.repository';

const FINAL_APPLICATION_STATUSES = new Set(['PLACED', 'REJECTED', 'WITHDRAWN']);

export class PlacementCompletionService {
  async completePlacement(userId: string, applicationId: string, data: CompletePlacementDTO) {
    const application = await placementCompletionRepository.findApplication(userId, applicationId);

    if (!application) {
      throw new NotFoundError('Rental application', applicationId);
    }

    if (application.screening?.overallStatus !== 'PASSED') {
      throw new ValidationError('Applicant screening must be passed before placement');
    }

    if (FINAL_APPLICATION_STATUSES.has(application.status)) {
      throw new ValidationError(`Applications with status ${application.status} cannot be placed`);
    }

    return placementCompletionRepository.complete(userId, applicationId, data);
  }
}

export const placementCompletionService = new PlacementCompletionService();
