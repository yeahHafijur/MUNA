import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Registers the device for push notifications and returns the Native FCM Device Token.
 * This token can be saved in the backend to send pushes via Firebase Admin.
 * 
 * NOTE: The notification handler is configured in _layout.tsx — do not duplicate here.
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#fbbf24',
    });
  }

  if (!Device.isDevice) {
    return undefined;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return undefined;
  }

  try {
    const tokenResponse = await Notifications.getDevicePushTokenAsync();
    return tokenResponse.data;
  } catch {
    return undefined;
  }
}

