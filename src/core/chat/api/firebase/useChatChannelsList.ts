import { useEffect } from 'react';
import { useChatChannels } from './useChatChannels';
import type { ChatChannel } from './firebaseChatClient';
import { useCurrentUser } from '../../../onboarding/hooks/useAuth';

type UseChatChannelsListReturn = {
  channels: ChatChannel[];
};

export const useChatChannelsList = (): UseChatChannelsListReturn => {
  const currentUser = useCurrentUser();
  const { channels, subscribeToChannels } = useChatChannels();

  useEffect(() => {
    const unsubscribe = subscribeToChannels(currentUser?.id ?? '');

    return () => {
      unsubscribe && unsubscribe();
    };
  }, [currentUser?.id, subscribeToChannels]);

  return {
    channels: channels ?? [],
  };
};