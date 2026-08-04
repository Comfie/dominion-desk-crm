import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import AuthLayout from './layout';

describe('AuthLayout', () => {
  it('positions auth as the DominionDesk rental operations product shell', () => {
    render(
      <AuthLayout>
        <div>Auth form</div>
      </AuthLayout>
    );

    expect(screen.getByText(/rental operations os/i)).toBeInTheDocument();
    expect(screen.getByText(/from placement to portal to payment/i)).toBeInTheDocument();
    expect(screen.getByText('Private landlords')).toBeInTheDocument();
    expect(screen.getByText('Property companies')).toBeInTheDocument();
    expect(screen.getByText('Rental agents')).toBeInTheDocument();
    expect(screen.getByText('Tenant portal')).toBeInTheDocument();
  });

  it('keeps the desktop brand panel constrained to the viewport', () => {
    render(
      <AuthLayout>
        <div>Auth form</div>
      </AuthLayout>
    );

    const brandPanel = screen.getByTestId('auth-brand-panel');

    expect(brandPanel).toHaveClass('lg:h-screen');
    expect(brandPanel).toHaveClass('lg:overflow-hidden');
  });

  it('uses a compact desktop grid for access paths so the panel does not clip', () => {
    render(
      <AuthLayout>
        <div>Auth form</div>
      </AuthLayout>
    );

    const accessPaths = screen.getByTestId('auth-access-paths');

    expect(accessPaths).toHaveClass('lg:grid-cols-2');
  });
});
