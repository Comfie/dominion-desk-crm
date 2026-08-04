import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import type {
  CreateRentalApplicationDTO,
  ListRentalApplicationsDTO,
} from '../dtos/rental-application.dto';

type CreateRentalApplicationWithStatus = CreateRentalApplicationDTO & {
  status: 'APPLICATION_RECEIVED';
};

export class RentalApplicationRepository {
  async findPropertyForUser(userId: string, propertyId: string) {
    return prisma.property.findFirst({
      where: { id: propertyId, userId },
      select: { id: true, userId: true },
    });
  }

  async findInquiryForUser(userId: string, inquiryId: string) {
    return prisma.inquiry.findFirst({
      where: { id: inquiryId, userId },
      select: { id: true, userId: true, propertyId: true },
    });
  }

  async findTenantForUser(userId: string, tenantId: string) {
    return prisma.tenant.findFirst({
      where: { id: tenantId, userId },
      select: { id: true, userId: true },
    });
  }

  async createWithScreening(userId: string, data: CreateRentalApplicationWithStatus) {
    return prisma.rentalApplication.create({
      data: {
        userId,
        propertyId: data.propertyId,
        inquiryId: data.inquiryId || null,
        tenantId: data.tenantId || null,
        applicantFirstName: data.applicantFirstName,
        applicantLastName: data.applicantLastName,
        applicantEmail: data.applicantEmail,
        applicantPhone: data.applicantPhone || null,
        idNumber: data.idNumber || null,
        requestedMoveInDate: data.requestedMoveInDate ? new Date(data.requestedMoveInDate) : null,
        proposedLeaseStartDate: data.proposedLeaseStartDate
          ? new Date(data.proposedLeaseStartDate)
          : null,
        proposedLeaseEndDate: data.proposedLeaseEndDate
          ? new Date(data.proposedLeaseEndDate)
          : null,
        proposedMonthlyRent:
          data.proposedMonthlyRent === undefined
            ? null
            : new Prisma.Decimal(data.proposedMonthlyRent),
        proposedDeposit:
          data.proposedDeposit === undefined ? null : new Prisma.Decimal(data.proposedDeposit),
        status: data.status,
        assignedTo: data.assignedTo || null,
        submittedAt: new Date(),
        screening: {
          create: {
            userId,
          },
        },
      },
      include: {
        property: { select: { id: true, name: true, city: true } },
        inquiry: { select: { id: true, contactName: true } },
        screening: true,
      },
    });
  }

  async list(userId: string, filters: ListRentalApplicationsDTO) {
    const where: Prisma.RentalApplicationWhereInput = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.propertyId) {
      where.propertyId = filters.propertyId;
    }

    if (filters.search) {
      where.OR = [
        { applicantFirstName: { contains: filters.search, mode: 'insensitive' } },
        { applicantLastName: { contains: filters.search, mode: 'insensitive' } },
        { applicantEmail: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [applications, total] = await Promise.all([
      prisma.rentalApplication.findMany({
        where,
        include: {
          property: { select: { id: true, name: true, city: true } },
          screening: { select: { overallStatus: true, riskScore: true } },
        },
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.rentalApplication.count({ where }),
    ]);

    return {
      data: applications,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }
}

export const rentalApplicationRepository = new RentalApplicationRepository();
