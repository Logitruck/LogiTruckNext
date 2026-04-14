import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import OperationOverviewSheet from '../screens/Home/HomeTrackingScreen/OperationBottomSheetScreen/OperationOverviewSheet/OperationOverviewSheet';
import OperationStaticSheet from '../screens/Home/HomeTrackingScreen/OperationBottomSheetScreen/OperationStaticSheet';
const Stack = createNativeStackNavigator();



const OperationBottomSheetNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: 'transparent' }
      }}
    >
      <Stack.Screen name="HomeSheetOperation" component={OperationOverviewSheet} />
    </Stack.Navigator>
  );
};
export default React.memo(OperationBottomSheetNavigator);