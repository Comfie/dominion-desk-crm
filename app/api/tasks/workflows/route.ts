import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PaymentStatus, TaskStatus, TaskType } from '@prisma/client';
import {
  addDays,
  differenceInCalendarDays,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  getArrearsWorkflow,
  getLeaseRenewalTaskDueDate,
  getLeaseRenewalWorkflow,
} from '@/lib/features/tasks/utils/landlord-workflows';
import { getMaintenanceWorkflow } from '@/lib/features/maintenance/utils/maintenance-workflows';

const workflowSchema = z.discriminatedUnion('workflow', [
  z.object({
    workflow: z.literal('arrears_follow_up'),
    month: z.number().int().min(1).max(12).optional(),
    year: z.number().int().min(2000).max(2100).optional(),
    propertyId: z.string().optional(),
    includePendingVerification: z.boolean().optional().default(true),
  }),
  z.object({
    workflow: z.literal('lease_renewal'),
    propertyId: z.string().optional(),
    windowDays: z.number().int().min(7).max(180).optional().default(60),
  }),
  z.object({
    workflow: z.literal('maintenance_operations'),
    propertyId: z.string().optional(),
  }),
]);

type ChecklistItem = {
  item: string;
  isRequired: boolean;
  sortOrder: number;
};

function getMaintenanceOpsChecklist(stage: string): ChecklistItem[] {
  switch (stage) {
    case 'needs-assignment':
      return [
        {
          item: 'Confirm who owns the repair internally or externally',
          isRequired: true,
          sortOrder: 0,
        },
        { item: 'Assign a contractor or staff member', isRequired: true, sortOrder: 1 },
        { item: 'Record the next promised ETA', isRequired: true, sortOrder: 2 },
      ];
    case 'needs-scheduling':
      return [
        { item: 'Confirm contractor availability', isRequired: true, sortOrder: 0 },
        { item: 'Set a scheduled visit date and time', isRequired: true, sortOrder: 1 },
        { item: 'Notify the tenant of the visit window', isRequired: true, sortOrder: 2 },
      ];
    case 'visit-overdue':
      return [
        { item: 'Confirm why the planned visit was missed', isRequired: true, sortOrder: 0 },
        { item: 'Set a replacement visit date', isRequired: true, sortOrder: 1 },
        { item: 'Update the tenant with the revised ETA', isRequired: true, sortOrder: 2 },
      ];
    case 'work-stalled':
      return [
        { item: 'Get a progress update from the contractor', isRequired: true, sortOrder: 0 },
        { item: 'Confirm the next completion ETA', isRequired: true, sortOrder: 1 },
        { item: 'Log the latest update for the tenant', isRequired: true, sortOrder: 2 },
      ];
    default:
      return [];
  }
}

function getMaintenanceTaskTitle(stage: string, title: string) {
  switch (stage) {
    case 'needs-assignment':
      return `Assign contractor: ${title}`;
    case 'needs-scheduling':
      return `Schedule visit: ${title}`;
    case 'visit-overdue':
      return `Visit overdue: ${title}`;
    case 'work-stalled':
      return `Work stalled: ${title}`;
    case 'closeout-required':
      return `Close out maintenance: ${title}`;
    default:
      return `Maintenance follow-up: ${title}`;
  }
}

async function getTemplateChecklist(userId: string, taskType: TaskType, category: string) {
  const template = await prisma.taskTemplate.findFirst({
    where: {
      taskType,
      category,
      OR: [{ userId }, { isSystem: true }],
    },
    orderBy: [{ isSystem: 'asc' }, { updatedAt: 'desc' }],
  });

  return Array.isArray(template?.checklist) ? (template.checklist as ChecklistItem[]) : [];
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = workflowSchema.parse(await request.json());
    const userId = session.user.id;

    if (payload.workflow === 'arrears_follow_up') {
      const now = new Date();
      const month = payload.month ?? now.getMonth() + 1;
      const year = payload.year ?? now.getFullYear();
      const periodStart = startOfMonth(new Date(year, month - 1, 1));
      const periodEnd = endOfMonth(periodStart);

      const paymentStatuses: PaymentStatus[] = payload.includePendingVerification
        ? [PaymentStatus.OVERDUE, PaymentStatus.PENDING_VERIFICATION]
        : [PaymentStatus.OVERDUE];

      const payments = await prisma.payment.findMany({
        where: {
          userId,
          paymentType: 'RENT',
          status: { in: paymentStatuses },
          dueDate: { gte: periodStart, lte: periodEnd },
          ...(payload.propertyId && payload.propertyId !== 'all'
            ? { propertyId: payload.propertyId }
            : {}),
        },
        select: {
          id: true,
          status: true,
          amount: true,
          dueDate: true,
          paymentReference: true,
          tenant: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          property: {
            select: {
              name: true,
            },
          },
        },
        orderBy: [{ dueDate: 'asc' }, { amount: 'desc' }],
      });

      const existingTasks = await prisma.task.findMany({
        where: {
          userId,
          taskType: 'PAYMENT_REMINDER',
          relatedType: 'payment',
          relatedId: { in: payments.map((payment) => payment.id) },
          status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        },
        select: {
          relatedId: true,
        },
      });

      const existingTaskIds = new Set(existingTasks.map((task) => task.relatedId).filter(Boolean));
      const checklist = await getTemplateChecklist(userId, 'PAYMENT_REMINDER', 'payment');
      let createdCount = 0;

      for (const payment of payments) {
        if (existingTaskIds.has(payment.id)) {
          continue;
        }

        const workflow = getArrearsWorkflow(payment.status, payment.dueDate);
        if (!workflow) {
          continue;
        }

        const tenantName = payment.tenant
          ? `${payment.tenant.firstName} ${payment.tenant.lastName}`
          : 'Unknown tenant';
        const propertyName = payment.property?.name || 'Unassigned property';
        const dueDateLabel = payment.dueDate ? format(payment.dueDate, 'PPP') : 'No due date';
        const daysOverdue =
          payment.status === 'OVERDUE' && payment.dueDate
            ? differenceInCalendarDays(
                startOfDay(new Date()),
                startOfDay(new Date(payment.dueDate))
              )
            : 0;

        const task = await prisma.task.create({
          data: {
            userId,
            title: `${workflow.label}: ${tenantName}`,
            description: `${propertyName} rent payment requires landlord follow-up.`,
            taskType: 'PAYMENT_REMINDER',
            priority: workflow.priority,
            dueDate: startOfDay(new Date()),
            reminderDate: startOfDay(new Date()),
            relatedType: 'payment',
            relatedId: payment.id,
            notes: [
              `Reference: ${payment.paymentReference}`,
              `Amount: R${Number(payment.amount).toFixed(2)}`,
              `Due date: ${dueDateLabel}`,
              payment.status === 'OVERDUE'
                ? `Days overdue: ${daysOverdue}`
                : 'Status: Pending verification',
              `Action: ${workflow.guidance}`,
            ].join('\n'),
          },
        });

        if (checklist.length > 0) {
          await prisma.taskChecklist.createMany({
            data: checklist.map((item, index) => ({
              taskId: task.id,
              item: item.item,
              isRequired: item.isRequired,
              sortOrder: item.sortOrder ?? index,
            })),
          });
        }

        createdCount++;
      }

      return NextResponse.json({
        workflow: payload.workflow,
        totalEligible: payments.length,
        createdCount,
        skippedCount: payments.length - createdCount,
      });
    }

    if (payload.workflow === 'maintenance_operations') {
      const requests = await prisma.maintenanceRequest.findMany({
        where: {
          userId,
          ...(payload.propertyId && payload.propertyId !== 'all'
            ? { propertyId: payload.propertyId }
            : {}),
        },
        include: {
          property: {
            select: {
              name: true,
            },
          },
          tenant: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });

      const existingTasks = await prisma.task.findMany({
        where: {
          userId,
          status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
          OR: [
            {
              maintenanceRequestId: { in: requests.map((request) => request.id) },
            },
            {
              relatedType: 'maintenance',
              relatedId: { in: requests.map((request) => request.id) },
            },
          ],
        },
        select: {
          maintenanceRequestId: true,
          relatedId: true,
        },
      });

      const existingTaskIds = new Set(
        existingTasks
          .flatMap((task) => [task.maintenanceRequestId, task.relatedId])
          .filter((value): value is string => Boolean(value))
      );
      const followUpChecklist = await getTemplateChecklist(userId, 'FOLLOW_UP', 'maintenance');
      let createdCount = 0;
      let totalEligible = 0;

      for (const request of requests) {
        const workflow = getMaintenanceWorkflow(request);
        if (!workflow) {
          continue;
        }

        totalEligible++;
        if (existingTaskIds.has(request.id)) {
          continue;
        }

        const propertyName = request.property?.name || 'Unassigned property';
        const tenantName = request.tenant
          ? `${request.tenant.firstName} ${request.tenant.lastName}`
          : 'No tenant linked';
        const task = await prisma.task.create({
          data: {
            userId,
            maintenanceRequestId: request.id,
            title: getMaintenanceTaskTitle(workflow.stage, request.title),
            description: `${propertyName} maintenance request needs landlord action.`,
            taskType: workflow.taskType,
            priority: workflow.priority,
            assignedTo: request.assignedTo || undefined,
            dueDate: workflow.dueDate,
            reminderDate: workflow.dueDate,
            relatedType: 'maintenance',
            relatedId: request.id,
            notes: [
              `Property: ${propertyName}`,
              `Tenant: ${tenantName}`,
              `Issue: ${request.title}`,
              request.scheduledDate
                ? `Scheduled date: ${format(request.scheduledDate, 'PPP')}`
                : 'Scheduled date: Not set',
              request.assignedTo ? `Assigned to: ${request.assignedTo}` : 'Assigned to: Unassigned',
              `Action: ${workflow.guidance}`,
            ].join('\n'),
          },
        });

        const checklist =
          workflow.taskType === 'FOLLOW_UP' && followUpChecklist.length > 0
            ? followUpChecklist
            : getMaintenanceOpsChecklist(workflow.stage);

        if (checklist.length > 0) {
          await prisma.taskChecklist.createMany({
            data: checklist.map((item, index) => ({
              taskId: task.id,
              item: item.item,
              isRequired: item.isRequired,
              sortOrder: item.sortOrder ?? index,
            })),
          });
        }

        createdCount++;
      }

      return NextResponse.json({
        workflow: payload.workflow,
        totalEligible,
        createdCount,
        skippedCount: totalEligible - createdCount,
      });
    }

    const today = startOfDay(new Date());
    const leases = await prisma.propertyTenant.findMany({
      where: {
        userId,
        isActive: true,
        leaseEndDate: {
          not: null,
          gte: today,
          lte: addDays(today, payload.windowDays),
        },
        ...(payload.propertyId && payload.propertyId !== 'all'
          ? { propertyId: payload.propertyId }
          : {}),
      },
      include: {
        tenant: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        property: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { leaseEndDate: 'asc' },
    });

    const existingTasks = await prisma.task.findMany({
      where: {
        userId,
        taskType: 'LEASE_RENEWAL',
        relatedType: 'lease',
        relatedId: { in: leases.map((lease) => lease.id) },
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
      },
      select: {
        relatedId: true,
      },
    });

    const existingTaskIds = new Set(existingTasks.map((task) => task.relatedId).filter(Boolean));
    const checklist = await getTemplateChecklist(userId, 'LEASE_RENEWAL', 'lease');
    let createdCount = 0;

    for (const lease of leases) {
      if (!lease.leaseEndDate || existingTaskIds.has(lease.id)) {
        continue;
      }

      const daysUntilExpiry = differenceInCalendarDays(
        startOfDay(new Date(lease.leaseEndDate)),
        today
      );
      const workflow = getLeaseRenewalWorkflow(daysUntilExpiry);
      const tenantName = `${lease.tenant.firstName} ${lease.tenant.lastName}`;
      const propertyName = lease.property.name;

      const task = await prisma.task.create({
        data: {
          userId,
          title: `Lease renewal: ${tenantName}`,
          description: `${propertyName} lease expires on ${format(lease.leaseEndDate, 'PPP')}.`,
          taskType: 'LEASE_RENEWAL',
          priority: workflow.priority,
          dueDate: getLeaseRenewalTaskDueDate(lease.leaseEndDate),
          relatedType: 'lease',
          relatedId: lease.id,
          notes: [
            `Tenant: ${tenantName}`,
            `Property: ${propertyName}`,
            `Lease end date: ${format(lease.leaseEndDate, 'PPP')}`,
            `Monthly rent: R${Number(lease.monthlyRent).toFixed(2)}`,
            `Action: ${workflow.guidance}`,
          ].join('\n'),
        },
      });

      if (checklist.length > 0) {
        await prisma.taskChecklist.createMany({
          data: checklist.map((item, index) => ({
            taskId: task.id,
            item: item.item,
            isRequired: item.isRequired,
            sortOrder: item.sortOrder ?? index,
          })),
        });
      }

      createdCount++;
    }

    return NextResponse.json({
      workflow: payload.workflow,
      totalEligible: leases.length,
      createdCount,
      skippedCount: leases.length - createdCount,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error generating landlord workflow tasks:', error);
    return NextResponse.json({ error: 'Failed to generate workflow tasks' }, { status: 500 });
  }
}
