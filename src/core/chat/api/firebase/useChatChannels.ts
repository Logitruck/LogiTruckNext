import { useRef, useState } from 'react';
import {
  subscribeChannels as subscribeChannelsAPI,
  listChannels as listChannelsAPI,
  createChannel as createChannelAPI,
  markChannelMessageAsRead as markChannelMessageAsReadAPI,
  updateGroup as updateGroupAPI,
  leaveGroup as leaveGroupAPI,
  deleteGroup as deleteGroupAPI,
  markUserAsTypingInChannel as markUserAsTypingInChannelAPI,
  updateGroupStatus as updateGroupStatusAPI,
  type ChatChannel,
  type ChatParticipant,
  type ChatChannelType,
} from './firebaseChatClient';

type PaginationRef = {
  page: number;
  size: number;
  exhausted: boolean;
};

type SemaphoresRef = {
  isMarkingAsTyping: boolean;
};

type UseChatChannelsReturn = {
  channels: ChatChannel[] | null;
  refreshing: boolean;
  loadingBottom: boolean;
  subscribeToChannels: (userID: string) => (() => void) | void;
  loadMoreChannels: (userID: string) => Promise<void>;
  pullToRefresh: (userID: string) => Promise<void>;
  markChannelMessageAsRead: (
    channelID: string,
    userID: string,
    threadMessageID?: string,
    readUserIDs?: string[],
  ) => Promise<any>;
  markUserAsTypingInChannel: (
    channelID: string,
    userID: string,
  ) => Promise<any>;
  createChannel: (
    creator: ChatParticipant,
    otherParticipants: ChatParticipant[],
    name?: string,
    isAdmin?: boolean,
    isChatBot?: boolean,
    type?: ChatChannelType,
  ) => Promise<any>;
  updateGroup: (
    channelID: string,
    userID: string,
    data: Record<string, any>,
  ) => Promise<any>;
  leaveGroup: (
    channelID: string,
    userID: string,
    content?: string,
  ) => Promise<any>;
  deleteGroup: (channelID: string) => Promise<any>;
  updateGroupStatus: (channelID: string, status: string) => Promise<any>;
};

export const useChatChannels = (): UseChatChannelsReturn => {
  const [channels, setChannels] = useState<ChatChannel[] | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loadingBottom, setLoadingBottom] = useState<boolean>(false);

  const pagination = useRef<PaginationRef>({
    page: 0,
    size: 25,
    exhausted: false,
  });

  const realtimeChannelsRef = useRef<ChatChannel[] | null>(null);

  const semaphores = useRef<SemaphoresRef>({
    isMarkingAsTyping: false,
  });

  const loadMoreChannels = async (userID: string): Promise<void> => {
    if (pagination.current.exhausted) {
      return;
    }

    setLoadingBottom(true);
    console.log('userID useChatClientfirebase', userID);

    const newChannels = await listChannelsAPI(
      userID,
      -1,
      pagination.current.size,
    );

    if ((newChannels?.length ?? 0) === 0) {
      pagination.current.exhausted = true;
    }

    pagination.current.page += 1;
    setLoadingBottom(false);

    setChannels(oldChannels =>
      deduplicatedChannels(oldChannels, newChannels, true),
    );
  };

  const subscribeToChannels = (userID: string) => {
    return subscribeChannelsAPI(userID, (newChannels: ChatChannel[]) => {
      realtimeChannelsRef.current = newChannels;

      setChannels(oldChannels =>
        deduplicatedChannels(oldChannels, newChannels, false),
      );
    });
  };

  const pullToRefresh = async (userID: string): Promise<void> => {
    setRefreshing(true);
    pagination.current.page = 0;
    pagination.current.exhausted = false;

    const newChannels = await listChannelsAPI(
      userID,
      pagination.current.page,
      pagination.current.size,
    );

    if ((newChannels?.length ?? 0) === 0) {
      pagination.current.exhausted = true;
    }

    pagination.current.page += 1;
    setRefreshing(false);

    setChannels(
      deduplicatedChannels(realtimeChannelsRef.current, newChannels, true),
    );
  };

  const createChannel = async (
    creator: ChatParticipant,
    otherParticipants: ChatParticipant[],
    name?: string,
    isAdmin?: boolean,
    isChatBot?: boolean,
    type?: ChatChannelType,
  ): Promise<any> => {
    console.log('name usechat', name, 'type usechat', type);

    return await createChannelAPI(
      creator,
      otherParticipants,
      name,
      isAdmin,
      isChatBot,
      type,
    );
  };

  const markUserAsTypingInChannel = async (
    channelID: string,
    userID: string,
  ): Promise<any> => {
    if (semaphores.current.isMarkingAsTyping === true) {
      return;
    }

    semaphores.current.isMarkingAsTyping = true;
    const res = await markUserAsTypingInChannelAPI(channelID, userID);
    semaphores.current.isMarkingAsTyping = false;

    return res;
  };

  const markChannelMessageAsRead = async (
    channelID: string,
    userID: string,
    threadMessageID?: string,
    readUserIDs: string[] = [],
  ): Promise<any> => {
    return await markChannelMessageAsReadAPI(
      channelID,
      userID,
      threadMessageID,
      readUserIDs,
    );
  };

  const updateGroup = async (
    channelID: string,
    userID: string,
    data: Record<string, any>,
  ): Promise<any> => {
    return await updateGroupAPI(channelID, userID, data);
  };

  const leaveGroup = async (
    channelID: string,
    userID: string,
    content?: string,
  ): Promise<any> => {
    return await leaveGroupAPI(channelID, userID, content);
  };

  const deleteGroup = async (channelID: string): Promise<any> => {
    return await deleteGroupAPI(channelID);
  };

  const updateGroupStatus = async (
    channelID: string,
    status: string,
  ): Promise<any> => {
    return await updateGroupStatusAPI(channelID, status);
  };

  const deduplicatedChannels = (
    oldChannels: ChatChannel[] | null,
    newChannels: ChatChannel[] | null,
    appendToBottom: boolean,
  ): ChatChannel[] => {
    const oldList = oldChannels || [];
    const newList = newChannels || [];

    const all = oldChannels
      ? appendToBottom
        ? [...oldList, ...newList]
        : [...newList, ...oldList]
      : newList;

    const deduplicated = (all || []).reduce<ChatChannel[]>((acc, curr) => {
      if (!acc.some(channel => channel.id === curr.id)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    return deduplicated;
  };

  return {
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
  };
};