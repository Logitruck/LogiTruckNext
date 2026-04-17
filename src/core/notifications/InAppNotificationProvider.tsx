import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  InAppNotification,
  registerInAppNotificationHandler,
  unregisterInAppNotificationHandler,
} from './notificationService';

type Props = {
  children: React.ReactNode;
  onOpenNotification: (type: string, data: Record<string, string>) => void;
};

const AUTO_HIDE_MS = 3500;

const InAppNotificationProvider: React.FC<Props> = ({
  children,
  onOpenNotification,
}) => {
  const [notification, setNotification] = useState<InAppNotification | null>(null);
  const queueRef = useRef<InAppNotification[]>([]);
  const translateY = useRef(new Animated.Value(-140)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY]);

  const animateOut = useCallback((onFinished?: () => void) => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -140,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinished?.();
    });
  }, [opacity, translateY]);

  const showNextFromQueue = useCallback(() => {
    if (notification || queueRef.current.length === 0) {
      return;
    }

    const nextNotification = queueRef.current.shift() || null;
    if (!nextNotification) {
      return;
    }

    setNotification(nextNotification);
  }, [notification]);

  const dismissCurrent = useCallback((afterDismiss?: () => void) => {
    clearHideTimeout();

    animateOut(() => {
      setNotification(null);
      afterDismiss?.();
    });
  }, [animateOut, clearHideTimeout]);

  useEffect(() => {
    registerInAppNotificationHandler((nextNotification) => {
      const alreadyQueued = queueRef.current.some(
        item => item.id === nextNotification.id,
      );

      if (notification?.id === nextNotification.id || alreadyQueued) {
        return;
      }

      if (!notification) {
        setNotification(nextNotification);
        return;
      }

      queueRef.current.push(nextNotification);
    });

    return () => {
      unregisterInAppNotificationHandler();
      clearHideTimeout();
    };
  }, [clearHideTimeout, notification]);

  useEffect(() => {
    if (!notification) {
      translateY.setValue(-140);
      opacity.setValue(0);

      const timer = setTimeout(() => {
        showNextFromQueue();
      }, 80);

      return () => clearTimeout(timer);
    }

    animateIn();

    clearHideTimeout();
    hideTimeoutRef.current = setTimeout(() => {
      dismissCurrent();
    }, AUTO_HIDE_MS);

    return clearHideTimeout;
  }, [
    animateIn,
    clearHideTimeout,
    dismissCurrent,
    notification,
    opacity,
    showNextFromQueue,
    translateY,
  ]);

  const handlePress = useCallback(() => {
    if (!notification) {
      return;
    }

    const { type, data } = notification;

    dismissCurrent(() => {
      onOpenNotification(type, data);
    });
  }, [dismissCurrent, notification, onOpenNotification]);

  const handleClose = useCallback(() => {
    dismissCurrent();
  }, [dismissCurrent]);

  const banner = useMemo(() => {
    if (!notification) {
      return null;
    }

    return (
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.bannerWrapper,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <SafeAreaView pointerEvents="box-none">
          <Pressable onPress={handlePress} style={styles.banner}>
            <View style={styles.textContainer}>
              <Text numberOfLines={1} style={styles.title}>
                {notification.title}
              </Text>
              <Text numberOfLines={2} style={styles.body}>
                {notification.body}
              </Text>
            </View>

            <Pressable hitSlop={10} onPress={handleClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </Pressable>
        </SafeAreaView>
      </Animated.View>
    );
  }, [handleClose, handlePress, notification, opacity, translateY]);

  return (
    <View style={styles.container}>
      {children}
      {banner}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bannerWrapper: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    zIndex: 9999,
  },
  banner: {
    minHeight: 72,
    borderRadius: 18,
    backgroundColor: '#1D1F24',
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    elevation: 10,
  },
  textContainer: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  body: {
    color: '#D6D8DC',
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: '#BFC4CC',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default InAppNotificationProvider;