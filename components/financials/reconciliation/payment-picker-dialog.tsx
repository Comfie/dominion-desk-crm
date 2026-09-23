'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

import type { BankLine, OpenPayment } from './types';
import { apiRequest, rand, shortDate } from './types';

interface PaymentPickerDialogProps {
  line: BankLine | null;
  onClose: () => void;
  onPick: (line: BankLine, paymentId: string) => Promise<void>;
}

export function PaymentPickerDialog({ line, onClose, onPick }: PaymentPickerDialogProps) {
  const [payments, setPayments] = useState<OpenPayment[] | null>(null);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!line) return;
    setQuery('');
    setPayments(null);
    apiRequest<OpenPayment[]>('/api/reconciliation/open-payments')
      .then(setPayments)
      .catch(() => setPayments([]));
  }, [line]);

  const filtered = useMemo(() => {
    if (!payments) return [];
    const q = query.trim().toLowerCase();
    const list = q
      ? payments.filter((p) =>
          [p.tenantName, p.propertyName, p.invoiceNumber, p.description]
            .filter(Boolean)
            .some((v) => v!.toLowerCase().includes(q))
        )
      : payments;
    // Invoices whose outstanding amount equals this deposit float to the top.
    return [...list].sort((a, b) => {
      const aExact = line && Math.abs(a.outstanding - line.amount) < 0.01 ? 0 : 1;
      const bExact = line && Math.abs(b.outstanding - line.amount) < 0.01 ? 0 : 1;
      return aExact - bExact;
    });
  }, [payments, query, line]);

  return (
    <Dialog open={!!line} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Which invoice does this pay?</DialogTitle>
          <DialogDescription>
            {line && (
              <>
                {rand(line.amount)} on {shortDate(line.transactionDate)}: &ldquo;
                {line.description}&rdquo;
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" />
          <Input
            className="pl-9"
            placeholder="Search tenant, property or invoice…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto">
          {!payments && (
            <div className="flex justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          )}
          {payments && filtered.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No unpaid invoices found. Generate this month&apos;s rent first.
            </p>
          )}
          {filtered.map((p) => {
            const exact = line && Math.abs(p.outstanding - line.amount) < 0.01;
            return (
              <button
                key={p.id}
                type="button"
                disabled={!!saving}
                onClick={async () => {
                  if (!line) return;
                  setSaving(p.id);
                  try {
                    await onPick(line, p.id);
                  } finally {
                    setSaving(null);
                  }
                }}
                className="hover:border-primary hover:bg-primary/5 flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors disabled:opacity-60"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{p.tenantName}</p>
                  <p className="text-muted-foreground truncate text-sm">
                    {[p.propertyName, p.invoiceNumber, `due ${shortDate(p.dueDate)}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {exact && <Badge variant="secondary">Amount matches</Badge>}
                  <div className="text-right">
                    <p className="font-semibold">{rand(p.outstanding)}</p>
                    {p.outstanding !== p.amount && (
                      <p className="text-muted-foreground text-xs">of {rand(p.amount)}</p>
                    )}
                  </div>
                  {saving === p.id && <Loader2 className="h-4 w-4 animate-spin" />}
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
