import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '../../core/dopebase';

import DriverHomeStack from './DriverHomeStack';
import DriverInspectionsStack from './DriverInspectionsStack';
import DriverJobsStack from './DriverJobsStack';

const Tab = createBottomTabNavigator();

const DriverTabs = () => {
  const { theme, appearance } = useTheme();
  const colors = theme.colors[appearance];

  return (
    <Tab.Navigator
      initialRouteName="DriverHomeTab"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primaryForeground,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: {
          backgroundColor: colors.primaryBackground,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tab.Screen
        name="DriverHomeTab"
        component={DriverHomeStack}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="home-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="DriverInspectionsTab"
        component={DriverInspectionsStack}
        options={{
          title: 'Inspections',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="clipboard-check-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="DriverJobsTab"
        component={DriverJobsStack}
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="briefcase-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default DriverTabs;