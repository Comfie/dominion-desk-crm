'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Calendar, DollarSign, MoreHorizontal } from 'lucide-react';

import { cn } from '@/lib/utils';

interface MobileNavProps {
  onMoreClick: () => void;
}

const mobileNavItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Properties',
    href: '/properties',
    icon: Building2,
  },
  {
    name: 'Bookings',
    href: '/bookings',
    icon: Calendar,
  },
  {
    name: 'Financials',
    href: '/financials/income',
    icon: DollarSign,
  },
];

export function MobileNav({ onMoreClick }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <nav className="shell-surface-strong fixed inset-x-0 bottom-0 z-40 border-t lg:hidden">
      <div className="shell-mobile-nav-frame grid grid-cols-5 gap-1 px-2 pt-2">
        {mobileNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href.split('/').slice(0, 2).join('/') + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'shell-action flex min-h-[var(--10x-shell-mobile-nav-height)] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-medium',
                isActive
                  ? 'bg-primary/10 text-primary shadow-[var(--10x-elev-shell-1)]'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={onMoreClick}
          className="shell-action text-muted-foreground hover:bg-secondary hover:text-foreground flex min-h-[var(--10x-shell-mobile-nav-height)] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-medium"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
