'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Plus, Receipt, Clock, CheckCircle, FileText } from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/ui/pagination';
import { ExpenseCard } from '@/components/financials/expense-card';
import { formatCurrency } from '@/lib/utils';

async function fetchExpenses(filters: Record<string, string>, page = 1) {
  const params = new URLSearchParams({ ...filters, page: page.toString() });
  const response = await fetch(`/api/expenses?${params}`);
  if (!response.ok) throw new Error('Failed to fetch expenses');
  return response.json();
}

export default function ExpensesPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['expenses', statusFilter, categoryFilter, page],
    queryFn: () =>
      fetchExpenses(
        {
          ...(statusFilter && { status: statusFilter }),
          ...(categoryFilter && { category: categoryFilter }),
        },
        page
      ),
  });

  const expenses = data?.data || [];
  const pagination = data?.pagination;
  const summary = data?.summary;

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" description="Track all property-related expenses">
        <Button asChild>
          <Link href="/financials/expenses/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Link>
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Receipt className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(data.summary.totalAmount)}
              </div>
              <p className="text-muted-foreground text-xs">{data.summary.count} expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.paidAmount)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(data.summary.unpaidAmount)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tax Deductible</CardTitle>
              <FileText className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(data.summary.deductibleAmount)}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border-input focus-visible:ring-ring flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
        >
          <option value="">All Status</option>
          <option value="UNPAID">Unpaid</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="border-input focus-visible:ring-ring flex h-9 rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
        >
          <option value="">All Categories</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="UTILITIES">Utilities</option>
          <option value="INSURANCE">Insurance</option>
          <option value="PROPERTY_TAX">Property Tax</option>
          <option value="MORTGAGE">Mortgage</option>
          <option value="CLEANING">Cleaning</option>
          <option value="SUPPLIES">Supplies</option>
          <option value="ADVERTISING">Advertising</option>
          <option value="PROFESSIONAL_FEES">Professional Fees</option>
          <option value="MANAGEMENT_FEE">Management Fee</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      {/* Expenses List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Failed to load expenses</p>
          </CardContent>
        </Card>
      ) : expenses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Receipt className="text-muted-foreground/50 mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">No expenses yet</h3>
            <p className="text-muted-foreground mt-2">
              Add your first expense to start tracking costs.
            </p>
            <Button asChild className="mt-4">
              <Link href="/financials/expenses/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {expenses.map(
              (expense: {
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
              }) => (
                <ExpenseCard key={expense.id} expense={expense} />
              )
            )}
          </div>
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
