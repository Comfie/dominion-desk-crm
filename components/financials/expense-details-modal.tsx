'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calendar, Building2, FileText, Receipt, Tag, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface ExpenseDetailsModalProps {
  expense: {
    id: string;
    title: string;
    description?: string | null;
    category: string;
    amount: number;
    expenseDate: string;
    status: string;
    vendor?: string | null;
    vendorInvoice?: string | null;
    unitLabel?: string | null;
    isDeductible: boolean;
    notes?: string | null;
    property?: {
      id: string;
      name: string;
      address?: string | null;
    } | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  UNPAID: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
};

const categoryLabels: Record<string, string> = {
  MAINTENANCE: 'Maintenance',
  UTILITIES: 'Utilities',
  INSURANCE: 'Insurance',
  PROPERTY_TAX: 'Property Tax',
  LEVIES: 'Levies',
  RATES: 'Rates',
  MUNICIPAL_CHARGES: 'Municipal Charges',
  CONSTRUCTION: 'Construction',
  LEGAL_FEES: 'Legal Fees',
  CAPITAL_IMPROVEMENT: 'Capital Improvement',
  MORTGAGE: 'Mortgage',
  CLEANING: 'Cleaning',
  SUPPLIES: 'Supplies',
  ADVERTISING: 'Advertising',
  PROFESSIONAL_FEES: 'Professional Fees',
  MANAGEMENT_FEE: 'Management Fee',
  OTHER: 'Other',
};

export function ExpenseDetailsModal({ expense, open, onOpenChange }: ExpenseDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const markAsPaid = useMutation({
    mutationFn: async (expenseId: string) => {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'PAID',
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to mark expense as paid');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Expense updated',
        description: 'Expense has been marked as paid',
      });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (!expense) return null;

  const canMarkAsPaid = expense.status !== 'PAID';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Expense Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header with amount and status */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-red-600">
                {formatCurrency(Number(expense.amount))}
              </div>
              <p className="font-medium">{expense.title}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={statusColors[expense.status] || statusColors.UNPAID}>
                {expense.status}
              </Badge>
              {expense.isDeductible && (
                <Badge variant="secondary" className="text-xs">
                  Tax Deductible
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Expense Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-semibold">Expense Information</h3>

              <div className="flex items-start gap-3">
                <FileText className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-sm">Category</p>
                  <p className="font-medium">
                    {categoryLabels[expense.category] || expense.category}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-sm">Expense Date</p>
                  <p className="font-medium">{formatDate(expense.expenseDate)}</p>
                </div>
              </div>

              {expense.vendor && (
                <div className="flex items-start gap-3">
                  <Tag className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-sm">Vendor</p>
                    <p className="font-medium">{expense.vendor}</p>
                    {expense.vendorInvoice && (
                      <p className="text-muted-foreground text-sm">
                        Invoice: {expense.vendorInvoice}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Related Information</h3>

              <div className="flex items-start gap-3">
                <Building2 className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-sm">Property</p>
                  <p className="font-medium">
                    {expense.property?.name || 'General Expense'}
                    {expense.unitLabel ? ` - ${expense.unitLabel}` : ''}
                  </p>
                  {expense.property?.address && (
                    <p className="text-muted-foreground text-sm">{expense.property.address}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="text-muted-foreground mt-0.5 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-sm">Tax Deductible</p>
                  <p className="font-medium">{expense.isDeductible ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Description or Notes */}
          {(expense.description || expense.notes) && (
            <>
              <Separator />
              <div>
                <h3 className="mb-2 font-semibold">
                  {expense.description ? 'Description' : 'Notes'}
                </h3>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {expense.description || expense.notes}
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex justify-end gap-2">
            {canMarkAsPaid && (
              <Button
                variant="default"
                onClick={() => markAsPaid.mutate(expense.id)}
                disabled={markAsPaid.isPending}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {markAsPaid.isPending ? 'Updating...' : 'Mark as Paid'}
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
