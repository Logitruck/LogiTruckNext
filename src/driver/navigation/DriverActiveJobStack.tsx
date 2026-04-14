import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeTrackingScreen from '../screens/Home/HomeTrackingScreen/HomeTrackingScreen';
import TicketCaptureScreen from '../screens/Jobs/TicketCaptureScreen/TicketCaptureScreen';

const Stack = createNativeStackNavigator();

const DriverActiveJobStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="HomeTracking"
        component={HomeTrackingScreen}
      />
      <Stack.Screen
        name="TicketCapture"
        component={TicketCaptureScreen}
      />
    </Stack.Navigator>
  );
};

export default DriverActiveJobStack;