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
          <blockquote className="space-y-2">
            <p className="text-lg leading-relaxed font-medium">
              &ldquo;Dominion Desk has transformed how I manage my rental properties. No more double
              bookings, and I can finally see all my finances in one place.&rdquo;
            </p>
            <footer className="text-sm opacity-80">
              — Sarah M., Property Owner in Johannesburg
            </footer>
          </blockquote>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold">500+</p>
              <p className="text-xs opacity-80">Active Properties</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">R2M+</p>
              <p className="text-xs opacity-80">Revenue Tracked</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">98%</p>
              <p className="text-xs opacity-80">Customer Satisfaction</p>
            </div>
          </div>
        </div>

        <div className="text-xs opacity-60">© 2025 Dominion Desk. All rights reserved.</div>
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
