import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeSheet from '../screens/Home/HomeTrackingScreen/OperationBottomSheetScreen/OperationStaticSheet';

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
     
    </Stack.Navigator>
  );
};

export default React.memo(BottomSheetNavigator);