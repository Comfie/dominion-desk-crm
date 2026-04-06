'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Calendar,
  Users,
  Wrench,
  ClipboardCheck,
  DollarSign,
  FileText,
  Mail,
  CheckSquare,
  BarChart3,
  Settings,
  LayoutDashboard,
  X,
  ChevronDown,
  Receipt,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowUpRight,
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

interface NavItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  children?: { name: string; href: string }[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigationSections: NavSection[] = [
  {
    title: 'Overview',
    items: [
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
        name: 'Tenants',
        href: '/tenants',
        icon: Users,
      },
      {
        name: 'Bookings',
        href: '/bookings',
        icon: Calendar,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        name: 'Maintenance',
        href: '/maintenance',
        icon: Wrench,
      },
      {
        name: 'Inspections',
        href: '/inspections',
        icon: ClipboardCheck,
      },
      {
        name: 'Tasks',
        href: '/tasks',
        icon: CheckSquare,
      },
      {
        name: 'Documents',
        href: '/documents',
        icon: FileText,
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        name: 'Financials',
        icon: DollarSign,
        children: [
          { name: 'Rent Collection', href: '/financials/rent-collection' },
          { name: 'Income & Payments', href: '/financials/income' },
          { name: 'Expenses', href: '/financials/expenses' },
        ],
      },
      {
        name: 'Reports',
        href: '/reports/analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    title: 'Communications',
    items: [
      {
        name: 'Communications',
        icon: Mail,
        children: [
          { name: 'Messages', href: '/messages' },
          { name: 'Automations', href: '/messages/automations' },
          { name: 'Scheduled', href: '/messages/scheduled' },
        ],
      },
    ],
  },
  {
    title: 'Settings',
    items: [
      {
        name: 'Settings',
        icon: Settings,
        children: [
          { name: 'Profile', href: '/settings/profile' },
          { name: 'Integrations', href: '/settings/integrations' },
        ],
      },
    ],
  },
];

export function Sidebar({ isOpen, onClose, isCollapsed = false, toggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Financials']);

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const isItemActive = (item: NavItem) => {
    if (item.href) {
      return (
        pathname === item.href ||
        pathname.startsWith(item.href.split('/').slice(0, 2).join('/') + '/')
      );
    }
    if (item.children) {
      return item.children.some((child) => pathname.startsWith(child.href));
    }
    return false;
  };

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
          'bg-sidebar/95 text-sidebar-foreground border-sidebar-border/80 fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r shadow-[0_0_0_1px_rgb(0_0_0_/_0.02),0_12px_32px_rgb(15_23_42_/_0.06)] backdrop-blur transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo and close button */}
        <div
          className={cn(
            'border-sidebar-border/80 flex h-16 items-center border-b px-4',
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
          <div className="flex items-center gap-1">
            {toggleCollapse && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="hidden h-8 w-8 rounded-lg lg:flex"
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                </span>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-4">
            {navigationSections.map((section) => (
              <div key={section.title} className="space-y-1">
                {!isCollapsed && (
                  <div className="px-3">
                    <p className="text-sidebar-foreground/45 text-[11px] font-semibold tracking-[0.18em] uppercase">
                      {section.title}
                    </p>
                  </div>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = isItemActive(item);
                    const isExpanded = expandedItems.includes(item.name);
                    const hasChildren = item.children && item.children.length > 0;
                    const showExpanded = isExpanded || isActive;

                    return (
                      <li key={item.name}>
                        {hasChildren ? (
                          <>
                            <button
                              onClick={() => toggleExpanded(item.name)}
                              className={cn(
                                'group flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all active:scale-[0.98]',
                                isActive
                                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                                  : 'text-sidebar-foreground/72 hover:bg-sidebar-primary/[0.08] hover:text-sidebar-foreground',
                                isCollapsed && 'justify-center px-2.5'
                              )}
                              title={isCollapsed ? item.name : undefined}
                            >
                              <item.icon className="h-4.5 w-4.5 shrink-0" />
                              {!isCollapsed && (
                                <>
                                  <span className="flex-1 text-left">{item.name}</span>
                                  <ChevronDown
                                    className={cn(
                                      'h-4 w-4 transition-transform',
                                      showExpanded && 'rotate-180'
                                    )}
                                  />
                                </>
                              )}
                            </button>
                            {!isCollapsed && showExpanded && (
                              <ul className="border-sidebar-border/70 bg-sidebar-primary/[0.03] mt-1 space-y-1 rounded-xl border p-1.5">
                                {item.children!.map((child) => {
                                  const isChildActive = pathname.startsWith(child.href);

                                  return (
                                    <li key={child.href}>
                                      <Link
                                        href={child.href}
                                        onClick={onClose}
                                        className={cn(
                                          'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors',
                                          isChildActive
                                            ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium'
                                            : 'text-sidebar-foreground/68 hover:bg-sidebar-primary/[0.08] hover:text-sidebar-foreground'
                                        )}
                                      >
                                        <Receipt className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                        <span>{child.name}</span>
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </>
                        ) : (
                          <Link
                            href={item.href!}
                            onClick={onClose}
                            className={cn(
                              'group flex items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium transition-all active:scale-[0.98]',
                              isActive
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                                : 'text-sidebar-foreground/72 hover:bg-sidebar-primary/[0.08] hover:text-sidebar-foreground',
                              isCollapsed && 'justify-center px-2.5'
                            )}
                            title={isCollapsed ? item.name : undefined}
                          >
                            <item.icon className="h-4.5 w-4.5 shrink-0" />
                            {!isCollapsed && (
                              <>
                                <span className="flex-1">{item.name}</span>
                                {isActive && <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />}
                              </>
                            )}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-sidebar-border/80 border-t p-3">
          {!isCollapsed ? (
            <div className="border-sidebar-border/70 bg-sidebar-primary/[0.03] rounded-xl border px-3 py-2.5">
              <p className="text-sidebar-foreground/75 truncate text-xs font-medium">
                Dominion Desk
              </p>
              <p className="text-sidebar-foreground/45 text-[11px]">v0.2.0 landlord workspace</p>
            </div>
          ) : (
            <div className="text-sidebar-foreground/45 text-center text-[11px]">v0.2.0</div>
          )}
        </div>
      </aside>
    </>
  );
}
