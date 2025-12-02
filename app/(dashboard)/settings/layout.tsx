'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Bell, Shield, CreditCard, Link2, Building2 } from 'lucide-react';
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
      <div className="border-b">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {settingsNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
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
