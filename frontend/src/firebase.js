import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAZXd396f67GSBrqvhXtCO-cxLAl_Igveo",
  authDomain: "muna-3aa9b.firebaseapp.com",
  projectId: "muna-3aa9b",
  storageBucket: "muna-3aa9b.firebasestorage.app",
  messagingSenderId: "333375340687",
  appId: "1:333375340687:web:0e0f3c7965f17cdd4cb0fa",
  measurementId: "G-SV2CFSFNCC"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// Request Permission and Get Token
export const requestFirebaseNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: "BBnHrHqSkDnBw35QcLtBi5XFD3vLwu5C9-bonVmtVzqDAeHDSkCaRw6-J0JRqPJ1e3uI5-KDZkU-8KdOT5u7bUQ"
      });
      if (token) {
        console.log("FCM Token:", token);
        return token;
      } else {
        console.log("No registration token available. Request permission to generate one.");
      }
    } else {
      console.log("Notification permission not granted.");
    }
  } catch (error) {
    console.error("An error occurred while retrieving token. ", error);
  }
  return null;
};

export const onMessageListener = (callback) => {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
