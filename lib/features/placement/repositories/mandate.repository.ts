import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db';
import type {
  CreateLandlordOwnerDTO,
  CreateRentalMandateDTO,
  ListLandlordOwnersDTO,
  ListRentalMandatesDTO,
  UpdateLandlordOwnerDTO,
  UpdateRentalMandateDTO,
} from '../dtos/mandate.dto';

export class MandateRepository {
  async createLandlordOwner(userId: string, data: CreateLandlordOwnerDTO) {
    return prisma.landlordOwner.create({
      data: {
        userId,
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName || null,
        email: data.email,
        phone: data.phone || null,
        alternatePhone: data.alternatePhone || null,
        idNumber: data.idNumber || null,
        taxNumber: data.taxNumber || null,
        vatNumber: data.vatNumber || null,
        vatRegistered: data.vatRegistered,
        status: data.status,
        notes: data.notes || null,
      },
    });
  }

  async listLandlordOwners(userId: string, filters: ListLandlordOwnersDTO) {
    const where: Prisma.LandlordOwnerWhereInput = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { companyName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [landlords, total] = await Promise.all([
      prisma.landlordOwner.findMany({
        where,
        include: {
          _count: {
            select: {
              properties: true,
              rentalMandates: true,
            },
          },
        },
        orderBy: [{ status: 'asc' }, { lastName: 'asc' }],
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.landlordOwner.count({ where }),
    ]);

    return {
      data: landlords,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async findPropertyForUser(userId: string, propertyId: string) {
    return prisma.property.findFirst({
      where: { id: propertyId, userId },
      select: { id: true, userId: true },
    });
  }

  async findLandlordOwnerForUser(userId: string, landlordOwnerId: string) {
    return prisma.landlordOwner.findFirst({
      where: { id: landlordOwnerId, userId },
      select: { id: true, userId: true },
    });
  }

  async updateLandlordOwner(landlordOwnerId: string, data: UpdateLandlordOwnerDTO) {
    return prisma.landlordOwner.update({
      where: { id: landlordOwnerId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        companyName: data.companyName,
        email: data.email,
        phone: data.phone,
        alternatePhone: data.alternatePhone,
        idNumber: data.idNumber,
        taxNumber: data.taxNumber,
        vatNumber: data.vatNumber,
        vatRegistered: data.vatRegistered,
        status: data.status,
        notes: data.notes,
      },
    });
  }

  async findRentalMandateForUser(userId: string, rentalMandateId: string) {
    return prisma.rentalMandate.findFirst({
      where: { id: rentalMandateId, userId },
      select: { id: true, userId: true },
    });
  }

  async createRentalMandate(userId: string, data: CreateRentalMandateDTO) {
    return prisma.rentalMandate.create({
      data: {
        userId,
        propertyId: data.propertyId,
        landlordOwnerId: data.landlordOwnerId || null,
        mandateType: data.mandateType,
        exclusivity: data.exclusivity,
        status: data.status,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        placementFeePercentage:
          data.placementFeePercentage === null || data.placementFeePercentage === undefined
            ? null
            : new Prisma.Decimal(data.placementFeePercentage),
        managementFeePercentage:
          data.managementFeePercentage === null || data.managementFeePercentage === undefined
            ? null
            : new Prisma.Decimal(data.managementFeePercentage),
        vatApplicable: data.vatApplicable,
        mandateDocumentUrl: data.mandateDocumentUrl || null,
        notes: data.notes || null,
      },
      include: {
        property: { select: { id: true, name: true, city: true } },
        landlordOwner: { select: { id: true, firstName: true, lastName: true, companyName: true } },
      },
    });
  }

  async listRentalMandates(userId: string, filters: ListRentalMandatesDTO) {
    const where: Prisma.RentalMandateWhereInput = { userId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.propertyId) {
      where.propertyId = filters.propertyId;
    }

    if (filters.landlordOwnerId) {
      where.landlordOwnerId = filters.landlordOwnerId;
    }

    const [mandates, total] = await Promise.all([
      prisma.rentalMandate.findMany({
        where,
        include: {
          property: { select: { id: true, name: true, city: true } },
          landlordOwner: {
            select: { id: true, firstName: true, lastName: true, companyName: true },
          },
        },
        orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.rentalMandate.count({ where }),
    ]);

    return {
      data: mandates,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async updateRentalMandate(rentalMandateId: string, data: UpdateRentalMandateDTO) {
    return prisma.rentalMandate.update({
      where: { id: rentalMandateId },
      data: {
        propertyId: data.propertyId,
        landlordOwnerId: data.landlordOwnerId,
        mandateType: data.mandateType,
        exclusivity: data.exclusivity,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate:
          data.endDate === undefined ? undefined : data.endDate ? new Date(data.endDate) : null,
        placementFeePercentage:
          data.placementFeePercentage === undefined
            ? undefined
            : data.placementFeePercentage === null
              ? null
              : new Prisma.Decimal(data.placementFeePercentage),
        managementFeePercentage:
          data.managementFeePercentage === undefined
            ? undefined
            : data.managementFeePercentage === null
              ? null
              : new Prisma.Decimal(data.managementFeePercentage),
        vatApplicable: data.vatApplicable,
        mandateDocumentUrl: data.mandateDocumentUrl,
        notes: data.notes,
      },
      include: {
        property: { select: { id: true, name: true, city: true } },
        landlordOwner: { select: { id: true, firstName: true, lastName: true, companyName: true } },
      },
    });
  }
}

export const mandateRepository = new MandateRepository();
