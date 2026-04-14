import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ManagerHomeChatScreen from  '../ManagerHomeChatScreen/ManagerHomeChatScreen';
// import DriversListBycompanyScreen from '../../carrier/screens/Drivers/DriversListByCompany';

import { IMChatScreen, IMViewGroupMembersScreen } from '../../core/chat';
import IMCreateGroupScreen from '../../core/chat/ui/IMCreateGroupScreen/IMCreateGroupScreen';

export type ChatStackParamList = {
  HomeChatScreen: undefined;
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
  DriversListScreen: undefined;
};

const Stack = createNativeStackNavigator<ChatStackParamList>();

const ChatStackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="HomeChatScreen">
      <Stack.Screen
        name="HomeChatScreen"
        component={ManagerHomeChatScreen}
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

      {/* <Stack.Screen
        name="DriversListScreen"
        component={DriversListBycompanyScreen}
        options={{ headerShown: true }}
      /> */}
    </Stack.Navigator>
  );
};

export default ChatStackNavigator;