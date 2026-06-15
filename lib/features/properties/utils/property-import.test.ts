import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';

import { buildPropertyImportTemplate, parsePropertyImportFile } from './property-import';

describe('property import parser', () => {
  it('parses a CSV import file', async () => {
    const csv = [
      'name,address,city,province,postalCode,propertyType,bedrooms,bathrooms,monthlyRent,securityDeposit,allowsMultipleTenants,rentalType',
      'Oak House,12 Oak Road,Cape Town,Western Cape,8001,HOUSE,3,2,18500,12000,true,LONG_TERM',
    ].join('\n');

    const file = new File([csv], 'properties.csv', { type: 'text/csv' });
    const properties = await parsePropertyImportFile(file);

    expect(properties).toEqual([
      expect.objectContaining({
        name: 'Oak House',
        propertyType: 'HOUSE',
        bedrooms: 3,
        bathrooms: 2,
        monthlyRent: 18500,
        securityDeposit: 12000,
        allowsMultipleTenants: true,
      }),
    ]);
  });

  it('parses an Excel import file', async () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([
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
        'Palm View',
        '44 Palm Ave',
        'Durban',
        'KwaZulu-Natal',
        '4001',
        'APARTMENT',
        2,
        1,
        9500,
        6000,
        false,
        'LONG_TERM',
      ],
    ]);

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Properties');

    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    const file = new File([buffer], 'properties.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const properties = await parsePropertyImportFile(file);

    expect(properties).toEqual([
      expect.objectContaining({
        name: 'Palm View',
        city: 'Durban',
        propertyType: 'APARTMENT',
        bedrooms: 2,
        monthlyRent: 9500,
        securityDeposit: 6000,
        allowsMultipleTenants: false,
      }),
    ]);
  });

  it('builds an Excel template workbook with import fields', () => {
    const template = buildPropertyImportTemplate();

    expect(template).toBeInstanceOf(ArrayBuffer);
    expect(template.byteLength).toBeGreaterThan(0);

    const workbook = XLSX.read(template, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

    expect(rows[0]).toEqual(expect.arrayContaining(['securityDeposit', 'allowsMultipleTenants']));
  });
});
