import { useRef } from 'react';
import { addReaction as addReactionAPI } from './firebaseChatClient';
import type { BaseChatMessage, ReactionKey } from '../utils';

type MessageAuthor = {
  id: string;
  [key: string]: any;
};

type SetMessages = React.Dispatch<
  React.SetStateAction<BaseChatMessage[] | null>
>;

export const useReactions = (setMessages: SetMessages) => {
  const inFlightReactionRequest = useRef<boolean>(false);

  const handleMessageReaction = async (
    message: BaseChatMessage,
    reactionType: ReactionKey | null,
    author: MessageAuthor,
    channelID: string,
  ) => {
    if (inFlightReactionRequest.current === true) {
      return;
    }

    if (!message?.id || !author?.id || !channelID) {
      return;
    }

    inFlightReactionRequest.current = true;

    if (
      message.myReaction &&
      (message.myReaction === reactionType || reactionType === null)
    ) {
      setMessages(oldMessages => {
        return (
          oldMessages?.map(oldMessage => {
            if (oldMessage.id === message.id) {
              return {
                ...oldMessage,
                myReaction: null,
                reactionsCount: Math.max(
                  0,
                  (oldMessage.reactionsCount || 0) - 1,
                ),
              };
            }
            return oldMessage;
          }) ?? null
        );
      });
    } else {
      const reactionsCount = message.reactionsCount
        ? message.myReaction
          ? message.reactionsCount
          : message.reactionsCount + 1
        : 1;

      setMessages(oldMessages => {
        return (
          oldMessages?.map(oldMessage => {
            if (oldMessage.id === message.id) {
              return {
                ...oldMessage,
                myReaction: reactionType,
                reactionsCount,
              };
            }
            return oldMessage;
          }) ?? null
        );
      });
    }

    const finalReaction = (reactionType ?? message.myReaction ?? '') as string;

    const res = await addReactionAPI(
      message.id,
      author.id,
      finalReaction,
      channelID,
    );

    inFlightReactionRequest.current = false;
    return res;
  };

  return {
    handleMessageReaction,
  };
};