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
    <Stack.Navigator>
      <Stack.Screen
        name="DealsHome"
        component={HomeDealsScreen}
        options={{ headerShown: false }}
        initialParams={{ status: null }}
      />

      <Stack.Screen
        name="RequestDetails"
        component={RequestDetailsScreen}
        options={{ title: 'Request Details' }}
      />

      <Stack.Screen
        name="PrepareOffer"
        component={PrepareOfferScreen}
        options={{ title: 'Prepare Offer' }}
      />

      <Stack.Screen
        name="ConfirmOffer"
        component={ConfirmOfferScreen}
        options={{ title: 'Confirm Offer' }}
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