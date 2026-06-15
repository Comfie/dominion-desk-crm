import * as XLSX from 'xlsx';

type ParsedPropertyRow = Record<string, unknown>;

const FIELD_MAP: Record<string, string> = {
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
  allowsmultipletenants: 'allowsMultipleTenants',
  availablefrom: 'availableFrom',
  minimumstay: 'minimumStay',
  maximumstay: 'maximumStay',
  petsallowed: 'petsAllowed',
  smokingallowed: 'smokingAllowed',
  checkintime: 'checkInTime',
  checkouttime: 'checkOutTime',
  houserules: 'houseRules',
};

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, '');
}

function convertPropertyValue(propertyName: string, value: string): unknown {
  if (
    propertyName === 'bedrooms' ||
    propertyName === 'parkingSpaces' ||
    propertyName === 'minimumStay' ||
    propertyName === 'maximumStay'
  ) {
    return value ? parseInt(value, 10) : undefined;
  }

  if (
    propertyName === 'bathrooms' ||
    propertyName === 'size' ||
    propertyName === 'monthlyRent' ||
    propertyName === 'dailyRate' ||
    propertyName === 'weeklyRate' ||
    propertyName === 'monthlyRate' ||
    propertyName === 'cleaningFee' ||
    propertyName === 'securityDeposit'
  ) {
    return value ? parseFloat(value) : undefined;
  }

  if (
    propertyName === 'furnished' ||
    propertyName === 'isAvailable' ||
    propertyName === 'allowsMultipleTenants' ||
    propertyName === 'petsAllowed' ||
    propertyName === 'smokingAllowed'
  ) {
    return value?.toLowerCase() === 'true' || value === '1';
  }

  if (propertyName === 'amenities') {
    return value ? value.split('|').map((item) => item.trim()) : [];
  }

  if (propertyName === 'availableFrom') {
    return value ? new Date(value) : undefined;
  }

  return value || undefined;
}

function rowsToProperties(headers: string[], rows: string[][]): ParsedPropertyRow[] {
  const properties: ParsedPropertyRow[] = [];

  for (const row of rows) {
    if (row.every((cell) => !String(cell || '').trim())) {
      continue;
    }

    const property: ParsedPropertyRow = {};

    headers.forEach((header, index) => {
      const value = String(row[index] ?? '');
      const normalizedHeader = normalizeHeader(header);
      const propertyName = FIELD_MAP[normalizedHeader] || header.trim();
      property[propertyName] = convertPropertyValue(propertyName, value);
    });

    properties.push(property);
  }

  return properties;
}

function parseCsvToRows(csvText: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, '');
  const lines = cleanText.trim().split(/\r?\n/);

  if (lines.length < 2) {
    throw new Error('CSV must contain at least a header row and one data row');
  }

  const firstLine = lines[0] ?? '';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ';' : ',';

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  return lines.filter((line) => line.trim().length > 0).map((line) => parseLine(line));
}

function parseSheetToRows(fileBuffer: ArrayBuffer): string[][] {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('Excel file must contain at least one sheet');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    blankrows: false,
    defval: '',
  }) as string[][];

  if (rows.length < 2) {
    throw new Error('Excel file must contain at least a header row and one data row');
  }

  return rows;
}

function readFileAsText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function readFileAsArrayBuffer(file: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export async function parsePropertyImportFile(file: File): Promise<ParsedPropertyRow[]> {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.json')) {
    const data = JSON.parse(await readFileAsText(file));
    const properties = Array.isArray(data) ? data : [data];
    return properties as ParsedPropertyRow[];
  }

  if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')) {
    const rows = parseSheetToRows(await readFileAsArrayBuffer(file));
    const [headers, ...dataRows] = rows;

    if (!headers) {
      throw new Error('Excel file must contain a header row');
    }

    return rowsToProperties(
      headers.map((header) => String(header || '').trim()),
      dataRows
    );
  }

  if (lowerName.endsWith('.csv')) {
    const rows = parseCsvToRows(await readFileAsText(file));
    const [headers, ...dataRows] = rows;

    if (!headers) {
      throw new Error('CSV must contain a header row');
    }

    return rowsToProperties(
      headers.map((header) => String(header || '').trim()),
      dataRows
    );
  }

  throw new Error('Unsupported file format. Please upload a CSV, Excel, or JSON file.');
}

export function buildPropertyImportTemplate() {
  const workbook = XLSX.utils.book_new();
  const rows = [
    [
      'name',
      'address',
      'city',
      'province',
      'postalCode',
      'propertyType',
      'bedrooms',
      'bathrooms',
      'monthlyRent',
      'securityDeposit',
      'allowsMultipleTenants',
      'rentalType',
    ],
    [
      'Sample Property 1',
      '123 Main St',
      'Cape Town',
      'Western Cape',
      '8001',
      'APARTMENT',
      2,
      1,
      15000,
      10000,
      false,
      'LONG_TERM',
    ],
    [
      'Sample Property 2',
      '456 Beach Rd',
      'Durban',
      'KwaZulu-Natal',
      '4001',
      'HOUSE',
      3,
      2,
      2500,
      5000,
      true,
      'SHORT_TERM',
    ],
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Properties');

  return XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });
}
