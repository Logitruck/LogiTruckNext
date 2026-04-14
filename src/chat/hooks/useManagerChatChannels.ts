import { useEffect, useCallback } from 'react';
import { useChatChannels } from '../../core/chat/api';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

type ManagerChannel = {
  id?: string;
  channelID?: string;
  type?: string;
  status?: string;
  [key: string]: any;
};

const useManagerChatChannels = () => {
  const {
    channels,
    refreshing,
    loadingBottom,
    subscribeToChannels,
    loadMoreChannels,
    pullToRefresh,
    markChannelMessageAsRead,
    markUserAsTypingInChannel,
    createChannel,
    updateGroup,
    leaveGroup,
    deleteGroup,
    updateGroupStatus,
  } = useChatChannels();

  const currentUser = useCurrentUser();

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    const unsubscribe = subscribeToChannels(currentUser.id);
    loadMoreChannels(currentUser.id);

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser?.id]);

  useEffect(() => {
  console.log('MOUNT useManagerChatChannels');
  return () => {
    console.log('UNMOUNT useManagerChatChannels');
  };
}, []);

  const closeJobChat = useCallback(
    async (channelID: string) => {
      try {
        return await updateGroupStatus(channelID, 'closed');
      } catch (error) {
        console.log('Error closing job chat:', error);
        return null;
      }
    },
    [updateGroupStatus],
  );

  const reopenJobChat = useCallback(
    async (channelID: string) => {
      try {
        return await updateGroupStatus(channelID, 'active');
      } catch (error) {
        console.log('Error reopening job chat:', error);
        return null;
      }
    },
    [updateGroupStatus],
  );

  return {
    channels,
    refreshing: !!refreshing,
    loadingBottom: !!loadingBottom,
    subscribeToChannels,
    loadMoreChannels,
    pullToRefresh,
    markChannelMessageAsRead,
    markUserAsTypingInChannel,
    createChannel,
    updateGroup,
    leaveGroup,
    deleteGroup,
    updateGroupStatus,
    closeJobChat,
    reopenJobChat,
  };
};

export default useManagerChatChannels;