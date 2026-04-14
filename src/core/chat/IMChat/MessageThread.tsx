import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, View, ListRenderItem } from 'react-native';
import { useTheme } from '../../dopebase';
import ThreadItem from './ThreadItem';
import TypingIndicator from './TypingIndicator';
import dynamicStyles from './styles';
import type {
  ChatChannel,
  ChatMessage,
  ChatParticipant,
} from '../api/firebase/firebaseChatClient';

type TypingUserInfo = {
  lastTypingDate?: number;
  [key: string]: any;
};

type ChannelWithTyping = ChatChannel & {
  typingUsers?: Record<string, TypingUserInfo>;
  participants?: ChatParticipant[];
};

type CurrentUser = ChatParticipant & {
  id: string;
};

type MessageThreadProps = {
  messages?: ChatMessage[] | null;
  user: CurrentUser;
  onChatMediaPress?: (item: ChatMessage) => void;
  onSenderProfilePicturePress?: (item: ChatParticipant) => void;
  onMessageLongPress?: (
    item: ChatMessage,
    isMedia?: boolean,
    reactionsPosition?: number,
  ) => void;
channelItem?: ChannelWithTyping | null;
  onListEndReached?: () => void;
  onChatUserItemPress?: (item: ChatParticipant) => void;
};

function MessageThread({
  messages,
  user,
  onChatMediaPress,
  onSenderProfilePicturePress,
  onMessageLongPress,
  channelItem,
  onListEndReached,
  onChatUserItemPress,
}: MessageThreadProps) {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const [isParticipantTyping, setIsParticipantTyping] = useState(false);

  const updateTypingIndicator = useCallback(() => {
    const userID = user.id;
    const typingUsers = channelItem?.typingUsers;

    if (typingUsers) {
      const currentTime = Math.floor(Date.now() / 1000);
      const keys = Object.keys(typingUsers);

      for (let i = 0; i < keys.length; i++) {
        const typingUserID = keys[i];

        if (typingUserID !== userID) {
          const { lastTypingDate } = typingUsers[typingUserID] || {};

          if (
            typeof lastTypingDate === 'number' &&
            currentTime - lastTypingDate <= 3
          ) {
            setIsParticipantTyping(true);

            setTimeout(() => {
              updateTypingIndicator();
            }, 1000);

            return;
          }
        }
      }
    }

    setIsParticipantTyping(false);
  }, [channelItem?.typingUsers, user.id]);

  useEffect(() => {
    if (channelItem?.typingUsers) {
      updateTypingIndicator();
    }
  }, [channelItem?.typingUsers, updateTypingIndicator]);

  const renderListHeaderComponent = () => {
    return isParticipantTyping ? (
      <View style={styles.receiveItemContainer}>
        <View style={styles.indicatorContainer}>
          <View style={styles.typingIndicatorContainer}>
            <TypingIndicator
              containerStyle={styles.indicatorDotContainer}
              dotRadius={5}
            />
          </View>
          <View style={styles.typingIndicatorContentSupport} />
          <View style={styles.typingIndicatorSupport} />
        </View>
      </View>
    ) : null;
  };

  const renderChatItem: ListRenderItem<ChatMessage> = ({ item, index }) => {
    const isRecentItem = index === 0;
    const participants = channelItem?.participants ?? [];

    return (
      <ThreadItem
        item={item}
        participants={participants}
        key={`chatitem${item.id || index}`}
        user={{ ...user, userID: user.id }}
        onChatMediaPress={onChatMediaPress}
        onSenderProfilePicturePress={onSenderProfilePicturePress}
        onMessageLongPress={onMessageLongPress}
        isRecentItem={isRecentItem}
        onChatUserItemPress={onChatUserItemPress}
      />
    );
  };

  return (
    <FlatList
      inverted
      style={styles.messageThreadContainer}
      showsVerticalScrollIndicator={false}
      data={messages ?? []}
      renderItem={renderChatItem}
      contentContainerStyle={styles.messageContentThreadContainer}
      removeClippedSubviews
      ListHeaderComponent={renderListHeaderComponent}
      keyboardShouldPersistTaps="never"
      onEndReached={onListEndReached}
      onEndReachedThreshold={0.3}
    />
  );
}

export default MessageThread;