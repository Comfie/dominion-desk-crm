import type { LucideIcon } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="text-muted-foreground h-4 w-4" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-muted-foreground text-xs">{description}</p>}
        {trend && (
          <p className={cn('mt-1 text-xs', trend.isPositive ? 'text-green-600' : 'text-red-600')}>
            {trend.isPositive ? '+' : '-'}
            {Math.abs(trend.value)}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
