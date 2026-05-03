import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
import { setActiveChatChannelID } from '../../core/notifications/notificationSession';

const ChatEntryScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { channelID, title, openedFromPushNotification } = route.params || {};

  useEffect(() => {
    if (!channelID) {
      navigation.goBack();
      return;
    }

    setActiveChatChannelID(channelID);

    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [
          {
            name: 'ChatHome',
          },
          {
            name: 'PersonalChat',
            params: {
              channel: {
                id: channelID,
                channelID,
                name: title || '',
              },
              openedFromPushNotification: openedFromPushNotification ?? true,
              isChatUserItemPress: false,
              title: title || '',
            },
          },
        ],
      }),
    );
  }, [channelID, title, openedFromPushNotification, navigation]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator />
    </View>
  );
};

export default ChatEntryScreen;