'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  PieChart,
  BarChart3,
  Building2,
} from 'lucide-react';

import { PageHeader, Loading } from '@/components/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';

async function fetchReports(year: string) {
  const response = await fetch(`/api/financials/reports?year=${year}`);
  if (!response.ok) throw new Error('Failed to fetch reports');
  return response.json();
}

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

const incomeTypeLabels: Record<string, string> = {
  RENT: 'Rent',
  DEPOSIT: 'Deposit',
  BOOKING: 'Booking',
  CLEANING_FEE: 'Cleaning Fee',
  UTILITIES: 'Utilities',
  LATE_FEE: 'Late Fee',
  DAMAGE: 'Damage',
  REFUND: 'Refund',
  OTHER: 'Other',
};

export default function FinancialReportsPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());

  const { data, isLoading, error } = useQuery({
    queryKey: ['financial-reports', selectedYear],
    queryFn: () => fetchReports(selectedYear),
  });

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financial Reports"
        description="Overview of income, expenses, and property performance"
      >
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-32 rounded-md border px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </PageHeader>

      {isLoading ? (
        <div className="space-y-6">
          <Loading
            size="xl"
            text="Loading financial reports..."
            submessage="Compiling income and expense data"
            className="py-12"
          />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Failed to load reports</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.summary.totalIncome)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <Receipt className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.summary.totalExpenses)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                {data.summary.totalProfit >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    data.summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(data.summary.totalProfit)}
                </div>
                <p className="text-muted-foreground text-xs">{data.summary.profitMargin}% margin</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tax Deductible</CardTitle>
                <Receipt className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.summary.taxDeductible)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Breakdown
              </CardTitle>
              <CardDescription>Income vs Expenses by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.monthlyData.map(
                  (month: {
                    month: number;
                    monthName: string;
                    income: number;
                    expenses: number;
                    profit: number;
                  }) => (
                    <div key={month.month} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{month.monthName}</span>
                        <span className={month.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(month.profit)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <div
                          className="h-2 rounded bg-green-500"
                          style={{
                            width: `${(month.income / Math.max(data.summary.totalIncome, 1)) * 100}%`,
                          }}
                        />
                        <div
                          className="h-2 rounded bg-red-500"
                          style={{
                            width: `${(month.expenses / Math.max(data.summary.totalExpenses, 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <div className="text-muted-foreground flex justify-between text-xs">
                        <span>Income: {formatCurrency(month.income)}</span>
                        <span>Expenses: {formatCurrency(month.expenses)}</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Income Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Income by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(data.incomeByType).length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center">No income data</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.incomeByType)
                      .sort((a, b) => (b[1] as number) - (a[1] as number))
                      .map(([type, amount]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm">{incomeTypeLabels[type] || type}</span>
                          <span className="font-medium">{formatCurrency(amount as number)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Expenses Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Expenses by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(data.expensesByCategory).length === 0 ? (
                  <p className="text-muted-foreground py-4 text-center">No expense data</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(data.expensesByCategory)
                      .sort((a, b) => (b[1] as number) - (a[1] as number))
                      .map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm">{categoryLabels[category] || category}</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(amount as number)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Property Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Property Performance
              </CardTitle>
              <CardDescription>Income and expenses by property</CardDescription>
            </CardHeader>
            <CardContent>
              {data.propertyPerformance.length === 0 ? (
                <p className="text-muted-foreground py-4 text-center">No property data available</p>
              ) : (
                <div className="space-y-4">
                  {data.propertyPerformance.map(
                    (prop: {
                      propertyId: string;
                      propertyName: string;
                      income: number;
                      expenses: number;
                      profit: number;
                    }) => (
                      <div key={prop.propertyId} className="border-b pb-4 last:border-0">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-medium">{prop.propertyName}</h4>
                          <span
                            className={`font-bold ${
                              prop.profit >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {formatCurrency(prop.profit)}
                          </span>
                        </div>
                        <div className="text-muted-foreground grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span>Income: </span>
                            <span className="text-green-600">{formatCurrency(prop.income)}</span>
                          </div>
                          <div>
                            <span>Expenses: </span>
                            <span className="text-red-600">{formatCurrency(prop.expenses)}</span>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
