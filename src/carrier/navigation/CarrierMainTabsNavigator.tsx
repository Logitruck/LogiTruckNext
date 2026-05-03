import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../core/dopebase';

import HomeDrawerNavigator from './HomeDrawerNavigator';
import InspectionDrawerNavigator from './InspectionDrawerNavigator';
import DealsDrawerNavigator from './DealsDrawerNavigator';
import CarrierProjectsDrawerNavigator from './CarrierProjectsDrawerNavigator';
import LiveTruckDrawerNavigator from './LiveTruckDrawerNavigator';
import CarrierJobsDrawerNavigator from './CarrierJobsDrawerNavigator';

const Tab = createBottomTabNavigator();

const CarrierMainTabsNavigator = () => {
  const { theme, appearance } = useTheme();
  const colors = theme.colors[appearance];

  return (
    <Tab.Navigator
      initialRouteName="CarrierHomeTab"
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
        name="CarrierHomeTab"
        component={HomeDrawerNavigator}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="CarrierInspectionsTab"
        component={InspectionDrawerNavigator}
        options={{
          title: 'Inspections',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="shield-search" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="CarrierJobsTab"
        component={CarrierJobsDrawerNavigator}
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="calendar-check-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="CarrierTruckLiveTab"
        component={LiveTruckDrawerNavigator}
        options={{
          title: 'Live Fleet',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="truck-outline" color={color} size={size} />
          ),
        }}
      />

      <Tab.Screen
        name="CarrierProjectsTab"
        component={CarrierProjectsDrawerNavigator}
        options={{
          title: 'Projects',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="briefcase-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="CarrierDealsTab"
        component={DealsDrawerNavigator}
        options={{
          title: 'Deals',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="hand-coin-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default CarrierMainTabsNavigator;