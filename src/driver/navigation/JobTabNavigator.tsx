import React from 'react';
import { TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme } from '../../core/dopebase';

import HomeTrackingScreen from '../screens/Home/HomeTrackingScreen/HomeTrackingScreen';
import TicketCaptureScreen from '../screens/Jobs/TicketCaptureScreen/TicketCaptureScreen';

const Stack = createNativeStackNavigator();

const JobTabNavigator = () => {
  const { theme, appearance } = useTheme();
  const colors = theme.colors[appearance];

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeTracking"
        component={HomeTrackingScreen}
        options={({ navigation }) => ({
          headerTitle: '',
          headerTransparent: true,
          headerTintColor: colors.primaryText,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.getParent()?.navigate('DriverMain')}
              style={{ marginLeft: 12 }}
            >
              <MaterialCommunityIcons
                name="menu"
                size={24}
                color={colors.primaryText}
              />
            </TouchableOpacity>
          ),
        })}
      />

      <Stack.Screen
        name="TicketCapture"
        component={TicketCaptureScreen}
        options={({ navigation }) => ({
          headerTitle: '',
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerTintColor: colors.primaryText,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ marginLeft: 12 }}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={colors.primaryText}
              />
            </TouchableOpacity>
          ),
        })}
      />
    </Stack.Navigator>
  );
};

export default JobTabNavigator;