import type {
  ReferenceCheckStatus,
  RentalApplicationStatus,
  ScreeningStatus,
} from '@prisma/client';

import { NotFoundError } from '@/lib/shared/errors/app-error';
import type { UpdateApplicantScreeningDTO } from '../dtos/screening.dto';
import {
  screeningRepository,
  type ScreeningUpdateData,
} from '../repositories/screening.repository';

type ScreeningState = {
  creditCheckStatus: ScreeningStatus;
  affordabilityStatus: ScreeningStatus;
  employerReferenceStatus: ReferenceCheckStatus;
  landlordReferenceStatus: ReferenceCheckStatus;
  ficaStatus: ScreeningStatus;
  consentReceived: boolean;
  declaredMonthlyIncome: unknown;
  riskScore: number | null;
  notes: string | null;
};

function deriveOverallStatus(screening: ScreeningState): ScreeningStatus {
  const screeningChecks = [
    screening.creditCheckStatus,
    screening.affordabilityStatus,
    screening.ficaStatus,
  ];
  const referenceChecks = [screening.employerReferenceStatus, screening.landlordReferenceStatus];

  if (screeningChecks.includes('FAILED') || referenceChecks.includes('FAILED')) {
    return 'FAILED';
  }

  if (screeningChecks.includes('NEEDS_REVIEW')) {
    return 'NEEDS_REVIEW';
  }

  const allChecksPassed =
    screeningChecks.every((status) => status === 'PASSED') &&
    referenceChecks.every((status) => status === 'PASSED') &&
    screening.consentReceived;

  if (allChecksPassed) {
    return 'PASSED';
  }

  const untouched =
    screeningChecks.every((status) => status === 'NOT_STARTED') &&
    referenceChecks.every((status) => status === 'NOT_REQUESTED') &&
    !screening.consentReceived &&
    screening.declaredMonthlyIncome === null &&
    screening.riskScore === null &&
    !screening.notes;

  return untouched ? 'NOT_STARTED' : 'PENDING';
}

function getApplicationStatus(
  currentStatus: RentalApplicationStatus,
  overallStatus: ScreeningStatus
) {
  if (
    overallStatus !== 'NOT_STARTED' &&
    (currentStatus === 'NEW' || currentStatus === 'APPLICATION_RECEIVED')
  ) {
    return 'SCREENING' as const;
  }

  return undefined;
}

export class ScreeningService {
  async updateScreening(
    userId: string,
    rentalApplicationId: string,
    data: UpdateApplicantScreeningDTO
  ) {
    const screening = await screeningRepository.findForApplication(userId, rentalApplicationId);

    if (!screening) {
      throw new NotFoundError('RentalApplication', rentalApplicationId);
    }

    const mergedState: ScreeningState = {
      creditCheckStatus: data.creditCheckStatus ?? screening.creditCheckStatus,
      affordabilityStatus: data.affordabilityStatus ?? screening.affordabilityStatus,
      employerReferenceStatus: data.employerReferenceStatus ?? screening.employerReferenceStatus,
      landlordReferenceStatus: data.landlordReferenceStatus ?? screening.landlordReferenceStatus,
      ficaStatus: data.ficaStatus ?? screening.ficaStatus,
      consentReceived: data.consentReceived ?? screening.consentReceived,
      declaredMonthlyIncome:
        data.declaredMonthlyIncome === undefined
          ? screening.declaredMonthlyIncome
          : data.declaredMonthlyIncome,
      riskScore: data.riskScore === undefined ? screening.riskScore : data.riskScore,
      notes: data.notes === undefined ? screening.notes : data.notes,
    };
    const overallStatus = deriveOverallStatus(mergedState);
    const proposedMonthlyRent = screening.rentalApplication.proposedMonthlyRent;
    const income =
      data.declaredMonthlyIncome === undefined
        ? screening.declaredMonthlyIncome
        : data.declaredMonthlyIncome;
    const numericIncome = income === null ? null : Number(income);
    const rentToIncomeRatio =
      numericIncome && proposedMonthlyRent
        ? Number(((Number(proposedMonthlyRent) / numericIncome) * 100).toFixed(2))
        : income === undefined
          ? undefined
          : null;
    const updateData: ScreeningUpdateData = {
      ...data,
      overallStatus,
      rentToIncomeRatio,
      applicationStatus: getApplicationStatus(screening.rentalApplication.status, overallStatus),
    };

    if (data.consentReceived !== undefined) {
      updateData.consentReceivedAt = data.consentReceived ? new Date() : null;
    }

    return screeningRepository.update(screening.id, updateData);
  }
}

export const screeningService = new ScreeningService();
