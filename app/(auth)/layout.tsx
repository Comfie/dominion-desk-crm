import { Building2 } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="from-primary via-primary/90 to-primary/80 text-primary-foreground hidden flex-col justify-between bg-gradient-to-br p-10 lg:flex">
        <div>
          <Link href="/" className="flex items-center">
            <img
              src="/logos/logo-dark.svg"
              alt="Dominion Desk"
              width={300}
              height={36}
              style={{ display: 'block' }}
            />
          </Link>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <p className="text-lg leading-relaxed font-medium">
              Stop chasing rent. Automate reminders, manage tenants, track maintenance, and generate
              tax-ready reports — all from one dashboard built for South Africa.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              'Automated rent reminders via email',
              'Tenant portal with proof-of-payment upload',
              '9 financial reports + CSV export',
              'Document vault for leases & FICA docs',
              'No credit card required — 2 months free',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm">
                <svg
                  className="h-4 w-4 flex-shrink-0 opacity-80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="opacity-90">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs opacity-60">
          © {new Date().getFullYear()} DominionDesk. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth forms */}
      <div className="bg-background flex items-center justify-center p-6 lg:p-10">
        <div className="w-full max-w-[400px] space-y-6">
          {/* Mobile logo */}
          <Link href="/" className="mb-8 flex items-center justify-center lg:hidden">
            <Logo variant="full" width={180} height={36} />
          </Link>

          {children}
        </div>
      </div>
    </div>
  );
}
