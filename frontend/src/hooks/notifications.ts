import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/axios';
import type { Notification } from '../types/family';

const fetchNotifications = async (): Promise<Notification[]> => {
  const { data } = await api.get('/notifications');
  return data;
};

export const useNotifications = () => {
  return useQuery<Notification[], Error>({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 1000 * 60, // Refetch every minute to keep the list... 🤢 fresh
  });
};

const fetchUnreadCount = async (): Promise<number> => {
  const { data } = await api.get('/notifications/unread-count');
  return data.unread_count;
};

export const useUnreadCount = () => {
  return useQuery<number, Error>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadCount,
    refetchInterval: 1000 * 30, // Refetch every 30 seconds for the 🤮
  });
};

const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  await api.post(`/notifications/${notificationId}/mark-read`);
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  // Optimistically update the cache: pretend notifications are read immediately for instant UI feedback.
  // If the mutation fails, restore the previous cached data.
  return useMutation({
    mutationFn: markNotificationAsRead,
    onMutate: async (notificationId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);

      // Optimistically update
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(['notifications'], 
          previousNotifications.map(n => 
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        );
      }

      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      // Rollback
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.post('/notifications/mark-all-read');
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);

      // Optimistically mark all as read
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(['notifications'], 
          previousNotifications.map(n => ({ ...n, is_read: true }))
        );
      }

      return { previousNotifications };
    },
    onError: (err, variables, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

const deleteNotification = async (notificationId: number): Promise<void> => {
  await api.delete(`/notifications/${notificationId}`);
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotification,
    onMutate: async (notificationId) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);

      // Optimistically remove from list
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(['notifications'], 
          previousNotifications.filter(n => n.id !== notificationId)
        );
      }

      return { previousNotifications };
    },
    onError: (err, notificationId, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

const bulkDeleteNotifications = async (notificationIds: number[]): Promise<void> => {
  await api.post('/notifications/bulk-delete', { notification_ids: notificationIds });
};

export const useBulkDeleteNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkDeleteNotifications,
    onMutate: async (notificationIds) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);

      // Optimistically remove from list
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(['notifications'], 
          previousNotifications.filter(n => !notificationIds.includes(n.id))
        );
      }

      return { previousNotifications };
    },
    onError: (err, notificationIds, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};

const bulkMarkAsRead = async (notificationIds: number[]): Promise<void> => {
  await api.post('/notifications/bulk-mark-read', { notification_ids: notificationIds });
};

export const useBulkMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkMarkAsRead,
    onMutate: async (notificationIds) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);

      // Optimistically mark as read
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(['notifications'], 
          previousNotifications.map(n => 
            notificationIds.includes(n.id) ? { ...n, is_read: true } : n
          )
        );
      }

      return { previousNotifications };
    },
    onError: (err, notificationIds, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
};