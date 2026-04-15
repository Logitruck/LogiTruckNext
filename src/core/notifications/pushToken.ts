import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native'; // Importante para iOS
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const requestPushPermission = async (): Promise<boolean> => {
  // En Android 13+ esto dispara el diálogo de permiso. 
  // En iOS es obligatorio para recibir notificaciones con alerta/sonido.
  const authStatus = await messaging().requestPermission();

  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
};

export const registerDeviceForPush = async (): Promise<void> => {
  try {
    // Solo iOS requiere este registro explícito antes de pedir el token
    if (Platform.OS === 'ios') {
      // Si el dispositivo ya está registrado, no hace nada (es seguro llamarlo siempre)
      await messaging().registerDeviceForRemoteMessages();
    }
  } catch (error) {
    console.log('🔥 Error registering device for remote messages:', error);
    throw error;
  }
};

export const getFCMToken = async (): Promise<string | null> => {
  try {
    await registerDeviceForPush();
    
    // Si estás en un simulador de iOS viejo, getToken podría fallar o tardar.
    const token = await messaging().getToken();
    return token || null;
  } catch (error) {
    console.log('🔥 Error getting FCM token:', error);
    return null;
  }
};

export const savePushTokenForUser = async (
  userID: string,
  token: string,
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userID);
    await updateDoc(userRef, {
      pushToken: token,
      fcmToken: token,
      // Guardar el sistema operativo ayuda mucho para debugging de notificaciones
      deviceOS: Platform.OS, 
      badgeCount: 0,
    });
  } catch (error) {
    console.log('🔥 Error saving push token to Firestore:', error);
  }
};

export const fetchAndStorePushTokenIfPossible = async (
  user: { id?: string } | null | undefined,
): Promise<string | null> => {
  try {
    if (!user?.id) return null;

    const granted = await requestPushPermission();
    if (!granted) {
      console.log('🔕 Push permission denied');
      return null;
    }

    const token = await getFCMToken();
    if (token) {
      await savePushTokenForUser(user.id, token);
      console.log('✅ FCM token stored:', token);
    }

    return token;
  } catch (error) {
    console.log('🔥 Error fetching/storing push token:', error);
    return null;
  }
};

export const subscribeToPushTokenRefresh = (
  userID: string,
): (() => void) => {
  // Este listener es vital para cuando el token expira (raro, pero pasa)
  return messaging().onTokenRefresh(async token => {
    try {
      if (userID) {
        await savePushTokenForUser(userID, token);
        console.log('🔄 FCM token refreshed:', token);
      }
    } catch (error) {
      console.log('🔥 Error refreshing push token:', error);
    }
  });
};