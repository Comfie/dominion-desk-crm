'use client';

import { Check, Link2, Loader2, RotateCcw, Undo2, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import type { BankLine } from './types';
import { rand, shortDate } from './types';

export type LineAction = 'confirm' | 'reject' | 'ignore' | 'restore' | 'unmatch' | 'pick';

interface BankLinesTableProps {
  lines: BankLine[];
  busyId: string | null;
  onAction: (line: BankLine, action: LineAction) => void;
  emptyMessage: string;
}

function ConfidenceBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const tone =
    value >= 80
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      {value >= 80 ? 'Strong match' : 'Possible match'} · {value}%
    </span>
  );
}

function MatchCell({ line }: { line: BankLine }) {
  if (!line.payment) {
    return line.status === 'IGNORED' ? (
      <span className="text-muted-foreground text-sm">Marked as not rent</span>
    ) : (
      <span className="text-muted-foreground text-sm">No invoice found</span>
    );
  }
  const p = line.payment;
  return (
    <div className="space-y-1">
      <p className="font-medium">{p.tenantName ?? 'Tenant'}</p>
      <p className="text-muted-foreground text-xs">
        {[p.propertyName, p.invoiceNumber, `due ${shortDate(p.dueDate)}`, rand(p.amount)]
          .filter(Boolean)
          .join(' · ')}
      </p>
      {line.status === 'SUGGESTED' && (
        <div className="flex flex-wrap items-center gap-2">
          <ConfidenceBadge value={line.matchConfidence} />
        </div>
      )}
      {line.status === 'SUGGESTED' && line.matchReasons.length > 0 && (
        <ul className="text-muted-foreground list-inside list-disc text-xs">
          {line.matchReasons.slice(0, 3).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}
      {line.status === 'MATCHED' && (
        <Badge variant="secondary" className="text-xs">
          Invoice {p.status === 'PAID' ? 'paid' : p.status.toLowerCase().replace('_', ' ')}
        </Badge>
      )}
    </div>
  );
}

function Actions({
  line,
  busy,
  onAction,
}: {
  line: BankLine;
  busy: boolean;
  onAction: (a: LineAction) => void;
}) {
  if (busy) return <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />;

  switch (line.status) {
    case 'SUGGESTED':
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" onClick={() => onAction('confirm')}>
            <Check className="mr-1 h-4 w-4" /> Confirm
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAction('pick')}>
            <Link2 className="mr-1 h-4 w-4" /> Other invoice
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onAction('reject')} title="Wrong match">
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    case 'UNMATCHED':
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => onAction('pick')}>
            <Link2 className="mr-1 h-4 w-4" /> Match to invoice
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onAction('ignore')}>
            Not rent
          </Button>
        </div>
      );
    case 'MATCHED':
      return (
        <Button size="sm" variant="ghost" onClick={() => onAction('unmatch')}>
          <Undo2 className="mr-1 h-4 w-4" /> Undo
        </Button>
      );
    case 'IGNORED':
      return (
        <Button size="sm" variant="ghost" onClick={() => onAction('restore')}>
          <RotateCcw className="mr-1 h-4 w-4" /> Restore
        </Button>
      );
  }
}

export function BankLinesTable({ lines, busyId, onAction, emptyMessage }: BankLinesTableProps) {
  if (lines.length === 0) {
    return <p className="text-muted-foreground py-10 text-center text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="text-muted-foreground border-b text-left text-xs uppercase">
            <th className="py-2 pr-4 font-medium">Date</th>
            <th className="py-2 pr-4 font-medium">Bank description</th>
            <th className="py-2 pr-4 text-right font-medium">Amount</th>
            <th className="py-2 pr-4 font-medium">Matched to</th>
            <th className="py-2 text-right font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-b align-top last:border-0">
              <td className="py-3 pr-4 whitespace-nowrap">{shortDate(line.transactionDate)}</td>
              <td className="max-w-[260px] py-3 pr-4 font-mono text-xs break-words">
                {line.description}
              </td>
              <td className="py-3 pr-4 text-right font-semibold whitespace-nowrap text-emerald-700 dark:text-emerald-400">
                {rand(line.amount)}
              </td>
              <td className="py-3 pr-4">
                <MatchCell line={line} />
              </td>
              <td className="py-3 text-right">
                <Actions
                  line={line}
                  busy={busyId === line.id}
                  onAction={(a) => onAction(line, a)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
