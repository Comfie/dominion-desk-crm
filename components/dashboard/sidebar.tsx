'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Calendar,
  Users,
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
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
  // {
  //   name: 'Inquiries',
  //   href: '/inquiries',
  //   icon: MessageSquare,
  // },
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

export function Sidebar({ isOpen, onClose, isCollapsed = false, toggleCollapse }: SidebarProps) {
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
          'bg-sidebar text-sidebar-foreground fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo and close button */}
        <div
          className={cn(
            'border-sidebar-border flex h-16 items-center border-b px-4',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <Link href="/dashboard" className="flex items-center" onClick={onClose}>
            {isCollapsed ? (
              <Logo variant="icon" width={32} height={32} />
            ) : (
              <Logo variant="full" width={160} height={32} />
            )}
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
                        ? 'bg-primary/10 text-primary'
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                      isCollapsed && 'justify-center px-2'
                    )}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-sidebar-border border-t p-4">
          {!isCollapsed ? (
            <div className="flex items-center justify-between">
              <div className="text-sidebar-foreground/50 text-xs">
                <p>Dominion Desk v0.1.0</p>
                <p>© 2025 All rights reserved</p>
              </div>
              {toggleCollapse && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCollapse}
                  className="hidden h-6 w-6 lg:flex"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              {toggleCollapse && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleCollapse}
                  className="hidden lg:flex"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
