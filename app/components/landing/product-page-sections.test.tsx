import { render, screen } from '@testing-library/react';
import {
  audiencePaths,
  faqItems,
  featureSuites,
  lifecycleStages,
  pricingPlans,
  productHero,
} from './product-page-content';
import {
  AudiencePathGrid,
  FaqSection,
  FeatureSuiteSection,
  HeroProductSurface,
  LifecycleRail,
  PricingSection,
} from './product-page-sections';

describe('product page sections', () => {
  it('renders the hero product surface with placement, management, and portal lanes', () => {
    render(<HeroProductSurface hero={productHero} />);

    expect(screen.getByText('Placement')).toBeInTheDocument();
    expect(screen.getByText('Management')).toBeInTheDocument();
    expect(screen.getByText('Tenant Portal')).toBeInTheDocument();
    expect(screen.getByText('Screening passed')).toBeInTheDocument();
  });

  it('does not render stale screenshot assets in product visuals', () => {
    const { container } = render(<HeroProductSurface hero={productHero} />);

    expect(container.querySelector('img')).not.toBeInTheDocument();
    expect(container.innerHTML).not.toContain('/mockups/');
  });

  it('renders the three audience paths', () => {
    render(<AudiencePathGrid paths={audiencePaths} />);

    expect(screen.getByText('Private landlords')).toBeInTheDocument();
    expect(screen.getByText('Property companies')).toBeInTheDocument();
    expect(screen.getByText('Rental agents')).toBeInTheDocument();
    expect(screen.getByText('Placement completion')).toBeInTheDocument();
    expect(screen.getByText('Lease assignment')).toBeInTheDocument();
    expect(screen.getByText('Tenant portal handoff')).toBeInTheDocument();
  });

  it('renders every lifecycle stage', () => {
    render(<LifecycleRail stages={lifecycleStages} />);

    for (const stage of lifecycleStages) {
      expect(screen.getByText(stage.label)).toBeInTheDocument();
    }
  });

  it('renders a feature suite with its feature inventory', () => {
    const placementSuite = featureSuites.find((suite) => suite.id === 'placement');
    expect(placementSuite).toBeDefined();

    render(<FeatureSuiteSection suite={placementSuite!} />);

    expect(screen.getByText('From landlord mandate to tenant handoff')).toBeInTheDocument();
    expect(screen.getByText('Tenant portal activation handoff')).toBeInTheDocument();
  });

  it('renders pricing with agency early access', () => {
    render(<PricingSection plans={pricingPlans} />);

    expect(screen.getByText('Agency early access')).toBeInTheDocument();
    expect(screen.getAllByText('Talk to us').length).toBeGreaterThan(0);
  });

  it('renders FAQ content without hiding answers by default', () => {
    render(<FaqSection items={faqItems} />);

    expect(screen.getByText('Who is DominionDesk for?')).toBeInTheDocument();
    expect(
      screen.getByText(/private landlords, property companies, and rental agents/i)
    ).toBeInTheDocument();
  });
});
