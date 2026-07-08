import * as XLSX from 'xlsx';
import type { PropertyType } from '@prisma/client';

type ParsedPropertyRow = Record<string, unknown>;
type RawRow = Record<string, string>;

// Normalized header -> internal field name. Fields prefixed with "__" are
// intermediate values consumed while building the final row rather than
// passed straight through to the DTO.
const FIELD_MAP: Record<string, string> = {
  name: 'name',
  propertyname: 'name',
  description: 'description',
  propertytype: 'propertyType',
  address: 'address',
  location: '__location',
  city: 'city',
  province: 'province',
  postalcode: 'postalCode',
  country: 'country',
  unitcode: '__unitCode',
  occupancytype: '__occupancyType',
  bedrooms: 'bedrooms',
  bathrooms: 'bathrooms',
  rooms: '__rooms',
  size: 'size',
  measurementsm2: 'size',
  furnished: 'furnished',
  parkingspaces: 'parkingSpaces',
  amenities: '__amenities',
  amenitiesincluded: '__amenities',
  freewifi: '__freeWifi',
  prepaidelectricity: '__prepaidElectricity',
  'water/sewerage/refuseincluded': '__utilitiesIncluded',
  primaryimageurl: 'primaryImageUrl',
  imageurl: 'primaryImageUrl',
  rentaltype: 'rentalType',
  monthlyrent: 'monthlyRent',
  rentalamount: 'monthlyRent',
  dailyrate: 'dailyRate',
  weeklyrate: 'weeklyRate',
  monthlyrate: 'monthlyRate',
  cleaningfee: 'cleaningFee',
  securitydeposit: 'securityDeposit',
  depositamount: 'securityDeposit',
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
  specificrules: 'houseRules',
  currentvaluation: 'currentValuation',
  valuer: 'valuedBy',
  valuationdate: 'lastValuationDate',
  standsize: '__standSize',
};

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, '');
}

function parseCurrency(value: string): number | undefined {
  const digits = value.replace(/[^0-9.]/g, '');
  return digits ? parseFloat(digits) : undefined;
}

function parseYesNo(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === 'yes' || normalized === 'true' || normalized === '1';
}

/** Splits a "Suburb, City, Province" location string into city/province. */
function parseLocation(value: string): { city?: string; province?: string } {
  const parts = value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    return { city: parts[1], province: parts[2] };
  }
  if (parts.length === 2) {
    return { city: parts[0], province: parts[1] };
  }
  if (parts.length === 1) {
    return { city: parts[0] };
  }
  return {};
}

/** Extracts a trailing 4-digit postal code from a full mailing address. */
function extractPostalCode(address: string): string | undefined {
  const match = address.match(/(\d{4})\s*$/);
  return match ? match[1] : undefined;
}

const ROOM_TYPE_KEYWORDS: Array<[RegExp, PropertyType]> = [
  [/studio/i, 'STUDIO'],
  [/townhouse/i, 'TOWNHOUSE'],
  [/duplex/i, 'DUPLEX'],
  [/penthouse/i, 'PENTHOUSE'],
  [/villa/i, 'VILLA'],
  [/cottage/i, 'COTTAGE'],
  [/house/i, 'HOUSE'],
  [/\broom\b/i, 'ROOM'],
];

/** Parses a free-text "Rooms" description (e.g. "1 Studio") into bedrooms + type. */
function parseRooms(value: string): { bedrooms: number; propertyType: PropertyType } {
  const numberMatch = value.match(/\d+/);
  const bedrooms = numberMatch ? parseInt(numberMatch[0], 10) : 0;

  for (const [pattern, propertyType] of ROOM_TYPE_KEYWORDS) {
    if (pattern.test(value)) {
      return { bedrooms, propertyType };
    }
  }

  return { bedrooms, propertyType: 'APARTMENT' };
}

/** Merges the comma/pipe-delimited amenities list with the Yes/No amenity flags. */
function mergeAmenities(row: RawRow): string[] {
  const raw = row.__amenities;
  const delimiter = raw?.includes('|') ? '|' : ',';
  const amenities = raw
    ? raw
        .split(delimiter)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  if (row.__freeWifi && parseYesNo(row.__freeWifi)) amenities.push('Free WiFi');
  if (row.__prepaidElectricity && parseYesNo(row.__prepaidElectricity)) {
    amenities.push('Prepaid Electricity');
  }
  if (row.__utilitiesIncluded && parseYesNo(row.__utilitiesIncluded)) {
    amenities.push('Water/Sewerage/Refuse Included');
  }

  return amenities;
}

/**
 * Groups raw rows so repeated Unit Code rows (one per Occupancy Type) collapse
 * into a single property. When both Single and Double occupancy rows exist for
 * a unit, the Single rate becomes the property's listed rent — the Double rate
 * is applied later at the tenant/lease level once a second tenant moves in.
 * Rows without a Unit Code are never grouped together (each stays its own row).
 */
function groupRawRows(rawRows: RawRow[]): RawRow[] {
  const groups = new Map<string, RawRow[]>();
  const order: string[] = [];

  rawRows.forEach((row, index) => {
    const unitCode = row.__unitCode?.trim();
    const key = unitCode ? `${normalizeHeader(row.name || '')}|${unitCode}` : `__row${index}`;

    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key)!.push(row);
  });

  return order.map((key) => {
    const rows = groups.get(key)!;
    if (rows.length === 1) return rows[0];

    const singleRow = rows.find((row) => row.__occupancyType?.trim().toLowerCase() === 'single');
    return singleRow || rows[0];
  });
}

function buildPropertyFromRawRow(row: RawRow): ParsedPropertyRow {
  const property: ParsedPropertyRow = {};

  // Unit Code makes the name unique per lettable unit within a building.
  const unitCode = row.__unitCode?.trim();
  property.name = unitCode ? `${row.name || ''} - ${unitCode}`.trim() : row.name;

  if (row.description) property.description = row.description;

  if (row.__location) {
    const { city, province } = parseLocation(row.__location);
    if (city) property.city = city;
    if (province) property.province = province;
  }
  if (row.city) property.city = row.city;
  if (row.province) property.province = row.province;

  if (row.address) {
    property.address = row.address;
    const postalCode = extractPostalCode(row.address);
    if (postalCode) property.postalCode = postalCode;
  }
  if (row.postalCode) property.postalCode = row.postalCode;
  if (row.country) property.country = row.country;

  if (row.__rooms) {
    const { bedrooms, propertyType } = parseRooms(row.__rooms);
    property.bedrooms = bedrooms;
    property.propertyType = propertyType;
  }
  if (row.bedrooms) property.bedrooms = parseInt(row.bedrooms, 10);
  if (row.propertyType) property.propertyType = row.propertyType;
  // Bathrooms has no source column in this dataset; default to a single
  // bathroom (the norm for bachelor/studio units) unless explicitly provided.
  property.bathrooms = row.bathrooms ? parseFloat(row.bathrooms) : 1;

  if (row.size) property.size = parseFloat(row.size);
  if (row.furnished) property.furnished = parseYesNo(row.furnished);
  if (row.parkingSpaces) property.parkingSpaces = parseInt(row.parkingSpaces, 10);

  const amenities = mergeAmenities(row);
  if (amenities.length > 0) property.amenities = amenities;

  if (row.primaryImageUrl) property.primaryImageUrl = row.primaryImageUrl;
  if (row.rentalType) property.rentalType = row.rentalType;

  if (row.monthlyRent) property.monthlyRent = parseCurrency(row.monthlyRent);
  if (row.dailyRate) property.dailyRate = parseCurrency(row.dailyRate);
  if (row.weeklyRate) property.weeklyRate = parseCurrency(row.weeklyRate);
  if (row.monthlyRate) property.monthlyRate = parseCurrency(row.monthlyRate);
  if (row.cleaningFee) property.cleaningFee = parseCurrency(row.cleaningFee);
  if (row.securityDeposit) property.securityDeposit = parseCurrency(row.securityDeposit);

  if (row.isAvailable) property.isAvailable = parseYesNo(row.isAvailable);
  if (row.allowsMultipleTenants)
    property.allowsMultipleTenants = parseYesNo(row.allowsMultipleTenants);
  if (row.availableFrom) property.availableFrom = new Date(row.availableFrom);
  if (row.minimumStay) property.minimumStay = parseInt(row.minimumStay, 10);
  if (row.maximumStay) property.maximumStay = parseInt(row.maximumStay, 10);
  if (row.petsAllowed) property.petsAllowed = parseYesNo(row.petsAllowed);
  if (row.smokingAllowed) property.smokingAllowed = parseYesNo(row.smokingAllowed);
  if (row.checkInTime) property.checkInTime = row.checkInTime;
  if (row.checkOutTime) property.checkOutTime = row.checkOutTime;
  if (row.houseRules) property.houseRules = row.houseRules;

  if (row.currentValuation) property.currentValuation = parseCurrency(row.currentValuation);
  if (row.valuedBy) property.valuedBy = row.valuedBy;
  if (row.lastValuationDate) property.lastValuationDate = new Date(row.lastValuationDate);

  // Stand size (land parcel) has no dedicated field — fold it into the
  // description as a note rather than dropping it.
  if (row.__standSize) {
    const note = `Stand size: ${row.__standSize}`;
    property.description = property.description ? `${property.description}\n${note}` : note;
  }

  return property;
}

function rowsToRawRows(headers: string[], rows: string[][]): RawRow[] {
  const rawRows: RawRow[] = [];

  for (const row of rows) {
    if (row.every((cell) => !String(cell || '').trim())) {
      continue;
    }

    const rawRow: RawRow = {};
    headers.forEach((header, index) => {
      const value = String(row[index] ?? '').trim();
      if (!value) return;
      const normalizedHeader = normalizeHeader(header);
      const fieldName = FIELD_MAP[normalizedHeader] || header.trim();
      rawRow[fieldName] = value;
    });

    rawRows.push(rawRow);
  }

  return rawRows;
}

function rowsToProperties(headers: string[], rows: string[][]): ParsedPropertyRow[] {
  const rawRows = rowsToRawRows(headers, rows);
  const groupedRows = groupRawRows(rawRows);
  return groupedRows.map(buildPropertyFromRawRow);
}

function parseCsvToRows(csvText: string): string[][] {
  const cleanText = csvText.replace(/^﻿/, '');
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
