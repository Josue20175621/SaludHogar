import React from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, BellRing } from 'lucide-react';
import { useUnreadCount } from '../hooks/notifications';

export const NotificationBell: React.FC = () => {
  const { data: data } = useUnreadCount();
  const location = useLocation();

  const unreadCount = data || 0;
  const isActive = location.pathname.startsWith('/app/notifications');

  return (
    <div className="relative inline-flex items-center">
      {unreadCount > 0 ? (
        <BellRing className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-cyan-600' : 'text-gray-400'}`} />
      ) : (
        <Bell className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-cyan-600' : 'text-gray-400'}`} />
      )}
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white text-[9px] font-bold shadow-sm">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
};