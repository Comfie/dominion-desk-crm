import { MaintenanceStatus, Priority, MaintenanceCategory } from '@prisma/client';
import { maintenanceRepository } from '@/lib/features/maintenance/repositories/maintenance.repository';
import { logger } from '@/lib/shared/logger';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/shared/errors/app-error';
import { prisma } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { maintenanceEmailTemplates } from '@/lib/features/maintenance/templates/maintenance-templates';

/**
 * Map maintenance status to task status for synchronization
 */
function mapMaintenanceStatusToTaskStatus(
  maintenanceStatus: MaintenanceStatus
): 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' {
  switch (maintenanceStatus) {
    case 'PENDING':
    case 'SCHEDULED':
      return 'TODO';
    case 'IN_PROGRESS':
      return 'IN_PROGRESS';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return 'TODO';
  }
}

/**
 * Maintenance Service
 * Business logic layer for maintenance requests
 */
export class MaintenanceService {
  /**
   * Create a new maintenance request
   */
  async create(
    userId: string,
    data: {
      propertyId: string;
      tenantId?: string;
      title: string;
      description: string;
      category: MaintenanceCategory;
      priority: Priority;
      scheduledDate?: Date;
      estimatedCost?: number;
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

    // If tenant specified, verify tenant belongs to user
    if (data.tenantId) {
      const tenant = await prisma.tenant.findFirst({
        where: {
          id: data.tenantId,
          userId,
        },
      });

      if (!tenant) {
        throw new NotFoundError('Tenant', data.tenantId);
      }
    }

    const maintenance = await maintenanceRepository.create({
      user: { connect: { id: userId } },
      property: { connect: { id: data.propertyId } },
      ...(data.tenantId && { tenant: { connect: { id: data.tenantId } } }),
      title: data.title,
      description: data.description,
      category: data.category,
      priority: data.priority,
      status: 'PENDING',
      scheduledDate: data.scheduledDate,
      estimatedCost: data.estimatedCost,
    });

    logger.info('Maintenance request created', {
      maintenanceId: maintenance.id,
      userId,
      propertyId: data.propertyId,
      priority: data.priority,
    });

    // Send email notification
    try {
      const landlord = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true, email: true },
      });

      const tenant = data.tenantId
        ? await prisma.tenant.findUnique({
            where: { id: data.tenantId },
            select: { firstName: true, lastName: true, email: true },
          })
        : null;

      if (landlord) {
        const emailTemplate = maintenanceEmailTemplates.created({
          landlordName: `${landlord.firstName} ${landlord.lastName}`,
          tenantName: tenant ? `${tenant.firstName} ${tenant.lastName}` : undefined,
          tenantEmail: tenant?.email,
          propertyName: property.name,
          propertyAddress: `${property.address}, ${property.city}`,
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
          status: 'PENDING',
          estimatedCost: data.estimatedCost ? `R ${data.estimatedCost.toFixed(2)}` : undefined,
        });

        await sendEmail({
          to: landlord.email,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });

        logger.info('Maintenance creation email sent', { maintenanceId: maintenance.id });
      }
    } catch (emailError) {
      logger.error('Failed to send maintenance creation email', {
        error: emailError,
        maintenanceId: maintenance.id,
      });
    }

    return maintenance;
  }

  /**
   * Update a maintenance request
   */
  async update(
    maintenanceId: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      category?: MaintenanceCategory;
      priority?: Priority;
      status?: MaintenanceStatus;
      scheduledDate?: Date;
      completedDate?: Date;
      estimatedCost?: number;
      actualCost?: number;
      assignedTo?: string;
      resolutionNotes?: string;
    }
  ) {
    const maintenance = await maintenanceRepository.findById(maintenanceId);

    if (!maintenance) {
      throw new NotFoundError('Maintenance request', maintenanceId);
    }

    if (maintenance.userId !== userId) {
      throw new ForbiddenError('You do not have permission to update this maintenance request');
    }

    // Business rule: If marking as completed, require completed date and actual cost
    if (data.status === 'COMPLETED') {
      if (!data.completedDate) {
        data.completedDate = new Date();
      }
    }

    const updated = await maintenanceRepository.update(maintenanceId, data);

    logger.info('Maintenance request updated', {
      maintenanceId,
      userId,
      changes: Object.keys(data),
    });

    return updated;
  }

  /**
   * Delete a maintenance request
   */
  async delete(maintenanceId: string, userId: string) {
    const maintenance = await maintenanceRepository.findById(maintenanceId);

    if (!maintenance) {
      throw new NotFoundError('Maintenance request', maintenanceId);
    }

    if (maintenance.userId !== userId) {
      throw new ForbiddenError('You do not have permission to delete this maintenance request');
    }

    // Business rule: Cannot delete completed maintenance requests
    if (maintenance.status === 'COMPLETED') {
      throw new ValidationError(
        'Cannot delete completed maintenance requests. Consider cancelling instead.',
        { maintenanceId, status: maintenance.status }
      );
    }

    await maintenanceRepository.delete(maintenanceId);

    logger.info('Maintenance request deleted', {
      maintenanceId,
      userId,
    });

    return { success: true };
  }

  /**
   * Get maintenance request by ID with ownership verification
   */
  async getById(maintenanceId: string, userId: string) {
    const maintenance = await maintenanceRepository.findById(maintenanceId);

    if (!maintenance) {
      throw new NotFoundError('Maintenance request', maintenanceId);
    }

    if (maintenance.userId !== userId) {
      throw new ForbiddenError('You do not have permission to view this maintenance request');
    }

    return maintenance;
  }

  /**
   * List maintenance requests with filters
   */
  async list(
    userId: string,
    filters?: {
      propertyId?: string;
      status?: MaintenanceStatus;
      priority?: Priority;
      category?: MaintenanceCategory;
      search?: string;
    }
  ) {
    return maintenanceRepository.findByUserId(userId, filters);
  }

  /**
   * Get maintenance requests for a specific property
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

    return maintenanceRepository.findByPropertyId(propertyId);
  }

  /**
   * Get maintenance statistics
   */
  async getStatistics(userId: string) {
    return maintenanceRepository.getStatistics(userId);
  }

  /**
   * Get urgent maintenance requests
   */
  async getUrgent(userId: string) {
    return maintenanceRepository.findUrgent(userId);
  }

  /**
   * Get pending maintenance requests
   */
  async getPending(userId: string) {
    return maintenanceRepository.findPending(userId);
  }

  /**
   * Update maintenance status
   */
  async updateStatus(
    maintenanceId: string,
    userId: string,
    status: MaintenanceStatus,
    resolutionNotes?: string
  ) {
    const maintenance = await this.getById(maintenanceId, userId);

    const updateData: any = { status };

    if (status === 'COMPLETED') {
      updateData.completedDate = new Date();
    }

    if (resolutionNotes) {
      updateData.resolutionNotes = resolutionNotes;
    }

    const updated = await maintenanceRepository.update(maintenanceId, updateData);

    // Sync task status if a linked task exists
    try {
      const linkedTask = await prisma.task.findFirst({
        where: { maintenanceRequestId: maintenanceId },
      });

      if (linkedTask) {
        const taskStatus = mapMaintenanceStatusToTaskStatus(status);
        await prisma.task.update({
          where: { id: linkedTask.id },
          data: {
            status: taskStatus,
            ...(status === 'COMPLETED' && { completedDate: new Date() }),
          },
        });

        logger.info('Linked task status synced', {
          maintenanceId,
          taskId: linkedTask.id,
          newTaskStatus: taskStatus,
        });
      }
    } catch (taskSyncError) {
      logger.error('Failed to sync linked task status', {
        error: taskSyncError,
        maintenanceId,
      });
      // Continue - don't fail the maintenance update if task sync fails
    }

    logger.info('Maintenance status updated', {
      maintenanceId,
      userId,
      oldStatus: maintenance.status,
      newStatus: status,
    });

    // Send email notification for status change
    try {
      const fullMaintenance = await prisma.maintenanceRequest.findUnique({
        where: { id: maintenanceId },
        include: {
          property: true,
          tenant: true,
          user: true,
        },
      });

      if (fullMaintenance) {
        const landlordName = `${fullMaintenance.user.firstName} ${fullMaintenance.user.lastName}`;
        const tenantName = fullMaintenance.tenant
          ? `${fullMaintenance.tenant.firstName} ${fullMaintenance.tenant.lastName}`
          : undefined;

        const emailData = {
          landlordName,
          tenantName,
          tenantEmail: fullMaintenance.tenant?.email,
          propertyName: fullMaintenance.property.name,
          propertyAddress: `${fullMaintenance.property.address}, ${fullMaintenance.property.city}`,
          title: fullMaintenance.title,
          description: fullMaintenance.description,
          category: fullMaintenance.category,
          priority: fullMaintenance.priority,
          status,
          scheduledDate: fullMaintenance.scheduledDate
            ? new Date(fullMaintenance.scheduledDate).toLocaleDateString()
            : undefined,
          completedDate: updateData.completedDate
            ? new Date(updateData.completedDate).toLocaleDateString()
            : undefined,
          actualCost: fullMaintenance.actualCost
            ? `R ${Number(fullMaintenance.actualCost).toFixed(2)}`
            : undefined,
          assignedTo: fullMaintenance.assignedTo,
          resolutionNotes: resolutionNotes || fullMaintenance.resolutionNotes || undefined,
        };

        let emailTemplate;
        switch (status) {
          case 'COMPLETED':
            emailTemplate = maintenanceEmailTemplates.completed(emailData);
            break;
          case 'CANCELLED':
            emailTemplate = maintenanceEmailTemplates.cancelled(emailData);
            break;
          // Only send emails for COMPLETED and CANCELLED to save email quota
          // SCHEDULED and IN_PROGRESS updates shown via dashboard alerts
          default:
            emailTemplate = null;
        }

        if (emailTemplate) {
          // Send to tenant if exists, otherwise to landlord
          const recipientEmail = fullMaintenance.tenant?.email || fullMaintenance.user.email;
          await sendEmail({
            to: recipientEmail,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
          });

          logger.info('Maintenance status change email sent', {
            maintenanceId,
            status,
            recipient: recipientEmail,
          });
        }
      }
    } catch (emailError) {
      logger.error('Failed to send maintenance status change email', {
        error: emailError,
        maintenanceId,
      });
    }

    return updated;
  }

  /**
   * Assign maintenance request to someone
   */
  async assign(maintenanceId: string, userId: string, assignedTo: string) {
    const maintenance = await this.getById(maintenanceId, userId);

    const updated = await maintenanceRepository.update(maintenanceId, {
      assignedTo,
      status: maintenance.status === 'PENDING' ? 'IN_PROGRESS' : maintenance.status,
    });

    logger.info('Maintenance request assigned', {
      maintenanceId,
      userId,
      assignedTo,
    });

    return updated;
  }

  /**
   * Send follow-up emails for stale maintenance requests
   * Checks for requests that haven't been updated in 5+ days
   */
  async sendFollowUpEmails(): Promise<{ sent: number; errors: number }> {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    try {
      // Find maintenance requests that are pending or in progress,
      // haven't been updated in 5+ days, and haven't had a follow-up sent
      const staleRequests = await prisma.maintenanceRequest.findMany({
        where: {
          status: {
            in: ['PENDING', 'IN_PROGRESS'],
          },
          updatedAt: {
            lte: fiveDaysAgo,
          },
          followUpSent: false,
        },
        include: {
          property: true,
          tenant: true,
          user: true,
        },
      });

      let sentCount = 0;
      let errorCount = 0;

      for (const request of staleRequests) {
        try {
          const daysStale = Math.floor(
            (Date.now() - new Date(request.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
          );

          const landlordName = `${request.user.firstName} ${request.user.lastName}`;
          const tenantName = request.tenant
            ? `${request.tenant.firstName} ${request.tenant.lastName}`
            : undefined;

          const emailTemplate = maintenanceEmailTemplates.followUp({
            landlordName,
            tenantName,
            propertyName: request.property.name,
            propertyAddress: `${request.property.address}, ${request.property.city}`,
            title: request.title,
            description: request.description,
            category: request.category,
            priority: request.priority,
            status: request.status,
            daysStale,
          });

          await sendEmail({
            to: request.user.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
          });

          // Mark follow-up as sent
          await prisma.maintenanceRequest.update({
            where: { id: request.id },
            data: {
              followUpSent: true,
              followUpSentAt: new Date(),
            },
          });

          sentCount++;
          logger.info('Follow-up email sent for stale maintenance request', {
            maintenanceId: request.id,
            daysStale,
          });
        } catch (error) {
          errorCount++;
          logger.error('Failed to send follow-up email', {
            error,
            maintenanceId: request.id,
          });
        }
      }

      logger.info('Follow-up email batch completed', {
        total: staleRequests.length,
        sent: sentCount,
        errors: errorCount,
      });

      return { sent: sentCount, errors: errorCount };
    } catch (error) {
      logger.error('Failed to process follow-up emails', { error });
      throw error;
    }
  }

  /**
   * Create a task from a maintenance request
   */
  async createTaskFromMaintenance(maintenanceId: string, userId: string) {
    // Verify maintenance request exists and belongs to user
    const maintenance = await maintenanceRepository.findById(maintenanceId);

    if (!maintenance) {
      throw new NotFoundError('Maintenance request', maintenanceId);
    }

    if (maintenance.userId !== userId) {
      throw new ForbiddenError('You do not have permission to access this maintenance request');
    }

    // Check if task already exists for this maintenance
    const existingTask = await prisma.task.findFirst({
      where: { maintenanceRequestId: maintenanceId },
    });

    if (existingTask) {
      throw new ValidationError('A task already exists for this maintenance request');
    }

    // Fetch property details
    const property = await prisma.property.findUnique({
      where: { id: maintenance.propertyId },
      select: { id: true, name: true },
    });

    // Create task
    const task = await prisma.task.create({
      data: {
        userId,
        maintenanceRequestId: maintenanceId,
        title: `[Maintenance] ${maintenance.title}`,
        description: `${maintenance.description}\n\nProperty: ${property?.name || 'Unknown'}\nCategory: ${maintenance.category}\nPriority: ${maintenance.priority}`,
        taskType: 'MAINTENANCE',
        priority: maintenance.priority,
        dueDate: maintenance.scheduledDate || undefined,
        status: mapMaintenanceStatusToTaskStatus(maintenance.status),
        assignedTo: maintenance.assignedTo || undefined,
        relatedType: 'maintenance',
        relatedId: maintenanceId,
      },
    });

    logger.info('Task created from maintenance request', {
      taskId: task.id,
      maintenanceId,
      userId,
    });

    return task;
  }
}

// Export singleton instance
export const maintenanceService = new MaintenanceService();
