import { describe, expect, it } from 'vitest';

import {
  createRentalApplicationSchema,
  listRentalApplicationsSchema,
} from '../dtos/rental-application.dto';

const validApplicationInput = {
  propertyId: 'property-1',
  inquiryId: 'inquiry-1',
  applicantFirstName: 'Lerato',
  applicantLastName: 'Mokoena',
  applicantEmail: 'lerato@example.com',
  applicantPhone: '0821234567',
  idNumber: '9001015009087',
  requestedMoveInDate: '2026-08-01',
  proposedLeaseStartDate: '2026-08-01',
  proposedLeaseEndDate: '2027-07-31',
  proposedMonthlyRent: 14500,
  proposedDeposit: 29000,
  assignedTo: 'agent-1',
};

describe('createRentalApplicationSchema', () => {
  it('accepts a valid rental application intake payload', () => {
    const result = createRentalApplicationSchema.parse(validApplicationInput);

    expect(result).toMatchObject(validApplicationInput);
  });

  it('requires applicant and property fields', () => {
    const result = createRentalApplicationSchema.safeParse({
      applicantLastName: 'Mokoena',
      applicantEmail: 'bad-email',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining(['propertyId', 'applicantFirstName', 'applicantEmail'])
    );
  });

  it('rejects negative rent and deposit values', () => {
    const result = createRentalApplicationSchema.safeParse({
      ...validApplicationInput,
      proposedMonthlyRent: -1,
      proposedDeposit: -1,
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining(['proposedMonthlyRent', 'proposedDeposit'])
    );
  });

  it('rejects a proposed lease end date before the start date', () => {
    const result = createRentalApplicationSchema.safeParse({
      ...validApplicationInput,
      proposedLeaseStartDate: '2026-08-01',
      proposedLeaseEndDate: '2026-07-31',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['proposedLeaseEndDate']);
  });
});

describe('listRentalApplicationsSchema', () => {
  it('coerces pagination and accepts status filters', () => {
    const result = listRentalApplicationsSchema.parse({
      status: 'SCREENING',
      propertyId: 'property-1',
      page: '2',
      limit: '10',
    });

    expect(result).toEqual({
      status: 'SCREENING',
      propertyId: 'property-1',
      page: 2,
      limit: 10,
    });
  });
});
