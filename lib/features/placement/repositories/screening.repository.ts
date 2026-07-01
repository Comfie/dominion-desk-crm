import { Prisma, RentalApplicationStatus, ScreeningStatus } from '@prisma/client';

import { prisma } from '@/lib/db';
import type { UpdateApplicantScreeningDTO } from '../dtos/screening.dto';

export type ScreeningUpdateData = UpdateApplicantScreeningDTO & {
  overallStatus: ScreeningStatus;
  rentToIncomeRatio?: number | null;
  consentReceivedAt?: Date | null;
  applicationStatus?: RentalApplicationStatus;
};

export class ScreeningRepository {
  async findForApplication(userId: string, rentalApplicationId: string) {
    return prisma.applicantScreening.findFirst({
      where: {
        userId,
        rentalApplicationId,
        rentalApplication: { userId },
      },
      include: {
        rentalApplication: {
          select: {
            id: true,
            status: true,
            proposedMonthlyRent: true,
          },
        },
      },
    });
  }

  async update(screeningId: string, data: ScreeningUpdateData) {
    const { applicationStatus, declaredMonthlyIncome, rentToIncomeRatio, ...screeningData } = data;

    return prisma.$transaction(async (transaction) => {
      const screening = await transaction.applicantScreening.update({
        where: { id: screeningId },
        data: {
          ...screeningData,
          declaredMonthlyIncome:
            declaredMonthlyIncome === undefined
              ? undefined
              : declaredMonthlyIncome === null
                ? null
                : new Prisma.Decimal(declaredMonthlyIncome),
          rentToIncomeRatio:
            rentToIncomeRatio === undefined
              ? undefined
              : rentToIncomeRatio === null
                ? null
                : new Prisma.Decimal(rentToIncomeRatio),
        },
        include: {
          rentalApplication: {
            select: {
              id: true,
              status: true,
              proposedMonthlyRent: true,
            },
          },
        },
      });

      if (applicationStatus) {
        await transaction.rentalApplication.update({
          where: { id: screening.rentalApplicationId },
          data: { status: applicationStatus },
        });
      }

      return screening;
    });
  }
}

export const screeningRepository = new ScreeningRepository();
