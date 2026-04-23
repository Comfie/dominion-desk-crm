import { PaymentStatus, Priority } from '@prisma/client';
import { differenceInCalendarDays, startOfDay, subDays } from 'date-fns';

export interface ArrearsWorkflowInfo {
  stage: 'proof-review' | 'first-reminder' | 'second-reminder' | 'formal-notice' | 'escalate';
  label: string;
  guidance: string;
  priority: Priority;
}

export interface LeaseRenewalWorkflowInfo {
  stage: 'monitor' | 'start-renewal' | 'finalise-terms' | 'urgent-signing';
  label: string;
  guidance: string;
  priority: Priority;
}

export function getArrearsWorkflow(
  status: PaymentStatus,
  dueDate: Date | string | null
): ArrearsWorkflowInfo | null {
  if (status === PaymentStatus.PENDING_VERIFICATION) {
    return {
      stage: 'proof-review',
      label: 'Proof review',
      guidance: 'Check uploaded proof of payment and either verify or follow up with the tenant.',
      priority: 'HIGH',
    };
  }

  if (status !== PaymentStatus.OVERDUE) {
    return null;
  }

  const daysOverdue = dueDate
    ? Math.max(1, differenceInCalendarDays(startOfDay(new Date()), startOfDay(new Date(dueDate))))
    : 1;

  if (daysOverdue <= 3) {
    return {
      stage: 'first-reminder',
      label: 'First reminder',
      guidance: 'Send a reminder and confirm when the tenant expects to settle the rent.',
      priority: 'HIGH',
    };
  }

  if (daysOverdue <= 7) {
    return {
      stage: 'second-reminder',
      label: 'Second follow-up',
      guidance: 'Call the tenant and document a concrete next payment commitment.',
      priority: 'HIGH',
    };
  }

  if (daysOverdue <= 14) {
    return {
      stage: 'formal-notice',
      label: 'Formal notice',
      guidance: 'Escalate to a formal arrears notice and log every communication attempt.',
      priority: 'URGENT',
    };
  }

  return {
    stage: 'escalate',
    label: 'Escalate',
    guidance: 'Treat this as severe arrears and move into enforcement or legal review.',
    priority: 'URGENT',
  };
}

export function getLeaseRenewalWorkflow(daysUntilExpiry: number): LeaseRenewalWorkflowInfo {
  if (daysUntilExpiry <= 14) {
    return {
      stage: 'urgent-signing',
      label: 'Urgent signing',
      guidance: 'Finalise terms immediately and get the renewal signed before the lease expires.',
      priority: 'URGENT',
    };
  }

  if (daysUntilExpiry <= 30) {
    return {
      stage: 'finalise-terms',
      label: 'Finalise terms',
      guidance: 'Settle the new rent and document package so signing can happen this month.',
      priority: 'HIGH',
    };
  }

  if (daysUntilExpiry <= 60) {
    return {
      stage: 'start-renewal',
      label: 'Start renewal',
      guidance: 'Open the renewal conversation now and confirm whether the tenant plans to stay.',
      priority: 'HIGH',
    };
  }

  return {
    stage: 'monitor',
    label: 'Monitor',
    guidance: 'Track the lease and prepare renewal terms before the 60-day mark.',
    priority: 'NORMAL',
  };
}

export function getLeaseRenewalTaskDueDate(leaseEndDate: Date | string): Date {
  const today = startOfDay(new Date());
  const targetDate = startOfDay(subDays(new Date(leaseEndDate), 30));
  return targetDate < today ? today : targetDate;
}
