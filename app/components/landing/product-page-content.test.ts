import {
  audiencePaths,
  faqItems,
  featureSuites,
  lifecycleStages,
  pricingPlans,
  productHero,
  staleScreenshotAssets,
  unsupportedProductionClaims,
} from './product-page-content';

describe('product landing page content', () => {
  it('positions DominionDesk as a rental operations platform for the three buying audiences', () => {
    expect(productHero.headline).toBe('Run the rental lifecycle from mandate to monthly rent.');
    expect(productHero.primaryCta.href).toBe('/register');
    expect(productHero.secondaryCta.href).toBe('/demo');
    expect(audiencePaths.map((path) => path.title)).toEqual([
      'Private landlords',
      'Property companies',
      'Rental agents',
    ]);
  });

  it('includes the full rental lifecycle rail in order', () => {
    expect(lifecycleStages.map((stage) => stage.label)).toEqual([
      'Mandate',
      'Application',
      'Viewing',
      'Screening',
      'Placement',
      'Lease',
      'Rent',
      'Maintenance',
      'Reports',
    ]);
  });

  it('includes the agency placement feature inventory', () => {
    const placementSuite = featureSuites.find((suite) => suite.id === 'placement');

    expect(placementSuite?.features).toEqual(
      expect.arrayContaining([
        'Agency-only placement workspace',
        'Landlord owner register',
        'Mandate register',
        'Placement and management fee tracking',
        'Application intake',
        'Viewing scheduling',
        'Applicant screening checklist',
        'FICA and consent tracking',
        'Placement completion',
        'Lease/property assignment',
        'Tenant portal activation handoff',
      ])
    );
  });

  it('includes management, portal, financial, operations, booking, and SA trust suites', () => {
    expect(featureSuites.map((suite) => suite.id)).toEqual([
      'placement',
      'management',
      'tenant-portal',
      'financial-control',
      'operations',
      'bookings-inquiries',
      'south-african-trust',
    ]);
  });

  it('uses talk-to-us agency pricing instead of inventing a price', () => {
    const agencyPlan = pricingPlans.find((plan) => plan.id === 'agency');

    expect(agencyPlan?.price).toBe('Talk to us');
    expect(agencyPlan?.features).toContain('Mandates, applications, screening, and portal handoff');
  });

  it('keeps unsupported external integrations out of production claims', () => {
    const visibleCopy = [
      productHero.headline,
      productHero.subheadline,
      ...audiencePaths.flatMap((path) => [path.title, path.promise, ...path.features]),
      ...featureSuites.flatMap((suite) => [suite.title, suite.summary, ...suite.features]),
      ...faqItems.flatMap((faq) => [faq.question, faq.answer]),
    ].join(' ');

    for (const claim of unsupportedProductionClaims) {
      expect(visibleCopy).not.toContain(claim);
    }
  });

  it('documents stale mockup screenshots so the page does not reuse them', () => {
    expect(staleScreenshotAssets).toEqual(
      expect.arrayContaining([
        '/mockups/img-dashboard.jpg',
        '/mockups/img-property-listing.jpg',
        '/mockups/img-tenant-listing.jpg',
        '/mockups/img-financials.jpg',
        '/mockups/img-maintenance.jpg',
        '/mockups/img-documents.jpg',
      ])
    );
  });
});
