import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DriverInspectionsHomeScreen from '../screens/Inspections/DriverInspectionsHomeScreen/DriverInspectionsHomeScreen';
import InspectionScreen from '../screens/Inspections/InspectionScreen/InspectionScreen';
import SummaryInspectionScreen from '../screens/Inspections/SummaryInspectionScreen/SummaryInspectionScreen';
import PreviewInspectionScreen from '../../modules/inspections/screens/PreviewInspectionScreen/PreviewInspectionScreen';
import ReportViewScreen from '../../modules/inspections/screens/ReportView/ReportViewScreen/ReportViewScreen';

const Stack = createNativeStackNavigator();

const DriverInspectionsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="DriverInspectionsHome"
        component={DriverInspectionsHomeScreen}
      />
      <Stack.Screen
        name="InspectionScreen"
        component={InspectionScreen}
      />
      <Stack.Screen
        name="SummaryInspection"
        component={SummaryInspectionScreen}
      />
      <Stack.Screen
        name="PreviewInspection"
        component={PreviewInspectionScreen}
      />
      <Stack.Screen
        name="ReportView"
        component={ReportViewScreen}
      />
    </Stack.Navigator>
  );
};

export default DriverInspectionsStack;