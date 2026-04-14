import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../core/dopebase';

import FinderHomeDrawer from './FinderHomeDrawer';
import SearchDrawer from './SearchDrawer';
import DealsDrawer from './DealsDrawer';
import ProjectsDrawer from './ProjectsDrawer';
import MessengerDrawer from './MessengerDrawer';

const Tab = createBottomTabNavigator();

const FinderRootNavigator = () => {
  const { theme, appearance } = useTheme();
  const colors = theme.colors[appearance];

  return (
    <Tab.Navigator
      initialRouteName="FinderHomeTab"
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
        name="FinderHomeTab"
        component={FinderHomeDrawer}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="view-dashboard-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="FinderSearchTab"
        component={SearchDrawer}
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="magnify"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="FinderDealsTab"
        component={DealsDrawer}
        options={{
          title: 'Deals',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="file-document-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />

      <Tab.Screen
        name="FinderProjectsTab"
        component={ProjectsDrawer}
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
        name="FinderChatTab"
        component={MessengerDrawer}
        options={{
          title: 'Messenger',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="message-text-outline"
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default FinderRootNavigator;