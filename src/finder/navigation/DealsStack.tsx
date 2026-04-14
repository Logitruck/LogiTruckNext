import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DeelsScreen from '../screens/deals/DealsScreen/DealsScreen';
import RequestDetailsScreen from '../screens/deals/RequestDetailsScreen/RequestDetailsScreen';
import ChecklistScreen from '../screens/deals/ChecklistScreen/ChecklistScreen';
import ContractStackNavigator from '../../modules/contracts/navigation/ContractStackNavigator';

const Stack = createNativeStackNavigator();

export const DealsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Deals" component={DeelsScreen} />
      <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} />
      <Stack.Screen name="Checklist" component={ChecklistScreen} />
      <Stack.Screen
        name="ContractsFlow"
        component={ContractStackNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};