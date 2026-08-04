import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LandingPageClient } from './LandingPageClient';

describe('LandingPageClient product page', () => {
  it('renders the product positioning and main CTAs', () => {
    render(<LandingPageClient />);

    expect(
      screen.getByRole('heading', {
        name: /run rentals from one operating cockpit/i,
      })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /start free/i })[0]).toHaveAttribute(
      'href',
      '/register'
    );
    expect(screen.getAllByRole('link', { name: /see product walkthrough/i })[0]).toHaveAttribute(
      'href',
      '/demo'
    );
  });

  it('renders the three audience paths and lifecycle rail', () => {
    render(<LandingPageClient />);

    expect(screen.getByText('Private landlords')).toBeInTheDocument();
    expect(screen.getByText('Property companies')).toBeInTheDocument();
    expect(screen.getByText('Rental agents')).toBeInTheDocument();
    expect(screen.getByText('Mandate')).toBeInTheDocument();
    expect(screen.getAllByText('Reports').length).toBeGreaterThan(0);
  });

  it('renders the placement, management, tenant portal, and financial suites', () => {
    render(<LandingPageClient />);

    expect(screen.getByText('From landlord mandate to tenant handoff')).toBeInTheDocument();
    expect(screen.getByText('Manage the property and the relationship')).toBeInTheDocument();
    expect(screen.getByText('Give every tenant a portal after handoff')).toBeInTheDocument();
    expect(
      screen.getByText('Know what is paid, overdue, profitable, and export-ready')
    ).toBeInTheDocument();
  });

  it('does not render unsupported production integration claims', () => {
    render(<LandingPageClient />);

    expect(screen.queryByText(/live Airbnb sync/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/live Paystack payments/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/guaranteed on-time payments/i)).not.toBeInTheDocument();
  });

  it('does not render stale screenshot paths from old mockups', () => {
    const { container } = render(<LandingPageClient />);

    expect(container.innerHTML).not.toContain('/mockups/');
  });

  it('keeps the hero background treatment in the DominionDesk blue palette', () => {
    const { container } = render(<LandingPageClient />);

    expect(container.innerHTML).toContain('rgba(59,130,246,0.18)');
    expect(container.innerHTML).not.toContain('rgba(225,181,106');
  });
});
