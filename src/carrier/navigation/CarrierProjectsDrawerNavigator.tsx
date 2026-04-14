import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from '../../core/dopebase';
import { useConfig } from '../../config';
import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';
import ProjectsCarrierStack from '../../modules/projects/navigation/CarrierProjectsStackNavigator';

const Drawer = createDrawerNavigator();

const CarrierProjectsDrawerNavigator = () => {
  const config = useConfig();
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      initialRouteName="ProjectsCarrierMain"
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 300,
        },
      }}
      drawerContent={({ navigation }) => (
        <IMDrawerMenu
          navigation={navigation}
          menuItems={
            config.drawerMenuConfig.carrierProjectsDrawerConfig.upperMenu
          }
          menuItemsSettings={
            config.drawerMenuConfig.carrierProjectsDrawerConfig.lowerMenu
          }
        />
      )}
    >
      <Drawer.Screen
        name="ProjectsCarrierMain"
        component={ProjectsCarrierStack}
      />
    </Drawer.Navigator>
  );
};

export default CarrierProjectsDrawerNavigator;