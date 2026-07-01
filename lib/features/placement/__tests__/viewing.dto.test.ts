import { describe, expect, it } from 'vitest';

import { createViewingSchema, listViewingsSchema, updateViewingSchema } from '../dtos/viewing.dto';

const validViewingInput = {
  propertyId: 'property-1',
  inquiryId: 'inquiry-1',
  rentalApplicationId: 'application-1',
  contactName: 'Lerato Mokoena',
  contactEmail: 'lerato@example.com',
  contactPhone: '0821234567',
  scheduledFor: '2026-08-05T10:00:00.000Z',
  durationMinutes: 45,
  assignedTo: 'agent-1',
};

describe('createViewingSchema', () => {
  it('accepts a valid viewing payload', () => {
    const result = createViewingSchema.parse(validViewingInput);

    expect(result).toMatchObject(validViewingInput);
  });

  it('requires property, contact name, and scheduled time', () => {
    const result = createViewingSchema.safeParse({
      contactEmail: '',
      contactPhone: '',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining(['propertyId', 'contactName', 'scheduledFor'])
    );
  });

  it('requires at least one contact channel', () => {
    const result = createViewingSchema.safeParse({
      ...validViewingInput,
      contactEmail: '',
      contactPhone: '',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join('.'))).toEqual(
      expect.arrayContaining(['contactEmail'])
    );
  });

  it('rejects short or excessive viewing durations', () => {
    const shortResult = createViewingSchema.safeParse({
      ...validViewingInput,
      durationMinutes: 5,
    });
    const longResult = createViewingSchema.safeParse({
      ...validViewingInput,
      durationMinutes: 300,
    });

    expect(shortResult.success).toBe(false);
    expect(longResult.success).toBe(false);
  });
});

describe('updateViewingSchema', () => {
  it('accepts attendance and feedback updates', () => {
    const result = updateViewingSchema.parse({
      status: 'ATTENDED',
      feedback: 'Applicant liked the property.',
      followUpNotes: 'Send application link.',
    });

    expect(result).toEqual({
      status: 'ATTENDED',
      feedback: 'Applicant liked the property.',
      followUpNotes: 'Send application link.',
    });
  });
});

describe('listViewingsSchema', () => {
  it('coerces pagination and accepts status/property filters', () => {
    const result = listViewingsSchema.parse({
      status: 'CONFIRMED',
      propertyId: 'property-1',
      page: '2',
      limit: '10',
    });

    expect(result).toEqual({
      status: 'CONFIRMED',
      propertyId: 'property-1',
      page: 2,
      limit: 10,
    });
  });
});
