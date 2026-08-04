'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, ChevronDown, Receipt, PanelLeftClose, PanelLeftOpen, ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import {
  getDashboardNavigationSections,
  isNavigationChildActive,
  isNavigationItemActive,
} from './navigation';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed?: boolean;
  toggleCollapse?: () => void;
  accountType?: string | null;
}

export function Sidebar({
  isOpen,
  onClose,
  isCollapsed = false,
  toggleCollapse,
  accountType,
}: SidebarProps) {
  const pathname = usePathname();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Financials']);
  const navigationSections = getDashboardNavigationSections(accountType);

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  return (
    <>
      {/* Backdrop for mobile */}
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
          'shell-surface-strong text-sidebar-foreground fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r backdrop-blur-xl transition-[width,transform,box-shadow,background-color,border-color] duration-[var(--10x-motion-slow)] ease-[var(--10x-motion-ease-standard)] lg:relative lg:h-dvh lg:shrink-0 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'shell-sidebar-collapsed' : 'shell-sidebar-frame'
        )}
      >
        {/* Logo and close button */}
        <div
          className={cn(
            'shell-header-bar flex items-center border-b px-4',
            isCollapsed ? 'justify-center' : 'justify-between'
          )}
        >
          <div
            className={cn('flex items-center gap-2', isCollapsed && 'w-full justify-center gap-0')}
          >
            <div
              className={cn(
                'overflow-hidden transition-[max-width,opacity,transform] duration-[var(--10x-motion-base)] ease-[var(--10x-motion-ease-standard)]',
                isCollapsed
                  ? 'max-w-0 -translate-x-2 opacity-0'
                  : 'max-w-[11rem] translate-x-0 opacity-100'
              )}
            >
              <Link href="/dashboard" className="flex items-center" onClick={onClose}>
                <Logo variant="full" width={156} height={34} />
              </Link>
            </div>
            <div
              className={cn(
                'overflow-hidden transition-[max-width,opacity,transform] duration-[var(--10x-motion-base)] ease-[var(--10x-motion-ease-standard)]',
                isCollapsed ? 'max-w-[2.5rem] scale-100 opacity-100' : 'max-w-0 scale-90 opacity-0'
              )}
            >
              <div className="flex justify-center">
                <Logo variant="icon" width={36} height={36} />
              </div>
            </div>
            {toggleCollapse && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCollapse}
                className="shell-action text-sidebar-foreground/70 hover:text-sidebar-foreground hidden h-9 w-9 rounded-xl lg:flex"
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
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="shell-action text-sidebar-foreground/70 hover:text-sidebar-foreground rounded-xl lg:hidden"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-4 md:py-5">
          <div className="space-y-5">
            {navigationSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <div
                  className={cn(
                    'overflow-hidden px-3 transition-[max-height,opacity,transform] duration-[var(--10x-motion-base)] ease-[var(--10x-motion-ease-standard)]',
                    isCollapsed
                      ? 'max-h-0 -translate-y-1 opacity-0'
                      : 'max-h-8 translate-y-0 opacity-100'
                  )}
                >
                  <p className="shell-label text-sidebar-foreground/45 whitespace-nowrap">
                    {section.title}
                  </p>
                </div>
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = isNavigationItemActive(item, pathname, section.items);
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
                                'shell-action shell-nav-item group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 font-medium active:scale-[0.99]',
                                isActive
                                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-[var(--10x-elev-shell-1)]'
                                  : 'text-sidebar-foreground/72 hover:bg-primary/5 hover:text-sidebar-foreground',
                                isCollapsed && 'justify-center px-2.5'
                              )}
                              title={isCollapsed ? item.name : undefined}
                            >
                              <item.icon className="h-4 w-4 shrink-0" />
                              <span
                                className={cn(
                                  'min-w-0 flex-1 overflow-hidden text-left whitespace-nowrap transition-[max-width,opacity,transform] duration-[var(--10x-motion-base)] ease-[var(--10x-motion-ease-standard)]',
                                  isCollapsed
                                    ? 'max-w-0 -translate-x-2 opacity-0'
                                    : 'max-w-[9rem] translate-x-0 opacity-100'
                                )}
                              >
                                {item.name}
                              </span>
                              <ChevronDown
                                className={cn(
                                  'shell-action h-4 w-4 shrink-0 transition-[opacity,transform] duration-[var(--10x-motion-base)] ease-[var(--10x-motion-ease-standard)]',
                                  showExpanded && 'rotate-180',
                                  isCollapsed && 'pointer-events-none opacity-0'
                                )}
                              />
                            </button>
                            <div
                              className={cn(
                                'overflow-hidden transition-[max-height,opacity,transform,margin] duration-[var(--10x-motion-slow)] ease-[var(--10x-motion-ease-standard)]',
                                !isCollapsed && showExpanded
                                  ? 'mt-2 max-h-48 translate-y-0 opacity-100'
                                  : 'mt-0 max-h-0 -translate-y-1 opacity-0'
                              )}
                            >
                              <ul className="bg-primary/5 space-y-1 rounded-2xl border p-2">
                                {item.children!.map((child) => {
                                  const isChildActive = isNavigationChildActive(
                                    child,
                                    pathname,
                                    item.children!
                                  );

                                  return (
                                    <li key={child.href}>
                                      <Link
                                        href={child.href}
                                        onClick={onClose}
                                        className={cn(
                                          'shell-action shell-nav-item flex items-center gap-2 rounded-xl px-3 py-2',
                                          isChildActive
                                            ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium'
                                            : 'text-sidebar-foreground/68 hover:bg-primary/6 hover:text-sidebar-foreground'
                                        )}
                                      >
                                        <Receipt className="h-3.5 w-3.5 shrink-0 opacity-70" />
                                        <span>{child.name}</span>
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          </>
                        ) : (
                          <Link
                            href={item.href!}
                            onClick={onClose}
                            className={cn(
                              'shell-action shell-nav-item group flex items-center gap-3 rounded-2xl px-3 py-2.5 font-medium active:scale-[0.99]',
                              isActive
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-[var(--10x-elev-shell-1)]'
                                : 'text-sidebar-foreground/72 hover:bg-primary/5 hover:text-sidebar-foreground',
                              isCollapsed && 'justify-center px-2.5'
                            )}
                            title={isCollapsed ? item.name : undefined}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span
                              className={cn(
                                'min-w-0 flex-1 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-[var(--10x-motion-base)] ease-[var(--10x-motion-ease-standard)]',
                                isCollapsed
                                  ? 'max-w-0 -translate-x-2 opacity-0'
                                  : 'max-w-[9rem] translate-x-0 opacity-100'
                              )}
                            >
                              {item.name}
                            </span>
                            <ArrowUpRight
                              className={cn(
                                'h-3.5 w-3.5 shrink-0 transition-[opacity,transform] duration-[var(--10x-motion-base)] ease-[var(--10x-motion-ease-standard)]',
                                isActive && !isCollapsed
                                  ? 'translate-x-0 opacity-80'
                                  : 'pointer-events-none translate-x-1 opacity-0'
                              )}
                            />
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
          <div
            className={cn(
              'bg-primary/5 overflow-hidden rounded-2xl border transition-[padding,opacity,max-height] duration-[var(--10x-motion-base)] ease-[var(--10x-motion-ease-standard)]',
              isCollapsed ? 'max-h-8 px-2 py-1.5 opacity-80' : 'max-h-20 px-3 py-3 opacity-100'
            )}
          >
            {!isCollapsed ? (
              <>
                <p className="text-sidebar-foreground/80 truncate text-sm font-semibold">
                  Dominion Desk
                </p>
                <p className="text-sidebar-foreground/45 text-[11px]">v0.2.0 landlord workspace</p>
              </>
            ) : (
              <div className="text-sidebar-foreground/45 text-center text-[11px]">v0.2.0</div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
