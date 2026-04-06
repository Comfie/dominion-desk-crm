import { Prisma, MaintenanceStatus, Priority, MaintenanceCategory } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * Maintenance Repository
 * Handles all database operations for maintenance requests
 */
export class MaintenanceRepository {
  /**
   * Find maintenance request by ID
   */
  async findById(id: string) {
    return prisma.maintenanceRequest.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        tasks: {
          orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
          select: {
            id: true,
            title: true,
            taskType: true,
            priority: true,
            status: true,
            dueDate: true,
            relatedType: true,
            relatedId: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * Find all maintenance requests for a user
   */
  async findByUserId(
    userId: string,
    filters?: {
      propertyId?: string;
      status?: MaintenanceStatus;
      priority?: Priority;
      category?: MaintenanceCategory;
      search?: string;
    }
  ) {
    const where: Prisma.MaintenanceRequestWhereInput = { userId };

    if (filters?.propertyId) {
      where.propertyId = filters.propertyId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.maintenanceRequest.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        tasks: {
          where: {
            status: {
              in: ['TODO', 'IN_PROGRESS'],
            },
          },
          orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
          take: 2,
          select: {
            id: true,
            title: true,
            taskType: true,
            priority: true,
            status: true,
            dueDate: true,
            relatedType: true,
            relatedId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find maintenance requests by property ID
   */
  async findByPropertyId(propertyId: string) {
    return prisma.maintenanceRequest.findMany({
      where: { propertyId },
      include: {
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Create a new maintenance request
   */
  async create(data: Prisma.MaintenanceRequestCreateInput) {
    return prisma.maintenanceRequest.create({
      data,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Update a maintenance request
   */
  async update(id: string, data: Prisma.MaintenanceRequestUpdateInput) {
    return prisma.maintenanceRequest.update({
      where: { id },
      data,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Delete a maintenance request
   */
  async delete(id: string) {
    return prisma.maintenanceRequest.delete({
      where: { id },
    });
  }

  /**
   * Get maintenance statistics
   */
  async getStatistics(userId: string) {
    const [total, pending, inProgress, completed, cancelled] = await Promise.all([
      prisma.maintenanceRequest.count({ where: { userId } }),
      prisma.maintenanceRequest.count({ where: { userId, status: 'PENDING' } }),
      prisma.maintenanceRequest.count({ where: { userId, status: 'IN_PROGRESS' } }),
      prisma.maintenanceRequest.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.maintenanceRequest.count({ where: { userId, status: 'CANCELLED' } }),
    ]);

    return {
      total,
      pending,
      inProgress,
      completed,
      cancelled,
    };
  }

  /**
   * Get urgent maintenance requests
   */
  async findUrgent(userId: string) {
    return prisma.maintenanceRequest.findMany({
      where: {
        userId,
        priority: 'URGENT',
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Get pending maintenance requests
   */
  async findPending(userId: string) {
    return prisma.maintenanceRequest.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }
}

// Export singleton instance
export const maintenanceRepository = new MaintenanceRepository();
