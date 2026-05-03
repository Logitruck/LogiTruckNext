import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CarrierJobsHomeScreen from '../screens/Jobs/CarrierJobsHomeScreen/CarrierJobsHomeScreen';
import JobDetailsScreen from '../../modules/projects/screens/carrier/JobDetailsScreen/JobDetailsScreen';

const Stack = createNativeStackNavigator();

const CarrierJobsStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CarrierJobsHome" component={CarrierJobsHomeScreen} />

      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={({ route }) => ({
          headerShown: true,
          title: (route.params as any)?.job?.name || "Job Details",
        })}
      />
    </Stack.Navigator>
  );
};

export default CarrierJobsStackNavigator;