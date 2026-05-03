import messaging from '@react-native-firebase/messaging';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const requestPushPermission = async (): Promise<boolean> => {
  const authStatus = await messaging().requestPermission();

  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
};

export const fetchAndStorePushTokenIfPossible = async (
  user: { id?: string; fcmToken?: string; pushToken?: string } | null | undefined,
): Promise<string | null> => {
  try {
    if (!user?.id) {
      return null;
    }

    // await messaging().registerDeviceForRemoteMessages();

    const granted = await requestPushPermission();
    if (!granted) {
      console.log('🔕 Push permission denied');
      return null;
    }

    const token = await messaging().getToken();
    if (!token) {
      return null;
    }

    if (user.fcmToken === token || user.pushToken === token) {
      console.log('ℹ️ FCM token unchanged');
      return token;
    }

    await updateDoc(doc(db, 'users', user.id), {
      fcmToken: token,
      pushToken: token,
      badgeCount: 0,
    });

    console.log('✅ FCM token stored:', token);
    return token;
  } catch (error) {
    console.log('🔥 Error fetching/storing push token:', error);
    return null;
  }
};

export const subscribeToPushTokenRefresh = (
  userID: string,
): (() => void) => {
  return messaging().onTokenRefresh(async token => {
    try {
      await updateDoc(doc(db, 'users', userID), {
        fcmToken: token,
        pushToken: token,
      });

      console.log('🔄 FCM token refreshed:', token);
    } catch (error) {
      console.log('🔥 Error refreshing push token:', error);
    }
  });
};