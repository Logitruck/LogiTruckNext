import { useState } from 'react';
import { subscribeToSingleChannel as subscribeToSingleChannelAPI } from './firebaseChatClient';
import type { ChatChannel } from './firebaseChatClient';

type UseChatSingleChannelReturn = {
  remoteChannel: ChatChannel | null;
  subscribeToSingleChannel: (channelID: string) => (() => void) | null;
};

export const useChatSingleChannel = (): UseChatSingleChannelReturn => {
  const [remoteChannel, setRemoteChannel] = useState<ChatChannel | null>(null);

  const subscribeToSingleChannel = (channelID: string) => {
    if (!channelID) {
      return null;
    }

    return subscribeToSingleChannelAPI(
      channelID,
      (channel: ChatChannel | undefined) => {
        setRemoteChannel(channel ?? null);
      },
    );
  };

  return {
    remoteChannel,
    subscribeToSingleChannel,
  };
};