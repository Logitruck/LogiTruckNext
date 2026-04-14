import { useEffect, useCallback } from 'react';
import { useChatChannels } from '../../core/chat/api';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

type DriverChannel = {
  id?: string;
  channelID?: string;
  type?: string;
  status?: string;
  [key: string]: any;
};

const useDriverChatChannels = () => {
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
    const currentUserID = currentUser?.id || currentUser?.userID;

    if (!currentUserID) {
      return;
    }

    const unsubscribe = subscribeToChannels(currentUserID);
    loadMoreChannels(currentUserID);

    return () => {
      unsubscribe?.();
    };
  }, [currentUser?.id, currentUser?.userID]);

  const closeJobChat = useCallback(
    async (channelID: string) => {
      try {
        return await updateGroupStatus(channelID, 'closed');
      } catch (error) {
        console.log('Error closing driver job chat:', error);
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
        console.log('Error reopening driver job chat:', error);
        return null;
      }
    },
    [updateGroupStatus],
  );

  return {
    channels: (channels ?? []) as DriverChannel[],
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

export default useDriverChatChannels;