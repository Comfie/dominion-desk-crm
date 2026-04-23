import { MaintenanceStatus, Priority, TaskType } from '@prisma/client';
import { differenceInCalendarDays, startOfDay } from 'date-fns';

export interface MaintenanceWorkflowInput {
  status: MaintenanceStatus;
  priority: Priority;
  assignedTo?: string | null;
  scheduledDate?: Date | string | null;
  completedDate?: Date | string | null;
  actualCost?: unknown;
  resolutionNotes?: string | null;
  followUpSent?: boolean | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface MaintenanceWorkflowInfo {
  stage:
    | 'needs-assignment'
    | 'needs-scheduling'
    | 'visit-overdue'
    | 'work-stalled'
    | 'closeout-required';
  label: string;
  guidance: string;
  priority: Priority;
  taskType: TaskType;
  ageDays: number;
  staleDays: number;
  daysPastSchedule: number;
  dueDate: Date;
}

const priorityRank: Record<Priority, number> = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  URGENT: 3,
};

function maxPriority(...priorities: Priority[]) {
  return priorities.reduce((highest, current) =>
    priorityRank[current] > priorityRank[highest] ? current : highest
  );
}

export function getMaintenanceWorkflow(
  request: MaintenanceWorkflowInput
): MaintenanceWorkflowInfo | null {
  const today = startOfDay(new Date());
  const createdDate = startOfDay(new Date(request.createdAt));
  const updatedDate = startOfDay(new Date(request.updatedAt));
  const scheduledDate = request.scheduledDate ? startOfDay(new Date(request.scheduledDate)) : null;
  const completedDate = request.completedDate ? startOfDay(new Date(request.completedDate)) : null;

  const ageDays = Math.max(0, differenceInCalendarDays(today, createdDate));
  const staleDays = Math.max(0, differenceInCalendarDays(today, updatedDate));
  const daysPastSchedule =
    scheduledDate && scheduledDate < today
      ? Math.max(1, differenceInCalendarDays(today, scheduledDate))
      : 0;

  if (request.status === MaintenanceStatus.COMPLETED) {
    const closeoutAgeDays = completedDate
      ? Math.max(0, differenceInCalendarDays(today, completedDate))
      : 0;
    const missingActualCost =
      request.actualCost === null || request.actualCost === undefined || request.actualCost === '';
    const missingResolutionNotes =
      typeof request.resolutionNotes !== 'string' || request.resolutionNotes.trim().length === 0;
    const needsTenantCloseout = request.followUpSent === false && closeoutAgeDays <= 14;

    if (missingActualCost || missingResolutionNotes || needsTenantCloseout) {
      const closeoutActions: string[] = [];
      if (missingActualCost) {
        closeoutActions.push('record the final contractor cost');
      }
      if (missingResolutionNotes) {
        closeoutActions.push('capture completion notes or evidence');
      }
      if (needsTenantCloseout) {
        closeoutActions.push('confirm the tenant accepts the repair outcome');
      }

      return {
        stage: 'closeout-required',
        label: 'Close out',
        guidance: `Complete close-out by ${closeoutActions.join(', ')}.`,
        priority: maxPriority(
          request.priority,
          missingActualCost || missingResolutionNotes ? 'HIGH' : 'NORMAL'
        ),
        taskType: TaskType.FOLLOW_UP,
        ageDays,
        staleDays,
        daysPastSchedule,
        dueDate: completedDate ?? today,
      };
    }

    return null;
  }

  if (request.status === MaintenanceStatus.CANCELLED) {
    return null;
  }

  if (!request.assignedTo?.trim()) {
    return {
      stage: 'needs-assignment',
      label: 'Assign contractor',
      guidance: 'Assign an owner or contractor so the request has clear accountability.',
      priority: maxPriority(request.priority, ageDays >= 2 ? 'URGENT' : 'HIGH'),
      taskType: TaskType.MAINTENANCE,
      ageDays,
      staleDays,
      daysPastSchedule,
      dueDate: today,
    };
  }

  if (
    (request.status === MaintenanceStatus.PENDING ||
      request.status === MaintenanceStatus.SCHEDULED) &&
    !scheduledDate
  ) {
    return {
      stage: 'needs-scheduling',
      label: 'Schedule visit',
      guidance: 'Set an ETA and confirm the visit window with the tenant.',
      priority: maxPriority(request.priority, ageDays >= 3 ? 'HIGH' : 'NORMAL'),
      taskType: TaskType.MAINTENANCE,
      ageDays,
      staleDays,
      daysPastSchedule,
      dueDate: today,
    };
  }

  if (
    (request.status === MaintenanceStatus.SCHEDULED ||
      request.status === MaintenanceStatus.IN_PROGRESS) &&
    daysPastSchedule > 0
  ) {
    return {
      stage: 'visit-overdue',
      label: 'Visit overdue',
      guidance:
        'The planned visit date has passed. Reconfirm attendance or reschedule immediately.',
      priority: maxPriority(request.priority, 'URGENT'),
      taskType: TaskType.MAINTENANCE,
      ageDays,
      staleDays,
      daysPastSchedule,
      dueDate: today,
    };
  }

  if (request.status === MaintenanceStatus.IN_PROGRESS && staleDays >= 3) {
    return {
      stage: 'work-stalled',
      label: 'Work stalled',
      guidance:
        'Progress has gone quiet. Get a status update, next ETA, and tenant communication logged.',
      priority: maxPriority(request.priority, staleDays >= 7 ? 'URGENT' : 'HIGH'),
      taskType: TaskType.MAINTENANCE,
      ageDays,
      staleDays,
      daysPastSchedule,
      dueDate: today,
    };
  }

  return null;
}
