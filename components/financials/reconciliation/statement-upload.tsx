'use client';

import { useRef, useState } from 'react';
import { FileUp, Loader2, UploadCloud } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

import { ApiError, apiRequest } from './types';

interface ImportSummary {
  totalRows: number;
  credits: number;
  duplicates: number;
  newTransactions: number;
  suggested: number;
  highConfidence: number;
  rematched: number;
}

interface MappingState {
  headers: string[];
  sampleRows: string[][];
  date: string;
  description: string;
  amountMode: 'amount' | 'credit';
  amount: string;
}

interface StatementUploadProps {
  onImported: (summary: ImportSummary) => void;
  compact?: boolean;
}

export function StatementUpload({ onImported, compact = false }: StatementUploadProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ name: string; content: string } | null>(null);
  const [mapping, setMapping] = useState<MappingState | null>(null);

  const submit = async (
    file: { name: string; content: string },
    columnMapping?: Record<string, unknown>
  ) => {
    setUploading(true);
    try {
      const result = await apiRequest<{ summary: ImportSummary }>('/api/reconciliation/import', {
        method: 'POST',
        body: JSON.stringify({
          fileName: file.name,
          content: file.content,
          mapping: columnMapping,
        }),
      });
      const s = result.summary;
      setMapping(null);
      setPendingFile(null);
      toast({
        title: `Statement imported: ${s.newTransactions} new deposit${s.newTransactions === 1 ? '' : 's'}`,
        description:
          `${s.suggested} matched to rent invoices` +
          (s.duplicates ? ` · ${s.duplicates} already imported before` : '') +
          (s.rematched ? ` · ${s.rematched} older lines matched` : ''),
      });
      onImported(s);
    } catch (error) {
      const details = error instanceof ApiError ? (error.details as Record<string, unknown>) : null;
      if (details?.code === 'MAPPING_REQUIRED') {
        const headers = (details.headers as string[]) ?? [];
        setPendingFile(file);
        setMapping({
          headers,
          sampleRows: (details.sampleRows as string[][]) ?? [],
          date: '0',
          description: headers.length > 1 ? '1' : '0',
          amountMode: 'amount',
          amount: headers.length > 2 ? '2' : '0',
        });
        return;
      }
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.(csv|txt)$/i.test(file.name)) {
      toast({
        title: 'Please upload a CSV file',
        description: 'In your banking app, download the transaction history as CSV.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Export a shorter date range (max 3 MB).',
        variant: 'destructive',
      });
      return;
    }
    await submit({ name: file.name, content: await file.text() });
    if (inputRef.current) inputRef.current.value = '';
  };

  const submitMapping = () => {
    if (!mapping || !pendingFile) return;
    const col = (v: string) => Number(v);
    void submit(pendingFile, {
      date: col(mapping.date),
      description: [col(mapping.description)],
      ...(mapping.amountMode === 'amount'
        ? { amount: col(mapping.amount) }
        : { credit: col(mapping.amount) }),
    });
  };

  const columnLabel = (index: number) => {
    const header = mapping?.headers[index];
    const sample = mapping?.sampleRows.find((r) => r[index] && r[index] !== header)?.[index];
    return `Column ${index + 1}${header ? `: ${header}` : ''}${sample ? ` (e.g. ${sample.slice(0, 24)})` : ''}`;
  };
  const columnCount = Math.max(
    mapping?.headers.length ?? 0,
    ...(mapping?.sampleRows.map((r) => r.length) ?? [0])
  );

  const columnSelect = (value: string, onChange: (v: string) => void) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: columnCount }, (_, i) => (
          <SelectItem key={i} value={String(i)}>
            {columnLabel(i)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.txt,text/csv"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      {compact ? (
        <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileUp className="mr-2 h-4 w-4" />
          )}
          Upload statement
        </Button>
      ) : (
        <Card
          className={`border-2 border-dashed transition-colors ${
            dragging ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFile(e.dataTransfer.files?.[0]);
          }}
        >
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="bg-primary/10 text-primary rounded-full p-4">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <UploadCloud className="h-8 w-8" />
              )}
            </div>
            <div>
              <p className="text-lg font-semibold">Drop your bank statement CSV here</p>
              <p className="text-muted-foreground mt-1 max-w-md text-sm">
                FNB, Standard Bank, Absa, Nedbank, Capitec and most other banks work. We only read
                the deposits and match them to your rent invoices. Nothing is marked paid until you
                confirm.
              </p>
            </div>
            <Button onClick={() => inputRef.current?.click()} disabled={uploading}>
              <FileUp className="mr-2 h-4 w-4" />
              Choose CSV file
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!mapping} onOpenChange={(open) => !open && setMapping(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Which column is which?</DialogTitle>
            <DialogDescription>
              We didn&apos;t recognise this bank&apos;s layout. Tell us once and we&apos;ll read the
              statement.
            </DialogDescription>
          </DialogHeader>
          {mapping && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Date</Label>
                {columnSelect(mapping.date, (v) => setMapping({ ...mapping, date: v }))}
              </div>
              <div className="space-y-2">
                <Label>Description / reference</Label>
                {columnSelect(mapping.description, (v) =>
                  setMapping({ ...mapping, description: v })
                )}
              </div>
              <div className="space-y-2">
                <Label>Amount layout</Label>
                <Select
                  value={mapping.amountMode}
                  onValueChange={(v) =>
                    setMapping({ ...mapping, amountMode: v as MappingState['amountMode'] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">One Amount column (deposits positive)</SelectItem>
                    <SelectItem value="credit">Separate Money In column</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{mapping.amountMode === 'amount' ? 'Amount' : 'Money in'}</Label>
                {columnSelect(mapping.amount, (v) => setMapping({ ...mapping, amount: v }))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setMapping(null)}>
              Cancel
            </Button>
            <Button onClick={submitMapping} disabled={uploading}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import statement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
