import { describe, expect, it } from 'vitest';

import { createMaintenanceSchema } from '../dtos/maintenance.dto';

const baseRequest = {
  propertyId: 'property-123',
  title: 'Leaking kitchen sink',
  description: 'Water is leaking under the kitchen sink and damaging the cupboard.',
  category: 'PLUMBING',
  priority: 'NORMAL',
};

const image = (index: number) => ({
  url: `https://files.example.com/maintenance-${index}.jpg`,
  name: `maintenance-${index}.jpg`,
  size: 1024 * index,
  type: 'image/jpeg',
});

describe('createMaintenanceSchema images', () => {
  it('accepts up to five maintenance photos', () => {
    const result = createMaintenanceSchema.safeParse({
      ...baseRequest,
      images: [1, 2, 3, 4, 5].map(image),
    });

    expect(result.success).toBe(true);
  });

  it('rejects more than five maintenance photos', () => {
    const result = createMaintenanceSchema.safeParse({
      ...baseRequest,
      images: [1, 2, 3, 4, 5, 6].map(image),
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['images']);
  });
});
