import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import type { CreateViewingDTO, ListViewingsDTO, UpdateViewingDTO } from '../dtos/viewing.dto';

type UpdateViewingRepositoryDTO = Omit<UpdateViewingDTO, 'attendedAt'> & {
  attendedAt?: Date | string | null;
};

export class ViewingRepository {
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

  async findRentalApplicationForUser(userId: string, rentalApplicationId: string) {
    return prisma.rentalApplication.findFirst({
      where: { id: rentalApplicationId, userId },
      select: { id: true, userId: true, propertyId: true },
    });
  }

  async findByIdForUser(userId: string, viewingId: string) {
    return prisma.viewing.findFirst({
      where: { id: viewingId, userId },
    });
  }

  async findConflictingViewing(
    userId: string,
    propertyId: string,
    scheduledFor: Date,
    durationMinutes: number,
    excludeViewingId?: string
  ) {
    const viewingEnd = new Date(scheduledFor.getTime() + durationMinutes * 60_000);

    const candidates = await prisma.viewing.findMany({
      where: {
        userId,
        propertyId,
        id: excludeViewingId ? { not: excludeViewingId } : undefined,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'ATTENDED'] },
        scheduledFor: {
          lt: viewingEnd,
        },
        AND: [
          {
            scheduledFor: {
              gte: new Date(scheduledFor.getTime() - 180 * 60_000),
            },
          },
        ],
      },
      orderBy: { scheduledFor: 'asc' },
    });

    return (
      candidates.find((viewing) => {
        const existingStart = viewing.scheduledFor;
        const existingEnd = new Date(existingStart.getTime() + viewing.durationMinutes * 60_000);

        return existingStart < viewingEnd && existingEnd > scheduledFor;
      }) || null
    );
  }

  async create(userId: string, data: CreateViewingDTO) {
    return prisma.viewing.create({
      data: {
        userId,
        propertyId: data.propertyId,
        inquiryId: data.inquiryId || null,
        rentalApplicationId: data.rentalApplicationId || null,
        contactName: data.contactName,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        scheduledFor: new Date(data.scheduledFor),
        durationMinutes: data.durationMinutes,
        assignedTo: data.assignedTo || null,
        status: 'SCHEDULED',
      },
      include: {
        property: { select: { id: true, name: true, city: true } },
        inquiry: { select: { id: true, contactName: true } },
        rentalApplication: {
          select: { id: true, applicantFirstName: true, applicantLastName: true },
        },
      },
    });
  }

  async update(viewingId: string, data: UpdateViewingRepositoryDTO) {
    return prisma.viewing.update({
      where: { id: viewingId },
      data: {
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
        durationMinutes: data.durationMinutes,
        status: data.status,
        attendedAt:
          data.attendedAt === undefined
            ? undefined
            : data.attendedAt
              ? new Date(data.attendedAt)
              : null,
        assignedTo: data.assignedTo,
        feedback: data.feedback,
        followUpNotes: data.followUpNotes,
      },
      include: {
        property: { select: { id: true, name: true, city: true } },
      },
    });
  }

  async list(userId: string, filters: ListViewingsDTO) {
    const where: Prisma.ViewingWhereInput = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.propertyId) {
      where.propertyId = filters.propertyId;
    }

    const [viewings, total] = await Promise.all([
      prisma.viewing.findMany({
        where,
        include: {
          property: { select: { id: true, name: true, city: true } },
          inquiry: { select: { id: true, contactName: true } },
          rentalApplication: {
            select: { id: true, applicantFirstName: true, applicantLastName: true },
          },
        },
        orderBy: [{ scheduledFor: 'asc' }],
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.viewing.count({ where }),
    ]);

    return {
      data: viewings,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }
}

export const viewingRepository = new ViewingRepository();
