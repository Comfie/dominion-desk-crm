import { Prisma, PropertyStatus, PropertyType, RentalType } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * Property Repository
 * Handles all database operations for properties
 */
export class PropertyRepository {
  /**
   * Find property by ID
   */
  async findById(id: string) {
    return prisma.property.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
          orderBy: { checkInDate: 'desc' },
          take: 5,
        },
        expenses: {
          orderBy: { expenseDate: 'desc' },
          take: 5,
        },
      },
    });
  }

  /**
   * Find all properties for a user
   */
  async findByUserId(
    userId: string,
    filters?: {
      status?: PropertyStatus;
      propertyType?: PropertyType;
      rentalType?: RentalType;
      isAvailable?: boolean;
      search?: string;
    }
  ) {
    const today = new Date();
    const where: Prisma.PropertyWhereInput = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.propertyType) {
      where.propertyType = filters.propertyType;
    }

    if (filters?.rentalType) {
      where.rentalType = filters.rentalType;
    }

    if (filters?.isAvailable !== undefined) {
      where.isAvailable = filters.isAvailable;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            bookings: true,
            tenants: true,
          },
        },
        tenants: {
          where: {
            isActive: true,
            OR: [{ leaseEndDate: null }, { leaseEndDate: { gte: today } }],
          },
          select: {
            id: true,
            leaseStartDate: true,
            leaseEndDate: true,
            moveInDate: true,
            tenant: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Create a new property
   */
  async create(data: Prisma.PropertyCreateInput) {
    return prisma.property.create({
      data,
    });
  }

  /**
   * Update a property
   */
  async update(id: string, data: Prisma.PropertyUpdateInput) {
    return prisma.property.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a property
   */
  async delete(id: string) {
    return prisma.property.delete({
      where: { id },
    });
  }

  /**
   * Get property statistics
   */
  async getStatistics(userId: string) {
    const [total, active, occupied, available] = await Promise.all([
      prisma.property.count({ where: { userId } }),
      prisma.property.count({ where: { userId, status: 'ACTIVE' } }),
      prisma.property.count({ where: { userId, status: 'OCCUPIED' } }),
      prisma.property.count({ where: { userId, isAvailable: true } }),
    ]);

    return {
      total,
      active,
      occupied,
      available,
    };
  }

  /**
   * Get properties with upcoming bookings
   */
  async findWithUpcomingBookings(userId: string, days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return prisma.property.findMany({
      where: {
        userId,
        bookings: {
          some: {
            checkInDate: {
              gte: new Date(),
              lte: futureDate,
            },
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          },
        },
      },
      include: {
        bookings: {
          where: {
            checkInDate: {
              gte: new Date(),
              lte: futureDate,
            },
            status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          },
          orderBy: { checkInDate: 'asc' },
        },
      },
    });
  }

  /**
   * Get properties by status
   */
  async findByStatus(userId: string, status: PropertyStatus) {
    return prisma.property.findMany({
      where: {
        userId,
        status,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

// Export singleton instance
export const propertyRepository = new PropertyRepository();
