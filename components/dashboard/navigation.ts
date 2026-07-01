import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Building2,
  Calendar,
  CheckSquare,
  ClipboardCheck,
  DollarSign,
  FileText,
  LayoutDashboard,
  Mail,
  Users,
  Wrench,
  Settings,
} from 'lucide-react';

import { canAccessPlacementFeatures } from '@/lib/account-capabilities';

export interface NavItem {
  name: string;
  href?: string;
  icon: LucideIcon;
  children?: { name: string; href: string }[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

type NavChild = { name: string; href: string };

function isHrefActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function hasMoreSpecificActiveHref(
  pathname: string,
  href: string,
  siblings: Array<{ href?: string }>
) {
  return siblings.some(
    (sibling) =>
      sibling.href &&
      sibling.href !== href &&
      sibling.href.startsWith(`${href}/`) &&
      isHrefActive(pathname, sibling.href)
  );
}

export function isNavigationChildActive(
  child: NavChild,
  pathname: string,
  siblings: NavChild[] = []
) {
  return (
    isHrefActive(pathname, child.href) && !hasMoreSpecificActiveHref(pathname, child.href, siblings)
  );
}

export function isNavigationItemActive(item: NavItem, pathname: string, siblings: NavItem[] = []) {
  if (item.href) {
    return (
      isHrefActive(pathname, item.href) && !hasMoreSpecificActiveHref(pathname, item.href, siblings)
    );
  }

  if (item.children) {
    return item.children.some((child) => isNavigationChildActive(child, pathname, item.children));
  }

  return false;
}

const baseNavigationSections: NavSection[] = [
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
          // { name: 'Integrations', href: '/settings/integrations' },
        ],
      },
    ],
  },
];

const placementSection: NavSection = {
  title: 'Placement',
  items: [
    {
      name: 'Placement Pipeline',
      href: '/placement',
      icon: ClipboardCheck,
    },
    {
      name: 'Applications',
      href: '/placement/applications',
      icon: FileText,
    },
    {
      name: 'Viewings',
      href: '/placement/viewings',
      icon: Calendar,
    },
    {
      name: 'Landlords',
      href: '/placement/landlords',
      icon: Users,
    },
    {
      name: 'Mandates',
      href: '/placement/mandates',
      icon: FileText,
    },
  ],
};

export function getDashboardNavigationSections(
  accountType: string | null | undefined
): NavSection[] {
  if (!canAccessPlacementFeatures(accountType)) {
    return baseNavigationSections;
  }

  return [baseNavigationSections[0], placementSection, ...baseNavigationSections.slice(1)];
}
