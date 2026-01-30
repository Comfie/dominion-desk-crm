'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Download, FileText, TrendingUp, TrendingDown, DollarSign, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface TaxSummaryData {
  year: number;
  summary: {
    totalIncome: number;
    totalDeductibleExpenses: number;
    totalNonDeductibleExpenses: number;
    totalExpenses: number;
    netTaxableIncome: number;
    netProfit: number;
  };
  incomeByType: Record<string, number>;
  deductibleExpenses: Record<string, number>;
  nonDeductibleExpenses: Record<string, number>;
  incomeByProperty: { name: string; amount: number }[];
  expensesByProperty: { name: string; deductible: number; nonDeductible: number }[];
  monthlyBreakdown: {
    month: number;
    monthName: string;
    income: number;
    deductibleExpenses: number;
    nonDeductibleExpenses: number;
    netIncome: number;
  }[];
  properties: { id: string; name: string; purchasePrice: number | null }[];
  metadata: { generatedAt: string; paymentsCount: number; expensesCount: number };
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

const formatLabel = (key: string) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

export default function TaxSummaryPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data, isLoading, error } = useQuery<TaxSummaryData>({
    queryKey: ['tax-summary', year],
    queryFn: async () => {
      const res = await fetch(`/api/reports/tax-summary?year=${year}`);
      if (!res.ok) throw new Error('Failed to fetch tax summary');
      return res.json();
    },
  });

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleExport = () => {
    // Create a simple text report for download
    if (!data) return;

    let report = `TAX SUMMARY REPORT - ${year}\n`;
    report += `Generated: ${format(new Date(data.metadata.generatedAt), 'PPpp')}\n\n`;
    report += `=== SUMMARY ===\n`;
    report += `Total Income: ${formatCurrency(data.summary.totalIncome)}\n`;
    report += `Total Deductible Expenses: ${formatCurrency(data.summary.totalDeductibleExpenses)}\n`;
    report += `Net Taxable Income: ${formatCurrency(data.summary.netTaxableIncome)}\n\n`;
    report += `=== INCOME BY TYPE ===\n`;
    Object.entries(data.incomeByType).forEach(([type, amount]) => {
      report += `${formatLabel(type)}: ${formatCurrency(amount)}\n`;
    });
    report += `\n=== DEDUCTIBLE EXPENSES ===\n`;
    Object.entries(data.deductibleExpenses).forEach(([category, amount]) => {
      report += `${formatLabel(category)}: ${formatCurrency(amount)}\n`;
    });

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tax-summary-${year}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Summary Report"
        description="Annual income and expense summary for tax purposes"
      >
        <div className="flex items-center gap-4">
          <Link href="/reports/analytics">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Analytics
            </Button>
          </Link>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border-input focus-visible:ring-ring flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <Button onClick={handleExport} disabled={!data}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-red-500">Failed to load tax summary. Please try again.</p>
          </CardContent>
        </Card>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.summary.totalIncome)}</div>
                <p className="text-muted-foreground text-xs">
                  {data.metadata.paymentsCount} payments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Deductible Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.summary.totalDeductibleExpenses)}
                </div>
                <p className="text-muted-foreground text-xs">Tax deductible</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Net Taxable Income</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.summary.netTaxableIncome)}
                </div>
                <p className="text-muted-foreground text-xs">Income - Deductible</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                <FileText className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.summary.netProfit)}</div>
                <p className="text-muted-foreground text-xs">After all expenses</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Income by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Income by Type</CardTitle>
                <CardDescription>Breakdown of rental income sources</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(data.incomeByType).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(data.incomeByType).map(([type, amount]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm">{formatLabel(type)}</span>
                        <span className="font-medium">{formatCurrency(amount)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No income recorded for this year</p>
                )}
              </CardContent>
            </Card>

            {/* Deductible Expenses */}
            <Card>
              <CardHeader>
                <CardTitle>Deductible Expenses</CardTitle>
                <CardDescription>Expenses that can be claimed for tax</CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(data.deductibleExpenses).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(data.deductibleExpenses).map(([category, amount]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-sm">{formatLabel(category)}</span>
                        <span className="font-medium text-red-600">-{formatCurrency(amount)}</span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between font-bold">
                      <span>Total Deductible</span>
                      <span className="text-red-600">
                        -{formatCurrency(data.summary.totalDeductibleExpenses)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No deductible expenses recorded</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
              <CardDescription>Income and expenses by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="py-2 text-left font-medium">Month</th>
                      <th className="py-2 text-right font-medium">Income</th>
                      <th className="py-2 text-right font-medium">Expenses</th>
                      <th className="py-2 text-right font-medium">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.monthlyBreakdown.map((month) => (
                      <tr key={month.month} className="border-b">
                        <td className="py-2">{month.monthName}</td>
                        <td className="py-2 text-right text-green-600">
                          {formatCurrency(month.income)}
                        </td>
                        <td className="py-2 text-right text-red-600">
                          {formatCurrency(month.deductibleExpenses + month.nonDeductibleExpenses)}
                        </td>
                        <td
                          className={`py-2 text-right font-medium ${month.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {formatCurrency(month.netIncome)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Income by Property */}
          {data.incomeByProperty.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Income by Property</CardTitle>
                <CardDescription>Revenue generated per property</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.incomeByProperty.map((property, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{property.name}</span>
                      <span className="font-medium">{formatCurrency(property.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Report Metadata */}
          <p className="text-muted-foreground text-center text-xs">
            Report generated on {format(new Date(data.metadata.generatedAt), 'PPpp')} • Based on{' '}
            {data.metadata.paymentsCount} payments and {data.metadata.expensesCount} expenses
          </p>
        </>
      ) : null}
    </div>
  );
}
