import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useNotifications, useMarkNotificationAsRead } from '../hooks/notifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && <NotificationList onClose={() => setIsOpen(false)} />}
    </div>
  );
};

interface NotificationListProps {
  onClose: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const { data: notifications, isLoading } = useNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();

  const handleNotificationClick = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
    onClose(); // Close the dropdown on click
  };
  
  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 text-gray-800">
      <div className="p-4 font-bold border-b">Notificaciones</div>
      <div className="max-h-96 overflow-y-auto">
        {isLoading && <p className="p-4 text-sm text-gray-500">Cargando...</p>}
        
        {notifications && notifications.length > 0 ? (
          <ul>
            {notifications.map(notification => (
              <li key={notification.id} className={`border-b last:border-b-0 ${!notification.is_read ? 'bg-cyan-50' : 'bg-white'}`}>
                <div 
                  onClick={() => handleNotificationClick(notification.id)}
                  className="block p-4 hover:bg-gray-100 cursor-pointer"
                >
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: es })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-sm text-gray-500">No tienes notificaciones nuevas.</p>
        )}
      </div>
    </div>
  );
};