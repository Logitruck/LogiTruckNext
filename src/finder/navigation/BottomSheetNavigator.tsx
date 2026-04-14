import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeSheet from '../screens/search/bottomSheet/HomeSheet/HomeSheet';
import RideTypesSheet from '../screens/search/bottomSheet/RideTypesSheet/RideTypesSheet';
import RideTypeDetailSheet from '../screens/search/bottomSheet/RideTypeDetailSheet/RideTypeDetailSheet';
import CargoDetailSheet from '../screens/search/bottomSheet/CargoDetailSheet/CargoDetailsSheet';

const Stack = createNativeStackNavigator();

const BottomSheetNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="HomeSheet"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="HomeSheet" component={HomeSheet} />
      <Stack.Screen name="RideTypesSheet" component={RideTypesSheet} />
      <Stack.Screen
        name="RideTypeDetailSheet"
        component={RideTypeDetailSheet}
      />
     {/*  <Stack.Screen name="ConfirmRideSheet" component={ConfirmRideSheet} />*/}
      <Stack.Screen name="CargoDetailSheet" component={CargoDetailSheet} /> 
    </Stack.Navigator>
  );
};

export default React.memo(BottomSheetNavigator);