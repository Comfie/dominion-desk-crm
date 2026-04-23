'use client';

import { useState } from 'react';

import { Sidebar } from './sidebar';
import { Header } from './header';
import { MobileNav } from './mobile-nav';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="bg-background relative flex h-dvh min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.08),transparent_72%)]"
        aria-hidden="true"
      />

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={isCollapsed}
        toggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main content area */}
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main id="main-content" className="shell-main flex-1 overflow-y-auto" tabIndex={-1}>
          <div className="mx-auto flex w-full max-w-[var(--10x-bp-shell-content-max)] flex-col gap-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav onMoreClick={() => setSidebarOpen(true)} />
    </div>
  );
}
