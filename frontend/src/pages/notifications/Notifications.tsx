import React, { useEffect, useState } from 'react';
import { Bell, Calendar, Pill, CircleAlert } from 'lucide-react';
import { useNotifications, useMarkAllNotificationsAsRead } from '../../hooks/notifications';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

const NotificationIcon: React.FC<{ type: string }> = ({ type }) => {
  switch (type) {
    case 'APPOINTMENT_REMINDER':
      return <Calendar className="w-5 h-5 text-green-500" />;
    case 'MEDICATION_REMINDER':
      return <Pill className="w-5 h-5 text-purple-500" />;
    default:
      return <CircleAlert className="w-5 h-5 text-gray-500" />;
  }
};

const NotificationsPage: React.FC = () => {
  const { data: notifications, isLoading } = useNotifications();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  // State to keep track of notifications that were unread on load
  const [newlyReadIds, setNewlyReadIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (notifications) {
      // Find unread notifications
      const unreadNotifications = notifications.filter(n => !n.is_read);

      if (unreadNotifications.length > 0) {
        // Store their IDs to trigger the flash animation
        const unreadIds = new Set(unreadNotifications.map(n => n.id));
        setNewlyReadIds(unreadIds);

        // Mark them all as read in the backend
        markAllAsReadMutation.mutate();
      }
    }
  }, [notifications, markAllAsReadMutation]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-6 rounded-lg border">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-8 h-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">
            Notificaciones
          </h1>
        </div>
      </div>

      {/* Notifications List */}
      {notifications && notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`
                bg-white rounded-lg border border-gray-200
                ${newlyReadIds.has(notification.id) ? 'flash-new' : ''}
              `}
            >
              <div className="p-5">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="p-2 flex-shrink-0 mt-1">
                    <NotificationIcon type={notification.type} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-relaxed mb-2">
                      {notification.message}
                    </p>

                    {/* Timestamp */}
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span>
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: es
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        {format(new Date(notification.created_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes notificaciones
            </h3>
            <p className="text-sm text-gray-500">
              Te avisaremos cuando haya algo nuevo.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;