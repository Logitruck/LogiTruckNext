import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useConfig } from '../../config';
import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';
import ChatStackNavigator from './ChatStackNavigator';
// import MyProfileScreen from '../../screens/MyProfileScreen/MyProfileScreen';

const Drawer = createDrawerNavigator();

const ChatDrawerNavigator = () => {
  const config = useConfig();

  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: true }}
      drawerContent={({ navigation }) => (
        <IMDrawerMenu
          navigation={navigation}
          menuItems={config.drawerMenuConfig.chatDrawerConfig.upperMenu}
          menuItemsSettings={config.drawerMenuConfig.chatDrawerConfig.lowerMenu}
        />
      )}
      initialRouteName="ChatStack"
    >
      <Drawer.Screen
        name="ChatStack"
        component={ChatStackNavigator}
        options={{ headerShown: false }}
      />

      {/* <Drawer.Screen
        name="MyProfileDrawer"
        component={MyProfileScreen}
      /> */}
    </Drawer.Navigator>
  );
};

export default ChatDrawerNavigator;