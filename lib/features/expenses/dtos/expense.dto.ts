import { z } from 'zod';
import { ExpenseCategory } from '@prisma/client';

/**
 * Create Expense DTO
 */
export const createExpenseSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  maintenanceRequestId: z.string().min(1).optional(),
  category: z.nativeEnum(ExpenseCategory),
  amount: z.number().positive('Amount must be positive'),
  expenseDate: z.coerce.date(),
  description: z.string().min(3).max(500),
  vendor: z.string().max(200).optional(),
  invoiceNumber: z.string().max(100).optional(),
  receiptUrl: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
});

export type CreateExpenseDTO = z.infer<typeof createExpenseSchema>;

/**
 * Update Expense DTO
 */
export const updateExpenseSchema = z.object({
  propertyId: z.string().min(1).optional(),
  maintenanceRequestId: z.string().min(1).optional().nullable(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  amount: z.number().positive().optional(),
  expenseDate: z.coerce.date().optional(),
  description: z.string().min(3).max(500).optional(),
  vendor: z.string().max(200).optional(),
  invoiceNumber: z.string().max(100).optional(),
  receiptUrl: z.string().url().optional(),
  notes: z.string().max(2000).optional(),
});

export type UpdateExpenseDTO = z.infer<typeof updateExpenseSchema>;

/**
 * List Expenses Query DTO
 */
export const listExpensesSchema = z.object({
  propertyId: z.string().min(1).optional(),
  maintenanceRequestId: z.string().min(1).optional(),
  category: z.nativeEnum(ExpenseCategory).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().max(200).optional(),
});

export type ListExpensesDTO = z.infer<typeof listExpensesSchema>;

/**
 * Expense ID Param DTO
 */
export const expenseIdSchema = z.object({
  id: z.string().min(1, 'Expense ID is required'),
});

export type ExpenseIdDTO = z.infer<typeof expenseIdSchema>;

/**
 * Statistics Query DTO
 */
export const expenseStatisticsSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type ExpenseStatisticsDTO = z.infer<typeof expenseStatisticsSchema>;
