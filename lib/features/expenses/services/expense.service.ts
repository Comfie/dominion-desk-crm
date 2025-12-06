import { ExpenseCategory } from '@prisma/client';
import { expenseRepository } from '@/lib/features/expenses/repositories/expense.repository';
import { logger } from '@/lib/shared/logger';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/shared/errors/app-error';
import { prisma } from '@/lib/db';

/**
 * Expense Service
 * Business logic layer for expenses
 */
export class ExpenseService {
  /**
   * Create a new expense
   */
  async create(
    userId: string,
    data: {
      propertyId: string;
      maintenanceRequestId?: string;
      category: ExpenseCategory;
      amount: number;
      expenseDate: Date;
      description: string;
      vendor?: string;
      invoiceNumber?: string;
      receiptUrl?: string;
      notes?: string;
    }
  ) {
    // Validation: Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: data.propertyId,
        userId,
      },
    });

    if (!property) {
      throw new NotFoundError('Property', data.propertyId);
    }

    // If maintenance request specified, verify it belongs to user
    if (data.maintenanceRequestId) {
      const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
        where: {
          id: data.maintenanceRequestId,
          userId,
        },
      });

      if (!maintenanceRequest) {
        throw new NotFoundError('Maintenance request', data.maintenanceRequestId);
      }
    }

    const expense = await expenseRepository.create({
      user: { connect: { id: userId } },
      property: { connect: { id: data.propertyId } },
      ...(data.maintenanceRequestId && {
        maintenanceRequest: { connect: { id: data.maintenanceRequestId } },
      }),
      title: data.description.substring(0, 100), // Use description as title
      category: data.category,
      amount: data.amount,
      expenseDate: data.expenseDate,
      description: data.description,
      vendor: data.vendor,
      notes: data.notes,
    });

    logger.info('Expense created', {
      expenseId: expense.id,
      userId,
      propertyId: data.propertyId,
      amount: data.amount,
      category: data.category,
    });

    return expense;
  }

  /**
   * Update an expense
   */
  async update(
    expenseId: string,
    userId: string,
    data: {
      propertyId?: string;
      maintenanceRequestId?: string | null;
      category?: ExpenseCategory;
      amount?: number;
      expenseDate?: Date;
      description?: string;
      vendor?: string;
      invoiceNumber?: string;
      receiptUrl?: string;
      notes?: string;
    }
  ) {
    const expense = await expenseRepository.findById(expenseId);

    if (!expense) {
      throw new NotFoundError('Expense', expenseId);
    }

    if (expense.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this expense');
    }

    // If property is being changed, verify new property belongs to user
    if (data.propertyId && data.propertyId !== expense.propertyId) {
      const property = await prisma.property.findFirst({
        where: {
          id: data.propertyId,
          userId,
        },
      });

      if (!property) {
        throw new NotFoundError('Property', data.propertyId);
      }
    }

    const updated = await expenseRepository.update(expenseId, data);

    logger.info('Expense updated', {
      expenseId,
      userId,
      changes: Object.keys(data),
    });

    return updated;
  }

  /**
   * Delete an expense
   */
  async delete(expenseId: string, userId: string) {
    const expense = await expenseRepository.findById(expenseId);

    if (!expense) {
      throw new NotFoundError('Expense', expenseId);
    }

    if (expense.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this expense');
    }

    await expenseRepository.delete(expenseId);

    logger.info('Expense deleted', {
      expenseId,
      userId,
    });

    return { success: true };
  }

  /**
   * Get expense by ID with ownership verification
   */
  async getById(expenseId: string, userId: string) {
    const expense = await expenseRepository.findById(expenseId);

    if (!expense) {
      throw new NotFoundError('Expense', expenseId);
    }

    if (expense.userId !== userId) {
      throw new ForbiddenError('You do not have permission to view this expense');
    }

    return expense;
  }

  /**
   * List expenses with filters
   */
  async list(
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
    return expenseRepository.findByUserId(userId, filters);
  }

  /**
   * Get expenses for a specific maintenance request
   */
  async getByMaintenanceRequestId(maintenanceRequestId: string, userId: string) {
    // Verify maintenance request belongs to user
    const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
      where: {
        id: maintenanceRequestId,
        userId,
      },
    });

    if (!maintenanceRequest) {
      throw new NotFoundError('Maintenance request', maintenanceRequestId);
    }

    return expenseRepository.findByMaintenanceRequestId(maintenanceRequestId);
  }

  /**
   * Get expenses for a specific property
   */
  async getByPropertyId(propertyId: string, userId: string) {
    // Verify property belongs to user
    const property = await prisma.property.findFirst({
      where: {
        id: propertyId,
        userId,
      },
    });

    if (!property) {
      throw new NotFoundError('Property', propertyId);
    }

    return expenseRepository.findByPropertyId(propertyId);
  }

  /**
   * Get expense statistics
   */
  async getStatistics(userId: string, startDate?: Date, endDate?: Date) {
    return expenseRepository.getStatistics(userId, startDate, endDate);
  }

  /**
   * Get expenses by category
   */
  async getByCategory(userId: string, category: ExpenseCategory) {
    return expenseRepository.findByCategory(userId, category);
  }

  /**
   * Get recent expenses
   */
  async getRecent(userId: string, limit = 10) {
    return expenseRepository.getRecent(userId, limit);
  }
}

// Export singleton instance
export const expenseService = new ExpenseService();
