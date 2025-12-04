import { z } from 'zod';
import { PaymentType, PaymentMethod, PaymentStatus } from '@prisma/client';

export const createPaymentSchema = z.object({
  tenantId: z.string().optional(),
  bookingId: z.string().optional(),
  propertyId: z.string().optional(),
  paymentType: z.nativeEnum(PaymentType),
  amount: z.number().positive(),
  currency: z.string().default('ZAR'),
  dueDate: z.date().optional(),
  paymentDate: z.date().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  status: z.nativeEnum(PaymentStatus).default(PaymentStatus.PENDING),
  description: z.string().optional(),
  notes: z.string().optional(),
  bankReference: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  paymentDate: z.date().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  notes: z.string().optional(),
  bankReference: z.string().optional(),
  receiptUrl: z.string().optional(),
});

export const generateMonthlyPaymentsSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2025),
});

export type CreatePaymentDTO = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentDTO = z.infer<typeof updatePaymentSchema>;
export type GenerateMonthlyPaymentsDTO = z.infer<typeof generateMonthlyPaymentsSchema>;
