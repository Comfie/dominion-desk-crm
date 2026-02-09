'use client';

import { useState } from 'react';
import { PaymentMethod } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface QuickRecordPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: string;
    amount: number;
  } | null;
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  property: {
    id: string;
    name: string;
  };
  onSuccess?: () => void;
}

export function QuickRecordPaymentModal({
  open,
  onOpenChange,
  payment,
  tenant,
  property,
  onSuccess,
}: QuickRecordPaymentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<{
    amount: string;
    paymentMethod: PaymentMethod;
    paymentDate: string;
    reference: string;
  }>({
    amount: payment?.amount?.toString() || '',
    paymentMethod: PaymentMethod.EFT,
    paymentDate: new Date().toISOString().split('T')[0],
    reference: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!payment) {
        toast({ title: 'Payment record not found', variant: 'destructive' });
        return;
      }

      const response = await fetch(`/api/payments/${payment.id}/record`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: formData.paymentMethod,
          paymentDate: new Date(formData.paymentDate),
          bankReference: formData.reference,
          status: 'PAID',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to record payment');
      }

      toast({ title: 'Payment recorded successfully' });
      onSuccess?.();
      onOpenChange(false);

      // Reset form
      setFormData({
        amount: payment.amount.toString(),
        paymentMethod: PaymentMethod.EFT,
        paymentDate: new Date().toISOString().split('T')[0],
        reference: '',
      });
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast({ title: error.message || 'Failed to record payment', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { value: PaymentMethod.EFT, label: 'EFT / Bank Transfer' },
    { value: PaymentMethod.CASH, label: 'Cash' },
    { value: PaymentMethod.CREDIT_CARD, label: 'Credit Card' },
    { value: PaymentMethod.DEBIT_CARD, label: 'Debit Card' },
    { value: PaymentMethod.OTHER, label: 'Other' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record payment for {tenant.firstName} {tenant.lastName} at {property.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              disabled
              className="bg-muted"
            />
            <p className="text-muted-foreground text-xs">
              Amount is pre-filled from the invoice and cannot be changed.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select
              value={formData.paymentMethod}
              onValueChange={(value: PaymentMethod) =>
                setFormData({ ...formData, paymentMethod: value })
              }
              required
            >
              <SelectTrigger id="paymentMethod">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Input
              id="paymentDate"
              type="date"
              value={formData.paymentDate}
              onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">
              Reference Number <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="reference"
              type="text"
              placeholder="e.g., Transaction ID, Receipt Number"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
