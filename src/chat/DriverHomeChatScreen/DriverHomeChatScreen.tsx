import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useTheme, useTranslations } from '../../core/dopebase';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';

import useDriverChatChannels from '../hooks/useDriverChatChannels';
import useDriverChatParticipants from '../hooks/useDriverChatParticipants';

import IMConversationPreviewCard from '../components/IMConversationPreviewCard/IMConversationPreviewCard';
import SelectParticipantModal from '../components/SelectParticipantModal/SelectParticipantModal';

import { dynamicStyles } from './styles';

type DriverChannel = {
  id?: string;
  channelID?: string;
  type?: 'job' | 'direct' | string;
  title?: string;
  name?: string;
  participants?: any[];
  [key: string]: any;
};

type DriverHomeChatScreenProps = {
  navigation: any;
};

const DriverHomeChatScreen = ({
  navigation,
}: DriverHomeChatScreenProps) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const currentUser = useCurrentUser();

  const { channels } = useDriverChatChannels();
  const { participants, loading: participantsLoading } =
    useDriverChatParticipants();

  const [participantModalVisible, setParticipantModalVisible] = useState(false);

  const jobChats = useMemo(
    () => (channels || []).filter(c => c.type === 'job'),
    [channels],
  );

  const directChats = useMemo(
    () => (channels || []).filter(c => c.type === 'direct'),
    [channels],
  );

  const colors = theme.colors[appearance];

  const renderHeaderLeft = useCallback(
    () => (
      <MaterialCommunityIcons
        name="menu"
        size={24}
        color={colors.primaryText}
        style={{ marginLeft: 16 }}
        onPress={() => navigation.openDrawer?.()}
      />
    ),
    [colors.primaryText, navigation],
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: localized('Messenger'),
      headerBackTitleVisible: false,
      headerLeft: renderHeaderLeft,
      headerStyle: {
        backgroundColor: colors.primaryBackground,
      },
      headerTintColor: colors.primaryText,
    });
  }, [
    navigation,
    localized,
    renderHeaderLeft,
    colors.primaryBackground,
    colors.primaryText,
  ]);

  const handleChatPress = useCallback(
    (channel: DriverChannel) => {
      navigation.navigate('PersonalChat', {
        channel: {
          ...channel,
          name: channel.title || channel.name || '',
        },
        isChatUserItemPress: false,
      });
    },
    [navigation],
  );

  const handleParticipantSelect = useCallback(
    (participant: any) => {
      setParticipantModalVisible(false);

      const currentUserID = currentUser?.id || currentUser?.userID;
      const participantID = participant?.id || participant?.userID;

      if (!currentUserID || !participantID) {
        return;
      }

      const normalizedParticipant = {
        id: participantID,
        ...participant,
      };

      const channel: DriverChannel = {
        id:
          currentUserID < participantID
            ? `${currentUserID}${participantID}`
            : `${participantID}${currentUserID}`,
        participants: [currentUser, normalizedParticipant],
        type: 'direct',
        name: '',
        title:
          normalizedParticipant.fullName ||
          `${normalizedParticipant.firstName ?? ''} ${normalizedParticipant.lastName ?? ''}`.trim(),
      };

      navigation.navigate('PersonalChat', {
        channel,
        isChatUserItemPress: false,
      });
    },
    [currentUser, navigation],
  );

  const renderSectionHeader = useCallback(
    (title: string, onPressNew?: () => void) => (
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{title}</Text>

        {onPressNew ? (
          <TouchableOpacity onPress={onPressNew}>
            <View style={styles.newChatButton}>
              <MaterialCommunityIcons
                name="chat-outline"
                size={16}
                style={styles.newChatIcon}
              />
              <Text style={styles.newChatText}>{localized('New chat')}</Text>
            </View>
          </TouchableOpacity>
        ) : null}
      </View>
    ),
    [localized, styles],
  );

  const renderChatSection = useCallback(
    (title: string, chats: DriverChannel[], onPressNew?: () => void) => (
      <View style={styles.sectionContainer}>
        {renderSectionHeader(title, onPressNew)}

        <View style={styles.sectionContent}>
          {chats.length === 0 ? (
            <Text style={styles.emptyText}>
              {localized('No conversations in this section')}
            </Text>
          ) : (
            chats.map((channel, index) => (
              <IMConversationPreviewCard
                key={channel.id || channel.channelID || `${title}-${index}`}
                channel={channel}
                onPress={() => handleChatPress(channel)}
              />
            ))
          )}
        </View>
      </View>
    ),
    [handleChatPress, localized, renderSectionHeader, styles],
  );

  return (
    <>
      <ScrollView style={styles.container}>
        {renderChatSection(localized('Job Conversations'), jobChats)}

        {renderChatSection(
          localized('Dispatch Messages'),
          directChats,
          () => setParticipantModalVisible(true),
        )}
      </ScrollView>

      <SelectParticipantModal
        isVisible={participantModalVisible}
        onClose={() => setParticipantModalVisible(false)}
        participants={participants}
        loading={participantsLoading}
        title={localized('Select Participant')}
        placeholder={localized('Search participant...')}
        onSelect={handleParticipantSelect}
      />
    </>
  );
};

export default DriverHomeChatScreen;