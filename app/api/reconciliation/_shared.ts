import { requireAuth } from '@/lib/auth-helpers';
import { requirePermission } from '@/lib/auth-helpers-enhanced';
import { ForbiddenError } from '@/lib/shared/errors/app-error';

/**
 * Reconciliation touches rent money: landlords (and team members with the
 * financials permission) only. Returns the workspace owner id to scope data.
 */
export async function requireReconciliationAccess() {
  const session = await requireAuth();
  if (session.user.role !== 'CUSTOMER') {
    throw new ForbiddenError('Only landlords can reconcile bank statements');
  }
  const ownerId = session.user.organizationId || session.user.id;
  await requirePermission(ownerId, 'canManageFinancials');
  return { session, ownerId, actorId: session.user.id };
}
