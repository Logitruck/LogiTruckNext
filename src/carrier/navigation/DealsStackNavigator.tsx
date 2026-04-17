import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeDealsScreen from '../screens/Deals/HomeDealsScreen';
import RequestDetailsScreen from '../screens/Deals/requestDetailScreen/RequestDetailsScreen';
import PrepareOfferScreen from '../screens/Deals/prepareOfferScreen/PrepareOfferScreen';
import ConfirmOfferScreen from '../screens/Deals/confirmOfferScreen/ConfirmOfferScreen';
import ContractStackNavigator from '../../modules/contracts/navigation/ContractStackNavigator';

const Stack = createNativeStackNavigator();

const DealsStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="DealsHome"
        component={HomeDealsScreen}
        initialParams={{ status: null }}
      />

      <Stack.Screen
        name="RequestDetails"
        component={RequestDetailsScreen}
        options={{
          headerShown: true,
          title: 'Request Details',
        }}
      />

      <Stack.Screen
        name="PrepareOffer"
        component={PrepareOfferScreen}
        options={{
          headerShown: true,
          title: 'Prepare Offer',
        }}
      />

      <Stack.Screen
        name="ConfirmOffer"
        component={ConfirmOfferScreen}
        options={{
          headerShown: true,
          title: 'Confirm Offer',
        }}
      />

      <Stack.Screen
        name="ContractsFlow"
        component={ContractStackNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default DealsStackNavigator;