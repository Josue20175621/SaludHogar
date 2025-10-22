import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestNotificationPermission } from '../firebase-config';

const NotificationHandler = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const setupNotifications = async () => {
      const token = await requestNotificationPermission();
      
      if (token) {
        try {
          console.log("API CHECK missing")
          console.log('FCM token sent to backend successfully');
        } catch (error) {
          console.error('Error sending token to backend:', error);
        }
      }
    };

    setupNotifications();
  }, [user?.id]);

  return null;
};

export default NotificationHandler;