'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Calendar,
  DollarSign,
  MessageSquare,
  Wrench,
  CheckSquare,
  Star,
  Info,
  Loader2,
} from 'lucide-react';

import { PageHeader } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotifications } from '@/hooks/use-notifications';

const notificationTypeIcons: Record<string, typeof Bell> = {
  BOOKING: Calendar,
  INQUIRY: MessageSquare,
  PAYMENT: DollarSign,
  MAINTENANCE: Wrench,
  TASK: CheckSquare,
  REVIEW: Star,
  SYSTEM: Info,
  OTHER: Bell,
};

const notificationTypeColors: Record<string, string> = {
  BOOKING: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  INQUIRY: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  PAYMENT: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  MAINTENANCE: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  TASK: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  REVIEW: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  SYSTEM: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const {
    notifications,
    unreadCount,
    pagination,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isMarkingAllAsRead,
  } = useNotifications({
    page,
    limit: 20,
    unreadOnly: filter === 'unread',
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
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
      >
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
            </SelectContent>
          </Select>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={() => markAllAsRead()} disabled={isMarkingAllAsRead}>
              {isMarkingAllAsRead ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="mr-2 h-4 w-4" />
              )}
              Mark all as read
            </Button>
          )}
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>
            Click on a notification to view details and mark it as read
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">No notifications</h3>
              <p className="text-muted-foreground">
                {filter === 'unread'
                  ? "You're all caught up!"
                  : "You don't have any notifications yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => {
                const Icon = notificationTypeIcons[notification.notificationType] || Bell;
                const colorClass =
                  notificationTypeColors[notification.notificationType] ||
                  notificationTypeColors.OTHER;

                return (
                  <div
                    key={notification.id}
                    className={`hover:bg-muted/50 flex cursor-pointer items-start gap-4 p-4 transition-colors ${
                      !notification.isRead ? 'bg-muted/30' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={`rounded-full p-2 ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-muted-foreground mt-1 text-sm">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <Badge variant="secondary" className="shrink-0">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-2 text-xs">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Mark as read</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-muted-foreground text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
