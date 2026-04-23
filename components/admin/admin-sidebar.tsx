'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Users, BarChart3, CreditCard, Settings, X, Shield } from 'lucide-react';

const navItems = [
  {
    title: 'System Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'System Admins',
    href: '/admin/system-admins',
    icon: Shield,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Subscriptions',
    href: '/admin/subscriptions',
    icon: CreditCard,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="shell-scrim fixed inset-0 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'shell-surface-strong shell-action shell-sidebar-frame fixed inset-y-0 left-0 z-50 transform border-r backdrop-blur-xl lg:relative lg:h-dvh lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="shell-header-bar flex items-center justify-between border-b px-4">
            <Link href="/admin/users" className="flex items-center gap-3">
              <Logo variant="icon" width={36} height={36} />
              <div className="space-y-1">
                <p className="shell-label">Operations Console</p>
                <span className="text-sm font-semibold text-white">Admin</span>
              </div>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="shell-action admin-subtle rounded-xl hover:text-white lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4 md:py-5">
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'shell-action shell-nav-item flex items-center gap-3 rounded-2xl px-3 py-2.5 font-medium',
                      isActive
                        ? 'bg-sky-400/90 text-slate-950 shadow-[var(--10x-elev-shell-1)]'
                        : 'admin-subtle hover:bg-white/6 hover:text-white'
                    )}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer - User info */}
          <div className="border-t p-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-400/15">
                  <Shield className="h-5 w-5 text-sky-300" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-white">Super Admin</p>
                  <p className="shell-support text-xs">Platform Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
