import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from '../navigation/RootNavigator';
import { useTheme } from '../core/dopebase';
import { navigationRef } from '../core/navigation/RootNavigation';
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

  usePushListeners((type, data) => {
    handlePushNavigation(type, data);
  });

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
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