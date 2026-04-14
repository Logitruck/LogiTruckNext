import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTheme, useTranslations } from '../../dopebase';
import IMConversationIconView from './IMConversationIconView/IMConversationIconView';
import { timeFormat } from '../../helpers/timeFormat';
import dynamicStyles from './styles';
import { formatMessage } from '../helpers/utils';
import { IMRichTextView } from '../../mentions';
import type {
  ChatChannel,
  ChatParticipant,
} from '../api/firebase/firebaseChatClient';
import type { ChatSender } from '../api/utils';

type ConversationItem = ChatChannel & {
  title?: string;
  markedAsRead?: boolean;
  updatedAt?: any;
  createdAt?: any;
};

type IMConversationViewProps = {
  onChatItemPress: (item: ConversationItem) => void;
  item: ConversationItem;
  user?: ChatParticipant | ChatSender | Record<string, any> | null;
};

function IMConversationView({
  onChatItemPress,
  item,
  user,
}: IMConversationViewProps) {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const userID = user?.userID || user?.id;
  const { markedAsRead } = item;

  const title = item.title || item.name || '';

  const participantsToShow =
    item?.admins?.length
      ? item.participants ?? []
      : (item.participants ?? []).filter((value) => value?.id !== userID);

  return (
    <TouchableOpacity
      onPress={() => onChatItemPress(item)}
      style={styles.chatItemContainer}
    >
      <IMConversationIconView participants={participantsToShow} />

      <View style={styles.chatItemContent}>
        <Text
          style={[
            styles.chatFriendName,
            !markedAsRead && styles.unReadmessage,
          ]}
        >
          {title}
        </Text>

        <View style={styles.content}>
          <Text
            numberOfLines={1}
            ellipsizeMode="middle"
            style={[styles.message, !markedAsRead && styles.unReadmessage]}
          >
            <IMRichTextView
              emailStyle={[styles.message, !markedAsRead && styles.unReadmessage]}
              phoneStyle={[styles.message, !markedAsRead && styles.unReadmessage]}
              hashTagStyle={[styles.message, !markedAsRead && styles.unReadmessage]}
              usernameStyle={[styles.message, !markedAsRead && styles.unReadmessage]}
            >
              {formatMessage(item, localized) || ' '}
            </IMRichTextView>
            {' • '}
            <Text
              numberOfLines={1}
              ellipsizeMode="middle"
              style={[styles.message, !markedAsRead && styles.unReadmessage]}
            >
              {timeFormat(item.updatedAt || item.createdAt)}
            </Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default IMConversationView;