import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  TouchableHighlight,
  Image,
  Text,
  Platform,
  ImageSourcePropType,
} from 'react-native';
import { useTheme, useTranslations } from '../../dopebase';
import dynamicStyles from './styles';
import { IMMentionList, IMRichTextInput } from '../../mentions';
import IMRichTextView from '../../mentions/IMRichTextView/IMRichTextView';
import type { ChatParticipant } from '../api/firebase/firebaseChatClient';

const assets: Record<string, ImageSourcePropType> = {
  cameraFilled: require('../assets/camera-filled.png'),
  send: require('../assets/send.png'),
  close: require('../assets/close-x-icon.png'),
  newDocument: require('../assets/new-document.png'),
};

type MentionParticipant = ChatParticipant & {
  id: string;
  name: string;
};

type RichTextChange = {
  content?: string;
  displayText?: string;
  mentions?: any[];
  [key: string]: any;
};

type InReplyToItem = {
  senderFirstName?: string;
  senderLastName?: string;
  content?: string;
  [key: string]: any;
};

type BottomInputProps = {
  value?: RichTextChange | string | null;
  onChangeText: (value: RichTextChange) => void;
  onSend: () => void;
  onSendAI?: () => void;
  onAddMediaPress: () => void;
  onAddDocPress: () => void;
  inReplyToItem?: InReplyToItem | null;
  onReplyingToDismiss?: () => void;
  participants?: ChatParticipant[];
  clearInput?: boolean;
  setClearInput: (value: boolean) => void;
  onChatUserItemPress?: (item: any) => void;
  textInputRef: React.RefObject<any>;
  isChatBot?: boolean;
};

function BottomInput({
  value,
  onChangeText,
  onSend,
  onSendAI,
  onAddMediaPress,
  onAddDocPress,
  inReplyToItem,
  onReplyingToDismiss,
  participants,
  clearInput,
  setClearInput,
  onChatUserItemPress,
  textInputRef,
  isChatBot,
}: BottomInputProps) {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const editorRef = useRef<any>(null);
  const [showUsersMention, setShowUsersMention] = useState(false);
  const [mentionsKeyword, setMentionsKeyword] = useState('');
  const [isTrackingStarted, setIsTrackingStarted] = useState(false);
  const [disabled, setDisabled] = useState(true);

  const formattedParticipants = useMemo<MentionParticipant[]>(() => {
    if (!participants) {
      return [];
    }

    return participants
      .map(user => {
        const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
        const id = user.id || user.userID;

        if (!id) {
          return null;
        }

        return { ...user, id, name };
      })
      .filter(Boolean) as MentionParticipant[];
  }, [participants]);

  const onChange = useCallback(
    (textObject: RichTextChange) => {
      const { displayText } = textObject;
      setDisabled((displayText?.length ?? 0) === 0);
      onChangeText(textObject);
    },
    [onChangeText],
  );

  const editorStyles = useMemo(
    () => ({
      input: {
        color: theme.colors[appearance].primaryText,
        paddingLeft: 0,
        ...Platform.select({
          web: {
            height: '100%',
          },
        }),
      },
      placeholderText: {
        color: theme.colors[appearance].secondaryText,
      },
      inputMaskText: {
        color: theme.colors[appearance].secondaryText,
      },
    }),
    [theme, appearance],
  );

  const handleSuggestionTap = useCallback((item: MentionParticipant) => {
    editorRef.current?.onSuggestionTap?.(item);
  }, []);

  const renderBottomInput = useCallback(() => {
    return (
      <View style={styles.bottomContentContainer}>
        {inReplyToItem ? (
          <View style={styles.inReplyToView}>
            <Text style={styles.replyingToHeaderText}>
              {localized('Replying to')}{' '}
              <Text style={styles.replyingToNameText}>
                {inReplyToItem.senderFirstName || inReplyToItem.senderLastName}
              </Text>
            </Text>

            <IMRichTextView
              onUserPress={onChatUserItemPress}
              defaultTextStyle={styles.replyingToContentText}
            >
              {inReplyToItem.content}
            </IMRichTextView>

            <TouchableHighlight
              style={styles.replyingToCloseButton}
              onPress={onReplyingToDismiss}
            >
              <Image source={assets.close} style={styles.replyingToCloseIcon} />
            </TouchableHighlight>
          </View>
        ) : null}

        <View style={styles.inputBar}>
          <View style={styles.leftIcons}>
            <TouchableOpacity
              onPress={onAddDocPress}
              style={styles.inputIconContainer}
            >
              <Image style={styles.inputIcon} source={assets.newDocument} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onAddMediaPress}
              style={styles.inputIconContainer}
            >
              <Image style={styles.inputIcon} source={assets.cameraFilled} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity activeOpacity={1} style={styles.inputContainer}>
            <IMRichTextInput
              richTextInputRef={editorRef}
              inputRef={textInputRef}
              initialValue=""
              multiline={Platform.OS !== 'web'}
              clearInput={clearInput}
              placeholder={localized('Start typing here...')}
              onChange={onChange}
              editable={true}
              showEditor={true}
              toggleEditor={() => {}}
              editorStyles={editorStyles}
              showMentions={showUsersMention}
              onHideMentions={() => setShowUsersMention(false)}
              onUpdateSuggestions={setMentionsKeyword}
              onTrackingStateChange={setIsTrackingStarted}
              setClearInput={setClearInput}
              autoFocus={true}
            />
          </TouchableOpacity>

          <TouchableOpacity
            disabled={disabled}
            onPress={() => {
              setDisabled(true);
              if (isChatBot) {
                onSendAI?.();
              } else {
                onSend();
              }
            }}
            style={[
              styles.inputIconContainer,
              disabled ? { opacity: 0.2 } : { opacity: 1 },
            ]}
          >
            <Image style={styles.inputIcon} source={assets.send} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [
    styles,
    inReplyToItem,
    localized,
    onChatUserItemPress,
    onReplyingToDismiss,
    onAddDocPress,
    onAddMediaPress,
    clearInput,
    editorStyles,
    showUsersMention,
    setClearInput,
    disabled,
    isChatBot,
    onSendAI,
    onSend,
    textInputRef,
    onChange,
  ]);

  return (
    <>
      <IMMentionList
        list={formattedParticipants}
        keyword={mentionsKeyword}
        isTrackingStarted={isTrackingStarted}
        onSuggestionTap={handleSuggestionTap}
      />
      {renderBottomInput()}
    </>
  );
}

export default BottomInput;