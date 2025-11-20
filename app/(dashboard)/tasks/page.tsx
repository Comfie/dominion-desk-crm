'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  ListTodo,
} from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { TaskCard } from '@/components/tasks/task-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Task {
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
}

async function fetchTasks(params: { status?: string; priority?: string; taskType?: string }) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.priority) searchParams.set('priority', params.priority);
  if (params.taskType) searchParams.set('taskType', params.taskType);

  const response = await fetch(`/api/tasks?${searchParams.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  return response.json();
}

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [priority, setPriority] = useState('');
  const [taskType, setTaskType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const statusFilter = activeTab === 'all' ? undefined : activeTab;

  const { data, isLoading, error } = useQuery({
    queryKey: ['tasks', statusFilter, priority, taskType],
    queryFn: () =>
      fetchTasks({
        status: statusFilter,
        priority: priority || undefined,
        taskType: taskType || undefined,
      }),
  });

  // Quick status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Filter tasks by search term
  const filteredTasks = data?.tasks?.filter((task: Task) =>
    searchTerm
      ? task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Tasks" description="Manage your tasks and reminders">
        <div className="flex gap-2">
          <Link href="/tasks/calendar">
            <Button variant="outline">
              <ListTodo className="mr-2 h-4 w-4" />
              Calendar
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

      {/* Summary Cards */}
      {data?.summary && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <CheckSquare className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">To Do</CardTitle>
              <ListTodo className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.todo}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.summary.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.summary.overdue}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>

              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
              >
                <option value="">All Types</option>
                <option value="FOLLOW_UP">Follow Up</option>
                <option value="VIEWING">Viewing</option>
                <option value="CHECK_IN">Check In</option>
                <option value="CHECK_OUT">Check Out</option>
                <option value="INSPECTION">Inspection</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="PAYMENT_REMINDER">Payment Reminder</option>
                <option value="LEASE_RENEWAL">Lease Renewal</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List with Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="TODO">To Do</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">Failed to load tasks</p>
              </CardContent>
            </Card>
          ) : filteredTasks?.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <CheckSquare className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">No tasks found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || priority || taskType || activeTab !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first task to get started'}
                </p>
                <Link href="/tasks/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Task
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task: Task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
