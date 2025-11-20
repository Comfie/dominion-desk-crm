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
    <nav className="bg-background border-border fixed inset-x-0 bottom-0 z-50 border-t lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {mobileNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            pathname.startsWith(item.href.split('/').slice(0, 2).join('/') + '/');

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
        <button
          onClick={onMoreClick}
          className="text-muted-foreground hover:text-foreground flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
