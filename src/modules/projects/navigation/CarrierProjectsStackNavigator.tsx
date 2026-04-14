import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProjectsHomeScreen from '../screens/shared/ProjectsHomeScreen/ProjectsHomeScreen';
import ProjectDetailsScreen from '../screens/shared/ProjectDetailsScreen/ProjectDetailsScreen';
import JobsListScreen from '../screens/carrier/JobsListScreen/JobsListScreen';
import JobDetailsScreen from '../screens/carrier/JobDetailsScreen/JobDetailsScreen';
import SetupProjectScreen from '../screens/carrier/CarrierProjectSetupScreen/CarrierProjectSetupScreen';
import AssignJobModalScreen from '../screens/carrier/AssignJobModalScreen/AssignJobModalScreen';
import ProjectChecklistScreen from '../screens/shared/ProjectChecklistScreen/ProjectChecklistScreen';
import ProjectResourcesScreen from '../screens/carrier/ProjectResourcesScreen/ProjectResourcesScreen';
import ProjectPersonnelScreen from '../screens/carrier/ProjectPersonnelScreen/ProjectPersonnelScreen';
import ProjectRoutesScreen from '../screens/shared/ProjectRoutesScreen/ProjectRoutesScreen';

const Stack = createNativeStackNavigator();

const CarrierProjectsStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProjectsHome"
        component={ProjectsHomeScreen}
        initialParams={{ role: "carrier" }}
        options={{ headerShown: false }}
      />

      <Stack.Screen name="ProjectDetails" component={ProjectDetailsScreen} />

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

      <Stack.Screen name="ProjectCarrierSetup" component={SetupProjectScreen} />

      <Stack.Screen
        name="AssignJobModal"
        component={AssignJobModalScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProjectResources"
        component={ProjectResourcesScreen}
      />
      <Stack.Screen
        name="ProjectChecklist"
        component={ProjectChecklistScreen}
      />
      <Stack.Screen
        name="ProjectPersonnel"
        component={ProjectPersonnelScreen}
      />
      <Stack.Screen
        name="ProjectRoutes"
        component={ProjectRoutesScreen}
      />
      
    </Stack.Navigator>
  );
};

export default CarrierProjectsStackNavigator;