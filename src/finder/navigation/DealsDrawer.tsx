import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useConfig } from '../../config';
import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';
import { DealsStack } from './DealsStack';

const Drawer = createDrawerNavigator();

const DealsDrawer = () => {
  const config = useConfig();

  return (
    <Drawer.Navigator
      initialRouteName="DealsScreen"
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
      <Drawer.Screen name="DealsScreen" component={DealsStack} />
    </Drawer.Navigator>
  );
};

export default DealsDrawer;