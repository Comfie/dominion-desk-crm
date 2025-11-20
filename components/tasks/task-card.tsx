'use client';

import Link from 'next/link';
import { Calendar, Clock, User, Building2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description?: string | null;
    taskType: string;
    priority: string;
    status: string;
    dueDate?: string | null;
    assignedTo?: string | null;
    relatedType?: string | null;
    relatedId?: string | null;
    createdAt: string;
  };
}

const statusIcons: Record<string, React.ReactNode> = {
  TODO: <Circle className="h-4 w-4 text-gray-400" />,
  IN_PROGRESS: <Clock className="h-4 w-4 text-blue-600" />,
  COMPLETED: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  CANCELLED: <AlertCircle className="h-4 w-4 text-gray-400" />,
};

const statusColors: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-800 border-gray-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  CANCELLED: 'bg-gray-100 text-gray-500 border-gray-200',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  NORMAL: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

const taskTypeLabels: Record<string, string> = {
  FOLLOW_UP: 'Follow Up',
  VIEWING: 'Viewing',
  CHECK_IN: 'Check In',
  CHECK_OUT: 'Check Out',
  INSPECTION: 'Inspection',
  MAINTENANCE: 'Maintenance',
  PAYMENT_REMINDER: 'Payment Reminder',
  LEASE_RENEWAL: 'Lease Renewal',
  OTHER: 'Other',
};

export function TaskCard({ task }: TaskCardProps) {
  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== 'COMPLETED' &&
    task.status !== 'CANCELLED';

  return (
    <Link href={`/tasks/${task.id}`}>
      <Card
        className={`hover:bg-muted/50 cursor-pointer transition-colors ${
          isOverdue ? 'border-red-200' : ''
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                {statusIcons[task.status]}
                <h3 className="font-semibold">{task.title}</h3>
              </div>

              {task.description && (
                <p className="text-muted-foreground line-clamp-2 text-sm">{task.description}</p>
              )}

              <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
                {task.dueDate && (
                  <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : ''}`}>
                    <Calendar className="h-4 w-4" />
                    <span>
                      {isOverdue ? 'Overdue: ' : 'Due: '}
                      {formatDate(task.dueDate)}
                    </span>
                  </div>
                )}

                {task.assignedTo && (
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{task.assignedTo}</span>
                  </div>
                )}

                {task.relatedType && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span className="capitalize">{task.relatedType}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge className={statusColors[task.status]}>{task.status.replace('_', ' ')}</Badge>
              <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
              <span className="text-muted-foreground text-xs">
                {taskTypeLabels[task.taskType] || task.taskType}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
