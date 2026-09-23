import { NextResponse } from 'next/server';
import { describe, expect, it } from 'vitest';

import { ValidationError } from '../app-error';
import { handleApiError } from '../error-handler';

describe('handleApiError', () => {
  it('passes through responses thrown by auth helpers (401 stays 401)', () => {
    const thrown = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    expect(handleApiError(thrown).status).toBe(401);
  });

  it('passes through 403 responses', () => {
    const thrown = NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    expect(handleApiError(thrown).status).toBe(403);
  });

  it('still maps app errors to their status', () => {
    expect(handleApiError(new ValidationError('bad')).status).toBe(400);
  });

  it('still returns 500 for unknown errors', () => {
    expect(handleApiError(new Error('boom')).status).toBe(500);
  });
});
