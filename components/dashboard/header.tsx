'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, Bell, LogOut, Settings, HelpCircle, User, Check, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
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
import { cn, getInitials } from '@/lib/utils';

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
    <header className="shell-surface shell-header-bar sticky top-0 z-30 flex items-center gap-3 border-b px-4 backdrop-blur-xl md:px-6">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="shell-action text-muted-foreground hover:text-foreground rounded-xl lg:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <div className="hidden min-w-0 items-center gap-3 lg:flex">
        <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-2xl">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="shell-label">Landlord Workspace</p>
          <p className="text-foreground truncate text-sm font-semibold">Dominion Desk operations</p>
        </div>
      </div>

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shell-action text-muted-foreground hover:text-foreground relative rounded-xl"
            >
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
              {/* Notification badge */}
              {unreadCount > 0 && (
                <span className="bg-destructive text-destructive-foreground ring-background absolute -top-1 -right-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold ring-2">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl"
            align="end"
            forceMount
          >
            <div className="flex items-center justify-between px-2">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto rounded-lg px-2 py-1 text-xs"
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
                    className={cn(
                      'shell-action flex cursor-pointer flex-col items-start gap-1 rounded-xl p-3',
                      !notification.isRead && 'bg-muted/50'
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <p className="text-sm font-medium">{notification.title}</p>
                    <p className="text-muted-foreground text-xs">{notification.message}</p>
                    <p className="text-muted-foreground text-xs" suppressHydrationWarning>
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
          className="shell-action text-muted-foreground hover:text-foreground hidden rounded-xl md:inline-flex"
          asChild
        >
          <Link href="/docs">
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Help & Documentation</span>
          </Link>
        </Button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="shell-action hover:border-border/80 relative h-10 w-10 rounded-2xl border border-transparent"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src={user?.image || ''} alt={user?.name || 'User'} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 rounded-2xl" align="end" forceMount>
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
