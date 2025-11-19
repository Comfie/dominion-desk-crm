'use client';

import { Menu, Bell, Search, User, LogOut, Settings, HelpCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-background sticky top-0 z-30 flex h-16 items-center gap-4 border-b px-4 md:px-6">
      {/* Mobile menu button */}
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Search */}
      <div className="relative flex-1 md:max-w-md">
        <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
        <Input
          type="search"
          placeholder="Search properties, bookings, tenants..."
          className="w-full pl-8"
        />
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
          {/* Notification badge */}
          <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium">
            3
          </span>
        </Button>

        {/* Help */}
        <Button variant="ghost" size="icon" className="hidden md:inline-flex">
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Help</span>
        </Button>

        {/* User menu - simplified for now */}
        <div className="relative">
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src="/avatars/user.png" alt="User" />
              <AvatarFallback>DU</AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </div>
    </header>
  );
}
