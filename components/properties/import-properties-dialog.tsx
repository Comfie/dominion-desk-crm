'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle, Download } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  buildPropertyImportTemplate,
  parsePropertyImportFile,
} from '@/lib/features/properties/utils/property-import';

interface ImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ index: number; property: string; error: string }>;
  createdProperties: Array<{ id: string; name: string }>;
}

async function importProperties(data: {
  properties: unknown[];
  skipErrors: boolean;
}): Promise<{ message: string; result: ImportResult }> {
  const response = await fetch('/api/properties/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to import properties');
  }

  return response.json();
}

interface ImportPropertiesDialogProps {
  disabled?: boolean;
  disabledMessage?: string;
}

export function ImportPropertiesDialog({ disabled, disabledMessage }: ImportPropertiesDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [skipErrors, setSkipErrors] = useState(true);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importStage, setImportStage] = useState<'idle' | 'reading' | 'importing' | 'done'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: importProperties,
    onSuccess: (data) => {
      setResult(data.result);
      setImportStage('done');
      setStatusMessage(`Imported ${data.result.successful} of ${data.result.total} properties.`);
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
    onError: (error: Error) => {
      setImportStage('idle');
      setStatusMessage(null);
      console.error('Import failed:', error);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setImportStage('idle');
      setStatusMessage(null);
      setParsedCount(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      setImportStage('reading');
      setStatusMessage(`Reading ${file.name}...`);

      const properties = await parsePropertyImportFile(file);
      setParsedCount(properties.length);

      setImportStage('importing');
      setStatusMessage(`Importing ${properties.length} properties...`);

      await importMutation.mutateAsync({ properties, skipErrors });
    } catch (error) {
      setImportStage('idle');
      setStatusMessage(null);
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Failed to import properties',
        variant: 'destructive',
      });
      console.error('Import failed:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setResult(null);
    setImportStage('idle');
    setStatusMessage(null);
    setParsedCount(null);
    importMutation.reset();
  };

  const downloadTemplate = () => {
    const blob = new Blob([buildPropertyImportTemplate()], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'property-import-template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (disabled) {
    return (
      <Button variant="outline" disabled title={disabledMessage}>
        <Upload className="mr-2 h-4 w-4" />
        Import Properties
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import Properties
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Properties</DialogTitle>
          <DialogDescription>
            Upload an Excel, CSV, or JSON file to bulk import properties. Download the Excel
            template to get started.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Download our Excel template to ensure proper formatting</span>
              <Button variant="link" size="sm" onClick={downloadTemplate}>
                Download Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <FileText className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <input
              type="file"
              accept=".csv,.json,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" asChild>
                <span>Choose File</span>
              </Button>
            </label>
            {file && (
              <p className="text-muted-foreground mt-2 text-sm">
                Selected: <span className="font-medium">{file.name}</span>
              </p>
            )}
            <p className="text-muted-foreground mt-1 text-xs">
              Excel is preferred. CSV remains supported as a fallback.
            </p>
          </div>

          {/* Options */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="skip-errors"
              checked={skipErrors}
              onCheckedChange={(checked) => setSkipErrors(checked as boolean)}
            />
            <Label htmlFor="skip-errors" className="cursor-pointer text-sm font-normal">
              Skip errors and continue importing valid properties
            </Label>
          </div>

          {/* Import Progress/Results */}
          {(importStage === 'reading' ||
            importStage === 'importing' ||
            importMutation.isPending) && (
            <div className="space-y-2">
              <Progress
                value={importStage === 'reading' ? 30 : importStage === 'importing' ? 70 : 90}
                className="w-full"
              />
              <p className="text-muted-foreground text-center text-sm">
                {statusMessage || 'Importing properties...'}
              </p>
              {parsedCount !== null && importStage !== 'done' && (
                <p className="text-muted-foreground text-center text-xs">
                  Parsed {parsedCount} properties. Issues will be listed after the import runs.
                </p>
              )}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <Alert variant={result.failed === 0 ? 'default' : 'destructive'}>
                {result.failed === 0 ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <div className="mb-2 font-medium">Import Summary</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>{result.successful} properties imported successfully</span>
                    </div>
                    {result.failed > 0 && (
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <span>{result.failed} properties failed to import</span>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>

              {/* Error Details */}
              {result.errors.length > 0 && (
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-4">
                  <p className="text-sm font-medium">Errors:</p>
                  {result.errors.map((err, idx) => (
                    <div key={idx} className="text-sm text-red-600">
                      <span className="font-medium">Row {err.index}:</span> {err.property} -{' '}
                      {err.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {importMutation.isError && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                {importMutation.error instanceof Error
                  ? importMutation.error.message
                  : 'Failed to import properties. Please check your file format.'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              onClick={handleImport}
              disabled={!file || importStage !== 'idle' || importMutation.isPending}
            >
              {importStage === 'reading' || importStage === 'importing' || importMutation.isPending
                ? 'Importing...'
                : 'Import Properties'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
