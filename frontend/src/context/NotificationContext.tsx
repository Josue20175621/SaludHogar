import type {ReactNode} from 'react'
import { createContext, useState, useContext, useEffect } from 'react';
import Notification from '../components/Notification';

type NotificationType = 'success' | 'error';

interface NotificationState {
  message: string;
  type: NotificationType;
  
  // We add a key to ensure React re-creates the component on new notifications
  key: number; 
}

interface NotificationContextProps {
  notify: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Effect to handle auto-dismissal
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        // This will trigger the fade-out animation in the Notification component
        closeNotification();
      }, 5000); // Auto-dismiss after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [notification]); // Re-run effect when notification changes

  const notify = (message: string, type: NotificationType) => {
    setNotification({ message, type, key: Date.now() });
  };

  // This function is now passed to the component to be called after the animation
  const closeNotification = () => {
    setNotification(null);
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {notification && (
        <Notification
          key={notification.key} // The key is important!
          message={notification.message}
          type={notification.type}
          onClose={closeNotification}
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