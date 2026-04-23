import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({ title, value, description, icon: Icon, trend }: StatsCardProps) {
  return (
    <Card className="admin-stat-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white/80">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-white/40" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {description && <p className="mt-1 text-xs text-white/55">{description}</p>}
        {trend && (
          <p className={`mt-1 text-xs ${trend.isPositive ? 'text-emerald-300' : 'text-red-300'}`}>
            {trend.isPositive ? '+' : ''}
            {trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
