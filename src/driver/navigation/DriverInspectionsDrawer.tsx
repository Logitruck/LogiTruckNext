import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useConfig } from '../../config';

import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';
// import IMChatScreen from '../../core/chat/IMChatScreen/IMChatScreen';
// import MyProfileScreen from '../../screens/MyProfileScreen/MyProfileScreen';

import DriverInspectionsStack from './DriverInspectionsStack';

const Drawer = createDrawerNavigator();

const DriverInspectionsDrawer = () => {
  const config = useConfig();

  return (
    <Drawer.Navigator
      initialRouteName="DriverInspectionsRoot"
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 300,
        },
      }}
      drawerContent={({ navigation }) => (
        <IMDrawerMenu
          navigation={navigation}
          menuItems={config.drawerMenuConfig.driverDrawerConfig.upperMenu}
          menuItemsSettings={config.drawerMenuConfig.driverDrawerConfig.lowerMenu}
        />
      )}
    >
      <Drawer.Screen
        name="DriverInspectionsRoot"
        component={DriverInspectionsStack}
      />

      {/* <Drawer.Screen
        name="PersonalChat"
        component={IMChatScreen}
      /> */}

      {/* <Drawer.Screen
        name="MyProfile"
        component={MyProfileScreen}
      /> */}
    </Drawer.Navigator>
  );
};

export default DriverInspectionsDrawer;