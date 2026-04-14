import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme, useTranslations } from '../../core/dopebase';

import SearchCarrierScreen from '../screens/search/SearchScreen/SearchCarrierScreen';
import SearchModal from '../screens/search/SearchModal/SearchModal';
// import SavePlaceScreen from '../screens/search/SavePlaceScreen/SavePlaceScreen';
import ReviewRequestScreen from '../screens/search/bottomSheet/ReviewRequestScreen/ReviewRequestScreen';
import SuccessRequestScreen from '../screens/search/bottomSheet/RequestSuccessScreen/RequestSuccessScreen';
import MyRequestsScreen from '../screens/search/bottomSheet/MyRequest/MyRequestsScreen';

const Stack = createNativeStackNavigator();

const SearchStack = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const colors = theme.colors[appearance];

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SearchCarrier"
        component={SearchCarrierScreen}
        options={{
          headerTitle: '',
          headerTransparent: true,
        }}
      />

     <Stack.Screen
        name="Search"
        component={SearchModal}
        options={{
          headerTitle: '',
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerTintColor: colors.primaryText,
        }}
      />
      <Stack.Screen
        name="ReviewRequest"
        component={ReviewRequestScreen}
        options={{
          presentation: 'modal',
          headerTitle: localized('Review Request'),

          animation: 'slide_from_bottom',
          headerTintColor: colors.primaryText,
        }}
      />
      <Stack.Screen
        name="RequestSuccess"
        component={SuccessRequestScreen}
        options={{
          presentation: 'modal',
          headerTitle: localized('Request Success'),
          headerShown: true,
          animation: 'slide_from_bottom',
          headerTintColor: colors.primaryText,
        }}
      />
       <Stack.Screen
        name="MyRequests"
        component={MyRequestsScreen}
        options={{
          headerTitle: localized('My Requests'),
          
        }}
      /> 
  {/*
      <Stack.Screen
        name="SavePlace"
        component={SavePlaceScreen}
        options={{
          headerTitle: '',
          headerTransparent: true,
        }}
      />


     */}
    </Stack.Navigator>
  );
};

export { SearchStack };