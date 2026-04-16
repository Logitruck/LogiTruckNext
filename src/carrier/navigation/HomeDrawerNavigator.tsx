import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useConfig } from '../../config';
import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';

import HomeScreen from '../screens/home/ManagerHomeScreen/ManagerHomeScreen';

// import MyProfileScreen from '../../screens/MyProfileScreen/MyProfileScreen';

const Drawer = createDrawerNavigator();

const HomeDrawerNavigator = () => {
  const config = useConfig();

  return (
    <Drawer.Navigator
      initialRouteName="HomeScreen"
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 300,
        },
      }}
      drawerContent={({ navigation }) => (
        <IMDrawerMenu
          navigation={navigation}
          menuItems={config.drawerMenuConfig.homeDrawerConfig.upperMenu}
          menuItemsSettings={config.drawerMenuConfig.homeDrawerConfig.lowerMenu}
        />
      )}
    >
      <Drawer.Screen name="HomeScreen" component={HomeScreen} />
      {/* <Drawer.Screen name="MyProfile" component={MyProfileScreen} /> */}
    </Drawer.Navigator>
  );
};

export default HomeDrawerNavigator;