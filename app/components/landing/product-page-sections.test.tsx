import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
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
    const { container } = render(<LifecycleRail stages={lifecycleStages} />);

    for (const stage of lifecycleStages) {
      expect(screen.getByText(stage.label)).toBeInTheDocument();
    }

    const rail = container.querySelector('[data-testid="lifecycle-rail"]');
    expect(rail).toHaveClass('lg:grid-cols-3');
    expect(rail).not.toHaveClass('lg:grid-cols-9');
  });

  it('renders a feature suite with its feature inventory', () => {
    const placementSuite = featureSuites.find((suite) => suite.id === 'placement');
    expect(placementSuite).toBeDefined();

    const { container } = render(<FeatureSuiteSection suite={placementSuite!} />);

    expect(screen.getByText('From landlord mandate to tenant handoff')).toBeInTheDocument();
    expect(screen.getByText('Tenant portal activation handoff')).toBeInTheDocument();

    const shell = container.querySelector('[data-testid="feature-suite-shell"]');
    expect(shell).toHaveClass('rounded-2xl');
    expect(shell).toHaveClass('bg-gradient-to-br');

    expect(screen.getByText('Workflow panel')).toBeInTheDocument();
    expect(screen.getAllByText('Active workflow').length).toBeGreaterThan(0);
    expect(container.innerHTML).not.toContain('/mockups/');
  });

  it('renders pricing with agency early access', () => {
    const { container } = render(<PricingSection plans={pricingPlans} />);

    expect(screen.getByText('Agency early access')).toBeInTheDocument();
    expect(screen.getAllByText('Talk to us').length).toBeGreaterThan(0);

    const planSummaries = container.querySelectorAll('[data-testid="pricing-plan-summary"]');
    expect(planSummaries).toHaveLength(pricingPlans.length);

    for (const summary of planSummaries) {
      expect(summary).toHaveClass('h-[13.5rem]');
    }

    const priceLabels = container.querySelectorAll('[data-testid="pricing-plan-price"]');
    expect(priceLabels).toHaveLength(pricingPlans.length);

    for (const label of priceLabels) {
      expect(label).toHaveClass('whitespace-nowrap');
    }
  });

  it('renders FAQ content without hiding answers by default', () => {
    render(<FaqSection items={faqItems} />);

    expect(screen.getByText('Who is DominionDesk for?')).toBeInTheDocument();
    expect(
      screen.getByText(/private landlords, property companies, and rental agents/i)
    ).toBeInTheDocument();
  });
});
