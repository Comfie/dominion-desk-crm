import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  notificationType: string;
  linkUrl: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function fetchNotifications(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}): Promise<NotificationsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.unreadOnly) searchParams.set('unreadOnly', 'true');

  const response = await fetch(`/api/notifications?${searchParams}`);
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  return response.json();
}

async function markAsRead(notificationId: string): Promise<Notification> {
  const response = await fetch(`/api/notifications/${notificationId}`, {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }
  return response.json();
}

async function markAllAsRead(): Promise<void> {
  const response = await fetch('/api/notifications/mark-all-read', {
    method: 'PATCH',
  });
  if (!response.ok) {
    throw new Error('Failed to mark all notifications as read');
  }
}

async function deleteNotification(notificationId: string): Promise<void> {
  const response = await fetch(`/api/notifications/${notificationId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete notification');
  }
}

export function useNotifications(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  refetchInterval?: number;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications', params],
    queryFn: () => fetchNotifications(params),
    refetchInterval: params?.refetchInterval ?? 30000, // Poll every 30 seconds by default
  });

  const markAsReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications: query.data?.notifications ?? [],
    unreadCount: query.data?.unreadCount ?? 0,
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
