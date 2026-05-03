import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../../core/dopebase';
import dynamicStyles from '../screens/SupportAssistantScreen/styles';
import { SupportMessage } from '../types';

type Props = {
  message: SupportMessage;
};

const SupportMessageBubble = ({ message }: Props) => {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const isUser = message.sender === 'user';

  return (
    <View
      style={[
        styles.messageRow,
        isUser ? styles.messageRowUser : styles.messageRowAssistant,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.messageBubbleUser : styles.messageBubbleAssistant,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isUser ? styles.messageTextUser : styles.messageTextAssistant,
          ]}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
};

export default SupportMessageBubble;