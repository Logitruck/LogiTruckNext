import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import Geocoder from 'react-native-geocoding';
import { useConfig } from '../config';
import { ProfileConfigProvider } from '../core/profile/hooks/useProfileConfig';
import { OnboardingConfigProvider } from '../core/onboarding/hooks/useOnboardingConfig';
import { VendorConfigProvider } from '../core/vendor/hooks/useVendorConfig';
import AppContainer from '../screens/AppContainer';

WebBrowser.maybeCompleteAuthSession();

const MainNavigator = AppContainer;

const AppContent = () => {
  const config = useConfig();

  useEffect(() => {
    if (config?.googleAPIKey) {
      Geocoder.init(config.googleAPIKey);
    }
  }, [config?.googleAPIKey]);

  return (
    <VendorConfigProvider config={config}>
      <ProfileConfigProvider config={config}>
        <OnboardingConfigProvider config={config}>
          <StatusBar style="auto" />
          <MainNavigator />
        </OnboardingConfigProvider>
      </ProfileConfigProvider>
    </VendorConfigProvider>
  );
};

export default AppContent;