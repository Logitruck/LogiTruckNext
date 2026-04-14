import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from '../../core/dopebase';
import { useConfig } from '../../config';
import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';
import { SearchStack } from './SearchStack';

const Drawer = createDrawerNavigator();

const SearchDrawer = () => {
  const config = useConfig();
  const { theme } = useTheme();

  return (
    <Drawer.Navigator
      initialRouteName="SearchScreen"
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 300,
        },
      }}
      drawerContent={({ navigation }) => (
        <IMDrawerMenu
          navigation={navigation}
          menuItems={config.drawerMenuConfig.searchDrawerConfig.upperMenu}
          menuItemsSettings={config.drawerMenuConfig.searchDrawerConfig.lowerMenu}
        />
      )}
    >
      <Drawer.Screen name="SearchScreen" component={SearchStack} />
    </Drawer.Navigator>
  );
};

export default SearchDrawer;