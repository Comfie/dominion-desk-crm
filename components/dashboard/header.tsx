'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Bell, Search, LogOut, Settings, HelpCircle, User, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/hooks';
import { useNotifications } from '@/hooks/use-notifications';
import { getInitials } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications({
    limit: 5,
    refetchInterval: 30000,
  });

  const handleNotificationClick = (notification: {
    id: string;
    linkUrl: string | null;
    isRead: boolean;
  }) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.linkUrl) {
      router.push(notification.linkUrl);
    }
  };

  return (
    <header className="bg-gradient-header sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/10 px-4 shadow-md backdrop-blur-sm md:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="text-white hover:bg-white/10 lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      {/* Search */}
      <div className="relative flex-1 md:max-w-md">
        <Search className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-400" />
        <Input
          type="search"
          placeholder="Search properties, bookings, tenants..."
          className="w-full border-white/20 bg-white/10 pl-8 text-white placeholder:text-gray-300 focus-visible:ring-white/30"
        />
      </div>

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
              {/* Notification badge */}
              {unreadCount > 0 && (
                <span className="bg-accent absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-medium text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80" align="end" forceMount>
            <div className="flex items-center justify-between px-2">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs"
                  onClick={() => markAllAsRead()}
                >
                  <Check className="mr-1 h-3 w-3" />
                  Mark all read
                </Button>
              )}
            </div>
            <DropdownMenuSeparator />
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex cursor-pointer flex-col items-start gap-1 p-3 ${
                      !notification.isRead ? 'bg-muted/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-muted-foreground text-xs">{notification.message}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </DropdownMenuItem>
                ))
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="justify-center">
              <Link href="/notifications" className="w-full text-center text-sm">
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Help */}
        <Button
          variant="ghost"
          size="icon"
          className="hidden text-white hover:bg-white/10 md:inline-flex"
          asChild
        >
          <Link href="/docs">
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help & Documentation</span>
          </Link>
        </Button>

        {/* Theme toggle */}
        <div className="text-white [&_button]:text-white [&_button:hover]:bg-white/10">
          <ThemeToggle />
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-white/10">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
                <AvatarFallback className="bg-primary text-white">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm leading-none font-medium">{user?.name || 'User'}</p>
                <p className="text-muted-foreground text-xs leading-none">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
