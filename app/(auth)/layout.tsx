import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/ui/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="text-primary-foreground hidden flex-col justify-between border-r border-white/10 bg-[radial-gradient(circle_at_top_left,hsl(var(--accent)/0.24),transparent_28%),linear-gradient(155deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.96)_48%,hsl(215_42%_18%)_100%)] p-10 lg:flex xl:p-12">
        <div className="space-y-10">
          <Link href="/" className="flex items-center">
            <Image
              src="/logos/logo-dark.svg"
              alt="Dominion Desk"
              width={300}
              height={36}
              priority
            />
          </Link>

          <div className="max-w-lg space-y-4">
            <p className="text-primary-foreground/70 text-xs font-semibold tracking-[0.22em] uppercase">
              Landlord workspace
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-balance">
              Run the operating system behind every rental.
            </h1>
            <p className="text-primary-foreground/78 text-base leading-relaxed">
              Stop chasing rent. Automate reminders, manage tenants, track maintenance, and generate
              tax-ready reports from one dashboard built for South African operators.
            </p>
          </div>

          <div className="max-w-xl rounded-3xl border border-white/10 bg-white/6 p-6 shadow-[var(--10x-elev-shell-3)] backdrop-blur-sm">
            <div className="space-y-3">
              {[
                'Automated rent reminders via email',
                'Tenant portal with proof-of-payment upload',
                '9 financial reports + CSV export',
                'Document vault for leases and FICA docs',
                'No credit card required for the first 2 months',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm">
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
                  <span className="text-primary-foreground/88">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-primary-foreground/60 text-xs">
          © {new Date().getFullYear()} DominionDesk. All rights reserved.
        </div>
      </div>

      {/* Right side - Auth forms */}
      <main
        id="main-content"
        className="bg-background flex items-center justify-center [background-image:radial-gradient(circle_at_top,hsl(var(--primary)/0.05),transparent_34rem)] px-6 py-10 lg:px-10"
      >
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <Link href="/" className="mb-8 flex items-center justify-center lg:hidden">
            <Logo variant="full" width={180} height={36} />
          </Link>

          {children}
        </div>
      </main>
    </div>
  );
}
