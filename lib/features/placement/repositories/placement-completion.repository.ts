import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import { NotFoundError, ValidationError } from '@/lib/shared/errors/app-error';
import type { CompletePlacementDTO } from '../dtos/placement-completion.dto';

export type PlacementCompletionResult = {
  application: {
    id: string;
    status: 'PLACED';
    tenantId: string;
  };
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tenantResolution: 'LINKED' | 'EMAIL_MATCH' | 'CREATED';
  portalAccessActive: boolean;
  nextAction: 'ACTIVATE_PORTAL' | null;
};

const FINAL_APPLICATION_STATUSES = new Set(['PLACED', 'REJECTED', 'WITHDRAWN']);

export class PlacementCompletionRepository {
  async findApplication(userId: string, applicationId: string) {
    return prisma.rentalApplication.findFirst({
      where: { id: applicationId, userId },
      select: {
        id: true,
        status: true,
        screening: { select: { overallStatus: true } },
      },
    });
  }

  async complete(
    userId: string,
    applicationId: string,
    data: CompletePlacementDTO
  ): Promise<PlacementCompletionResult> {
    return prisma.$transaction(
      async (transaction) => {
        const today = new Date();
        const application = await transaction.rentalApplication.findFirst({
          where: { id: applicationId, userId },
          include: {
            screening: {
              select: {
                overallStatus: true,
                declaredMonthlyIncome: true,
              },
            },
            tenant: {
              select: {
                id: true,
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
                portalUserId: true,
              },
            },
            property: {
              select: {
                id: true,
                allowsMultipleTenants: true,
                tenants: {
                  where: {
                    isActive: true,
                    OR: [{ leaseEndDate: null }, { leaseEndDate: { gte: today } }],
                  },
                  select: { id: true },
                },
              },
            },
          },
        });

        if (!application) {
          throw new NotFoundError('Rental application', applicationId);
        }

        if (application.screening?.overallStatus !== 'PASSED') {
          throw new ValidationError('Applicant screening must be passed before placement');
        }

        if (FINAL_APPLICATION_STATUSES.has(application.status)) {
          throw new ValidationError(
            `Applications with status ${application.status} cannot be placed`
          );
        }

        if (
          !application.property.allowsMultipleTenants &&
          application.property.tenants.length > 0
        ) {
          throw new ValidationError(
            'Property already has an active tenant assignment. Enable "Allows Multiple Tenants" in property settings to add more tenants.',
            { propertyId: application.property.id }
          );
        }

        let tenant = application.tenant;
        let tenantResolution: PlacementCompletionResult['tenantResolution'] = 'LINKED';

        if (tenant && tenant.userId !== userId) {
          throw new NotFoundError('Tenant', tenant.id);
        }

        if (!tenant) {
          tenant = await transaction.tenant.findFirst({
            where: {
              userId,
              email: { equals: application.applicantEmail, mode: 'insensitive' },
            },
            select: {
              id: true,
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              portalUserId: true,
            },
          });
          tenantResolution = tenant ? 'EMAIL_MATCH' : 'CREATED';
        }

        if (!tenant) {
          tenant = await transaction.tenant.create({
            data: {
              userId,
              firstName: application.applicantFirstName,
              lastName: application.applicantLastName,
              email: application.applicantEmail,
              phone: application.applicantPhone || '',
              idNumber: application.idNumber,
              monthlyIncome: application.screening.declaredMonthlyIncome,
              tenantType: 'TENANT',
              status: 'ACTIVE',
            },
            select: {
              id: true,
              userId: true,
              firstName: true,
              lastName: true,
              email: true,
              portalUserId: true,
            },
          });
        }

        const duplicateLease = await transaction.propertyTenant.findFirst({
          where: {
            propertyId: application.property.id,
            tenantId: tenant.id,
            unitLabel: data.unitLabel || null,
            isActive: true,
            OR: [{ leaseEndDate: null }, { leaseEndDate: { gte: today } }],
          },
          select: { id: true },
        });

        if (duplicateLease) {
          throw new ValidationError(
            'This tenant already has an active lease for this property/unit combination',
            {
              propertyId: application.property.id,
              tenantId: tenant.id,
              unitLabel: data.unitLabel,
            }
          );
        }

        await transaction.propertyTenant.create({
          data: {
            userId,
            propertyId: application.property.id,
            tenantId: tenant.id,
            leaseStartDate: new Date(data.leaseStartDate),
            leaseEndDate: data.leaseEndDate ? new Date(data.leaseEndDate) : null,
            monthlyRent: new Prisma.Decimal(data.monthlyRent),
            depositPaid: new Prisma.Decimal(data.depositPaid),
            moveInDate: data.moveInDate ? new Date(data.moveInDate) : null,
            unitLabel: data.unitLabel || null,
            isActive: true,
          },
        });

        const placedApplication = await transaction.rentalApplication.update({
          where: { id: applicationId },
          data: { tenantId: tenant.id, status: 'PLACED' },
          select: { id: true, status: true, tenantId: true },
        });

        const portalAccessActive = Boolean(tenant.portalUserId);

        return {
          application: {
            id: placedApplication.id,
            status: 'PLACED',
            tenantId: placedApplication.tenantId as string,
          },
          tenant: {
            id: tenant.id,
            firstName: tenant.firstName,
            lastName: tenant.lastName,
            email: tenant.email,
          },
          tenantResolution,
          portalAccessActive,
          nextAction: portalAccessActive ? null : 'ACTIVATE_PORTAL',
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  }
}

export const placementCompletionRepository = new PlacementCompletionRepository();
