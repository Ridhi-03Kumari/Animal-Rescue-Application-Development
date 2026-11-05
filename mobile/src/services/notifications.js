import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

// Configure foreground presentation behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register device for push notifications (rescuers only)
 */
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    return null;
  }

  let token = null;

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('emergency-rescues', {
        name: 'Emergency Animal Rescues',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#B3261E',
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[PUSH] Notification permissions not granted');
      return null;
    }

    // Try native device push token first
    try {
      const deviceTokenData = await Notifications.getDevicePushTokenAsync();
      token = deviceTokenData.data;
    } catch (e) {
      // In Expo Go without standalone build, fallback to expo push token
      try {
        const expoTokenData = await Notifications.getExpoPushTokenAsync();
        token = expoTokenData.data;
      } catch (err2) {
        console.log('[PUSH] Token retrieval not supported in current simulator/environment:', err2.message);
      }
    }

    if (token) {
      const lastRegistered = await AsyncStorage.getItem('last_registered_push_token');
      if (lastRegistered !== token) {
        await api.registerDeviceToken(token);
        await AsyncStorage.setItem('last_registered_push_token', token);
        console.log('[PUSH] Push token successfully registered with backend');
      }
    }
  } catch (err) {
    console.log('[PUSH] Error in registerForPushNotificationsAsync:', err.message);
  }

  return token;
}

/**
 * Hook up listeners for incoming notifications and user taps
 * @param {Object} navigationRef - React Navigation ref
 * @returns {Function} cleanup function
 */
export function setupNotificationListeners(navigationRef) {
  if (Platform.OS === 'web') return () => {};

  // 1. Foreground notification received listener
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[PUSH FOREGROUND] Received notification:', notification.request.content.title);
  });

  // 2. User tapped notification listener (background & open app)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response?.notification?.request?.content?.data;
    handleNotificationData(data, navigationRef);
  });

  // 3. Cold start: check if app was opened by tapping a notification
  Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response) {
      const data = response?.notification?.request?.content?.data;
      handleNotificationData(data, navigationRef);
    }
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

function handleNotificationData(data, navigationRef) {
  if (!data) return;

  if (data.type === 'RESCUE_REQUEST' && data.caseId) {
    console.log(`[PUSH NAVIGATE] Opening rescue request for case: ${data.caseId}`);
    if (navigationRef && navigationRef.isReady && navigationRef.isReady()) {
      navigationRef.navigate('RescueRequest', { caseId: data.caseId });
    }
  }
}

