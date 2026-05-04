import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useConfig } from '../../config';
import { IMDrawerMenu } from '../../core/ui/drawer/IMDrawerMenu/IMDrawerMenu';
import ProjectsStack from '../../modules/projects/navigation/FinderProjectsStackNavigator';
import MyProfileScreen from '../../core/profile/screens/MyProfileScreen';

const Drawer = createDrawerNavigator();

const ProjectsDrawer = () => {
  const config = useConfig();

  return (
    <Drawer.Navigator
      initialRouteName="ProjectsMain"
      id="ProjectsDrawer"
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 300,
        },
      }}
      drawerContent={({ navigation }) => (
        <IMDrawerMenu
          navigation={navigation}
          menuItems={config.drawerMenuConfig.projectsDrawerConfig.upperMenu}
          menuItemsSettings={config.drawerMenuConfig.projectsDrawerConfig.lowerMenu}
        />
      )}
    >
      <Drawer.Screen
        name="ProjectsMain"
        component={ProjectsStack}
      />
      <Drawer.Screen name="MyProfileDrawer" component={MyProfileScreen} options={{ headerShown: true, headerTitle: '' }} />
    </Drawer.Navigator>
  );
};

export default ProjectsDrawer;