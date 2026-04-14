import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DriverJobsScreen from '../screens/Jobs/DriverJobsScreen/DriverJobsScreen';

const Stack = createNativeStackNavigator();

const DriverJobsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverJobsMain" component={DriverJobsScreen} />
    </Stack.Navigator>
  );
};

export default DriverJobsStack;