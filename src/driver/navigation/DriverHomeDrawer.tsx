import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useConfig } from '../../config';

import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';
// import IMChatScreen from '../../core/chat/IMChatScreen/IMChatScreen';
// import MyProfileScreen from '../../screens/MyProfileScreen/MyProfileScreen';

import HomeDriverScreen from '../screens/Home/HomeDriverScreen/HomeDriverScreen';
import ReportViewScreen from '../../modules/inspections/screens/ReportView/ReportViewScreen/ReportViewScreen';

const Drawer = createDrawerNavigator();

const DriverHomeDrawer = () => {
  const config = useConfig();

  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false }}
      drawerContent={({ navigation }) => (
        <IMDrawerMenu
          navigation={navigation}
          menuItems={config.drawerMenuConfig.driverDrawerConfig.upperMenu}
          menuItemsSettings={config.drawerMenuConfig.driverDrawerConfig.lowerMenu}
        />
      )}
    >
      {/* Pantalla principal */}
      <Drawer.Screen
        name="DriverHomeMain"
        component={HomeDriverScreen}
      />

      {/* Extras accesibles desde drawer */}
      {/* <Drawer.Screen
        name="PersonalChat"
        component={IMChatScreen}
      />

      <Drawer.Screen
        name="MyProfile"
        component={MyProfileScreen}
      /> */}

      <Drawer.Screen
        name="ReportView"
        component={ReportViewScreen}
      />
    </Drawer.Navigator>
  );
};

export default DriverHomeDrawer;