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

  it('parses a real-world multi-unit sheet (unit codes, occupancy pricing, currency, valuation)', async () => {
    const headers = [
      'Property Name',
      'Address',
      'Location',
      'Description',
      'Unit Code',
      'Occupancy Type',
      'Rental Amount',
      'Deposit Amount',
      'Rooms',
      'Specific Rules',
      'Amenities Included',
      'Free WiFi',
      'Prepaid Electricity',
      'Water/Sewerage/Refuse Included',
      'Measurements m2',
      'Image URL',
      'Current Valuation',
      'Valuer',
      'Valuation Date',
      'Stand Size',
      'Available From',
    ].join(',');

    const singleRow = [
      'RIVERLEA',
      '"8 Arno Street, Riverlea, Johannesburg, Gauteng, 1709"',
      '"Riverlea, Johannesburg, Gauteng"',
      'Furnished Bachelor Unit.',
      'M1',
      'Single',
      'R1850.00',
      'R1850.00',
      '1 Studio',
      'No pets. No smoking.',
      '"Air fryer, Blinds, Kettle"',
      'Yes',
      'Yes',
      'Yes',
      '18',
      '',
      'R1760000.00',
      'City of Johannesburg',
      '2023/07/01',
      '428 m2',
      '1 July 2026',
    ].join(',');

    const doubleRow = [
      'RIVERLEA',
      '"8 Arno Street, Riverlea, Johannesburg, Gauteng, 1709"',
      '"Riverlea, Johannesburg, Gauteng"',
      'Furnished Bachelor Unit.',
      'M1',
      'Double',
      'R2850.00',
      'R2850.00',
      '1 Studio',
      'No pets. No smoking.',
      '"Air fryer, Blinds, Kettle"',
      'Yes',
      'Yes',
      'Yes',
      '18',
      '',
      'R1760000.00',
      'City of Johannesburg',
      '2023/07/01',
      '428 m2',
      '1 July 2026',
    ].join(',');

    const csv = [headers, singleRow, doubleRow].join('\n');
    const file = new File([csv], 'riverlea.csv', { type: 'text/csv' });
    const properties = await parsePropertyImportFile(file);

    // The Single/Double rows for the same unit collapse into one property.
    expect(properties).toHaveLength(1);
    expect(properties[0]).toEqual(
      expect.objectContaining({
        name: 'RIVERLEA - M1',
        city: 'Johannesburg',
        province: 'Gauteng',
        postalCode: '1709',
        bedrooms: 1,
        bathrooms: 1,
        propertyType: 'STUDIO',
        monthlyRent: 1850,
        securityDeposit: 1850,
        size: 18,
        amenities: [
          'Air fryer',
          'Blinds',
          'Kettle',
          'Free WiFi',
          'Prepaid Electricity',
          'Water/Sewerage/Refuse Included',
        ],
        currentValuation: 1760000,
        valuedBy: 'City of Johannesburg',
      })
    );
    expect(properties[0].description as string).toContain('Stand size: 428 m2');
    expect(properties[0].lastValuationDate).toBeInstanceOf(Date);
    expect(properties[0].availableFrom).toBeInstanceOf(Date);
  });

  it('keeps the Double occupancy row when no Single row exists for a unit', async () => {
    const csv = [
      'Property Name,Unit Code,Occupancy Type,Rental Amount,Rooms,Address,Location',
      'RIVERLEA,M4,Double,R2850.00,1 Studio,"8 Arno Street, Riverlea, Johannesburg, Gauteng, 1709","Riverlea, Johannesburg, Gauteng"',
    ].join('\n');

    const file = new File([csv], 'riverlea.csv', { type: 'text/csv' });
    const properties = await parsePropertyImportFile(file);

    expect(properties).toHaveLength(1);
    expect(properties[0]).toEqual(
      expect.objectContaining({ name: 'RIVERLEA - M4', monthlyRent: 2850 })
    );
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
