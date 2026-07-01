import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

const push = vi.fn();
const executeRecaptcha = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

vi.mock('react-google-recaptcha-v3', () => ({
  GoogleReCaptchaProvider: ({ children }: { children: React.ReactNode }) => children,
  useGoogleReCaptcha: () => ({
    executeRecaptcha,
  }),
}));

import RegisterPage from './page';

describe('RegisterPage', () => {
  it('submits local development registrations without executing reCAPTCHA', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Account created successfully' }),
      })
    );

    executeRecaptcha.mockRejectedValue(new Error('reCAPTCHA should not run locally'));

    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/first name/i), 'Local');
    await user.type(screen.getByLabelText(/last name/i), 'Tester');
    await user.type(screen.getByLabelText(/email/i), 'local-register@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({
          body: expect.stringContaining('"recaptchaToken":"local-development"'),
        })
      );
    });

    expect(executeRecaptcha).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/login?registered=true');
  });
});
