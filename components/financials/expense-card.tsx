'use client';

import Link from 'next/link';
import { Receipt, Calendar, Building2, Tag } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ExpenseCardProps {
  expense: {
    id: string;
    title: string;
    category: string;
    amount: number;
    expenseDate: string;
    status: string;
    vendor?: string | null;
    isDeductible: boolean;
    property?: {
      id: string;
      name: string;
    } | null;
  };
}

const statusColors: Record<string, string> = {
  UNPAID: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PAID: 'bg-green-100 text-green-800 border-green-200',
  OVERDUE: 'bg-red-100 text-red-800 border-red-200',
};

const categoryLabels: Record<string, string> = {
  MAINTENANCE: 'Maintenance',
  UTILITIES: 'Utilities',
  INSURANCE: 'Insurance',
  PROPERTY_TAX: 'Property Tax',
  MORTGAGE: 'Mortgage',
  CLEANING: 'Cleaning',
  SUPPLIES: 'Supplies',
  ADVERTISING: 'Advertising',
  PROFESSIONAL_FEES: 'Professional Fees',
  MANAGEMENT_FEE: 'Management Fee',
  OTHER: 'Other',
};

export function ExpenseCard({ expense }: ExpenseCardProps) {
  return (
    <Link href={`/financials/expenses/${expense.id}`}>
      <Card className="hover:bg-muted/50 cursor-pointer transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{expense.title}</h3>
                <Badge variant="outline" className="text-xs">
                  {categoryLabels[expense.category] || expense.category}
                </Badge>
                {expense.isDeductible && (
                  <Badge variant="secondary" className="text-xs">
                    Tax Deductible
                  </Badge>
                )}
              </div>

              <div className="text-muted-foreground flex flex-wrap gap-4 text-sm">
                {expense.property && (
                  <div className="flex items-center gap-1">
                    <Building2 className="h-4 w-4" />
                    <span>{expense.property.name}</span>
                  </div>
                )}
                {expense.vendor && (
                  <div className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    <span>{expense.vendor}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(expense.expenseDate)}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 text-lg font-bold text-red-600">
                <Receipt className="h-4 w-4" />
                {formatCurrency(Number(expense.amount))}
              </div>
              <Badge className={`${statusColors[expense.status]} mt-1`}>{expense.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
