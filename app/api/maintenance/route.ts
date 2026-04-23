import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import {
  maintenanceService,
  createMaintenanceSchema,
  listMaintenanceSchema,
} from '@/lib/features/maintenance';
import { getMaintenanceWorkflow } from '@/lib/features/maintenance/utils/maintenance-workflows';
import { notifyMaintenanceRequest } from '@/lib/notifications';
import { ValidationError, NotFoundError, ForbiddenError } from '@/lib/shared/errors/app-error';

/**
 * GET /api/maintenance - List maintenance requests
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Parse and validate filters
    const filters = listMaintenanceSchema.parse({
      propertyId: searchParams.get('propertyId') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
    });

    // Use service layer
    const maintenanceRequests = await maintenanceService.list(session.user.id, filters);
    const enrichedRequests = maintenanceRequests.map((request) => {
      const workflow = getMaintenanceWorkflow(request);
      const workflowTask =
        workflow && request.tasks.length > 0
          ? request.tasks.find((task) =>
              workflow.taskType === 'FOLLOW_UP'
                ? task.taskType === 'FOLLOW_UP'
                : task.taskType === 'MAINTENANCE'
            ) || request.tasks[0]
          : null;

      return {
        ...request,
        workflow: workflow
          ? {
              ...workflow,
              task: workflowTask
                ? {
                    id: workflowTask.id,
                    title: workflowTask.title,
                    taskType: workflowTask.taskType,
                    priority: workflowTask.priority,
                    status: workflowTask.status,
                    dueDate: workflowTask.dueDate,
                  }
                : null,
            }
          : null,
      };
    });

    // Apply pagination
    const total = enrichedRequests.length;
    const startIndex = (page - 1) * limit;
    const paginatedData = enrichedRequests.slice(startIndex, startIndex + limit);

    const summary = enrichedRequests.reduce(
      (acc, request) => {
        acc.total++;

        switch (request.status) {
          case 'PENDING':
            acc.pending++;
            break;
          case 'SCHEDULED':
            acc.scheduled++;
            break;
          case 'IN_PROGRESS':
            acc.inProgress++;
            break;
          case 'COMPLETED':
            acc.completed++;
            break;
          case 'CANCELLED':
            acc.cancelled++;
            break;
        }

        if (!request.workflow) {
          return acc;
        }

        acc.activeQueue++;
        acc.openWorkflowTasks += request.workflow.task ? 1 : 0;
        acc.requestsWithoutWorkflowTask += request.workflow.task ? 0 : 1;

        switch (request.workflow.stage) {
          case 'needs-assignment':
            acc.unassigned++;
            break;
          case 'needs-scheduling':
            acc.unscheduled++;
            break;
          case 'visit-overdue':
            acc.overdueVisits++;
            break;
          case 'work-stalled':
            acc.stalled++;
            break;
          case 'closeout-required':
            acc.closeoutRequired++;
            break;
        }

        return acc;
      },
      {
        total: 0,
        pending: 0,
        scheduled: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0,
        activeQueue: 0,
        unassigned: 0,
        unscheduled: 0,
        overdueVisits: 0,
        stalled: 0,
        closeoutRequired: 0,
        openWorkflowTasks: 0,
        requestsWithoutWorkflowTask: 0,
      }
    );

    return NextResponse.json({
      data: paginatedData,
      summary: {
        total: summary.total,
        pending: summary.pending,
        scheduled: summary.scheduled,
        inProgress: summary.inProgress,
        completed: summary.completed,
        cancelled: summary.cancelled,
        activeQueue: summary.activeQueue,
        unassigned: summary.unassigned,
        unscheduled: summary.unscheduled,
        overdueVisits: summary.overdueVisits,
        stalled: summary.stalled,
        closeoutRequired: summary.closeoutRequired,
        openWorkflowTasks: summary.openWorkflowTasks,
        requestsWithoutWorkflowTask: summary.requestsWithoutWorkflowTask,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }
    console.error('Error fetching maintenance requests:', error);
    return NextResponse.json({ error: 'Failed to fetch maintenance requests' }, { status: 500 });
  }
}

/**
 * POST /api/maintenance - Create a maintenance request
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createMaintenanceSchema.parse(body);

    // Use service layer - handles property/tenant verification
    const maintenanceRequest = await maintenanceService.create(session.user.id, {
      propertyId: validatedData.propertyId,
      tenantId: validatedData.tenantId,
      title: validatedData.title,
      description: validatedData.description,
      category: validatedData.category,
      priority: validatedData.priority,
      scheduledDate: validatedData.scheduledDate,
      estimatedCost: validatedData.estimatedCost,
    });

    // Create notification
    try {
      if (maintenanceRequest.property) {
        await notifyMaintenanceRequest(
          session.user.id,
          validatedData.title,
          maintenanceRequest.property.name,
          maintenanceRequest.id
        );
      }
    } catch (notifyError) {
      console.error('Failed to create notification:', notifyError);
    }

    return NextResponse.json(maintenanceRequest, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message }, { status: 400 });
    }

    console.error('Error creating maintenance request:', error);
    return NextResponse.json({ error: 'Failed to create maintenance request' }, { status: 500 });
  }
}
