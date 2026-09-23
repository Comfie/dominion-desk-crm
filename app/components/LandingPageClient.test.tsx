import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LandingPageClient } from './LandingPageClient';

describe('LandingPageClient', () => {
  it('leads with the bank statement promise and a free-start CTA', () => {
    render(<LandingPageClient />);
    expect(
      screen.getByRole('heading', { level: 1, name: /upload your bank statement/i })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /start/i })[0]).toHaveAttribute('href', '/register');
  });

  it('resolves the statement demo into a rent roll when matched', () => {
    render(<LandingPageClient />);
    expect(screen.getByText('Waiting for statement')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Match statement' }));
    expect(screen.getByText('Not paid')).toBeInTheDocument();
    expect(screen.getByText(/^R .+ outstanding$/)).toBeInTheDocument();
  });

  it('prices per occupied unit with a minimum and a cap', () => {
    render(<LandingPageClient />);
    const slider = screen.getByLabelText(/units have a tenant/i);
    fireEvent.change(slider, { target: { value: '2' } });
    expect(screen.getByTestId('calculated-price')).toHaveTextContent('R299');
    fireEvent.change(slider, { target: { value: '6' } });
    expect(screen.getByTestId('calculated-price')).toHaveTextContent('R594');
    fireEvent.change(slider, { target: { value: '25' } });
    expect(screen.getByTestId('calculated-price')).toHaveTextContent('R999');
  });

  it('is honest about what is not built and makes no invented claims', () => {
    const { container } = render(<LandingPageClient />);
    expect(screen.getByRole('heading', { name: 'Not built yet' })).toBeInTheDocument();
    const text = container.textContent ?? '';
    expect(text).not.toMatch(/500\+|R4\.2M|98%|13 hours/);
    expect(text).not.toMatch(/4% of/);
  });
});
