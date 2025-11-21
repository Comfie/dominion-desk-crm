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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 lg:pb-6"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav onMoreClick={() => setSidebarOpen(true)} />
    </div>
  );
}
