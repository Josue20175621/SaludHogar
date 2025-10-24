import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { requestNotificationPermission } from '../firebase-config';
import { authApi } from '../api/axios';

const NotificationHandler = () => {
  const { user } = useAuth();

  useEffect(() => {
    const setupNotifications = async () => {
      const token = await requestNotificationPermission();
      
      if (token) {
        try {
          await authApi.post('/push/fcm-token', {
            token: token,
            user_id: user?.id
          });
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