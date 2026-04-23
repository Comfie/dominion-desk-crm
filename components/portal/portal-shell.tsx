'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { CreditCard, FileText, LayoutDashboard, LogOut, User, Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

const portalNavItems = [
  {
    href: '/portal/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/portal/payments',
    label: 'Payments',
    icon: CreditCard,
  },
  {
    href: '/portal/maintenance',
    label: 'Maintenance',
    icon: Wrench,
  },
  {
    href: '/portal/documents',
    label: 'Documents',
    icon: FileText,
  },
  {
    href: '/portal/profile',
    label: 'Profile',
    icon: User,
  },
];

type PortalShellProps = {
  children: ReactNode;
  maxWidthClass?: string;
};

export function PortalShell({ children, maxWidthClass = 'max-w-7xl' }: PortalShellProps) {
  const pathname = usePathname();

  return (
    <div className="portal-shell dark" style={{ colorScheme: 'dark' }}>
      <header className="portal-header">
        <div className={cn('portal-header-inner mx-auto px-4 sm:px-6 lg:px-8', maxWidthClass)}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:gap-8">
              <Link href="/portal/dashboard" className="portal-brand">
                <Logo variant="icon" width={32} height={32} />
                <div>
                  <p className="portal-brand-label">Tenant Portal</p>
                  <p className="portal-brand-title">DominionDesk</p>
                </div>
              </Link>

              <nav className="portal-nav">
                {portalNavItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/portal/dashboard' && pathname.startsWith(`${item.href}/`));

                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn('portal-nav-link', isActive && 'portal-nav-link-active')}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-3 self-start xl:self-auto">
              <Button
                variant="outline"
                size="sm"
                className="portal-signout"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className={cn('portal-main mx-auto w-full px-4 sm:px-6 lg:px-8', maxWidthClass)}>
        {children}
      </main>

      <footer className="border-t border-white/8 bg-black/10 py-3">
        <div className={cn('mx-auto px-4 text-center sm:px-6 lg:px-8', maxWidthClass)}>
          <p className="portal-faint-text text-xs">
            © {new Date().getFullYear()} DominionDesk. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
