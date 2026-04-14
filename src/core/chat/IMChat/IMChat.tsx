import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import {
  useTheme,
  useTranslations,
  ActivityIndicator,
  TouchableIcon,
  MediaViewerModal,
  KeyboardAvoidingView,
} from '../../dopebase';
import DialogInput from 'react-native-dialog-input';
import { useChatChannels } from '../api/firebase/useChatChannels';
import BottomInput from './BottomInput';
import MessageThread from './MessageThread';
import dynamicStyles from './styles';
import { EU } from '../../mentions/IMRichTextInput/EditorUtil';
import { ForwardMessageModal } from './ForwardMessageModal';
import type {
  BaseChatMessage,
  ChatSender,
  ReactionKey,
} from '../api/utils';
import type {
  ChatChannel,
  ChatParticipant,
} from '../api/firebase/firebaseChatClient';

const reactionIcons: ReactionKey[] = [
  'like',
  'love',
  'laugh',
  'surprised',
  'cry',
  'angry',
];

const assets: Record<ReactionKey, any> = {
  surprised: require('../assets/wow.png'),
  laugh: require('../assets/crylaugh.png'),
  cry: require('../assets/crying.png'),
  like: require('../assets/blue-like.png'),
  love: require('../assets/red-heart.png'),
  angry: require('../assets/anger.png'),
  sad: require('../assets/crying.png'),
};

type ThreadActionSheetState = {
  inBound?: boolean;
  options?: string[];
  reactionsPosition?: number;
};

type RichTextChange = {
  displayText?: string;
  text?: string;
  content?: string;
  mentions?: any[];
  [key: string]: any;
};

type IMChatProps = {
  onSendInput: () => void;
  onSendAIInput?: () => void;
  messages: BaseChatMessage[] | null;
  inputValue: RichTextChange | string | null;
  onChangeTextInput: (value: RichTextChange) => void;
  user: ChatSender;
  loading?: boolean;
  inReplyToItem?: BaseChatMessage | null;
  onAddMediaPress: () => void;
  mediaItemURLs: string[];
  isMediaViewerOpen: boolean;
  selectedMediaIndex: number;
  onChatMediaPress: (item: BaseChatMessage) => void;
  onMediaClose: () => void;
  onChangeName: (text: string) => void;
  onAddDocPress: () => void;
  isRenameDialogVisible: boolean;
  showRenameDialog: (show: boolean) => void;
  onViewMembers?: (channel: ChatChannel) => void;
  onLeave?: (channel: ChatChannel) => void;
  onDeleteGroup?: (channel: ChatChannel) => void;
  onSenderProfilePicturePress?: (item: any) => void;
  onReplyActionPress?: (item: BaseChatMessage | null) => void;
  onReplyingToDismiss?: () => void;
  onDeleteThreadItem?: (item: BaseChatMessage | null) => void;
  channelItem?: ChatChannel | null;
  onListEndReached?: () => void;
  isInputClear?: boolean;
  setIsInputClear: (value: boolean) => void;
  onChatUserItemPress?: (item: ChatParticipant | ChatSender) => void;
  onReaction: (reaction: ReactionKey, message: BaseChatMessage | null) => void;
  onForwardMessageActionPress?: (
    channel: ChatChannel,
    message: BaseChatMessage | null,
  ) => void;
  isChatBot?: boolean;
};

function IMChat(props: IMChatProps) {
  const {
    onSendInput,
    onSendAIInput,
    messages,
    inputValue,
    onChangeTextInput,
    user,
    loading = false,
    inReplyToItem,
    onAddMediaPress,
    mediaItemURLs,
    isMediaViewerOpen,
    selectedMediaIndex,
    onChatMediaPress,
    onMediaClose,
    onChangeName,
    onAddDocPress,
    isRenameDialogVisible,
    showRenameDialog,
    onReplyActionPress,
    onReplyingToDismiss,
    onDeleteThreadItem,
    channelItem,
    onListEndReached,
    isInputClear,
    setIsInputClear,
    onChatUserItemPress,
    onReaction,
    onForwardMessageActionPress,
    isChatBot = false,
  } = props;

  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
  const { markUserAsTypingInChannel } = useChatChannels();

  const [loadingMessages, setLoadingMessages] = useState(false);
  const [, setLocalMessages] = useState<BaseChatMessage[] | null>(messages);
  const [channel] = useState<Record<string, any>>({});
  const [temporaryInReplyToItem, setTemporaryInReplyToItem] =
    useState<BaseChatMessage | null>(null);
  const [threadItemActionSheet, setThreadItemActionSheet] =
    useState<ThreadActionSheetState>({});
  const [isReactionsContainerVisible, setIsReactionsContainerVisible] =
    useState(false);
  const [showForwardMessageModal, setShowForwardMessageModal] =
    useState(false);

  const textInputRef = useRef<any>(null);

  useEffect(() => {
    if (loadingMessages) {
      const timer = setTimeout(() => {
        setLoadingMessages(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loadingMessages]);

  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  const CANCEL = localized('Cancel');
  const REPLY = localized('Reply');
  const FORWARD = localized('Forward');
  const DELETE = localized('Delete');

  const mediaThreadItemSheetOptions = [CANCEL, FORWARD];
  const inBoundThreadItemSheetOptions = [REPLY, FORWARD];
  const outBoundThreadItemSheetOptions = [REPLY, FORWARD, DELETE];

  const markUserAsTyping = (displayValue: string | undefined) => {
    const text = displayValue || '';

    if (text.length > 0 && channelItem?.id && user?.id) {
      markUserAsTypingInChannel(channelItem.id, user.id);
    }
  };

  const onChangeText = useCallback(
    ({ displayText, text }: RichTextChange) => {
      const safeText = text ?? '';
      const mentions = EU.findMentions(safeText);

      onChangeTextInput({
        content: safeText,
        text: safeText,
        displayText,
        mentions,
      });

      markUserAsTyping(displayText);
    },
    [onChangeTextInput, channelItem?.id, user?.id],
  );

  const onSend = useCallback(() => {
    textInputRef.current?.clear?.();
    onSendInput();
  }, [onSendInput]);

  const onSendAI = useCallback(() => {
    textInputRef.current?.clear?.();
    onSendAIInput?.();
  }, [onSendAIInput]);

  const onMessageLongPress = useCallback(
    (
      threadItem: BaseChatMessage,
      isMedia?: boolean,
      reactionsPosition?: number,
    ) => {
      setTemporaryInReplyToItem(threadItem);
      setIsReactionsContainerVisible(true);

      if (isMedia) {
        setThreadItemActionSheet({
          options: mediaThreadItemSheetOptions,
          reactionsPosition,
        });
      } else if (user.id === threadItem?.senderID) {
        setThreadItemActionSheet({
          inBound: false,
          options: outBoundThreadItemSheetOptions,
          reactionsPosition,
        });
      } else {
        setThreadItemActionSheet({
          inBound: true,
          options: inBoundThreadItemSheetOptions,
          reactionsPosition,
        });
      }
    },
    [user.id],
  );

  const onReplyPress = useCallback(
    (index: number) => {
      if (index === 0) {
        onReplyActionPress?.(temporaryInReplyToItem);
      }
    },
    [onReplyActionPress, temporaryInReplyToItem],
  );

  const handleInBoundThreadItemActionSheet = useCallback(
    (index: number) => {
      if (index === inBoundThreadItemSheetOptions.indexOf(REPLY)) {
        return onReplyPress(index);
      }
      if (index === inBoundThreadItemSheetOptions.indexOf(FORWARD)) {
        return setShowForwardMessageModal(true);
      }
    },
    [onReplyPress],
  );

  const handleOutBoundThreadItemActionSheet = useCallback(
    (index: number) => {
      if (index === outBoundThreadItemSheetOptions.indexOf(REPLY)) {
        return onReplyPress(index);
      }

      if (index === outBoundThreadItemSheetOptions.indexOf(FORWARD)) {
        return setShowForwardMessageModal(true);
      }

      if (index === outBoundThreadItemSheetOptions.indexOf(DELETE)) {
        return onDeleteThreadItem?.(temporaryInReplyToItem);
      }
    },
    [onDeleteThreadItem, onReplyPress, temporaryInReplyToItem],
  );

  const handleMediaThreadItemActionSheet = useCallback((index: number) => {
    if (index === mediaThreadItemSheetOptions.indexOf(FORWARD)) {
      setShowForwardMessageModal(true);
    }
  }, []);

  const onThreadItemActionSheetDone = useCallback(
    (index: number) => {
      if (threadItemActionSheet.inBound !== undefined) {
        if (threadItemActionSheet.inBound) {
          handleInBoundThreadItemActionSheet(index);
        } else {
          handleOutBoundThreadItemActionSheet(index);
        }
      } else {
        handleMediaThreadItemActionSheet(index);
      }
    },
    [
      threadItemActionSheet.inBound,
      handleInBoundThreadItemActionSheet,
      handleOutBoundThreadItemActionSheet,
      handleMediaThreadItemActionSheet,
    ],
  );

  const onForwardMessage = useCallback(
    (forwardChannel: ChatChannel) => {
      if (onForwardMessageActionPress) {
        onForwardMessageActionPress(forwardChannel, temporaryInReplyToItem);
      }
    },
    [onForwardMessageActionPress, temporaryInReplyToItem],
  );

  const onReactionPress = async (reaction: ReactionKey) => {
    setIsReactionsContainerVisible(false);
    onReaction(reaction, temporaryInReplyToItem);
  };

  const renderReactionButtonIcon = (
    src: any,
    tappedIcon: ReactionKey,
    index: number,
  ) => {
    return (
      <TouchableIcon
        key={index + 'icon'}
        containerStyle={styles.reactionIconContainer}
        iconSource={src}
        imageStyle={styles.reactionIcon}
        onPress={() => onReactionPress(tappedIcon)}
      />
    );
  };

  const renderReactionsContainer = () => {
    if (isReactionsContainerVisible) {
      return (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => {
            setIsReactionsContainerVisible(false);
          }}
          style={styles.threadReactionContainer}
        >
          <View
            style={[
              styles.reactionContainer,
              { top: threadItemActionSheet?.reactionsPosition },
            ]}
          >
            {reactionIcons.map((icon, index) =>
              renderReactionButtonIcon(assets[icon], icon, index),
            )}
          </View>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderThreadItemActionSheet = () => {
    return (
      <View
        style={[
          styles.threadItemActionSheetContainer,
          styles.bottomContentContainer,
        ]}
      >
        {threadItemActionSheet?.options?.map((item, index) => {
          return (
            <TouchableOpacity
              key={item + index}
              onPress={() => {
                onThreadItemActionSheetDone(index);
                setIsReactionsContainerVisible(false);
              }}
            >
              <Text style={styles.threadItemActionSheetOptionsText}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.personalChatContainer}>
      <>
        <MessageThread
          messages={messages}
          user={user}
          onChatMediaPress={onChatMediaPress}
          onSenderProfilePicturePress={props.onSenderProfilePicturePress}
          onMessageLongPress={onMessageLongPress}
          channelItem={channelItem}
          onListEndReached={onListEndReached}
          onChatUserItemPress={onChatUserItemPress}
        />

        {renderReactionsContainer()}

        {!isReactionsContainerVisible && (
          <BottomInput
            textInputRef={textInputRef}
            value={inputValue}
            onChangeText={onChangeText}
            onSend={onSend}
            onSendAI={onSendAI}
            onAddMediaPress={onAddMediaPress}
            onAddDocPress={onAddDocPress}
            inReplyToItem={inReplyToItem}
            onReplyingToDismiss={onReplyingToDismiss}
            participants={channelItem?.participants}
            clearInput={isInputClear}
            setClearInput={setIsInputClear}
            onChatUserItemPress={onChatUserItemPress}
            isChatBot={isChatBot}
          />
        )}

        {isReactionsContainerVisible && renderThreadItemActionSheet()}
      </>

      <DialogInput
        isDialogVisible={isRenameDialogVisible}
        title={localized('Change Name')}
        hintInput={channel.name}
        textInputProps={{ selectTextOnFocus: true }}
        submitText={localized('OK')}
        submitInput={onChangeName}
        closeDialog={() => {
          showRenameDialog(false);
        }}
      />

      <MediaViewerModal
        mediaItems={mediaItemURLs}
        isModalOpen={isMediaViewerOpen}
        onClosed={onMediaClose}
        selectedMediaIndex={selectedMediaIndex}
      />

{showForwardMessageModal && (
  <ForwardMessageModal
    isVisible={showForwardMessageModal}
    onDismiss={() => setShowForwardMessageModal(false)}
    onSend={onForwardMessage}
    availableParticipants={[]}
  />
)}

      {loading && <ActivityIndicator />}
    </KeyboardAvoidingView>
  );
}

export default IMChat;