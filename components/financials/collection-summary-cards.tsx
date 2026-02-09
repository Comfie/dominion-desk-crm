'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';

interface CollectionSummaryCardsProps {
  summary: {
    totalExpected: number;
    totalCollected: number;
    collectionRate: number;
    outstandingAmount: number;
    overdueCount: number;
    pendingVerificationCount: number;
  };
  currency?: string;
}

export function CollectionSummaryCards({ summary, currency = 'ZAR' }: CollectionSummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const cards = [
    {
      title: 'Total Expected',
      value: formatCurrency(summary.totalExpected),
      icon: DollarSign,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
    {
      title: 'Total Collected',
      value: formatCurrency(summary.totalCollected),
      icon: TrendingUp,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950',
    },
    {
      title: 'Collection Rate',
      value: `${summary.collectionRate.toFixed(1)}%`,
      subtitle:
        summary.collectionRate >= 90
          ? 'Excellent'
          : summary.collectionRate >= 70
            ? 'Good'
            : 'Needs Attention',
      icon: summary.collectionRate >= 70 ? TrendingUp : TrendingDown,
      color:
        summary.collectionRate >= 90
          ? 'text-green-600 dark:text-green-400'
          : summary.collectionRate >= 70
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-red-600 dark:text-red-400',
      bgColor:
        summary.collectionRate >= 90
          ? 'bg-green-50 dark:bg-green-950'
          : summary.collectionRate >= 70
            ? 'bg-yellow-50 dark:bg-yellow-950'
            : 'bg-red-50 dark:bg-red-950',
    },
    {
      title: 'Outstanding',
      value: formatCurrency(summary.outstandingAmount),
      subtitle: summary.overdueCount > 0 ? `${summary.overdueCount} overdue` : undefined,
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">{card.title}</p>
                  <p className="mt-2 text-2xl font-bold">{card.value}</p>
                  {card.subtitle && <p className={`mt-1 text-xs ${card.color}`}>{card.subtitle}</p>}
                </div>
                <div className={`rounded-full p-3 ${card.bgColor}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
