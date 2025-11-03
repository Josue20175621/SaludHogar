import React from 'react';
import { Bell, BellRing } from 'lucide-react';
import { useUnreadCount } from '../hooks/notifications';

export const NotificationBell: React.FC<{ className?: string }> = ({ className }) => {
  const { data } = useUnreadCount();
  const unreadCount = data || 0;

  const Icon = unreadCount > 0 ? BellRing : Bell;

  return (
    <div className="relative inline-flex items-center">
      <Icon className={className} />

      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white text-[9px] font-bold shadow-sm">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </div>
  );
};
