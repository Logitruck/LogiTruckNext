import { useEffect, useRef } from 'react';
import messaging from '@react-native-firebase/messaging';
import { showInAppNotification } from './notificationService';
import { isSameActiveChat } from './notificationSession';

type PushData = Record<string, string>;
type HandleNavigation = (type: string, data: PushData) => void;

export const usePushListeners = (handleNavigation: HandleNavigation) => {
  const processedMessageIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const markAsProcessed = (messageId?: string | null) => {
      if (!messageId) {
        return false;
      }

      if (processedMessageIdsRef.current.has(messageId)) {
        return true;
      }

      processedMessageIdsRef.current.add(messageId);

      setTimeout(() => {
        processedMessageIdsRef.current.delete(messageId);
      }, 10000);

      return false;
    };

    const unsubscribeForeground = messaging().onMessage(async remoteMessage => {
      console.log('📩 Foreground push:', remoteMessage);

      if (markAsProcessed(remoteMessage.messageId)) {
        return;
      }

      const data = (remoteMessage.data || {}) as PushData;
      const type = data.type || '';

      const title =
        remoteMessage.notification?.title ||
        data.title ||
        'Nueva notificación';

      const body =
        remoteMessage.notification?.body ||
        data.body ||
        '';

      const shouldSuppressBanner =
        type === 'chat' && isSameActiveChat(data.channelID);

      if (shouldSuppressBanner) {
        console.log('🔕 Foreground banner suppressed: same active chat');
        return;
      }

      showInAppNotification({
        id: remoteMessage.messageId || `${Date.now()}`,
        type,
        title,
        body,
        data,
      });
    });

    const unsubscribeOpened = messaging().onNotificationOpenedApp(
      remoteMessage => {
        if (!remoteMessage?.data) {
          return;
        }

        if (markAsProcessed(remoteMessage.messageId)) {
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

        if (markAsProcessed(remoteMessage.messageId)) {
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