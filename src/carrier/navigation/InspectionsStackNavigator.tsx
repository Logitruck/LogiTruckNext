import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import InspectionsHomeScreen from '../screens/Inspections/InspectionsHome/InspectionsHomeScreen';
import InspectionReportViewScreen from '../../modules/inspections/screens/ReportView/ReportViewScreen/ReportViewScreen';
import InspectionRepairScreen from '../screens/Inspections/InspectionRepair/InspectionRepairScreen';
// import InspectionRepairPreviewScreen from '../screens/Inspections/PreviewRepairInspection/PreviewRepairInspection';
import InspectionPreviewScreen from '../../modules/inspections/screens/PreviewInspectionScreen/PreviewInspectionScreen';
// import InspectionDetailsScreen from '../screens/InspectionDetails/InspectionDetailsScreen';

const Stack = createNativeStackNavigator();

const InspectionsStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="InspectionsHome"
        component={InspectionsHomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InspectionRepair"
        component={InspectionRepairScreen}
      />
      <Stack.Screen
        name="PreviewInspection"
        component={InspectionPreviewScreen}
      />

       <Stack.Screen
        name="ReportView"
        component={InspectionReportViewScreen}
      />

      
{/*
      <Stack.Screen
        name="PreviewRepairInspection"
        component={InspectionRepairPreviewScreen}
      />

      

      <Stack.Screen
        name="InspectionsDetail"
        component={InspectionDetailsScreen}
      />*/}
    </Stack.Navigator> 
  );
};

export default InspectionsStackNavigator;