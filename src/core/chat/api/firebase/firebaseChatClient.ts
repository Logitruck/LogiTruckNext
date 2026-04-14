import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';
import {
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore';

import { DocRef, channelsRef, ChatFunctions } from './chatRef';
import { getUnixTimeStamp } from '../../../helpers/timeFormat';
export type ChatParticipant = {
  id?: string;
  userID?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  language?: string;
  profilePictureURL?: string;
  [key: string]: any;
};

export type ChatChannelType =
  | 'direct'
  | 'job'
  | 'offer'
  | 'support_ai'
  | string;

export type ChatChannel = {
  id: string;
  channelID?: string;
  creatorID?: string;
  name?: string;
  title?: string;
  participants?: ChatParticipant[];
  isChatBot?: boolean;
  createdAt?: number;
  type?: ChatChannelType;
  status?: string;
  relatedJobID?: string | null;
  relatedOfferID?: string | null;
  admins?: string[];
  readUserIDs?: string[];
  lastMessage?: string | Record<string, any>;
  lastMessageDate?: number | string;
  lastMessageSenderId?: string;
  lastThreadMessageId?: string;
  typingUsers?: Record<string, any>;
  [key: string]: any;
};

export type ChatMessage = {
  id?: string;
  _id?: string;
  senderID?: string;
  content?: string;
  createdAt?: number;
  media?: Record<string, any> | null;
  language?: string;
  translations?: Array<{
    language: string;
    translatedContent: string;
  }>;
  [key: string]: any;
};

type Unsubscribe = () => void;

export const subscribeChannels = (
  userID: string,
  callback: (channels: ChatChannel[]) => void,
): Unsubscribe => {
  console.log('subscriveChannels', userID);

  const q = query(
    DocRef(userID).chatFeedLive,
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot: QuerySnapshot<DocumentData>) => {
      callback(snapshot.docs.map(docItem => docItem.data() as ChatChannel));
    },
  );
};

export const subscribeToSingleChannel = (
  channelID: string,
  callback: (channel: ChatChannel | undefined) => void,
): Unsubscribe => {
  return onSnapshot(doc(channelsRef, channelID), snapshot => {
    callback(snapshot.data() as ChatChannel | undefined);
  });
};

export const listChannels = async (
  userID: string,
  page: number = -1,
  size: number = 1000,
): Promise<ChatChannel[] | null> => {
  const instance = ChatFunctions().listChannelsWithFilters;
  console.log('listChannels', userID);

  try {
    const res = await instance({
      userID,
      page,
      size,
    });
    return (res?.data as any)?.channels ?? null;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const createChannel = async (
  creator: ChatParticipant,
  otherParticipants: ChatParticipant[],
  name?: string,
  isAdmin: boolean = false,
  isChatBot: boolean = false,
  type?: ChatChannelType,
  relatedJobID: string | null = null,
  relatedOfferID: string | null = null,
): Promise<ChatChannel | null> => {
  let channelID = uuid();
  const id1 = creator.id;

  console.log('type create chat api', type);
  console.log('name create chat api', name);

  if (!id1) {
    return null;
  }

  if (otherParticipants?.length === 1) {
    const id2 = otherParticipants[0].id || otherParticipants[0].userID;

    if (!id2 || id1 === id2) {
      return null;
    }

    channelID = id1 < id2 ? id1 + id2 : id2 + id1;
  }

  const data: ChatChannel = {
    creatorID: id1,
    id: channelID,
    channelID,
    name,
    participants: [...otherParticipants, creator],
    isChatBot,
    createdAt: getUnixTimeStamp(),
    type,
    status: 'active',
  };

  if (type === 'job' && relatedJobID) {
    data.relatedJobID = relatedJobID;
  }

  if (type === 'offer' && relatedOfferID) {
    data.relatedOfferID = relatedOfferID;
  }

  const instance = !isChatBot
    ? ChatFunctions().createChannel
    : ChatFunctions().createChannelAI;

  try {
    const res = await instance(data);
    return (res?.data as ChatChannel) ?? null;
  } catch (error) {
    console.log('create error', error);
    return null;
  }
};

export const updateGroupStatus = async (
  channelID: string,
  status: string,
): Promise<any> => {
  const instance = ChatFunctions().updateGroup;

  try {
    const res = await instance({
      channelID,
      status,
    });

    return res?.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const markChannelMessageAsRead = async (
  channelID: string,
  userID: string,
  messageID?: string,
  readUserIDs?: string[],
): Promise<any> => {
  const instance = ChatFunctions().markAsRead;

  try {
    const res = await instance({
      channelID,
      userID,
      messageID,
      readUserIDs,
    });

    return res?.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const markUserAsTypingInChannel = async (
  channelID: string,
  userID: string,
): Promise<any> => {
  const instance = ChatFunctions().markUserAsTypingInChannel;

  try {
    const res = await instance({
      channelID,
      userID,
    });

    return res?.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const sendMessage = async (
  channel: ChatChannel,
  message: ChatMessage,
): Promise<any> => {
  const instance = ChatFunctions().insertMessage;

  try {
    const res = await instance({
      channelID: channel?.id,
      message,
    });

    return res?.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const sendMessageAI = async (
  channel: ChatChannel,
  message: ChatMessage,
): Promise<any> => {
  console.log('sendMessageAI', channel.id, message);

  const instance = ChatFunctions().insertMessageAI;

  try {
    const res = await instance({
      channelID: channel?.id,
      message,
      assistantID: 'asst_uKPgc6agi72QEzvFVxbIMSaA',
    });

    return res?.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const deleteMessage = async (
  channel: ChatChannel,
  messageID: string,
): Promise<any> => {
  if (!channel?.id || !messageID) {
    return;
  }

  const instance = ChatFunctions().deleteMessage;

  try {
    const res = await instance({
      channelID: channel?.id,
      messageID,
    });

    return res?.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const subscribeToMessages = (
  channelID: string,
  callback: (messages: ChatMessage[]) => void,
): Unsubscribe => {
  const q = query(
    DocRef(channelID).messagesLive,
    orderBy('createdAt', 'desc'),
  );

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot: QuerySnapshot<DocumentData>) => {
      callback(snapshot.docs.map(docItem => docItem.data() as ChatMessage));
    },
  );
};

export const listMessages = async (
  channelID: string,
  page: number = 0,
  size: number = 1000,
): Promise<ChatMessage[]> => {
  const instance = ChatFunctions().listMessages;

  try {
    const res = await instance({
      channelID,
      page,
      size,
    });

    return ((res?.data as any)?.messages ?? []) as ChatMessage[];
  } catch (error) {
    console.log(error);
    return [];
  }
};

export const deleteGroup = async (channelID: string): Promise<any> => {
  const instance = ChatFunctions().deleteGroup;

  try {
    const res = await instance({
      channelID,
    });

    return res?.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const leaveGroup = async (
  channelID: string,
  userID: string,
  content?: string,
): Promise<any> => {
  const instance = ChatFunctions().leaveGroup;

  try {
    const res = await instance({
      channelID,
      userID,
      content,
    });

    return res?.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const updateGroup = async (
  channelID: string,
  userID: string,
  newData: Record<string, any>,
): Promise<any> => {
  const instance = ChatFunctions().updateGroup;

  try {
    const res = await instance({
      channelID,
      userID,
      channelData: newData,
    });

    return res?.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const currentTimestamp = (): number => {
  return getUnixTimeStamp();
};

export const addReaction = async (
  messageID: string,
  authorID: string,
  reaction: string,
  channelID: string,
): Promise<any> => {
  const instance = ChatFunctions().addMessageReaction;

  try {
    const res = await instance({
      authorID,
      messageID,
      reaction,
      channelID,
    });

    return res?.data;
  } catch (error) {
    console.log(error);
    return null;
  }
};