import type { ReactNode } from 'react';
import { createContext, useState, useContext, useEffect } from 'react';
import Notification from '../components/Notification';

type NotificationType = 'success' | 'error';

interface NotificationState {
  message: string;
  type: NotificationType;
  isClosing: boolean;
}

interface NotificationContextProps {
  notify: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const notify = (message: string, type: NotificationType) => {
    setNotification({ message, type, isClosing: false });
  };

  useEffect(() => {
    if (notification && !notification.isClosing) {
      const timer = setTimeout(() => {
        startClose();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const startClose = () => {
    setNotification(prev =>
      prev ? { ...prev, isClosing: true } : null
    );
  };

  const finishClose = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          closing={notification.isClosing}
          onClose={finishClose}
          onRequestClose={startClose}
        />
      )}
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifier() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifier must be used within a NotificationProvider');
  }
  return context;
}