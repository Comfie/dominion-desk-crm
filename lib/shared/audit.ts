import { Session } from 'next-auth';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/shared/logger';

/**
 * Audit log actions
 */
export type AuditAction = 'created' | 'updated' | 'deleted' | 'viewed' | 'exported' | 'imported';

/**
 * Audit log entity types
 */
export type AuditEntity =
  | 'property'
  | 'booking'
  | 'tenant'
  | 'payment'
  | 'expense'
  | 'document'
  | 'maintenance_request'
  | 'inquiry'
  | 'task'
  | 'message'
  | 'automation'
  | 'integration'
  | 'team_member'
  | 'user'
  | 'settings';

/**
 * Log an audit trail entry
 *
 * @param session - The authenticated user session
 * @param action - The action performed (created, updated, deleted, etc.)
 * @param entity - The entity type (property, booking, etc.)
 * @param entityId - The ID of the entity
 * @param changes - Optional before/after values for updates
 * @param request - Optional request object for IP and user agent
 *
 * @example
 * ```typescript
 * await logAudit(
 *   session,
 *   'updated',
 *   'property',
 *   property.id,
 *   { before: { name: 'Old Name' }, after: { name: 'New Name' } },
 *   request
 * );
 * ```
 */
export async function logAudit(
  session: Session,
  action: AuditAction,
  entity: AuditEntity,
  entityId: string,
  changes?: unknown,
  request?: Request
): Promise<void> {
  try {
    const ipAddress = request?.headers.get('x-forwarded-for') || null;
    const userAgent = request?.headers.get('user-agent') || null;

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action,
        entity,
        entityId,
        changes: changes || undefined,
        ipAddress,
        userAgent,
      },
    });

    logger.info('Audit log created', {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      isTeamMember: session.user.isTeamMember,
      action,
      entity,
      entityId,
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    logger.error('Failed to create audit log', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session.user.id,
      action,
      entity,
      entityId,
    });
  }
}

/**
 * Log multiple audit entries at once (for bulk operations)
 *
 * @param session - The authenticated user session
 * @param entries - Array of audit log entries
 * @param request - Optional request object for IP and user agent
 *
 * @example
 * ```typescript
 * await logBulkAudit(session, [
 *   { action: 'deleted', entity: 'booking', entityId: 'booking-1' },
 *   { action: 'deleted', entity: 'booking', entityId: 'booking-2' },
 * ], request);
 * ```
 */
export async function logBulkAudit(
  session: Session,
  entries: Array<{
    action: AuditAction;
    entity: AuditEntity;
    entityId: string;
    changes?: unknown;
  }>,
  request?: Request
): Promise<void> {
  try {
    const ipAddress = request?.headers.get('x-forwarded-for') || null;
    const userAgent = request?.headers.get('user-agent') || null;

    await prisma.auditLog.createMany({
      data: entries.map((entry) => ({
        userId: session.user.id,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        changes: entry.changes || undefined,
        ipAddress,
        userAgent,
      })),
    });

    logger.info('Bulk audit logs created', {
      userId: session.user.id,
      count: entries.length,
    });
  } catch (error) {
    logger.error('Failed to create bulk audit logs', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: session.user.id,
      count: entries.length,
    });
  }
}

/**
 * Get audit logs for a specific entity
 *
 * @param entityId - The ID of the entity
 * @param limit - Maximum number of logs to return
 * @returns Array of audit log entries
 *
 * @example
 * ```typescript
 * const history = await getEntityAuditHistory('property-123', 50);
 * ```
 */
export async function getEntityAuditHistory(entityId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: {
      entityId,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Get audit logs for a user
 *
 * @param userId - The ID of the user
 * @param limit - Maximum number of logs to return
 * @returns Array of audit log entries
 *
 * @example
 * ```typescript
 * const userActivity = await getUserAuditHistory(session.user.id, 100);
 * ```
 */
export async function getUserAuditHistory(userId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Get recent audit logs for an organization
 * Useful for displaying recent activity in the dashboard
 *
 * @param organizationId - The ID of the organization (userId)
 * @param limit - Maximum number of logs to return
 * @returns Array of audit log entries
 *
 * @example
 * ```typescript
 * const recentActivity = await getOrganizationRecentActivity(session.user.organizationId, 20);
 * ```
 */
export async function getOrganizationRecentActivity(organizationId: string, limit = 50) {
  // Get all users who have access to this organization
  const teamMembers = await prisma.teamMember.findMany({
    where: {
      userId: organizationId,
      status: 'ACCEPTED',
    },
    select: {
      email: true,
    },
  });

  const teamEmails = teamMembers.map((tm) => tm.email);

  // Get audit logs from organization owner and team members
  const owner = await prisma.user.findUnique({
    where: { id: organizationId },
    select: { email: true },
  });

  const allEmails = owner ? [owner.email, ...teamEmails] : teamEmails;

  const users = await prisma.user.findMany({
    where: {
      email: {
        in: allEmails,
      },
    },
    select: {
      id: true,
    },
  });

  const userIds = users.map((u) => u.id);

  return prisma.auditLog.findMany({
    where: {
      userId: {
        in: userIds,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}
