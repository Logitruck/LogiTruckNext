import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LiveFleetMapScreen from '../screens/LiveFeet/LiveFleetMapScreen/LiveFleetMapScreen';
import TruckLiveDetailScreen from '../screens/LiveFeet/TruckLiveDetailScreen/TruckLiveDetailScreen';

const Stack = createNativeStackNavigator();

const LiveTruckStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="LiveFleet"
        component={LiveFleetMapScreen}
        options={{ headerShown: false }}
        initialParams={{ status: null }}
      />

      <Stack.Screen
        name="TruckLiveDetail"
        component={TruckLiveDetailScreen}
        options={{ title: 'Track Details' }}
      />

     
    </Stack.Navigator>
  );
};

export default LiveTruckStackNavigator;