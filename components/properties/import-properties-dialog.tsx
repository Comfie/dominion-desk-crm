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

/**
 * Parse CSV text into an array of objects
 * Handles Excel-formatted CSV with quoted fields, commas within fields, etc.
 */
function parseCSV(csvText: string): unknown[] {
  // Remove BOM if present (Excel sometimes adds UTF-8 BOM)
  const cleanText = csvText.replace(/^\uFEFF/, '');
  const lines = cleanText.trim().split(/\r?\n/); // Handle both \n and \r\n line endings

  if (lines.length < 2) {
    throw new Error('CSV must contain at least a header row and one data row');
  }

  // Auto-detect delimiter (comma or semicolon)
  // Excel in some regions uses semicolon instead of comma
  const firstLine = lines[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  console.log('Detected CSV delimiter:', delimiter === ';' ? 'semicolon (;)' : 'comma (,)');

  // Parse a single CSV line handling quoted fields
  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote ""
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        // Field separator (using detected delimiter)
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const rawHeaders = parseLine(lines[0]);
  // Normalize headers: trim whitespace
  const headers = rawHeaders.map((h) => h.trim());

  // Debug: log headers to help troubleshoot
  console.log('CSV Headers:', headers);

  const properties: Record<string, unknown>[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Skip empty lines
    if (!lines[i].trim()) continue;

    const values = parseLine(lines[i]);
    const property: Record<string, unknown> = {};

    headers.forEach((header, index) => {
      const value = values[index] || '';
      // Normalize header for comparison (case-insensitive)
      const normalizedHeader = header.toLowerCase();

      // Map to the correct property name (camelCase as expected by schema)
      let propertyName = header; // Default to original header

      // Create mapping for known fields to handle case variations
      const fieldMap: Record<string, string> = {
        name: 'name',
        description: 'description',
        propertytype: 'propertyType',
        address: 'address',
        city: 'city',
        province: 'province',
        postalcode: 'postalCode',
        country: 'country',
        bedrooms: 'bedrooms',
        bathrooms: 'bathrooms',
        size: 'size',
        furnished: 'furnished',
        parkingspaces: 'parkingSpaces',
        amenities: 'amenities',
        primaryimageurl: 'primaryImageUrl',
        rentaltype: 'rentalType',
        monthlyrent: 'monthlyRent',
        dailyrate: 'dailyRate',
        weeklyrate: 'weeklyRate',
        monthlyrate: 'monthlyRate',
        cleaningfee: 'cleaningFee',
        securitydeposit: 'securityDeposit',
        isavailable: 'isAvailable',
        availablefrom: 'availableFrom',
        minimumstay: 'minimumStay',
        maximumstay: 'maximumStay',
        petsallowed: 'petsAllowed',
        smokingallowed: 'smokingAllowed',
        checkintime: 'checkInTime',
        checkouttime: 'checkOutTime',
        houserules: 'houseRules',
      };

      propertyName = fieldMap[normalizedHeader] || header;

      // Convert data types based on field type
      if (
        propertyName === 'bedrooms' ||
        propertyName === 'parkingSpaces' ||
        propertyName === 'minimumStay' ||
        propertyName === 'maximumStay'
      ) {
        property[propertyName] = value ? parseInt(value, 10) : undefined;
      } else if (
        propertyName === 'bathrooms' ||
        propertyName === 'size' ||
        propertyName === 'monthlyRent' ||
        propertyName === 'dailyRate' ||
        propertyName === 'weeklyRate' ||
        propertyName === 'monthlyRate' ||
        propertyName === 'cleaningFee' ||
        propertyName === 'securityDeposit'
      ) {
        property[propertyName] = value ? parseFloat(value) : undefined;
      } else if (
        propertyName === 'furnished' ||
        propertyName === 'isAvailable' ||
        propertyName === 'petsAllowed' ||
        propertyName === 'smokingAllowed'
      ) {
        property[propertyName] = value?.toLowerCase() === 'true' || value === '1';
      } else if (propertyName === 'amenities') {
        property[propertyName] = value ? value.split('|').map((a: string) => a.trim()) : [];
      } else if (propertyName === 'availableFrom') {
        property[propertyName] = value ? new Date(value) : undefined;
      } else {
        property[propertyName] = value || undefined;
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
