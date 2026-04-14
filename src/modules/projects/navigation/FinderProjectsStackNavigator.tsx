import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProjectsHomeScreen from '../screens/shared/ProjectsHomeScreen/ProjectsHomeScreen';
import ProjectDetailsScreen from '../screens/shared/ProjectDetailsScreen/ProjectDetailsScreen';
import ProjectRoutesScreen from '../screens/finder/ProjectRoutesScreen/ProjectRoutesScreen';
import JobsListScreen from '../screens/finder/JobsListScreen/JobsListScreen';
import JobDetailsScreen from '../screens/finder/JobDetailsScreen/JobDetailsScreen';
import EditRouteScreen from '../screens/finder/EditRouteScreen/EditRouteScreen';
import SetupProjectScreen from '../screens/finder/SetupProjectScreen/SetupProjectScreen';
import ProjectChecklistScreen from '../screens/shared/ProjectChecklistScreen/ProjectChecklistScreen';


const Stack = createNativeStackNavigator();

const FinderProjectsStackNavigator = () => {

console.log('JobDetailsScreen import =>', JobDetailsScreen);
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProjectsHome"
        component={ProjectsHomeScreen}
        initialParams={{ role: "finder" }}
        options={{ headerShown: false }}
      />

      <Stack.Screen name="ProjectDetails" component={ProjectDetailsScreen} />

      <Stack.Screen
        name="ProjectRoutes"
        component={ProjectRoutesScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ProjectJobsList"
        component={JobsListScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen name="ProjectSetup" component={SetupProjectScreen} />

      <Stack.Screen name="EditRoute" component={EditRouteScreen} />
      <Stack.Screen
        name="ProjectChecklist"
        component={ProjectChecklistScreen}
      />
    </Stack.Navigator>
  );
};

export default FinderProjectsStackNavigator;