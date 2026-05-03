import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import CarrierMainTabsNavigator from './CarrierMainTabsNavigator';
import CarrierChatStackNavigator from './CarrierChatStackNavigator';
import SupportAssistantScreen from '../../modules/aiSupport/screens/SupportAssistantScreen/SupportAssistantScreen';

import { SupportContext } from '../../modules/aiSupport/types';
export type CarrierRootStackParamList = {
  CarrierMainTabs: undefined;
  GlobalChatStack: undefined;
  SupportAssistant: {
    context?: SupportContext;
  };
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
      <Stack.Screen
        name="SupportAssistant"
        component={SupportAssistantScreen}
      />
    </Stack.Navigator>
  );
};

export default CarrierRootNavigator;