let activeChatChannelID: string | null = null;

export const setActiveChatChannelID = (channelID: string | null) => {
  activeChatChannelID = channelID;
};

export const getActiveChatChannelID = () => activeChatChannelID;

export const isSameActiveChat = (channelID?: string | null) => {
  if (!channelID) {
    return false;
  }

  return activeChatChannelID === channelID;
};