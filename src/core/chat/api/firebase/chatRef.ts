import {
  collection,
  doc,
  getFirestore,
} from 'firebase/firestore';
import {
  getFunctions,
  httpsCallable,
} from 'firebase/functions';

const db = getFirestore();
const functions = getFunctions();

export const channelsRef = collection(db, 'channels');
export const socialFeedsRef = collection(db, 'social_feeds');

export const DocRef = (id: string) => {
  return {
    socialFeedDoc: doc(db, 'social_feeds', id),
    channelDoc: doc(db, 'channels', id),
    chatFeedLive: collection(db, 'social_feeds', id, 'chat_feed_live'),
    messagesLive: collection(db, 'channels', id, 'messages_live'),
  };
};

export const ChatFunctions = () => {
  return {
    listChannels: httpsCallable(functions, 'listChannels'),
    listChannelsWithFilters: httpsCallable(
      functions,
      'listChannelsWithFilters',
    ),
    createChannel: httpsCallable(functions, 'createChannel'),
    createChannelAI: httpsCallable(functions, 'createChannelAI'),
    markAsRead: httpsCallable(functions, 'markAsRead'),
    markUserAsTypingInChannel: httpsCallable(
      functions,
      'markUserAsTypingInChannel',
    ),
    deleteMessage: httpsCallable(functions, 'deleteMessage'),
    listMessages: httpsCallable(functions, 'listMessages'),
    deleteGroup: httpsCallable(functions, 'deleteGroup'),
    leaveGroup: httpsCallable(functions, 'leaveGroup'),
    updateGroup: httpsCallable(functions, 'updateGroup'),
    addMessageReaction: httpsCallable(functions, 'addMessageReaction'),
    insertMessage: httpsCallable(functions, 'insertMessage'),
    insertMessageAI: httpsCallable(functions, 'insertMessageAI'),
  };
};