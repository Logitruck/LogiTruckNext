import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeDriverScreen from '../screens/Home/HomeDriverScreen/HomeDriverScreen';

const Stack = createNativeStackNavigator();

const DriverHomeStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DriverHomeMain" component={HomeDriverScreen} />
    </Stack.Navigator>
  );
};

export default DriverHomeStack;