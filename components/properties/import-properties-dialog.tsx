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

function parseCSV(csvText: string): unknown[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must contain at least a header row and one data row');
  }

  const headers = lines[0].split(',').map((h) => h.trim());
  const properties: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const property: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      const value = values[index];

      // Convert data types
      if (
        header === 'bedrooms' ||
        header === 'parkingSpaces' ||
        header === 'minimumStay' ||
        header === 'maximumStay'
      ) {
        property[header] = value ? parseInt(value, 10) : undefined;
      } else if (
        header === 'bathrooms' ||
        header === 'size' ||
        header === 'monthlyRent' ||
        header === 'dailyRate' ||
        header === 'weeklyRate' ||
        header === 'monthlyRate' ||
        header === 'cleaningFee' ||
        header === 'securityDeposit'
      ) {
        property[header] = value ? parseFloat(value) : undefined;
      } else if (
        header === 'furnished' ||
        header === 'isAvailable' ||
        header === 'petsAllowed' ||
        header === 'smokingAllowed'
      ) {
        property[header] = value?.toLowerCase() === 'true' || value === '1';
      } else if (header === 'amenities') {
        property[header] = value ? value.split('|').map((a: string) => a.trim()) : [];
      } else if (header === 'availableFrom') {
        property[header] = value ? new Date(value) : undefined;
      } else {
        property[header] = value || undefined;
      }
    });

    properties.push(property);
  }

  return properties;
}

export function ImportPropertiesDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [skipErrors, setSkipErrors] = useState(true);
  const [result, setResult] = useState<ImportResult | null>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: importProperties,
    onSuccess: (data) => {
      setResult(data.result);
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    try {
      const text = await file.text();
      let properties: unknown[];

      if (file.name.endsWith('.csv')) {
        properties = parseCSV(text);
      } else if (file.name.endsWith('.json')) {
        const data = JSON.parse(text);
        properties = Array.isArray(data) ? data : [data];
      } else {
        throw new Error('Unsupported file format. Please upload a CSV or JSON file.');
      }

      await importMutation.mutateAsync({ properties, skipErrors });
    } catch (error) {
      console.error('Import failed:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setFile(null);
    setResult(null);
    importMutation.reset();
  };

  const downloadTemplate = () => {
    const template = `name,address,city,province,postalCode,propertyType,bedrooms,bathrooms,monthlyRent,rentalType
Sample Property 1,123 Main St,Cape Town,Western Cape,8001,APARTMENT,2,1,15000,LONG_TERM
Sample Property 2,456 Beach Rd,Durban,KwaZulu-Natal,4001,HOUSE,3,2,2500,SHORT_TERM`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'property-import-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

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
            Upload a CSV or JSON file to bulk import properties. Download the template to get
            started.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Download our CSV template to ensure proper formatting</span>
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
              accept=".csv,.json"
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
          {importMutation.isPending && (
            <div className="space-y-2">
              <Progress value={undefined} className="w-full" />
              <p className="text-muted-foreground text-center text-sm">Importing properties...</p>
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
            <Button onClick={handleImport} disabled={!file || importMutation.isPending}>
              {importMutation.isPending ? 'Importing...' : 'Import Properties'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
