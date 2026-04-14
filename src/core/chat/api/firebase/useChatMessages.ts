import { useRef, useState } from 'react';
import {
  sendMessage as sendMessageAPI,
  sendMessageAI as sendMessageAIAPI,
  deleteMessage as deleteMessageAPI,
  subscribeToMessages as subscribeMessagesAPI,
//   subscribeToMessagesAI as subscribeMessagesAIAPI,
  listMessages as listMessagesAPI,
  type ChatMessage,
} from './firebaseChatClient';
import { useReactions } from './useReactions';
import {
  hydrateMessagesWithMyReactions,
  getMessageObject,
  type BaseChatMessage,
  type ChatSender,
  type ReactionKey,
} from '../utils';
import { useCurrentUser } from '../../../onboarding/hooks/useAuth';

type PaginationRef = {
  page: number;
  size: number;
  exhausted: boolean;
};

type CurrentUser = {
  id?: string;
  [key: string]: any;
};

type UseChatMessagesReturn = {
  messages: BaseChatMessage[] | null;
  subscribeToMessages: (channelID: string) => (() => void) | void;
//   subscribeToMessagesAI: (channelID: string) => (() => void) | void;
  loadMoreMessages: (channelID: string) => Promise<void>;
  sendMessage: (newMessage: BaseChatMessage, channel: any) => Promise<any>;
  sendMessageAI: (newMessage: BaseChatMessage, channel: any) => Promise<any>;
  optimisticSetMessage: (
    sender: ChatSender,
    message: Record<string, any>,
    media: Record<string, any> | null,
    inReplyToItem: any,
  ) => BaseChatMessage;
  deleteMessage: (channel: any, threadItemID: string) => Promise<any>;
  addReaction: (
    message: BaseChatMessage,
    author: { id: string; [key: string]: any },
    reaction: ReactionKey | null,
    channelID: string,
  ) => Promise<void>;
  getMessageObject: typeof getMessageObject;
};

export const useChatMessages = (): UseChatMessagesReturn => {
  const [messages, setMessages] = useState<BaseChatMessage[] | null>(null);

  const pagination = useRef<PaginationRef>({
    page: 0,
    size: 25,
    exhausted: false,
  });

  const { handleMessageReaction } = useReactions(setMessages);
  const currentUser = useCurrentUser() as CurrentUser | null;

  const addReaction = async (
    message: BaseChatMessage,
    author: { id: string; [key: string]: any },
    reaction: ReactionKey | null,
    channelID: string,
  ): Promise<void> => {
    await handleMessageReaction(message, reaction, author, channelID);
  };

  const loadMoreMessages = async (channelID: string): Promise<void> => {
    if (pagination.current.exhausted) {
      return;
    }

    const newMessages = await listMessagesAPI(
      channelID,
      pagination.current.page,
      pagination.current.size,
    );

    if ((newMessages?.length ?? 0) === 0) {
      pagination.current.exhausted = true;
    }

    pagination.current.page += 1;

    setMessages(prevMessages =>
      hydrateMessagesWithMyReactions(
        deduplicatedMessages(prevMessages, newMessages, true),
        currentUser?.id,
      ) ?? null,
    );
  };

  const subscribeToMessages = (channelID: string) => {
    return subscribeMessagesAPI(channelID, (newMessages: ChatMessage[]) => {
      setMessages(prevMessages =>
        hydrateMessagesWithMyReactions(
          deduplicatedMessages(prevMessages, newMessages, false),
          currentUser?.id,
        ) ?? null,
      );
    });
  };

//   const subscribeToMessagesAI = (channelID: string) => {
//     return subscribeMessagesAIAPI(channelID, (newMessages: ChatMessage[]) => {
//       setMessages(prevMessages =>
//         hydrateMessagesWithMyReactions(
//           deduplicatedMessages(prevMessages, newMessages, false),
//           currentUser?.id,
//         ) ?? null,
//       );
//     });
//   };

  const optimisticSetMessage = (
    sender: ChatSender,
    message: Record<string, any>,
    media: Record<string, any> | null,
    inReplyToItem: any,
  ): BaseChatMessage => {
    const newMessage = getMessageObject(sender, message, media, inReplyToItem);

    setMessages(prevMessages =>
      hydrateMessagesWithMyReactions(
        deduplicatedMessages(prevMessages, [newMessage], false),
        currentUser?.id,
      ) ?? null,
    );

    return newMessage;
  };

  const sendMessage = async (
    newMessage: BaseChatMessage,
    channel: any,
  ): Promise<any> => {
    return sendMessageAPI(channel, newMessage);
  };

  const sendMessageAI = async (
    newMessage: BaseChatMessage,
    channel: any,
  ): Promise<any> => {
    console.log('sendMessageAI');
    return sendMessageAIAPI(channel, newMessage);
  };

  const deleteMessage = async (
    channel: any,
    threadItemID: string,
  ): Promise<any> => {
    return deleteMessageAPI(channel, threadItemID);
  };

  const deduplicatedMessages = (
    oldMessages: BaseChatMessage[] | null,
    newMessages: BaseChatMessage[] | null | undefined,
    appendToBottom: boolean,
  ): BaseChatMessage[] => {
    const oldList = [...(oldMessages ?? [])];
    const newList = [...(newMessages ?? [])];

    const all = oldMessages
      ? appendToBottom
        ? [...oldList, ...newList]
        : [...newList, ...oldList]
      : newList;

    const deduplicated = all.reduce<BaseChatMessage[]>((acc, curr) => {
      if (!acc.some(message => message.id === curr.id)) {
        acc.push(curr);
      }
      return acc;
    }, []);

    return deduplicated.sort((a, b) => {
      return (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0);
    });
  };

  return {
    messages,
    subscribeToMessages,
    // subscribeToMessagesAI,
    loadMoreMessages,
    sendMessage,
    sendMessageAI,
    optimisticSetMessage,
    deleteMessage,
    addReaction,
    getMessageObject,
  };
};