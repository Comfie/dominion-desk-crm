'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface CollectionTrendChartProps {
  data: Array<{
    month: string;
    expected: number;
    collected: number;
    rate: number;
  }>;
  currency?: string;
}

export function CollectionTrendChart({ data, currency = 'ZAR' }: CollectionTrendChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Collection Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground flex h-[200px] items-center justify-center text-sm">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Collection Trend (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor' }} />
            <YAxis
              yAxisId="left"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={formatCurrency}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              tickFormatter={formatPercent}
              domain={[0, 100]}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;

                return (
                  <div className="bg-background rounded-lg border p-3 shadow-lg">
                    <p className="mb-2 font-semibold">{payload[0].payload.month}</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Expected:</span>
                        <span className="font-medium">
                          {formatCurrency(payload[0].payload.expected)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Collected:</span>
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {formatCurrency(payload[0].payload.collected)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Rate:</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {formatPercent(payload[0].payload.rate)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px' }} iconType="line" />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="expected"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Expected"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="collected"
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Collected"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="rate"
              stroke="hsl(221, 83%, 53%)"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Collection Rate (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
