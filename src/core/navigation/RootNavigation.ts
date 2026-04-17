import { createNavigationContainerRef } from '@react-navigation/native';

export type GlobalChatStackParams = {
  screen?: 'ChatHome' | 'ChatEntryScreen' | 'PersonalChat';
  params?: {
    channelID?: string;
    title?: string;
    openedFromPushNotification?: boolean;
    channel?: {
      id: string;
      channelID: string;
      name?: string;
    };
    isChatUserItemPress?: boolean;
  };
};

export type RootStackParamList = {
  GlobalChatStack: GlobalChatStackParams;
};

export const navigationRef =
  createNavigationContainerRef<RootStackParamList>();

let pendingGlobalChatNavigation: GlobalChatStackParams | null = null;

export const navigateToGlobalChat = (params: GlobalChatStackParams) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate('GlobalChatStack', params);
    return;
  }

  pendingGlobalChatNavigation = params;
};

export const flushPendingGlobalChatNavigation = () => {
  if (!navigationRef.isReady() || !pendingGlobalChatNavigation) {
    return;
  }

  navigationRef.navigate('GlobalChatStack', pendingGlobalChatNavigation);
  pendingGlobalChatNavigation = null;
};

export const clearPendingGlobalChatNavigation = () => {
  pendingGlobalChatNavigation = null;
};