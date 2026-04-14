import 'react-native-get-random-values';
import { v4 as uuid } from 'uuid';
import { getUnixTimeStamp } from '../../helpers/timeFormat';

export type ReactionKey =
  | 'like'
  | 'love'
  | 'laugh'
  | 'angry'
  | 'surprised'
  | 'cry'
  | 'sad';

export type ReactionsDict = Partial<Record<ReactionKey, string[]>>;

export type ChatSender = {
  id: string;
  firstName?: string;
  fullname?: string;
  username?: string;
  profilePictureURL?: string;
  profilePictureKey?: string;
  [key: string]: any;
};

export type BaseChatMessage = {
  id?: string;
  createdAt?: number;
  content?: string;
  reactions?: ReactionsDict;
  reactionsCount?: number;
  myReaction?: ReactionKey | null;
  media?: Record<string, any> | null;
  inReplyToItem?: any;
  inReplyToStory?: boolean;
  story?: any;
  readUserIDs?: string[];
  forwardMessage?: boolean;
  senderFirstName?: string;
  senderUsername?: string;
  senderID?: string;
  senderLastName?: string;
  senderProfilePictureURL?: string;
  senderProfilePictureKey?: string;
  [key: string]: any;
};

export const hydrateMessagesWithMyReactions = (
  messages: BaseChatMessage[] | null | undefined,
  userID?: string,
): BaseChatMessage[] | undefined => {
  return messages?.map(message => {
    const myReaction = getMyReaction(message.reactions, userID);

    return myReaction ? { ...message, myReaction } : message;
  });
};

const getMyReaction = (
  reactionsDict?: ReactionsDict,
  userID?: string,
): ReactionKey | null => {
  const reactionKeys: ReactionKey[] = [
    'like',
    'love',
    'laugh',
    'angry',
    'surprised',
    'cry',
    'sad',
  ];

  let result: ReactionKey | null = null;

  reactionKeys.forEach(reactionKey => {
    if (
      reactionsDict &&
      reactionsDict[reactionKey] &&
      userID &&
      reactionsDict[reactionKey]?.includes(userID)
    ) {
      result = reactionKey;
    }
  });

  return result;
};

export const getMessageObject = (
  sender: ChatSender,
  message: Record<string, any>,
  media: Record<string, any> | null,
  inReplyToItem: any,
  forwardMessage: boolean = false,
  inReplyToStory: boolean = false,
  story: any = null,
): BaseChatMessage => {
  const { profilePictureURL, profilePictureKey } = sender;
  const userID = sender.id;
  const timestamp = getUnixTimeStamp();
  const messageID = uuid();

  return {
    ...message,
    id: messageID,
    createdAt: timestamp,
    senderFirstName: sender.firstName || sender.fullname,
    senderUsername: sender.username || sender.firstName,
    senderID: userID,
    senderLastName: '',
    senderProfilePictureURL: profilePictureURL,
    media,
    inReplyToItem,
    inReplyToStory,
    story,
    readUserIDs: [userID],
    forwardMessage,
    ...(profilePictureKey
      ? { senderProfilePictureKey: profilePictureKey }
      : {}),
  };
};