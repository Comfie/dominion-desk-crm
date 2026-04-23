'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Bell, Shield, CreditCard, Link2, Building2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const settingsNav = [
  {
    name: 'Profile',
    href: '/settings/profile',
    icon: User,
  },
  {
    name: 'Banking',
    href: '/settings/banking',
    icon: Building2,
    description: 'Payment & invoice details',
  },
  {
    name: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
  },
  {
    name: 'Security',
    href: '/settings/security',
    icon: Shield,
  },
  {
    name: 'Team',
    href: '/settings/team',
    icon: Users,
    description: 'Manage team members',
  },
  {
    name: 'Subscription',
    href: '/settings/subscription',
    icon: CreditCard,
  },
  {
    name: 'Integrations',
    href: '/settings/integrations',
    icon: Link2,
  },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      {/* Settings Navigation */}
      <div className="shell-surface scrollbar-thin overflow-x-auto rounded-3xl border p-1">
        <nav className="flex min-w-max gap-1">
          {settingsNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'shell-action flex min-h-11 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-[var(--10x-elev-shell-1)]'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Settings Content */}
      {children}
    </div>
  );
}
