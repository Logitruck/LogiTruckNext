import React, {
  useEffect,
  useState,
  useCallback,
  useLayoutEffect,
} from 'react';
import { ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { useTheme, useTranslations } from '../../core/dopebase';
import { useCurrentUser } from '../../core/onboarding/hooks/useAuth';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import useManagerChatChannels from '../hooks/useManagerChatChannels';
import useManagerChatParticipants from '../hooks/useManagerChatParticipants';
import useManagerContextItems from '../hooks/useManagerContextItems';

import IMConversationPreviewCard from '../components/IMConversationPreviewCard/IMConversationPreviewCard';
import SelectParticipantModal from '../components/SelectParticipantModal/SelectParticipantModal';
import SelectContextItemModal from '../components/SelectContextItemModal/SelectContextItemModal';

import { dynamicStyles } from './styles';

type ManagerChannel = {
  id?: string;
  channelID?: string;
  type?: 'offer' | 'job' | 'direct' | string;
  title?: string;
  name?: string;
  participants?: any[];
  [key: string]: any;
};

type ManagerHomeChatScreenProps = {
  navigation: any;
};

const ManagerHomeChatScreen = ({
  navigation,
}: ManagerHomeChatScreenProps) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);
  const currentUser = useCurrentUser();

  const { channels } = useManagerChatChannels();
  const { participants, loading: participantsLoading } =
    useManagerChatParticipants();
  const { contextItems, loading: contextLoading } = useManagerContextItems();
// console.log('contextItems',contextItems)
useEffect(() => {
  
  console.log('MOUNT ManagerHomeChatScreen');
  return () => {
    console.log('UNMOUNT ManagerHomeChatScreen');
  };
}, []);

  const [participantModalVisible, setParticipantModalVisible] = useState(false);
  const [contextModalVisible, setContextModalVisible] = useState(false);

const offerChats = React.useMemo(
  () => (channels || []).filter((c) => c.type === 'offer'),
  [channels],
);

const jobChats = React.useMemo(
  () => (channels || []).filter((c) => c.type === 'job'),
  [channels],
);

console.log('jobChats',jobChats)

const directChats = React.useMemo(
  () => (channels || []).filter((c) => c.type === 'direct'),
  [channels],
);

const colors = theme.colors[appearance];

const renderHeaderLeft = useCallback(
  () => (
    <MaterialCommunityIcons
      name="arrow-left"
      size={24}
      color={colors.primaryText}
      style={{ marginLeft: 16 }}
      onPress={() => navigation.goBack()}
    />
  ),
  [colors.primaryText, navigation],
);

useLayoutEffect(() => {
  navigation.setOptions({
    headerShown: true,
    headerTitle: 'Messenger',
    headerBackTitleVisible: false,
    headerLeft: renderHeaderLeft,
    headerStyle: {
      backgroundColor: colors.primaryBackground,
    },
    headerTintColor: colors.primaryText,
  });
}, [navigation, renderHeaderLeft, colors.primaryBackground, colors.primaryText]);

  const handleChatPress = useCallback(
    (channel: ManagerChannel) => {
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

      const channel: ManagerChannel = {
        id:
          currentUserID < participantID
            ? `${currentUserID}${participantID}`
            : `${participantID}${currentUserID}`,
        participants: [currentUser, participant],
        type: 'direct',
        name: '',
        title:
          participant.fullName ||
          `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim(),
      };

      navigation.navigate('PersonalChat', {
        channel,
        isChatUserItemPress: false,
      });
    },
    [currentUser, navigation],
  );

  const handleContextSelect = useCallback(
    (item: any) => {
      setContextModalVisible(false);

      const raw = item?.raw;
      if (!raw) {
        return;
      }

      const channel: ManagerChannel = {
        id: `${currentUser?.id}_${raw.id}`,
        participants: raw.participants || [],
        type: raw.type || 'offer',
        name: raw.id,
        title: item.title,
      };

      navigation.navigate('PersonalChat', {
        channel,
        isChatUserItemPress: false,
      });
    },
    [currentUser?.id, navigation],
  );

  const renderSectionHeader = useCallback(
    (title: string, onPressNew: () => void) => (
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{title}</Text>

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
      </View>
    ),
    [localized, styles],
  );

  const renderChatSection = useCallback(
    (title: string, chats: ManagerChannel[], onPressNew: () => void) => (
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
console.log('channels manager length', channels?.length);
console.log('participants manager length', participants?.length);
console.log('contextItems manager length', contextItems?.length);


  return (
    <>
      <ScrollView style={styles.container}>
        {renderChatSection(
          localized('Offers Negotiations'),
          offerChats,
          () => setContextModalVisible(true),
        )}

        {renderChatSection(
          localized('Active Jobs'),
          jobChats,
          () => setContextModalVisible(true),
        )}

        {renderChatSection(
          localized('Direct Messages'),
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

      <SelectContextItemModal
        isVisible={contextModalVisible}
        onClose={() => setContextModalVisible(false)}
        items={contextItems}
        loading={contextLoading}
        title={localized('Select Context')}
        placeholder={localized('Search...')}
        onSelect={handleContextSelect}
      />
    </>
  );
};

export default ManagerHomeChatScreen;