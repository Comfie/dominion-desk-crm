import { Building2, Calendar, Users, DollarSign, MessageSquare, Wrench } from 'lucide-react';

import { PageHeader, StatsCard } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your properties."
      >
        <Button>Add Property</Button>
      </PageHeader>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatsCard
          title="Total Properties"
          value="12"
          icon={Building2}
          trend={{ value: 8.2, isPositive: true }}
        />
        <StatsCard
          title="Active Bookings"
          value="8"
          icon={Calendar}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatsCard
          title="Total Tenants"
          value="24"
          icon={Users}
          description="Across all properties"
        />
        <StatsCard
          title="Monthly Revenue"
          value="R 156,000"
          icon={DollarSign}
          trend={{ value: 4.3, isPositive: true }}
        />
        <StatsCard
          title="Pending Inquiries"
          value="5"
          icon={MessageSquare}
          description="Requires attention"
        />
        <StatsCard title="Maintenance" value="3" icon={Wrench} description="Open requests" />
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Your latest booking activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">Sandton Apartment</p>
                    <p className="text-muted-foreground text-sm">Dec 20 - Dec 27, 2024</p>
                  </div>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Confirmed
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
            <CardDescription>Tasks due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Follow up with inquiry', due: 'Today', priority: 'high' },
                { title: 'Prepare check-in package', due: 'Tomorrow', priority: 'normal' },
                { title: 'Schedule property inspection', due: 'In 3 days', priority: 'low' },
              ].map((task, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-muted-foreground text-sm">Due: {task.due}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      task.priority === 'high'
                        ? 'bg-red-100 text-red-800'
                        : task.priority === 'normal'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
