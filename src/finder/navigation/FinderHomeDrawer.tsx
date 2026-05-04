import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useConfig } from '../../config';
import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';
import { HomeFinderNavigator } from './FinderStackNavigators';
import MyProfileScreen from '../../core/profile/screens/MyProfileScreen';

const Drawer = createDrawerNavigator();

const FinderHomeDrawer = () => {
  const config = useConfig();

  return (
    <Drawer.Navigator
      initialRouteName="FinderHomeScreen"
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 300,
        },
      }}
      drawerContent={({ navigation }) => (
        <IMDrawerMenu
          navigation={navigation}
          menuItems={config.drawerMenuConfig.finderHomeDrawerConfig.upperMenu}
          menuItemsSettings={config.drawerMenuConfig.finderHomeDrawerConfig.lowerMenu}
        />
      )}
    >
      <Drawer.Screen
        name="FinderHomeScreen"
        component={HomeFinderNavigator}
      />
      <Drawer.Screen name="MyProfileDrawer" component={MyProfileScreen} options={{ headerShown: true, headerTitle: '' }} />
    </Drawer.Navigator>
  );
};

export default FinderHomeDrawer;