import { describe, expect, it } from 'vitest';

import { metadata } from './page';

describe('public page metadata', () => {
  it('leads with the reconciliation promise', () => {
    expect(metadata.title).toBe('DominionDesk | See who has paid rent in seconds');
    expect(String(metadata.description)).toMatch(/bank statement/i);
  });

  it('keeps Open Graph and Twitter titles in sync with the page title', () => {
    expect(metadata.openGraph).toMatchObject({
      title: metadata.title,
      url: 'https://dominiondesk.com',
      siteName: 'DominionDesk',
      locale: 'en_ZA',
    });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image', title: metadata.title });
  });

  it('does not advertise placement or percentage pricing', () => {
    const text = JSON.stringify(metadata);
    expect(text).not.toMatch(/placement/i);
    expect(text).not.toMatch(/4%/);
  });
});
