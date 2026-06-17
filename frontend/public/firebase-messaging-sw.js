importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
  apiKey: "AIzaSyAZXd396f67GSBrqvhXtCO-cxLAl_Igveo",
  authDomain: "muna-3aa9b.firebaseapp.com",
  projectId: "muna-3aa9b",
  storageBucket: "muna-3aa9b.firebasestorage.app",
  messagingSenderId: "333375340687",
  appId: "1:333375340687:web:0e0f3c7965f17cdd4cb0fa",
  measurementId: "G-SV2CFSFNCC"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
