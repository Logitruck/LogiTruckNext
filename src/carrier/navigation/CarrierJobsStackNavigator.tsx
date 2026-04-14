import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CarrierJobsHomeScreen from '../screens/Jobs/CarrierJobsHomeScreen/CarrierJobsHomeScreen';
import JobDetailsScreen from '../../modules/projects/screens/carrier/JobDetailsScreen/JobDetailsScreen';

const Stack = createNativeStackNavigator();

const CarrierJobsStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="CarrierJobsHome"
        component={CarrierJobsHomeScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default CarrierJobsStackNavigator;