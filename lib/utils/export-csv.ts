/**
 * Client-side CSV export utility.
 * Converts an array of objects into a CSV file and triggers download.
 */

type CsvValue = string | number | boolean | null | undefined;

interface ExportCsvOptions {
  filename: string;
  headers: string[];
  rows: CsvValue[][];
}

function escapeCsvValue(value: CsvValue): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportToCsv({ filename, headers, rows }: ExportCsvOptions) {
  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) => row.map(escapeCsvValue).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatDateForCsv(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-ZA');
}

export function formatCurrencyForCsv(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '0';
  return amount.toFixed(2);
}
