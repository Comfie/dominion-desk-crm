import { describe, expect, it } from 'vitest';

import { metadata } from './page';

describe('public page metadata', () => {
  it('positions DominionDesk as a South African rental operations platform', () => {
    expect(metadata.title).toBe('DominionDesk | Rental Operations OS for South Africa');
    expect(metadata.description).toBe(
      'Run placement, tenant management, rent collection, maintenance, documents, and reports from one South African rental operations platform.'
    );
  });

  it('uses matching Open Graph metadata', () => {
    expect(metadata.openGraph).toMatchObject({
      title: 'DominionDesk | Rental Operations OS for South Africa',
      description:
        'A South African rental operations platform for landlords, property companies, and rental agents.',
      url: 'https://dominiondesk.com',
      siteName: 'DominionDesk',
      locale: 'en_ZA',
      type: 'website',
    });
  });

  it('uses matching Twitter metadata', () => {
    expect(metadata.twitter).toMatchObject({
      card: 'summary_large_image',
      title: 'DominionDesk | Rental Operations OS for South Africa',
      description:
        'Manage placement, tenants, rent, maintenance, documents, and reports from one product.',
    });
  });
});
