import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';

type PushData = Record<string, string>;
type HandleNavigation = (type: string, data: PushData) => void;

export const usePushListeners = (handleNavigation: HandleNavigation) => {
  useEffect(() => {
    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('📩 Foreground push:', remoteMessage);
    });

    const unsubscribeOpened = messaging().onNotificationOpenedApp(
      remoteMessage => {
        if (!remoteMessage?.data) {
          return;
        }

        const data = remoteMessage.data as PushData;
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
        handleNavigation(data.type || '', data);
      });

    return () => {
      unsubscribeForeground();
      unsubscribeOpened();
    };
  }, [handleNavigation]);
};