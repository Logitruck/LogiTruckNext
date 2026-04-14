import React from 'react';
import { Linking, StyleProp, TextStyle } from 'react-native';
import ParsedText from 'react-native-parsed-text';
import styles from './styles';

type UserInfo = {
  firstName: string;
  userID: string;
  id: string;
};

type IMRichTextTXViewProps = {
  children?: React.ReactNode;
  onHashTagPress?: (text: string, matchIndex: number) => void;
  onUserPress?: (user: UserInfo) => void;
  defaultTextStyle?: StyleProp<TextStyle>;
  usernameStyle?: StyleProp<TextStyle>;
  hashTagStyle?: StyleProp<TextStyle>;
  phoneStyle?: StyleProp<TextStyle>;
  emailStyle?: StyleProp<TextStyle>;
};

export default function IMRichTextTXView(props: IMRichTextTXViewProps) {
  const {
    children,
    onHashTagPress,
    defaultTextStyle,
    usernameStyle,
    hashTagStyle,
    phoneStyle,
    emailStyle,
  } = props;

  const onEmailPress = async (email: string, _matchIndex: number) => {
    await Linking.openURL(`mailto:${email}`);
  };

  const onPhonePress = async (phoneNumber: string, _matchIndex: number) => {
    await Linking.openURL(`tel:${phoneNumber}`);
  };

  const onUrlPress = async (url: string, _matchIndex: number) => {
    const followsProtocol = url.startsWith('http');

    if (followsProtocol) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(`https://${url}`);
    }
  };

  const onUserPress = (user: string, _matchIndex: number) => {
    const pattern = /@\[([^\]]+?)\]\(id:([^\]]+?)\)/gim;
    const match = pattern.exec(user);

    if (!match) {
      return;
    }

    const userInfo: UserInfo = {
      firstName: match[1],
      userID: match[2],
      id: match[2],
    };

    props.onUserPress?.(userInfo);
  };

  const renderText = (matchingString: string, _matches: string[]) => {
    const pattern = /@\[([^\]]+?)\]\(id:([^\]]+?)\)/gim;
    const match = pattern.exec(matchingString);

    if (!match) {
      return matchingString;
    }

    return `${match[1]}`;
  };

  return (
    <ParsedText
      style={defaultTextStyle}
      parse={[
        { type: 'url', style: styles.url, onPress: onUrlPress },
        {
          type: 'phone',
          style: [styles.phone, phoneStyle],
          onPress: onPhonePress,
        },
        {
          type: 'email',
          style: [styles.email, emailStyle],
          onPress: onEmailPress,
        },
        {
          pattern: /@\[([^\]]+?)\]\(id:([^\]]+?)\)/gim,
          style: [styles.username, usernameStyle],
          onPress: props.onUserPress ? onUserPress : undefined,
          renderText,
        },
        {
          pattern: /#(\w+)/,
          style: [styles.hashTag, hashTagStyle],
          onPress: onHashTagPress,
        },
      ]}
      childrenProps={{ allowFontScaling: false }}
    >
      {children}
    </ParsedText>
  );
}