import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from '../../core/dopebase';
import { useConfig } from '../../config';
import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';

import DealsStackNavigator from './DealsStackNavigator';
// import MyProfileScreen from '../../screens/MyProfileScreen/MyProfileScreen';

const Drawer = createDrawerNavigator();

const DealsDrawerNavigator = () => {
  const config = useConfig();
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      initialRouteName="Deals"
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 300,
        },
      }}
      drawerContent={({ navigation }) => (
        <IMDrawerMenu
          navigation={navigation}
          menuItems={config.drawerMenuConfig.dealsDrawerConfig.upperMenu}
          menuItemsSettings={config.drawerMenuConfig.dealsDrawerConfig.lowerMenu}
        />
      )}
    >
      <Drawer.Screen name="Deals" component={DealsStackNavigator} />
      {/* <Drawer.Screen name="MyProfileDrawer" component={MyProfileScreen} /> */}
    </Drawer.Navigator>
  );
};

export default DealsDrawerNavigator;