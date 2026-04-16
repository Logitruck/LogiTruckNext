import { useEffect } from 'react';
import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';

type PushData = Record<string, string>;
type HandleNavigation = (type: string, data: PushData) => void;

export const usePushListeners = (handleNavigation: HandleNavigation) => {
  useEffect(() => {
    const unsubscribeForeground = messaging().onMessage(
      async remoteMessage => {
        console.log('📩 Foreground push:', remoteMessage);

        const data = (remoteMessage.data || {}) as PushData;
        const type = data.type || '';

        const title =
          remoteMessage.notification?.title || 'Nueva notificación';
        const body = remoteMessage.notification?.body || '';

        Alert.alert(title, body, [
          {
            text: 'Cerrar',
            style: 'cancel',
          },
          {
            text: 'Abrir',
            onPress: () => handleNavigation(type, data),
          },
        ]);
      },
    );

    const unsubscribeOpened = messaging().onNotificationOpenedApp(
      remoteMessage => {
        if (!remoteMessage?.data) {
          return;
        }

        const data = remoteMessage.data as PushData;
        console.log('📲 Push opened from background:', data);
        handleNavigation(data.type || '', data);
      },
    );

    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (!remoteMessage?.data) {
          return;
        }

        const data = remoteMessage.data as PushData;
        console.log('🚀 Push opened from quit state:', data);
        handleNavigation(data.type || '', data);
      });

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
    };
  }, [handleNavigation]);
};