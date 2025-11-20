'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Calendar,
  Users,
  MessageSquare,
  Wrench,
  DollarSign,
  FileText,
  Mail,
  CheckSquare,
  BarChart3,
  Link2,
  Settings,
  LayoutDashboard,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
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
    name: 'Tenants',
    href: '/tenants',
    icon: Users,
  },
  {
    name: 'Inquiries',
    href: '/inquiries',
    icon: MessageSquare,
  },
  {
    name: 'Maintenance',
    href: '/maintenance',
    icon: Wrench,
  },
  {
    name: 'Financials',
    href: '/financials/income',
    icon: DollarSign,
  },
  {
    name: 'Documents',
    href: '/documents',
    icon: FileText,
  },
  {
    name: 'Communications',
    href: '/messages',
    icon: Mail,
  },
  {
    name: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
  },
  {
    name: 'Reports',
    href: '/reports/analytics',
    icon: BarChart3,
  },
  {
    name: 'Integrations',
    href: '/settings/integrations',
    icon: Link2,
  },
  {
    name: 'Settings',
    href: '/settings/profile',
    icon: Settings,
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-50 flex w-64 flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo and close button */}
        <div className="border-sidebar-border flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <Building2 className="text-sidebar-primary h-6 w-6" />
            <span className="text-lg font-semibold">Property CRM</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="scrollbar-thin flex-1 overflow-y-auto p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(item.href.split('/').slice(0, 2).join('/') + '/');
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors active:scale-[0.98]',
                      isActive
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-sidebar-border border-t p-4">
          <div className="text-sidebar-foreground/50 text-xs">
            <p>Property CRM v0.1.0</p>
            <p>© 2024 All rights reserved</p>
          </div>
        </div>
      </aside>
    </>
  );
}
