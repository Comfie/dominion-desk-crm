import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';

import { buildPropertyExportWorkbook } from './property-export';

describe('property export workbook', () => {
  it('includes full property details in the export sheet', () => {
    const workbook = buildPropertyExportWorkbook([
      {
        id: 'property-1',
        name: 'Oak House',
        description: 'Family home',
        propertyType: 'HOUSE',
        address: '12 Oak Road',
        city: 'Cape Town',
        province: 'Western Cape',
        postalCode: '8001',
        country: 'South Africa',
        bedrooms: 3,
        bathrooms: 2,
        size: 145,
        furnished: false,
        parkingSpaces: 1,
        amenities: ['pool', 'wifi'],
        primaryImageUrl: 'https://example.com/oak.jpg',
        rentalType: 'LONG_TERM',
        monthlyRent: 18500,
        dailyRate: null,
        weeklyRate: null,
        monthlyRate: null,
        cleaningFee: 0,
        securityDeposit: 12000,
        isAvailable: true,
        availableFrom: '2026-06-01T00:00:00.000Z',
        minimumStay: 12,
        maximumStay: null,
        allowsMultipleTenants: true,
        petsAllowed: false,
        smokingAllowed: false,
        checkInTime: '14:00',
        checkOutTime: '10:00',
        houseRules: 'No smoking',
        status: 'ACTIVE',
        activeTenantCount: 2,
        occupiedTenantCount: 1,
        reservedTenantCount: 1,
        hasActiveTenant: true,
        isOccupied: true,
        isReserved: true,
        createdAt: '2026-06-10T00:00:00.000Z',
        updatedAt: '2026-06-12T00:00:00.000Z',
        _count: {
          bookings: 4,
          tenants: 2,
        },
      },
    ] as never);

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];

    expect(rows[0]).toEqual(
      expect.arrayContaining([
        'Security Deposit',
        'Allows Multiple Tenants',
        'Active Tenant Count',
        'Bookings Count',
      ])
    );
    expect(rows[1]).toEqual(expect.arrayContaining(['Oak House', '12000', 'true', '2']));
  });
});
