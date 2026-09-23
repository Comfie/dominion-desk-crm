'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCheck, CircleHelp, Landmark, Loader2, RefreshCw } from 'lucide-react';

import type { LineAction } from '@/components/financials/reconciliation/bank-lines-table';
import { BankLinesTable } from '@/components/financials/reconciliation/bank-lines-table';
import { LeaseReferencesCard } from '@/components/financials/reconciliation/lease-references-card';
import { PaymentPickerDialog } from '@/components/financials/reconciliation/payment-picker-dialog';
import { StatementUpload } from '@/components/financials/reconciliation/statement-upload';
import type {
  BankLine,
  BankLineStatus,
  ReconciliationOverview,
} from '@/components/financials/reconciliation/types';
import { apiRequest, rand, shortDate } from '@/components/financials/reconciliation/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const TABS: Array<{ value: BankLineStatus; label: string; empty: string }> = [
  {
    value: 'SUGGESTED',
    label: 'To confirm',
    empty: 'Nothing waiting for confirmation. Upload a new statement to find payments.',
  },
  {
    value: 'UNMATCHED',
    label: 'Unmatched',
    empty: 'Every deposit has been matched or dismissed.',
  },
  { value: 'MATCHED', label: 'Matched', empty: 'No confirmed matches yet.' },
  { value: 'IGNORED', label: 'Not rent', empty: 'No deposits marked as not rent.' },
];

export default function ReconciliationPage() {
  const { toast } = useToast();
  const [data, setData] = useState<ReconciliationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<BankLineStatus>('SUGGESTED');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [pickerLine, setPickerLine] = useState<BankLine | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await apiRequest<ReconciliationOverview>('/api/reconciliation'));
    } catch (error) {
      toast({
        title: 'Could not load reconciliation',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const lines = useMemo(
    () => data?.transactions.filter((t) => t.status === tab) ?? [],
    [data, tab]
  );
  const strongCount = useMemo(
    () =>
      data?.transactions.filter((t) => t.status === 'SUGGESTED' && (t.matchConfidence ?? 0) >= 80)
        .length ?? 0,
    [data]
  );

  const runAction = async (
    line: BankLine,
    action: Exclude<LineAction, 'pick'>,
    paymentId?: string
  ) => {
    setBusyId(line.id);
    try {
      await apiRequest(`/api/reconciliation/transactions/${line.id}`, {
        method: 'POST',
        body: JSON.stringify({ action, ...(paymentId ? { paymentId } : {}) }),
      });
      if (action === 'confirm') {
        toast({
          title: 'Payment recorded',
          description: `${rand(line.amount)} marked as received.`,
        });
      }
      await load();
    } catch (error) {
      toast({
        title: 'Could not update',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleAction = (line: BankLine, action: LineAction) => {
    if (action === 'pick') setPickerLine(line);
    else void runAction(line, action);
  };

  const confirmAll = async () => {
    setBulkBusy(true);
    try {
      const result = await apiRequest<{ confirmed: number; skipped: number }>(
        '/api/reconciliation/confirm-all',
        { method: 'POST', body: JSON.stringify({ minConfidence: 80 }) }
      );
      toast({
        title: `${result.confirmed} payment${result.confirmed === 1 ? '' : 's'} recorded`,
        description: result.skipped ? `${result.skipped} need a manual look.` : undefined,
      });
      await load();
    } catch (error) {
      toast({
        title: 'Bulk confirm failed',
        description: error instanceof Error ? error.message : undefined,
        variant: 'destructive',
      });
    } finally {
      setBulkBusy(false);
    }
  };

  const firstRun = !loading && (data?.imports.length ?? 0) === 0;
  const lastImport = data?.imports[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bank reconciliation</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Upload your bank statement and see exactly who has paid, in seconds.
          </p>
        </div>
        {!firstRun && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            {strongCount > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void confirmAll()}
                disabled={bulkBusy}
              >
                {bulkBusy ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCheck className="mr-2 h-4 w-4" />
                )}
                Confirm {strongCount} strong match{strongCount === 1 ? '' : 'es'}
              </Button>
            )}
            <StatementUpload compact onImported={() => void load()} />
          </div>
        )}
      </div>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      )}

      {firstRun && (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <StatementUpload onImported={() => void load()} />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CircleHelp className="h-4 w-4" /> How it works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="text-muted-foreground list-inside list-decimal space-y-2 text-sm">
                  <li>
                    Send each tenant their payment reference (right). They use it on every EFT.
                  </li>
                  <li>
                    In your banking app, download the account&apos;s transaction history as CSV.
                  </li>
                  <li>Upload it here. We match deposits to rent invoices and show you why.</li>
                  <li>Confirm the matches. Invoices, arrears and reports update instantly.</li>
                </ol>
                <p className="text-muted-foreground mt-4 flex items-start gap-2 text-xs">
                  <Landmark className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  DominionDesk never connects to your bank or touches your money. It only reads the
                  file you upload.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2">
            <LeaseReferencesCard references={data?.leaseReferences ?? []} />
          </div>
        </div>
      )}

      {!loading && !firstRun && data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Waiting for you to confirm</CardDescription>
                <CardTitle className="text-2xl">{data.counts.SUGGESTED.count}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs">
                {rand(data.counts.SUGGESTED.amount)} in deposits
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Deposits with no invoice</CardDescription>
                <CardTitle className="text-2xl">{data.counts.UNMATCHED.count}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs">
                {rand(data.counts.UNMATCHED.amount)} to match or dismiss
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Reconciled to date</CardDescription>
                <CardTitle className="text-2xl">{rand(data.counts.MATCHED.amount)}</CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-xs">
                {lastImport
                  ? `Last statement: ${lastImport.fileName} (${shortDate(lastImport.periodStart)} – ${shortDate(lastImport.periodEnd)})`
                  : null}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="gap-4">
              <Tabs value={tab} onValueChange={(v) => setTab(v as BankLineStatus)}>
                <TabsList className="flex-wrap">
                  {TABS.map((t) => (
                    <TabsTrigger key={t.value} value={t.value}>
                      {t.label}
                      <span className="text-muted-foreground ml-1.5 text-xs">
                        {data.counts[t.value].count}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <BankLinesTable
                lines={lines}
                busyId={busyId}
                onAction={handleAction}
                emptyMessage={TABS.find((t) => t.value === tab)!.empty}
              />
            </CardContent>
          </Card>

          <LeaseReferencesCard references={data.leaseReferences} />
        </>
      )}

      <PaymentPickerDialog
        line={pickerLine}
        onClose={() => setPickerLine(null)}
        onPick={async (line, paymentId) => {
          await runAction(line, 'confirm', paymentId);
          setPickerLine(null);
        }}
      />
    </div>
  );
}
