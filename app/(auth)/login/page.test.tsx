import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const push = vi.fn();
let searchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => searchParams,
}));

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

import LoginPage from './page';

describe('LoginPage', () => {
  it('frames sign-in as access to the rental operations workspace', () => {
    searchParams = new URLSearchParams();

    render(<LoginPage />);

    expect(
      screen.getByRole('heading', { name: /access your rental operations workspace/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/sign in to manage placement, rent, maintenance/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create account/i })).toHaveAttribute(
      'href',
      '/register'
    );
  });

  it('shows a registration success message after signup redirect', () => {
    searchParams = new URLSearchParams('registered=true');

    render(<LoginPage />);

    expect(screen.getByText(/account created/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in to open your dominiondesk workspace/i)).toBeInTheDocument();
  });
});
