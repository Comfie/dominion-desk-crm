import { z } from 'zod';

export const MAX_STATEMENT_BYTES = 3 * 1024 * 1024; // 3 MB of CSV text

const columnIndex = z.number().int().min(0).max(100);

export const columnMappingSchema = z
  .object({
    date: columnIndex,
    description: z.array(columnIndex).min(1),
    amount: columnIndex.optional(),
    credit: columnIndex.optional(),
    debit: columnIndex.optional(),
    balance: columnIndex.optional(),
  })
  .refine((m) => m.amount !== undefined || m.credit !== undefined, {
    message: 'Choose either an Amount column or a Money In column',
  });

export const importStatementSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  content: z
    .string()
    .min(1, 'The file is empty')
    .max(MAX_STATEMENT_BYTES, 'Statement file is too large (max 3 MB)'),
  mapping: columnMappingSchema.optional(),
});

export const transactionActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('confirm'), paymentId: z.string().min(1).optional() }),
  z.object({ action: z.literal('reject') }), // reject a suggestion
  z.object({ action: z.literal('ignore') }), // not rent
  z.object({ action: z.literal('restore') }), // undo ignore
  z.object({ action: z.literal('unmatch') }), // undo a confirmed match
]);

export const confirmAllSchema = z.object({
  minConfidence: z.number().int().min(50).max(100).default(80),
});

export const listTransactionsQuerySchema = z.object({
  status: z.enum(['UNMATCHED', 'SUGGESTED', 'MATCHED', 'IGNORED', 'ALL']).default('ALL'),
  importId: z.string().optional(),
});

export type ImportStatementDTO = z.infer<typeof importStatementSchema>;
export type TransactionActionDTO = z.infer<typeof transactionActionSchema>;
export type ConfirmAllDTO = z.infer<typeof confirmAllSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
