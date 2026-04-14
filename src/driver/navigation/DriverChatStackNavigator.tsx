import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import DriverHomeChatScreen from  '../../chat/DriverHomeChatScreen/DriverHomeChatScreen';
import { IMChatScreen, IMViewGroupMembersScreen } from '../../core/chat';
import IMCreateGroupScreen from '../../core/chat/ui/IMCreateGroupScreen/IMCreateGroupScreen';

export type DriverChatStackParamList = {
  DriverHomeChatScreen: undefined;
  PersonalChat: {
    channel: any;
    openedFromPushNotification?: boolean;
    isChatUserItemPress?: boolean;
    isChatBot?: boolean;
    title?: string;
  };
  CreateGroup: {
    availableParticipants?: any[];
  };
  ViewGroupMembers: {
    channel: any;
  };
};

const Stack = createNativeStackNavigator<DriverChatStackParamList>();

const DriverChatStackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="DriverHomeChatScreen">
      <Stack.Screen
        name="DriverHomeChatScreen"
        component={DriverHomeChatScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="PersonalChat"
        component={IMChatScreen}
        options={{ headerShown: true }}
      />

      <Stack.Screen
        name="CreateGroup"
        component={IMCreateGroupScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ViewGroupMembers"
        component={IMViewGroupMembersScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default DriverChatStackNavigator;