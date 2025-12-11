'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
} from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Task {
  id: string;
  title: string;
  taskType: string;
  priority: string;
  status: string;
  dueDate?: string | null;
}

const statusIcons: Record<string, React.ReactNode> = {
  TODO: <Circle className="h-3 w-3 text-gray-400" />,
  IN_PROGRESS: <Clock className="h-3 w-3 text-blue-600" />,
  COMPLETED: <CheckCircle2 className="h-3 w-3 text-green-600" />,
  CANCELLED: <AlertCircle className="h-3 w-3 text-gray-400" />,
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export default function TaskCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calculate date range for the current month view
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Get the start of the week containing the first day
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // Get the end of the week containing the last day
  const endDate = new Date(lastDayOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  // Fetch tasks for the visible range
  const { data, isLoading } = useQuery({
    queryKey: ['tasks-calendar', year, month],
    queryFn: async () => {
      // Use date range parameters to fetch tasks for the current month view
      const params = new URLSearchParams({
        dueAfter: startDate.toISOString(),
        dueBefore: endDate.toISOString(),
        limit: '100', // Fetch more tasks for calendar view
      });
      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
  });

  // Filter tasks that have due dates (API returns tasks in data.data, not data.tasks)
  const tasksWithDueDates = data?.data?.filter((task: Task) => task.dueDate) || [];

  // Group tasks by date
  const tasksByDate: Record<string, Task[]> = {};
  tasksWithDueDates.forEach((task: Task) => {
    if (task.dueDate) {
      const dateKey = new Date(task.dueDate).toISOString().split('T')[0]!;
      if (!tasksByDate[dateKey]) {
        tasksByDate[dateKey] = [];
      }
      tasksByDate[dateKey].push(task);
    }
  });

  // Generate calendar days
  const calendarDays: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    calendarDays.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  // Navigation functions
  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Task Calendar" description="View your tasks organized by due date">
        <div className="flex gap-2">
          <Link href="/tasks">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              List View
            </Button>
          </Link>
          <Link href="/tasks/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </Link>
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {monthNames[month]} {year}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-7 gap-1">
              {[...Array(35)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              {/* Day headers */}
              <div className="grid grid-cols-7 border-b bg-gray-50">
                {dayNames.map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {calendarDays.map((date, index) => {
                  const dateKey = date.toISOString().split('T')[0]!;
                  const dayTasks = tasksByDate[dateKey] || [];

                  return (
                    <div
                      key={index}
                      className={`min-h-32 border-r border-b p-1 ${
                        !isCurrentMonth(date) ? 'bg-gray-50' : ''
                      } ${isToday(date) ? 'bg-blue-50' : ''}`}
                    >
                      <div
                        className={`mb-1 text-sm font-medium ${
                          !isCurrentMonth(date) ? 'text-gray-400' : ''
                        } ${isToday(date) ? 'text-blue-600' : ''}`}
                      >
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {dayTasks.slice(0, 3).map((task: Task) => (
                          <Link key={task.id} href={`/tasks/${task.id}`}>
                            <div
                              className={`flex items-center gap-1 rounded p-1 text-xs hover:bg-gray-100 ${
                                task.status === 'COMPLETED' ? 'line-through opacity-60' : ''
                              }`}
                            >
                              {statusIcons[task.status]}
                              <span className="flex-1 truncate">{task.title}</span>
                              {task.priority === 'URGENT' && (
                                <span className="h-2 w-2 rounded-full bg-red-500" />
                              )}
                              {task.priority === 'HIGH' && (
                                <span className="h-2 w-2 rounded-full bg-orange-500" />
                              )}
                            </div>
                          </Link>
                        ))}
                        {dayTasks.length > 3 && (
                          <div className="text-muted-foreground px-1 text-xs">
                            +{dayTasks.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium">Legend:</span>
            <div className="flex items-center gap-1">
              <Circle className="h-3 w-3 text-gray-400" />
              <span>To Do</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-600" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span>Urgent</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span>High Priority</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Tasks Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks This Month</CardTitle>
        </CardHeader>
        <CardContent>
          {tasksWithDueDates.filter((task: Task) => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return taskDate.getMonth() === month && taskDate.getFullYear() === year;
          }).length === 0 ? (
            <p className="text-muted-foreground text-sm">No tasks scheduled for this month</p>
          ) : (
            <div className="space-y-2">
              {tasksWithDueDates
                .filter((task: Task) => {
                  if (!task.dueDate) return false;
                  const taskDate = new Date(task.dueDate);
                  return taskDate.getMonth() === month && taskDate.getFullYear() === year;
                })
                .sort((a: Task, b: Task) => {
                  return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();
                })
                .slice(0, 10)
                .map((task: Task) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors">
                      <div className="flex items-center gap-3">
                        {statusIcons[task.status]}
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-muted-foreground text-xs">
                            {new Date(task.dueDate!).toLocaleDateString('en-ZA', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short',
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
