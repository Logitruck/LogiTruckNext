import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme, useTranslations } from '../../core/dopebase';

import FinderHomeScreen from '../screens/Home/FinderHomeScreen/FinderHomeScreen';
import MyRequestsScreen from '../screens/search/bottomSheet/MyRequest/MyRequestsScreen';

const Stack = createNativeStackNavigator();

const HomeFinderNavigator = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: theme.colors[appearance].primaryText,
      }}
    >
      <Stack.Screen
        name="FinderHomeScreen"
        component={FinderHomeScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="MyRequests"
        component={MyRequestsScreen}
        options={{
          title: localized('My Requests'),
        }}
      />
    </Stack.Navigator>
  );
};

export { HomeFinderNavigator };