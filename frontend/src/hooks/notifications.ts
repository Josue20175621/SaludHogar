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
    // Refetch every minute to keep the list fresh
    // This is terrible
    refetchInterval: 1000 * 60,
  });
};

const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  await api.post(`/notifications/${notificationId}/mark-read`);
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      // When a notification is marked as read, invalidate the main list
      // to update the UI (e.g., remove the "unread" indicator).
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};