import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from '../../core/dopebase';
import { useConfig } from '../../config';
import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';
import LiveTruckStackNavigator from './LiveTruckStackNavigator';
import MyProfileScreen from '../../core/profile/screens/MyProfileScreen';

const Drawer = createDrawerNavigator();

const LiveTruckDrawerNavigator = () => {
  const config = useConfig();
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      initialRouteName="LiveTruck"
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 300,
        },
      }}
      drawerContent={({ navigation }) => (
        <IMDrawerMenu
          navigation={navigation}
          menuItems={config.drawerMenuConfig.liveTruckDrawerConfig.upperMenu}
          menuItemsSettings={config.drawerMenuConfig.liveTruckDrawerConfig.lowerMenu}
        />
      )}
    >
      <Drawer.Screen
        name="LiveTruck"
        component={LiveTruckStackNavigator}
      />
      <Drawer.Screen name="MyProfileDrawer" component={MyProfileScreen} options={{ headerShown: true, headerTitle: '' }} />
    </Drawer.Navigator>
  );
};

export default LiveTruckDrawerNavigator;