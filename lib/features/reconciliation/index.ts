/**
 * Reconciliation Feature Module
 * Bank statement import + matching of EFT deposits to rent invoices.
 */
export {
  reconciliationRepository,
  ReconciliationRepository,
} from './repositories/reconciliation.repository';
export { reconciliationService, ReconciliationService } from './services/reconciliation.service';
export * from './dtos/reconciliation.dto';
export {
  HIGH_CONFIDENCE_THRESHOLD,
  SUGGEST_THRESHOLD,
  scoreMatch,
  suggestMatches,
} from './utils/matching';
export { generatePaymentReference, normalizeForMatching } from './utils/payment-reference';
export { parseBankStatement, StatementParseError } from './utils/statement-parser';
