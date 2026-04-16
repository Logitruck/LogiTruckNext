import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ManagerHomeChatScreen from '../../chat/ManagerHomeChatScreen/ManagerHomeChatScreen';
import { IMChatScreen, IMViewGroupMembersScreen } from '../../core/chat';
import IMCreateGroupScreen from '../../core/chat/ui/IMCreateGroupScreen/IMCreateGroupScreen';
import ChatEntryScreen from '../../chat/ChatEntryScreen/ChatEntryScreen';

export type CarrierChatStackParamList = {
  ChatHome: undefined;
  ChatEntryScreen: {
    channelID: string;
    title?: string;
    openedFromPushNotification?: boolean;
  };
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

const Stack = createNativeStackNavigator<CarrierChatStackParamList>();

const CarrierChatStackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="ChatHome">
      <Stack.Screen
        name="ChatHome"
        component={ManagerHomeChatScreen}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="ChatEntryScreen"
        component={ChatEntryScreen}
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

export default CarrierChatStackNavigator;