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
  type?: string;
  name?: string;
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
  const currentUser = useCurrentUser() as ChatSender;

  const openedFromPushNotification =
    route.params.openedFromPushNotification ?? false;
  const isChatUserItemPress = route.params.isChatUserItemPress ?? false;
  const isChatBot = route.params.isChatBot ?? false;

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

  const {
    createChannel,
    markChannelMessageAsRead,
    updateGroup,
    leaveGroup,
    deleteGroup,
  } = useChatChannels();

const { remoteChannel, subscribeToSingleChannel } =
  useChatSingleChannel();

  const { showActionSheetWithOptions } = useActionSheet();
  const subscribeMessagesRef = useRef<(() => void) | null>(null);

  const photoUploadActionSheet = useMemo(
    () => ({
      title: localized('Photo Upload'),
      options: [
        localized('Launch Camera'),
        localized('Open Photo Gallery'),
        localized('Cancel'),
      ],
      cancelButtonIndex: 2,
    }),
    [localized],
  );

  const groupOptionsActionSheet = useMemo(
    () => ({
      title: localized('Group Settings'),
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
      title: localized('Group Settings'),
      options: [...groupOptionsActionSheet.options, localized('Cancel')],
      cancelButtonIndex: 3,
    }),
    [groupOptionsActionSheet, localized],
  );

  const adminGroupSettingsActionSheet = useMemo(
    () => ({
      title: localized('Group Settings'),
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
      title: localized('Actions'),
      options: [localized('Cancel')],
      cancelButtonIndex: 0,
    }),
    [localized],
  );

  const channelWithHydratedOtherParticipants = useCallback(
    (passedChannel?: ChatChannel | null): ChatChannel | null => {
      const allParticipants = passedChannel?.participants;
      if (!allParticipants) {
        return passedChannel ?? null;
      }

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
    [leaveGroup, navigation, currentUser?.id, currentUser?.firstName],
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

  const showRenameDialog = useCallback((show: boolean) => {
    setIsRenameDialogVisible(show);
  }, []);

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

  const onGroupSettingsActionDone = useCallback(
    (index: number, passedChannel: ChatChannel) => {
      if (index === 0) {
        onViewMembers(passedChannel);
      } else if (index === 1) {
        showRenameDialog(true);
      } else if (index === 2) {
        onLeave(passedChannel);
      }
    },
    [onLeave, onViewMembers, showRenameDialog],
  );

  const onAdminGroupSettingsActionDone = useCallback(
    (index: number, passedChannel: ChatChannel) => {
      if (index === 0) {
        onViewMembers(passedChannel);
      } else if (index === 1) {
        showRenameDialog(true);
      } else if (index === 2) {
        onLeave(passedChannel);
      } else if (index === 3) {
        onDeleteGroup(passedChannel);
      }
    },
    [onDeleteGroup, onLeave, onViewMembers, showRenameDialog],
  );

  const onSettingsPress = useCallback(() => {
    if (channel?.admins && channel?.admins?.includes(currentUser?.id)) {
      showActionSheetWithOptions(
        {
          options: adminGroupSettingsActionSheet.options,
          cancelButtonIndex: adminGroupSettingsActionSheet.cancelButtonIndex,
          destructiveButtonIndex:
            adminGroupSettingsActionSheet.destructiveButtonIndex,
        },
        (index: number) =>
          onAdminGroupSettingsActionDone(index, remoteChannel as ChatChannel),
      );
    } else if (channel?.admins) {
      showActionSheetWithOptions(
        {
          options: groupSettingsActionSheet.options,
          cancelButtonIndex: groupSettingsActionSheet.cancelButtonIndex,
        },
        (index: number) =>
          onGroupSettingsActionDone(index, remoteChannel as ChatChannel),
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
    channel?.admins,
    currentUser?.id,
    groupSettingsActionSheet,
    onAdminGroupSettingsActionDone,
    onGroupSettingsActionDone,
    privateSettingsActionSheet,
    remoteChannel,
    showActionSheetWithOptions,
  ]);

const configureNavigation = (passedChannel?: ChatChannel | null) => {
  if (!passedChannel) {
    return;
  }

  let title = passedChannel?.name;
  const isGroupChat = (passedChannel?.participants?.length ?? 0) > 2;

  if (!title && (passedChannel?.participants?.length ?? 0) > 1) {
    const otherUser = passedChannel.participants?.find(
      participant => participant.id !== currentUser.id,
    );

    title =
      otherUser?.fullName ||
      `${otherUser?.firstName ?? ''} ${otherUser?.lastName ?? ''}`.trim();
  }

  navigation.setOptions({
    headerTitle: title || route.params.title || localized('Chat'),
    headerStyle: {
      backgroundColor: theme.colors[appearance].primaryBackground,
    },
    headerBackTitleVisible: false,
    headerTitleStyle:
      isGroupChat && Platform.OS !== 'web'
        ? {
            width: Dimensions.get('window').width - 110,
          }
        : null,
    headerTintColor: theme.colors[appearance].primaryText,
    headerRight: () => (
      <View style={{ flexDirection: 'row' }}>
        <IconButton
          source={require('../assets/settings-icon.png')}
          tintColor={theme.colors[appearance].primaryForeground}
          onPress={onSettingsPress}
          marginRight={15}
          width={20}
          height={20}
        />
      </View>
    ),
  });
};

useLayoutEffect(() => {
  console.log('EFFECT 1 layout navigation');
  if (!openedFromPushNotification) {
    configureNavigation(
      channelWithHydratedOtherParticipants(route.params.channel),
    );
  } else {
    navigation.setOptions({ headerTitle: '' });
  }
}, [navigation, route.params.channel]);
useEffect(() => {
  console.log('EFFECT 2 configureNavigation', {
    channelId: channel?.id,
    remoteChannelId: remoteChannel?.id,
  });
  configureNavigation(remoteChannel || channel);
}, [channel, remoteChannel]);

useEffect(() => {
  console.log('EFFECT 3 media viewer', selectedMediaIndex);
  if (selectedMediaIndex !== -1) {
    setIsMediaViewerOpen(true);
  } else {
    setIsMediaViewerOpen(false);
  }
}, [selectedMediaIndex]);

  useEffect(() => {
    console.log('EFFECT 4 subscribe init', currentUser?.id);
    const hydratedChannel = channelWithHydratedOtherParticipants(
      route.params.channel,
    );
    if (!hydratedChannel) {
      return;
    }

    const channelID = hydratedChannel?.channelID || hydratedChannel?.id;
    if (!channelID) {
      return;
    }

    setChannel(hydratedChannel);

    const unsubscribeMessages = subscribeToMessages(channelID);
    subscribeMessagesRef.current =
      typeof unsubscribeMessages === 'function' ? unsubscribeMessages : null;

    const unsubscribe = subscribeToSingleChannel(channelID);

    return () => {
      if (subscribeMessagesRef.current) {
        subscribeMessagesRef.current();
      }
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser?.id]);

  const markThreadItemAsReadIfNeeded = useCallback(

    
    (passedChannel: ChatChannel) => {
      const {
        id: channelID,
        lastThreadMessageId,
        readUserIDs = [],
        lastMessage,
      } = passedChannel;

      const userID = currentUser?.id;
      const isRead = readUserIDs?.includes(userID);
// console.log('markThreadItemAsReadIfNeeded', {
//   channelID,
//   userID,
//   lastThreadMessageId,
//   readUserIDs,
//   isRead,
//   lastMessage,
// });
      if (
        !isRead &&
        channelID &&
        lastMessage &&
        userID &&
        !readUserIDs.includes(userID)
      ) {
        const newReadUserIDs = readUserIDs ? [...readUserIDs, userID] : [userID];
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
    console.log('EFFECT 5 remoteChannel', remoteChannel?.id);
    if (!remoteChannel) {
      return;
    }
    // console.log('remoteChannel raw', JSON.stringify(remoteChannel, null, 2));
    const hydratedChannel = channelWithHydratedOtherParticipants(remoteChannel);

    console.log('compare channel', {
  prevId: channel?.id,
  nextId: hydratedChannel?.id,
  prevLastMessage: channel?.lastMessage,
  nextLastMessage: hydratedChannel?.lastMessage,
  prevLastMessageDate: channel?.lastMessageDate,
  nextLastMessageDate: hydratedChannel?.lastMessageDate,
  prevReadUserIDs: JSON.stringify(channel?.readUserIDs || []),
  nextReadUserIDs: JSON.stringify(hydratedChannel?.readUserIDs || []),
});

    setChannel(hydratedChannel);

    if (hydratedChannel) {
      markThreadItemAsReadIfNeeded(hydratedChannel);
    }

    if (openedFromPushNotification) {
      configureNavigation(hydratedChannel);
    }
  }, [
    remoteChannel
  ]);

  const onChangeName = useCallback(
    async (text: string) => {

      setIsRenameDialogVisible(false);

      const data = {
        ...channel,
        name: text,
        content: `${currentUser?.firstName ?? 'Someone'} has renamed the group.`,
      };
      const channelID = channel?.channelID || channel?.id;
      if (!channelID || !currentUser?.id) return;

      await updateGroup(channelID, currentUser?.id, data);
      setChannel(data as ChatChannel);
      configureNavigation(data as ChatChannel);
    },
    [channel, currentUser?.id, currentUser?.firstName, updateGroup, configureNavigation],
  );

  const onListEndReached = useCallback(() => {
    loadMoreMessages(route?.params?.channel?.id);
  }, [loadMoreMessages, route?.params?.channel?.id]);

  const onChangeTextInput = useCallback((text: any) => {
    setInputValue(text);
  }, []);

  const createOne2OneChannel = useCallback(async () => {
    const response = await createChannel(
      currentUser,
      (channelWithHydratedOtherParticipants(channel) as any)?.otherParticipants,
      channel?.name,
      false,
      isChatBot,
      channel?.type,
    );

    if (response) {
      const channelID = response?.channelID || response?.id;
      setChannel(channelWithHydratedOtherParticipants(response));

      if (subscribeMessagesRef.current) {
        subscribeMessagesRef.current();
      }

      if (channelID) {
        const unsubscribeMessages = subscribeToMessages(channelID);
        subscribeMessagesRef.current =
          typeof unsubscribeMessages === 'function'
            ? unsubscribeMessages
            : null;
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
      (channelWithHydratedOtherParticipants(channel) as any)?.otherParticipants,
      '',
      false,
      isChatBot,
    );

    if (response) {
      const channelID = response?.channelID || response?.id;
      setChannel(channelWithHydratedOtherParticipants(response));

      if (subscribeMessagesRef.current) {
        subscribeMessagesRef.current();
      }

      if (channelID) {
        const unsubscribeMessages = subscribeToMessages(channelID);
        subscribeMessagesRef.current =
          typeof unsubscribeMessages === 'function'
            ? unsubscribeMessages
            : null;
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

    let tempInputValue = inputValue;
    if (!tempInputValue) {
      tempInputValue = formatMessage(downloadObject, localized);
    }

    const newMessage = optimisticSetMessage(
      currentUser,
      tempInputValue,
      downloadObject,
      inReplyToItem,
    );

    setInputValue('');
    setInReplyToItem(null);
    setIsInputClear(true);

    if (channel?.lastMessageDate || (channel as any)?.otherParticipants?.length > 1) {
      await sendMessage(newMessage, tempInputValue);
      console.log("send message")
      return;
    }

    const newChannel = await createOne2OneChannel();
    if (newChannel) {
      await sendMessage(newMessage, tempInputValue, newChannel);
    }

    setLoading(false);
  }, [
    inputValue,
    downloadObject,
    localized,
    optimisticSetMessage,
    currentUser,
    inReplyToItem,
    channel,
    createOne2OneChannel,
    sendMessage,
  ]);

  const onSendAIInput = useCallback(async () => {
    if (!inputValue && !downloadObject) {
      return;
    }

    let tempInputValue = inputValue;
    if (!tempInputValue) {
      tempInputValue = formatMessage(downloadObject, localized);
    }

    const newMessage = optimisticSetMessage(
      currentUser,
      tempInputValue,
      downloadObject,
      inReplyToItem,
    );

    setInputValue('');
    setInReplyToItem(null);
    setIsInputClear(true);

    if (channel?.lastMessageDate || (channel as any)?.otherParticipants?.length > 1) {
      await sendMessageAI(newMessage, tempInputValue);
      return;
    }

    const newChannel = await createOne2BotChannel();
    if (newChannel) {
      await sendMessageAI(
        newMessage,
        tempInputValue,
        (newChannel as any).data ?? newChannel,
      );
    }

    setLoading(false);
  }, [
    inputValue,
    downloadObject,
    localized,
    optimisticSetMessage,
    currentUser,
    inReplyToItem,
    channel,
    createOne2BotChannel,
    sendMessageAI,
  ]);

  const startUpload = useCallback(
    async (uploadData: UploadData) => {
      setLoading(true);

      const { type } = uploadData;
      if (!type) {
        alert(
          localized(
            `Can\'t upload file without a media type. Please report this error with the full error logs`,
          ),
        );
      }

      const { downloadURL, thumbnailURL } =
        await storageAPI.processAndUploadMediaFile(uploadData);

      if (downloadURL) {
        setDownloadObject({
          ...uploadData,
          source: downloadURL,
          uri: downloadURL,
          url: downloadURL,
          urlKey: "",
          type,
          thumbnailURL: thumbnailURL ?? undefined,
          thumbnailKey: "",
        });
      }

      setLoading(false);
    },
    [localized],
  );

  

  const onOpenPhotos = useCallback(() => {
    ImagePicker.launchImageLibraryAsync({
      selectionLimit: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.All,
    })
      .then(result => {
        if (result.canceled !== true) {
          const image = result.assets[0] as any;
          const pattern = /[a-zA-Z]+\/[A-Za-z0-9]+/i;
          const match = pattern.exec(image.uri);
          startUpload({ type: (match ?? [])[0], ...image });
        }
      })
      .catch(error => {
        console.log(error);
      });
  }, [startUpload]);

   const onLaunchCamera = useCallback(() => {
    ImagePicker.launchCameraAsync({})
      .then(result => {
        if (result.canceled !== true) {
          startUpload(result.assets[0] as any);
        }
      })
      .catch(error => {
        console.log(error);
      });
  }, [startUpload]);

  const onPhotoUploadDialogDone = useCallback(
    (index: number) => {
      if (index === 0) {
        onLaunchCamera();
      }

      if (index === 1) {
        onOpenPhotos();
      }
    },
    [onLaunchCamera, onOpenPhotos],
  );

  const onAddMediaPress = useCallback(() => {
    showActionSheetWithOptions(
      {
        options: photoUploadActionSheet.options,
        cancelButtonIndex: photoUploadActionSheet.cancelButtonIndex,
      },
      onPhotoUploadDialogDone,
    );
  }, [onPhotoUploadDialogDone, photoUploadActionSheet, showActionSheetWithOptions]);

  const onAudioRecordSend = useCallback(
    (audioRecord: any) => {
      startUpload(audioRecord);
    },
    [startUpload],
  );

 


  const onAddDocPress = useCallback(async () => {
    try {
      const res: any = await DocumentPicker.getDocumentAsync();
      if (res) {
        startUpload({
          ...res,
          type: 'file',
          fileID: +new Date() + (res.name ?? ''),
        });
      }
    } catch (e) {
      console.warn(e);
    }
  }, [startUpload]);

  
useEffect(() => {
  console.log('EFFECT 6 downloadObject', !!downloadObject);
  if (downloadObject !== null) {
    onSendInput();
  }
}, [downloadObject]);

  const images = useMemo(() => {
    const list: { id: string; url: string }[] = [];

    messages?.forEach((item: any) => {
      if (item?.media) {
        const type = item.media?.type;
        if (type?.startsWith('image')) {
          list.push({
            id: item.id,
            url: item.media.url,
          });
        }
      }
    });

    return list;
  }, [messages]);

  const mediaItemURLs = useMemo(() => {
    return images.flatMap(i => i.url);
  }, [images]);

  const onChatMediaPress = useCallback(
    (item: BaseChatMessage) => {
      const index = images?.findIndex(image => image.id === item.id);
      setSelectedMediaIndex(index);
    },
    [images],
  );

  const onMediaClose = useCallback(() => {
    setSelectedMediaIndex(-1);
  }, []);

  const onReplyActionPress = useCallback((replyItem: BaseChatMessage | null) => {
    setInReplyToItem(replyItem);
  }, []);

  const onReplyingToDismiss = useCallback(() => {
    setInReplyToItem(null);
  }, []);

  const onDeleteThreadItem = useCallback(
    (message: BaseChatMessage | null) => {
      deleteMessage(channel, message?.id as string);
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
    [navigation, currentUser?.id, isChatUserItemPress],
  );

  const onReaction = useCallback(
    async (reaction: ReactionKey, message: BaseChatMessage | null) => {
      if (!message || !channel?.id) return;

await addReaction(message, currentUser, reaction, channel.id);
    },
    [addReaction, currentUser, channel?.id],
  );

  const onForwardMessageActionPress = useCallback(
    async (passedChannel: ChatChannel, message: BaseChatMessage | null) => {
      if (!message) {
        return false;
      }

      let tempInputValue: any = { content: message.content };
      if (!tempInputValue) {
        tempInputValue = formatMessage(downloadObject, localized);
      }

      const hydratedChannel =
        channelWithHydratedOtherParticipants(passedChannel);

      const newMessage = getMessageObject(
        currentUser,
        tempInputValue,
        message?.media ?? null,
        null,
        true,
      );

      if ((hydratedChannel as any)?.title) {
        const response = await sendMessageAPI(newMessage, hydratedChannel);
        if (response?.error) {
          alert(response.error);
          return false;
        } else {
          setInReplyToItem(null);
          return true;
        }
      }

      const newChannel = await createChannel(
        currentUser,
        (channelWithHydratedOtherParticipants(passedChannel) as any)
          ?.otherParticipants,
      );

      if (newChannel) {
        const response = await sendMessageAPI(newMessage, newChannel);
        if (response?.error) {
          alert(response.error);
          return false;
        } else {
          setInReplyToItem(null);
          return true;
        }
      }

      setInReplyToItem(null);
      return false;
    },
    [
      channelWithHydratedOtherParticipants,
      createChannel,
      currentUser,
      downloadObject,
      getMessageObject,
      localized,
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
      isRenameDialogVisible={isRenameDialogVisible}
      showRenameDialog={showRenameDialog}
      onViewMembers={onViewMembers}
      onChangeName={onChangeName}
      onLeave={onLeave}
      onDeleteGroup={onDeleteGroup}
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