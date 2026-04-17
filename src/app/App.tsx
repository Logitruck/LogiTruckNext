import { useCallback, useEffect } from 'react';
import { LogBox } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  DopebaseProvider,
  TranslationProvider,
  ActionSheetProvider,
} from '../core/dopebase';
import configureStore from '../redux/store';
import AppContent from './AppContent';
import translations from '../translations';
import { ConfigProvider } from '../config';
import { AuthProvider } from '../core/onboarding/hooks/useAuth';
import { ProfileAuthProvider } from '../core/profile/hooks/useProfileAuth';
import { authManager } from '../core/onboarding/api';
import InAppNotificationProvider from '../core/notifications/InAppNotificationProvider';
import { handlePushNavigation } from '../core/notifications/handlePushNavigation';
import 'react-native-get-random-values';

const store = configureStore();

const App = () => {
  useEffect(() => {
    LogBox.ignoreAllLogs(true);
  }, []);

  const onOpenNotification = useCallback(
    (type: string, data: Record<string, string>) => {
      handlePushNavigation(type, data);
    },
    [],
  );

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <TranslationProvider translations={translations}>
          <DopebaseProvider>
            <ConfigProvider>
              <AuthProvider authManager={authManager}>
                <ProfileAuthProvider authManager={authManager}>
                  <ActionSheetProvider>
                    <InAppNotificationProvider
                      onOpenNotification={onOpenNotification}
                    >
                      <AppContent />
                    </InAppNotificationProvider>
                  </ActionSheetProvider>
                </ProfileAuthProvider>
              </AuthProvider>
            </ConfigProvider>
          </DopebaseProvider>
        </TranslationProvider>
      </SafeAreaProvider>
    </Provider>
  );
};

export default App;