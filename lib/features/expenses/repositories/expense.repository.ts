import { Prisma, ExpenseCategory } from '@prisma/client';
import { prisma } from '@/lib/db';

/**
 * Expense Repository
 * Handles all database operations for expenses
 */
export class ExpenseRepository {
  /**
   * Find expense by ID
   */
  async findById(id: string) {
    return prisma.expense.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        maintenanceRequest: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Find all expenses for a user
   */
  async findByUserId(
    userId: string,
    filters?: {
      propertyId?: string;
      maintenanceRequestId?: string;
      category?: ExpenseCategory;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    }
  ) {
    const where: Prisma.ExpenseWhereInput = { userId };

    if (filters?.propertyId) {
      where.propertyId = filters.propertyId;
    }

    if (filters?.maintenanceRequestId) {
      where.maintenanceRequestId = filters.maintenanceRequestId;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.startDate || filters?.endDate) {
      where.expenseDate = {};
      if (filters.startDate) {
        where.expenseDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.expenseDate.lte = filters.endDate;
      }
    }

    if (filters?.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { vendor: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.expense.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        maintenanceRequest: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { expenseDate: 'desc' },
    });
  }

  /**
   * Find expenses by property ID
   */
  async findByPropertyId(propertyId: string) {
    return prisma.expense.findMany({
      where: { propertyId },
      include: {
        maintenanceRequest: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { expenseDate: 'desc' },
    });
  }

  /**
   * Find expenses by maintenance request ID
   */
  async findByMaintenanceRequestId(maintenanceRequestId: string) {
    return prisma.expense.findMany({
      where: { maintenanceRequestId },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { expenseDate: 'desc' },
    });
  }

  /**
   * Create a new expense
   */
  async create(data: Prisma.ExpenseCreateInput) {
    return prisma.expense.create({
      data,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        maintenanceRequest: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Update an expense
   */
  async update(id: string, data: Prisma.ExpenseUpdateInput) {
    return prisma.expense.update({
      where: { id },
      data,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        maintenanceRequest: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });
  }

  /**
   * Delete an expense
   */
  async delete(id: string) {
    return prisma.expense.delete({
      where: { id },
    });
  }

  /**
   * Get expense statistics
   */
  async getStatistics(userId: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.ExpenseWhereInput = { userId };

    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = startDate;
      if (endDate) where.expenseDate.lte = endDate;
    }

    const [totalAmount, expenseCount, byCategory] = await Promise.all([
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.expense.count({ where }),
      prisma.expense.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
      }),
    ]);

    return {
      totalAmount: Number(totalAmount._sum.amount || 0),
      expenseCount,
      byCategory: byCategory.map((item) => ({
        category: item.category,
        amount: Number(item._sum.amount || 0),
      })),
    };
  }

  /**
   * Get expenses by category
   */
  async findByCategory(userId: string, category: ExpenseCategory) {
    return prisma.expense.findMany({
      where: {
        userId,
        category,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { expenseDate: 'desc' },
    });
  }

  /**
   * Get recent expenses
   */
  async getRecent(userId: string, limit = 10) {
    return prisma.expense.findMany({
      where: { userId },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { expenseDate: 'desc' },
      take: limit,
    });
  }
}

// Export singleton instance
export const expenseRepository = new ExpenseRepository();
