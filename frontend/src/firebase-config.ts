import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, type Messaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDRG14sO4lJJqJxHgeOVWLqC-AGfKypTi8",
  authDomain: "saludhogar-89e02.firebaseapp.com",
  projectId: "saludhogar-89e02",
  storageBucket: "saludhogar-89e02.firebasestorage.app",
  messagingSenderId: "348100959195",
  appId: "1:348100959195:web:62eb4a933298ad813b25fe"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging: Messaging = getMessaging(app);

export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'BFjiuWo8fX4gW03J9OssZ7ciMDIMQKX6gbQP80K5py9UDIF6pViGCDWLBiBktD977ZiKt8Ziv6rAYnucOe35gII'
      });
      
      if (token) {
        console.log('FCM Token:', token);
        return token;
      } else {
        console.log('No registration token available.');
        return null;
      }
    } else {
      console.log('Notification permission denied.');
      return null;
    }
  } catch (error) {
    console.error('Error getting notification permission:', error);
    return null;
  }
};