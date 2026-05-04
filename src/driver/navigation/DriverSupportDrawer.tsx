import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useConfig } from '../../config';

import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';
// import IMChatScreen from '../../core/chat/IMChatScreen/IMChatScreen';
// import MyProfileScreen from '../../screens/MyProfileScreen/MyProfileScreen';
import AssistantScreenScreen from '../../modules/inspections/screens/ReportView/ReportViewScreen/ReportViewScreen';
import MyProfileScreen from '../../core/profile/screens/MyProfileScreen';

const Drawer = createDrawerNavigator();

const DriverSupportDrawer = () => {
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
      <Drawer.Screen name="DriverSupportMain" component={AssistantScreenScreen} />
      <Drawer.Screen name="MyProfileDrawer" component={MyProfileScreen} options={{ headerShown: true, headerTitle: '' }} />
    </Drawer.Navigator>
  );
};

export default DriverSupportDrawer;