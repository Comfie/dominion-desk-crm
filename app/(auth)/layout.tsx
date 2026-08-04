import Image from 'next/image';
import Link from 'next/link';
import { Building2, CheckCircle2, ClipboardCheck, KeyRound, Users } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

const accessPaths = [
  {
    label: 'Private landlords',
    detail: 'Rent, maintenance, documents, and reports.',
    icon: Building2,
  },
  {
    label: 'Property companies',
    detail: 'Teams, portfolios, financials, and workflows.',
    icon: Users,
  },
  {
    label: 'Rental agents',
    detail: 'Mandates, applications, screening, and handoff.',
    icon: ClipboardCheck,
  },
  {
    label: 'Tenant portal',
    detail: 'Invoices, proof of payment, and maintenance.',
    icon: KeyRound,
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left side - Branding */}
      <div
        data-testid="auth-brand-panel"
        className="text-primary-foreground hidden flex-col justify-between overflow-hidden border-r border-white/10 bg-[radial-gradient(circle_at_top_left,hsl(var(--accent)/0.24),transparent_28%),linear-gradient(155deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.96)_48%,hsl(215_42%_18%)_100%)] p-6 lg:flex lg:h-screen lg:overflow-hidden xl:p-8"
      >
        <div className="space-y-5">
          <Link href="/" className="flex items-center">
            <Image
              src="/logos/logo-dark.svg"
              alt="Dominion Desk"
              width={220}
              height={26}
              className="h-8 w-auto"
            />
          </Link>

          <div className="max-w-lg space-y-3">
            <p className="text-primary-foreground/70 text-xs font-semibold tracking-[0.22em] uppercase">
              Rental operations OS
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-balance xl:text-3xl">
              One workspace for every rental handoff.
            </h1>
            <p className="text-primary-foreground/78 text-sm leading-6">
              From placement to portal to payment, DominionDesk keeps South African rental teams,
              landlords, agents, and tenants working from the same operational line.
            </p>
          </div>

          <div className="max-w-xl rounded-3xl border border-white/10 bg-white/6 p-4 shadow-[var(--10x-elev-shell-3)] backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-primary-foreground/60 text-xs font-semibold tracking-[0.18em] uppercase">
                  Access paths
                </p>
                <p className="text-primary-foreground/90 mt-1 text-xs font-medium">
                  Sign in to the workspace built for your role.
                </p>
              </div>
              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-100">
                Product access
              </span>
            </div>

            <div data-testid="auth-access-paths" className="grid gap-2.5 lg:grid-cols-2">
              {accessPaths.map((path) => {
                const Icon = path.icon;

                return (
                  <div
                    key={path.label}
                    className="rounded-2xl border border-white/10 bg-white/8 p-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/10">
                        <Icon className="text-primary-foreground/90 h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-primary-foreground font-semibold">{path.label}</p>
                        <p className="text-primary-foreground/68 mt-1 hidden text-xs leading-5">
                          {path.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/20 p-3">
              <div className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-200" />
                <span className="text-primary-foreground/82 text-xs leading-5">
                  Tenant portal access, agency placement, and management workflows stay connected
                  after sign-in.
                </span>
              </div>
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
        className="bg-background flex items-center justify-center [background-image:radial-gradient(circle_at_top,hsl(var(--primary)/0.05),transparent_34rem)] px-6 py-8 lg:min-h-screen lg:px-10 lg:py-6"
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
