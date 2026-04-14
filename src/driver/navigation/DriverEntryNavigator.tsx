import React from 'react';
import { View, ActivityIndicator } from 'react-native';

import { useTheme } from '../../core/dopebase';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

import useActiveJob from '../hooks/useActiveJob';
import DriverTabs from './DriverTabs';
import DriverActiveJobStack from './DriverActiveJobStack';

const DriverEntryNavigator = () => {
  const { theme, appearance } = useTheme();
  const currentUser = useCurrentUser();
  const { activeJob, loading } = useActiveJob(currentUser?.id);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors[appearance].primaryBackground,
        }}
      >
        <ActivityIndicator
          size="large"
          color={theme.colors[appearance].primaryForeground}
        />
      </View>
    );
  }

  if (activeJob) {
    return <DriverActiveJobStack />;
  }

  return <DriverTabs />;
};

export default DriverEntryNavigator;