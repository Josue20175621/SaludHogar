importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDRG14sO4lJJqJxHgeOVWLqC-AGfKypTi8",
  authDomain: "saludhogar-89e02.firebaseapp.com",
  projectId: "saludhogar-89e02",
  storageBucket: "saludhogar-89e02.firebasestorage.app",
  messagingSenderId: "348100959195",
  appId: "1:348100959195:web:62eb4a933298ad813b25fe"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});