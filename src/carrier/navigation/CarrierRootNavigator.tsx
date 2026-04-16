import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CarrierMainTabsNavigator from './CarrierMainTabsNavigator';
import CarrierChatStackNavigator from './CarrierChatStackNavigator';

export type CarrierRootStackParamList = {
  CarrierMainTabs: undefined;
  GlobalChatStack: undefined;
};

const Stack = createNativeStackNavigator<CarrierRootStackParamList>();

const CarrierRootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="CarrierMainTabs"
        component={CarrierMainTabsNavigator}
      />
      <Stack.Screen
        name="GlobalChatStack"
        component={CarrierChatStackNavigator}
      />
    </Stack.Navigator>
  );
};

export default CarrierRootNavigator;