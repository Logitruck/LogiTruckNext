import { useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from '../navigation/RootNavigator';
import { useTheme } from '../core/dopebase';
import {
  navigationRef,
  flushPendingGlobalChatNavigation,
} from '../core/navigation/RootNavigation';
import { usePushListeners } from '../core/notifications/usePushListeners';
import { handlePushNavigation } from '../core/notifications/handlePushNavigation';

const linking = {
  prefixes: ['https://mychat.com', 'mychat://', 'http://localhost:19006'],
  config: {
    screens: {},
  },
};

const AppContainer = () => {
  const { appearance, theme } = useTheme();

  const onHandlePushNavigation = useCallback(
    (type: string, data: Record<string, string>) => {
      handlePushNavigation(type, data);
    },
    [],
  );

  usePushListeners(onHandlePushNavigation);

  const handleNavigationReady = useCallback(() => {
    flushPendingGlobalChatNavigation();
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={handleNavigationReady}
      theme={
        appearance === 'dark'
          ? theme.navContainerTheme.dark
          : theme.navContainerTheme.light
      }
    >
      <RootNavigator />
    </NavigationContainer>
  );
};

export default AppContainer;