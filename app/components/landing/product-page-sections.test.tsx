import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  audiencePaths,
  faqItems,
  featureSuites,
  productCapabilities,
  quickStartSteps,
  lifecycleStages,
  pricingPlans,
  productHero,
} from './product-page-content';
import {
  AudiencePathGrid,
  CapabilityGrid,
  FaqSection,
  FeatureSuiteSection,
  GettingStartedSection,
  HeroProductSurface,
  LifecycleRail,
  PricingSection,
} from './product-page-sections';

describe('product page sections', () => {
  it('renders the hero product surface with placement, management, and portal lanes', () => {
    const { container } = render(<HeroProductSurface hero={productHero} />);

    expect(screen.getAllByText('Rental cockpit').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Operational view').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Placement').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Rent control').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Maintenance').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tenant handoff ready').length).toBeGreaterThan(0);

    const desktopGrid = container.querySelector('[data-testid="hero-cockpit-grid"]');
    expect(desktopGrid).toHaveClass('lg:grid-cols-3');
    expect(desktopGrid).toHaveClass('gap-4');
  });

  it('keeps the landing product visuals in the DominionDesk blue palette', () => {
    const { container } = render(<HeroProductSurface hero={productHero} />);

    expect(container.innerHTML).toContain('#08233F');
    expect(container.innerHTML).toContain('#3B82F6');
    expect(container.innerHTML).not.toContain('#F7F0E5');
    expect(container.innerHTML).not.toContain('#E1B56A');
    expect(container.innerHTML).not.toContain('#8A5A18');
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

  it('renders the getting started steps as product onboarding cards', () => {
    render(<GettingStartedSection steps={quickStartSteps} />);

    expect(screen.getByText('Your first live workflow is five minutes away.')).toBeInTheDocument();
    expect(screen.getByText('Capture the rental')).toBeInTheDocument();
    expect(screen.getByText('Invite the tenant')).toBeInTheDocument();
    expect(screen.getByText('Run the month')).toBeInTheDocument();
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

  it('renders a broad capability inventory without relying on screenshots', () => {
    const { container } = render(<CapabilityGrid capabilities={productCapabilities} />);

    expect(screen.getByText('Everything in the rental operations stack.')).toBeInTheDocument();
    expect(screen.getByText('Placement')).toBeInTheDocument();
    expect(screen.getByText('Tenant portal')).toBeInTheDocument();
    expect(screen.getByText('South African workflows')).toBeInTheDocument();
    expect(container.querySelectorAll('[data-testid="capability-card"]').length).toBe(
      productCapabilities.length
    );
    expect(container.innerHTML).not.toContain('/mockups/');
  });

  it('renders FAQ content without hiding answers by default', () => {
    render(<FaqSection items={faqItems} />);

    expect(screen.getByText('Who is DominionDesk for?')).toBeInTheDocument();
    expect(
      screen.getByText(/private landlords, property companies, and rental agents/i)
    ).toBeInTheDocument();
  });
});
