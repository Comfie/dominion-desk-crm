import { describe, expect, it } from 'vitest';

import {
  createLandlordOwnerSchema,
  createRentalMandateSchema,
  listRentalMandatesSchema,
  updateLandlordOwnerSchema,
  updateRentalMandateSchema,
} from '../dtos/mandate.dto';

const validLandlordInput = {
  firstName: 'Ayesha',
  lastName: 'Khan',
  companyName: 'Khan Family Trust',
  email: 'ayesha@example.com',
  phone: '0821234567',
  alternatePhone: '0115550100',
  idNumber: '8001015009087',
  taxNumber: '1234567890',
  vatNumber: '4123456789',
  vatRegistered: true,
  notes: 'Owns two managed rentals.',
};

const validMandateInput = {
  propertyId: 'property-1',
  landlordOwnerId: 'landlord-1',
  mandateType: 'MANAGED_RENTAL',
  exclusivity: 'SOLE',
  status: 'ACTIVE',
  startDate: '2026-08-01',
  endDate: '2027-07-31',
  placementFeePercentage: 6.5,
  managementFeePercentage: 8,
  vatApplicable: true,
  mandateDocumentUrl: 'https://example.com/mandate.pdf',
  notes: 'Fees negotiated for multiple properties.',
} as const;

describe('createLandlordOwnerSchema', () => {
  it('accepts a valid landlord owner payload', () => {
    const result = createLandlordOwnerSchema.parse(validLandlordInput);

    expect(result).toMatchObject(validLandlordInput);
  });

  it('requires owner names and a valid email', () => {
    const result = createLandlordOwnerSchema.safeParse({
      firstName: '',
      lastName: '',
      email: 'not-an-email',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining(['firstName', 'lastName', 'email'])
    );
  });
});

describe('updateLandlordOwnerSchema', () => {
  it('accepts partial landlord owner edits', () => {
    const result = updateLandlordOwnerSchema.parse({
      phone: '0837654321',
      status: 'INACTIVE',
    });

    expect(result).toEqual({
      phone: '0837654321',
      status: 'INACTIVE',
    });
  });
});

describe('createRentalMandateSchema', () => {
  it('accepts a valid mandate payload', () => {
    const result = createRentalMandateSchema.parse(validMandateInput);

    expect(result).toMatchObject(validMandateInput);
  });

  it('requires a property and mandate start date', () => {
    const result = createRentalMandateSchema.safeParse({
      mandateType: 'PLACEMENT_ONLY',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining(['propertyId', 'startDate'])
    );
  });

  it('rejects end dates before start dates', () => {
    const result = createRentalMandateSchema.safeParse({
      ...validMandateInput,
      startDate: '2026-08-01',
      endDate: '2026-07-31',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['endDate']);
  });

  it('rejects invalid placement and management fee percentages', () => {
    const result = createRentalMandateSchema.safeParse({
      ...validMandateInput,
      placementFeePercentage: -1,
      managementFeePercentage: 101,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining(['placementFeePercentage', 'managementFeePercentage'])
    );
  });
});

describe('updateRentalMandateSchema', () => {
  it('accepts partial mandate fee edits', () => {
    const result = updateRentalMandateSchema.parse({
      placementFeePercentage: 4.5,
      managementFeePercentage: 8,
      status: 'ACTIVE',
    });

    expect(result).toEqual({
      placementFeePercentage: 4.5,
      managementFeePercentage: 8,
      status: 'ACTIVE',
    });
  });
});

describe('listRentalMandatesSchema', () => {
  it('coerces pagination and accepts status/property filters', () => {
    const result = listRentalMandatesSchema.parse({
      status: 'ACTIVE',
      propertyId: 'property-1',
      page: '2',
      limit: '10',
    });

    expect(result).toEqual({
      status: 'ACTIVE',
      propertyId: 'property-1',
      page: 2,
      limit: 10,
    });
  });
});
