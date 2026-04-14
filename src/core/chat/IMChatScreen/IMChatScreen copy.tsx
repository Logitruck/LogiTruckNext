import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import { View, Dimensions, Platform } from 'react-native';
import {
  useTheme,
  useTranslations,
  Alert,
  IconButton,
  useActionSheet,
} from '../../dopebase';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useCurrentUser } from '../../onboarding/hooks/useAuth';
import IMChat from '../IMChat/IMChat';
import {
  useChatMessages,
  useChatChannels,
  useChatSingleChannel,
} from '../../chat/api';
import { storageAPI } from '../../media';
import { formatMessage } from '../helpers/utils';
import type {
  ChatChannel,
  ChatParticipant,
} from '../../chat/api/firebase/firebaseChatClient';
import type {
  BaseChatMessage,
  ChatSender,
  ReactionKey,
} from '../api/utils';

type UploadData = {
  uri?: string;
  url?: string;
  source?: string;
  type?: string;
  name?: string;
  fileName?: string;
  mimeType?: string;
  fileID?: string | number;
  thumbnailURL?: string;
  thumbnailKey?: string;
  urlKey?: string;
  [key: string]: any;
};

type RouteParams = {
  channel: ChatChannel;
  openedFromPushNotification?: boolean;
  isChatUserItemPress?: boolean;
  isChatBot?: boolean;
  title?: string;
};

type IMChatScreenProps = {
  navigation: any;
  route: {
    params: RouteParams;
  };
};

const IMChatScreen = ({ navigation, route }: IMChatScreenProps) => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const colors = theme.colors[appearance];
  const currentUser = useCurrentUser() as ChatSender;

  const openedFromPushNotification =
    route.params.openedFromPushNotification ?? false;
  const isChatUserItemPress = route.params.isChatUserItemPress ?? false;
  const isChatBot = route.params.isChatBot ?? false;

  const initialChannel = route?.params?.channel;
  const initialChannelID =
    initialChannel?.channelID || initialChannel?.id || null;

  const {
    messages,
    subscribeToMessages,
    loadMoreMessages,
    sendMessage: sendMessageAPI,
    sendMessageAI: sendMessageAIAPI,
    optimisticSetMessage,
    deleteMessage,
    addReaction,
    getMessageObject,
  } = useChatMessages();

  const {
    createChannel,
    markChannelMessageAsRead,
    updateGroup,
    leaveGroup,
    deleteGroup,
  } = useChatChannels();

  const { remoteChannel, subscribeToSingleChannel } = useChatSingleChannel();
  const { showActionSheetWithOptions } = useActionSheet();

  const [channel, setChannel] = useState<ChatChannel | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState<any>('');
  const [downloadObject, setDownloadObject] = useState<UploadData | null>(null);
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [isRenameDialogVisible, setIsRenameDialogVisible] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(-1);
  const [inReplyToItem, setInReplyToItem] = useState<BaseChatMessage | null>(
    null,
  );
  const [isInputClear, setIsInputClear] = useState(false);

  const subscribeMessagesRef = useRef<(() => void) | null>(null);

  const groupOptionsActionSheet = useMemo(
    () => ({
      options: [
        localized('View Members'),
        localized('Rename Group'),
        localized('Leave Group'),
      ],
    }),
    [localized],
  );

  const groupSettingsActionSheet = useMemo(
    () => ({
      options: [...groupOptionsActionSheet.options, localized('Cancel')],
      cancelButtonIndex: 3,
    }),
    [groupOptionsActionSheet, localized],
  );

  const adminGroupSettingsActionSheet = useMemo(
    () => ({
      options: [
        ...groupOptionsActionSheet.options,
        localized('Delete Group'),
        localized('Cancel'),
      ],
      cancelButtonIndex: 4,
      destructiveButtonIndex: 3,
    }),
    [groupOptionsActionSheet, localized],
  );

  const privateSettingsActionSheet = useMemo(
    () => ({
      options: [localized('Cancel')],
      cancelButtonIndex: 0,
    }),
    [localized],
  );

  const channelWithHydratedOtherParticipants = useCallback(
    (passedChannel?: ChatChannel | null): ChatChannel | null => {
      if (!passedChannel) {
        return null;
      }

      const allParticipants = passedChannel.participants ?? [];
      const otherParticipants = allParticipants.filter(
        participant => participant && participant.id !== currentUser.id,
      );

      return {
        ...passedChannel,
        otherParticipants,
      } as ChatChannel;
    },
    [currentUser.id],
  );

  const onViewMembers = useCallback(
    (passedChannel: ChatChannel) => {
      navigation.navigate('ViewGroupMembers', {
        channel: passedChannel,
      });
    },
    [navigation],
  );

  const onLeaveGroupConfirmed = useCallback(
    async (passedChannel: ChatChannel) => {
      setLoading(true);
      await leaveGroup(
        passedChannel?.id,
        currentUser?.id,
        `${currentUser?.firstName ?? 'Someone'} has left the group.`,
      );
      setLoading(false);
      navigation.goBack(null);
    },
    [currentUser?.firstName, currentUser?.id, leaveGroup, navigation],
  );

  const onDeleteGroupConfirmed = useCallback(
    async (passedChannel: ChatChannel) => {
      setLoading(true);
      await deleteGroup(passedChannel?.id);
      setLoading(false);
      navigation.goBack(null);
    },
    [deleteGroup, navigation],
  );

  const onLeave = useCallback(
    (passedChannel: ChatChannel) => {
      if (
        passedChannel?.admins?.length === 1 &&
        passedChannel?.admins?.includes(currentUser?.id)
      ) {
        Alert.alert(
          localized('Set a new admin'),
          localized(
            'You are the only admin of this group so please choose a new admin first in order to leave this group',
          ),
          [{ text: 'Okay' }],
          { cancelable: false },
        );
      } else {
        Alert.alert(
          localized(`Leave ${passedChannel?.name ?? 'group'}`),
          localized('Are you sure you want to leave this group?'),
          [
            {
              text: 'Yes',
              onPress: () => onLeaveGroupConfirmed(passedChannel),
              style: 'destructive',
            },
            { text: 'No' },
          ],
          { cancelable: false },
        );
      }
    },
    [currentUser?.id, localized, onLeaveGroupConfirmed],
  );

  const onDeleteGroup = useCallback(
    (passedChannel: ChatChannel) => {
      if (passedChannel?.admins?.includes(currentUser?.id)) {
        Alert.alert(
          localized('Delete Group'),
          localized('Are you sure you want to delete this group?'),
          [
            {
              text: 'Delete Group',
              onPress: () => onDeleteGroupConfirmed(passedChannel),
              style: 'destructive',
            },
            { text: 'No' },
          ],
          { cancelable: false },
        );
      }
    },
    [currentUser?.id, localized, onDeleteGroupConfirmed],
  );

  const showRenameDialog = useCallback((show: boolean) => {
    setIsRenameDialogVisible(show);
  }, []);

  const onGroupSettingsActionDone = useCallback(
    (index: number, passedChannel: ChatChannel) => {
      if (index === 0) onViewMembers(passedChannel);
      else if (index === 1) showRenameDialog(true);
      else if (index === 2) onLeave(passedChannel);
    },
    [onLeave, onViewMembers, showRenameDialog],
  );

  const onAdminGroupSettingsActionDone = useCallback(
    (index: number, passedChannel: ChatChannel) => {
      if (index === 0) onViewMembers(passedChannel);
      else if (index === 1) showRenameDialog(true);
      else if (index === 2) onLeave(passedChannel);
      else if (index === 3) onDeleteGroup(passedChannel);
    },
    [onDeleteGroup, onLeave, onViewMembers, showRenameDialog],
  );

  const onSettingsPress = useCallback(() => {
    const passedChannel = remoteChannel || channel;
    if (!passedChannel) {
      return;
    }

    if (
      passedChannel?.admins &&
      passedChannel.admins.includes(currentUser?.id)
    ) {
      showActionSheetWithOptions(
        {
          options: adminGroupSettingsActionSheet.options,
          cancelButtonIndex: adminGroupSettingsActionSheet.cancelButtonIndex,
          destructiveButtonIndex:
            adminGroupSettingsActionSheet.destructiveButtonIndex,
        },
        (index: number) =>
          onAdminGroupSettingsActionDone(index, passedChannel),
      );
    } else if (passedChannel?.admins) {
      showActionSheetWithOptions(
        {
          options: groupSettingsActionSheet.options,
          cancelButtonIndex: groupSettingsActionSheet.cancelButtonIndex,
        },
        (index: number) => onGroupSettingsActionDone(index, passedChannel),
      );
    } else {
      showActionSheetWithOptions(
        {
          options: privateSettingsActionSheet.options,
          cancelButtonIndex: privateSettingsActionSheet.cancelButtonIndex,
        },
        () => {},
      );
    }
  }, [
    adminGroupSettingsActionSheet,
    channel,
    currentUser?.id,
    groupSettingsActionSheet,
    onAdminGroupSettingsActionDone,
    onGroupSettingsActionDone,
    privateSettingsActionSheet,
    remoteChannel,
    showActionSheetWithOptions,
  ]);

  useLayoutEffect(() => {
    const passedChannel = remoteChannel || channel || initialChannel;

    let title = passedChannel?.name || route.params.title || 'Chat';
    const isGroupChat = (passedChannel?.participants?.length ?? 0) > 2;

    if (!passedChannel?.name && passedChannel?.participants?.length) {
      const otherUser = passedChannel.participants.find(
        participant => participant.id !== currentUser.id,
      );
      title =
        otherUser?.fullName ||
        `${otherUser?.firstName ?? ''} ${otherUser?.lastName ?? ''}`.trim() ||
        title;
    }

    navigation.setOptions({
      headerTitle: openedFromPushNotification ? '' : title,
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerBackTitleVisible: false,
      headerTitleStyle:
        isGroupChat && Platform.OS !== 'web'
          ? { width: Dimensions.get('window').width - 110 }
          : null,
      headerTintColor: colors.primaryText,
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <IconButton
            source={require('../assets/settings-icon.png')}
            tintColor={colors.primaryForeground}
            onPress={onSettingsPress}
            marginRight={15}
            width={20}
            height={20}
          />
        </View>
      ),
    });
  }, [
    channel,
    colors.primaryBackground,
    colors.primaryForeground,
    colors.primaryText,
    currentUser.id,
    navigation,
    onSettingsPress,
    openedFromPushNotification,
    remoteChannel,
    route.params.title,
    initialChannel,
  ]);

  useEffect(() => {
    setIsMediaViewerOpen(selectedMediaIndex !== -1);
  }, [selectedMediaIndex]);

  useEffect(() => {
    if (!currentUser?.id || !initialChannelID) {
      return;
    }

    const hydratedChannel =
      channelWithHydratedOtherParticipants(initialChannel);
    if (!hydratedChannel) {
      return;
    }

    setChannel(hydratedChannel);

    if (typeof subscribeMessagesRef.current === 'function') {
      subscribeMessagesRef.current();
    }

   const unsubscribeMessages = subscribeToMessages(initialChannelID);

subscribeMessagesRef.current =
  typeof unsubscribeMessages === 'function' ? unsubscribeMessages : null;
    const unsubscribeSingle = subscribeToSingleChannel(initialChannelID);

    return () => {
      if (typeof subscribeMessagesRef.current === 'function') {
        subscribeMessagesRef.current();
      }
      if (typeof unsubscribeSingle === 'function') {
        unsubscribeSingle();
      }
    };
  }, [currentUser?.id, initialChannelID, channelWithHydratedOtherParticipants, initialChannel, subscribeToMessages, subscribeToSingleChannel]);

  const markThreadItemAsReadIfNeeded = useCallback(
    (passedChannel: ChatChannel) => {
      const {
        id: channelID,
        lastThreadMessageId,
        readUserIDs = [],
        lastMessage,
      } = passedChannel;

      const userID = currentUser?.id;
      const isRead = readUserIDs.includes(userID);

      if (!isRead && channelID && lastMessage && userID) {
        const newReadUserIDs = [...readUserIDs, userID];
        markChannelMessageAsRead(
          channelID,
          userID,
          lastThreadMessageId,
          newReadUserIDs,
        );
      }
    },
    [currentUser?.id, markChannelMessageAsRead],
  );

  useEffect(() => {
    if (!remoteChannel) {
      return;
    }

    const hydratedChannel = channelWithHydratedOtherParticipants(remoteChannel);
    if (!hydratedChannel) {
      return;
    }

    setChannel(hydratedChannel);
    markThreadItemAsReadIfNeeded(hydratedChannel);
  }, [
    channelWithHydratedOtherParticipants,
    markThreadItemAsReadIfNeeded,
    remoteChannel,
  ]);

  const onChangeName = useCallback(
    async (text: string) => {
      const channelID = channel?.channelID || channel?.id;
      if (!channelID) {
        return;
      }

      setIsRenameDialogVisible(false);

      const data = {
        ...channel,
        name: text,
        content: `${currentUser?.firstName ?? 'Someone'} has renamed the group.`,
      };

      await updateGroup(channelID, currentUser?.id, data);
      setChannel(data as ChatChannel);
    },
    [channel, currentUser?.firstName, currentUser?.id, updateGroup],
  );

  const onListEndReached = useCallback(() => {
    if (initialChannelID) {
      loadMoreMessages(initialChannelID);
    }
  }, [initialChannelID, loadMoreMessages]);

  const onChangeTextInput = useCallback((text: any) => {
    setInputValue(text);
  }, []);

  const createOne2OneChannel = useCallback(async () => {
    const response = await createChannel(
      currentUser,
      channelWithHydratedOtherParticipants(channel)?.otherParticipants,
      channel?.name,
      false,
      isChatBot,
      channel?.type,
    );

    if (response) {
      const channelID = response?.channelID || response?.id;
      setChannel(channelWithHydratedOtherParticipants(response));

      if (typeof subscribeMessagesRef.current === 'function') {
        subscribeMessagesRef.current();
      }
      if (channelID) {
        const unsubscribeMessages = subscribeToMessages(channelID);

subscribeMessagesRef.current =
  typeof unsubscribeMessages === 'function' ? unsubscribeMessages : null;
      }
    }

    return response;
  }, [
    channel,
    channelWithHydratedOtherParticipants,
    createChannel,
    currentUser,
    isChatBot,
    subscribeToMessages,
  ]);

  const createOne2BotChannel = useCallback(async () => {
    const response = await createChannel(
      currentUser,
      channelWithHydratedOtherParticipants(channel)?.otherParticipants,
      '',
      false,
      isChatBot,
    );

    if (response) {
      const channelID = response?.channelID || response?.id;
      setChannel(channelWithHydratedOtherParticipants(response));

      if (typeof subscribeMessagesRef.current === 'function') {
        subscribeMessagesRef.current();
      }
      if (channelID) {
        const unsubscribeMessages = subscribeToMessages(channelID);

subscribeMessagesRef.current =
  typeof unsubscribeMessages === 'function' ? unsubscribeMessages : null;
      }
    }

    return response;
  }, [
    channel,
    channelWithHydratedOtherParticipants,
    createChannel,
    currentUser,
    isChatBot,
    subscribeToMessages,
  ]);

  const sendMessage = useCallback(
    async (
      newMessage: BaseChatMessage,
      tempInputValue: any,
      newChannel: ChatChannel | null = channel,
    ) => {
      const response = await sendMessageAPI(newMessage, newChannel);
      if (response?.error) {
        alert(response.error);
        setInputValue(tempInputValue);
        setInReplyToItem(newMessage.inReplyToItem);
      } else {
        setDownloadObject(null);
      }
    },
    [channel, sendMessageAPI],
  );

  const sendMessageAI = useCallback(
    async (
      newMessage: BaseChatMessage,
      tempInputValue: any,
      newChannel: ChatChannel | null = channel,
    ) => {
      const response = await sendMessageAIAPI(newMessage, newChannel);
      if (response?.error) {
        alert(response.error);
        setInputValue(tempInputValue);
        setInReplyToItem(newMessage.inReplyToItem);
      } else {
        setDownloadObject(null);
      }
    },
    [channel, sendMessageAIAPI],
  );

  const onSendInput = useCallback(async () => {
    if (!inputValue && !downloadObject) {
      return;
    }

    const tempInputValue =
      inputValue || formatMessage(downloadObject, localized);

    const newMessage = optimisticSetMessage(
      currentUser,
      tempInputValue,
      downloadObject,
      inReplyToItem,
    );

    setInputValue('');
    setInReplyToItem(null);
    setIsInputClear(true);

    if (
      channel?.lastMessageDate ||
      (channel as any)?.otherParticipants?.length > 1
    ) {
      await sendMessage(newMessage, tempInputValue);
      return;
    }

    const newChannel = await createOne2OneChannel();
    if (newChannel) {
      await sendMessage(newMessage, tempInputValue, newChannel);
    }

    setLoading(false);
  }, [
    channel,
    createOne2OneChannel,
    currentUser,
    downloadObject,
    inReplyToItem,
    inputValue,
    localized,
    optimisticSetMessage,
    sendMessage,
  ]);

  const onSendAIInput = useCallback(async () => {
    if (!inputValue && !downloadObject) {
      return;
    }

    const tempInputValue =
      inputValue || formatMessage(downloadObject, localized);

    const newMessage = optimisticSetMessage(
      currentUser,
      tempInputValue,
      downloadObject,
      inReplyToItem,
    );

    setInputValue('');
    setInReplyToItem(null);
    setIsInputClear(true);

    if (
      channel?.lastMessageDate ||
      (channel as any)?.otherParticipants?.length > 1
    ) {
      await sendMessageAI(newMessage, tempInputValue);
      return;
    }

    const newChannel = await createOne2BotChannel();
    if (newChannel) {
      await sendMessageAI(
        newMessage,
        tempInputValue,
        (newChannel as any)?.data ?? newChannel,
      );
    }

    setLoading(false);
  }, [
    channel,
    createOne2BotChannel,
    currentUser,
    downloadObject,
    inReplyToItem,
    inputValue,
    localized,
    optimisticSetMessage,
    sendMessageAI,
  ]);

  const startUpload = useCallback(async (uploadData: UploadData) => {
    setLoading(true);

    const { downloadURL, thumbnailURL } =
      await storageAPI.processAndUploadMediaFile(uploadData);

    if (downloadURL) {
      setDownloadObject({
        ...uploadData,
        source: downloadURL,
        uri: downloadURL,
        url: downloadURL,
        urlKey: '',
        type: uploadData.type,
        thumbnailURL: thumbnailURL ?? undefined,
        thumbnailKey: '',
      });
    }

    setLoading(false);
  }, []);

  const onAddMediaPress = useCallback(() => {
    ImagePicker.launchImageLibraryAsync({
      selectionLimit: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    })
      .then(result => {
        if (!result.canceled) {
          const asset = result.assets[0];

          startUpload({
            ...asset,
            fileName: asset.fileName ?? undefined,
            type: asset.mimeType || 'image/jpeg',
            name: asset.fileName ?? `media_${Date.now()}.jpg`,
          });
        }
      })
      .catch(error => {
        console.log(error);
      });
  }, [startUpload]);

  const onAddDocPress = useCallback(async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync();
      if (res && !res.canceled) {
        const asset = res.assets?.[0];
        if (asset) {
          startUpload({
            ...asset,
            type: asset.mimeType || 'file',
            fileID: +new Date() + (asset.name ?? ''),
          });
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }, [startUpload]);

  const images = useMemo(() => {
    const list: { id: string; url: string }[] = [];

    messages?.forEach(item => {
      if (item?.media?.type?.startsWith('image') && item.media.url && item.id) {
        list.push({
          id: item.id,
          url: item.media.url,
        });
      }
    });

    return list;
  }, [messages]);

  const mediaItemURLs = useMemo(() => images.map(i => i.url), [images]);

  const onChatMediaPress = useCallback(
    (item: BaseChatMessage) => {
      const index = images.findIndex(image => image.id === item.id);
      setSelectedMediaIndex(index);
    },
    [images],
  );

  const onMediaClose = useCallback(() => {
    setSelectedMediaIndex(-1);
  }, []);

  const onReplyActionPress = useCallback(
    (replyItem: BaseChatMessage | null) => {
      setInReplyToItem(replyItem);
    },
    [],
  );

  const onReplyingToDismiss = useCallback(() => {
    setInReplyToItem(null);
  }, []);

  const onDeleteThreadItem = useCallback(
    (message: BaseChatMessage | null) => {
      if (!message?.id) {
        return;
      }
      deleteMessage(channel, message.id);
    },
    [channel, deleteMessage],
  );

  const onChatUserItemPress = useCallback(
    async (item: ChatParticipant | ChatSender) => {
      if (isChatUserItemPress) {
        if (item.id === currentUser.id) {
          navigation.navigate('MainProfile', {
            stackKeyTitle: 'MainProfile',
            lastScreenTitle: 'Chat',
          });
        } else {
          navigation.navigate('MainProfile', {
            user: item,
            stackKeyTitle: 'MainProfile',
            lastScreenTitle: 'Chat',
          });
        }
      }
    },
    [currentUser.id, isChatUserItemPress, navigation],
  );

  const onReaction = useCallback(
    async (reaction: ReactionKey, message: BaseChatMessage | null) => {
      if (!message || !channel?.id) {
        return;
      }
      await addReaction(message, currentUser, reaction, channel.id);
    },
    [addReaction, channel?.id, currentUser],
  );

  const onForwardMessageActionPress = useCallback(
    async (targetChannel: ChatChannel, message: BaseChatMessage | null) => {
      if (!message) {
        return false;
      }

      const tempInputValue = { content: message.content };
      const hydratedChannel =
        channelWithHydratedOtherParticipants(targetChannel);

      const newMessage = getMessageObject(
        currentUser,
        tempInputValue,
        message.media ?? null,
        null,
        true,
      );

      if ((hydratedChannel as any)?.title) {
        const response = await sendMessageAPI(newMessage, hydratedChannel);
        if (response?.error) {
          alert(response.error);
          return false;
        }

        setInReplyToItem(null);
        return true;
      }

      const newChannel = await createChannel(
        currentUser,
        channelWithHydratedOtherParticipants(targetChannel)?.otherParticipants,
      );

      if (newChannel) {
        const response = await sendMessageAPI(newMessage, newChannel);
        if (response?.error) {
          alert(response.error);
          return false;
        }

        setInReplyToItem(null);
        return true;
      }

      setInReplyToItem(null);
      return false;
    },
    [
      channelWithHydratedOtherParticipants,
      createChannel,
      currentUser,
      getMessageObject,
      sendMessageAPI,
    ],
  );

  return (
    <IMChat
      user={currentUser}
      messages={messages}
      inputValue={inputValue}
      inReplyToItem={inReplyToItem}
      loading={loading}
      onAddMediaPress={onAddMediaPress}
      onAddDocPress={onAddDocPress}
      onSendInput={onSendInput}
      onSendAIInput={onSendAIInput}
      onChangeTextInput={onChangeTextInput}
      mediaItemURLs={mediaItemURLs}
      isMediaViewerOpen={isMediaViewerOpen}
      selectedMediaIndex={selectedMediaIndex}
      onChatMediaPress={onChatMediaPress}
      onMediaClose={onMediaClose}
      onChangeName={onChangeName}
      isRenameDialogVisible={isRenameDialogVisible}
      showRenameDialog={showRenameDialog}
      onViewMembers={onViewMembers}
      onLeave={onLeave}
      onDeleteGroup={onDeleteGroup}
      onSenderProfilePicturePress={onChatUserItemPress}
      onReplyActionPress={onReplyActionPress}
      onReplyingToDismiss={onReplyingToDismiss}
      onDeleteThreadItem={onDeleteThreadItem}
      channelItem={channel}
      onListEndReached={onListEndReached}
      isInputClear={isInputClear}
      setIsInputClear={setIsInputClear}
      onChatUserItemPress={onChatUserItemPress}
      onReaction={onReaction}
      onForwardMessageActionPress={onForwardMessageActionPress}
      isChatBot={isChatBot}
    />
  );
};

export default IMChatScreen;