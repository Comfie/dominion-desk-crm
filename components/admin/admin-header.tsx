'use client';

import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Menu, LogOut, User } from 'lucide-react';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="shell-surface shell-header-bar sticky top-0 z-30 flex items-center justify-between border-b px-4 backdrop-blur-xl md:px-6">
      <div className="flex min-w-0 items-center gap-3 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="shell-action admin-subtle rounded-xl hover:text-white lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div className="min-w-0">
          <p className="shell-label hidden sm:block">Operations Console</p>
          <h1 className="shell-section-title truncate font-semibold text-white">
            Super Admin Portal
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shell-action admin-subtle relative rounded-2xl border border-transparent hover:border-white/15 hover:bg-white/5 hover:text-white"
            >
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="admin-dialog w-60 rounded-2xl">
            <DropdownMenuLabel>
              <div>
                <p className="font-medium text-white">{session?.user?.name}</p>
                <p className="text-xs text-white/55">{session?.user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
