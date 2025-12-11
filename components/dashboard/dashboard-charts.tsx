'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Pie,
  PieChart,
  Legend,
} from 'recharts';

interface DashboardChartsProps {
  data?: {
    revenue: Array<{ name: string; total: number }>;
    propertyStatus: Array<{ name: string; value: number }>;
  };
}

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#ef4444', '#64748b'];

export function DashboardCharts({ data }: DashboardChartsProps) {
  if (!data) return null;

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4" variant="elevated">
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
          <CardDescription>Monthly revenue for the last 6 months</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.revenue}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `R${value}`}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar dataKey="total" fill="#0ea5e9" radius={[4, 4, 0, 0]} className="fill-primary" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="col-span-3" variant="elevated">
        <CardHeader>
          <CardTitle>Property Status</CardTitle>
          <CardDescription>Current distribution of property statuses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[350px] w-full items-center justify-center">
            {data.propertyStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.propertyStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.propertyStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    itemStyle={{ color: '#1f2937' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground flex h-full items-center justify-center">
                No property data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
