import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';



import ProjectsHomeScreen from '../screens/projects/home/ProjectsHomeScreen';
// import ProjectRoutesScreen from '../screens/projects/ProjectRoutes/ProjectRoutesScreen';
// import JobsListScreen from '../screens/projects/Jobs/JobsListScreen';
// import ProjectDetailsScreen from '../screens/projects/Details/ProjectDetailsScreen';
// import EditRouteScreen from '../screens/projects/EditRoute/EditRouteScreen';
// import SetupProjectScreen from '../screens/projects/SetupProjects/SetupProjects';
// import JobDetailsScreen from '../screens/projects/Jobs/JobDetailsScreen/JobDetailsScreen';

const Stack = createNativeStackNavigator();

const ProjectsStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="ProjectsHome"
        component={ProjectsHomeScreen}
      />

      {/* <Stack.Screen
        name="ProjectRoutes"
        component={ProjectRoutesScreen}
      />

      <Stack.Screen
        name="ProjectJobsList"
        component={JobsListScreen}
      />

      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
      />

      <Stack.Screen
        name="ProjectDetails"
        component={ProjectDetailsScreen}
      />

      <Stack.Screen
        name="ProjectSetup"
        component={SetupProjectScreen}
      />

      <Stack.Screen
        name="EditRoute"
        component={EditRouteScreen}
      /> */}
    </Stack.Navigator>
  );
};

export default ProjectsStackNavigator;