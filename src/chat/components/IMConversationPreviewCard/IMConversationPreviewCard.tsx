import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../../core/dopebase';
import { useCurrentUser } from '../../../core/onboarding/hooks/useAuth';
import { dynamicStyles } from './styles';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ChatParticipantModal from '../ChatParticipantModal/ChatParticipantModal';

type Participant = {
  id?: string;
  userID?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  profilePictureURL?: string;
  email?: string;
  [key: string]: any;
};

type Channel = {
  id?: string;
  name?: string;
  title?: string;
  participants?: Participant[];
  [key: string]: any;
};

type IMConversationPreviewCardProps = {
  channel: Channel;
  onPress: () => void;
};

const DEFAULT_AVATAR =
  'https://www.iosapptemplates.com/wp-content/uploads/2019/06/empty-avatar.jpg';

const IMConversationPreviewCard = ({
  channel,
  onPress,
}: IMConversationPreviewCardProps) => {
  const { theme, appearance } = useTheme();
  const currentUser = useCurrentUser();
  const styles = dynamicStyles(theme, appearance);

  const [modalVisible, setModalVisible] = useState(false);
  const currentUserID = currentUser?.id || currentUser?.userID;

  const getChatTitle = (currentChannel: Channel) => {
    if (currentChannel?.name) return currentChannel.name;

    const others = (currentChannel.participants || []).filter(
      (p) => p.id !== currentUserID && p.userID !== currentUserID,
    );

    if (others.length === 1) {
      const user = others[0];
      return (
        `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Unnamed Chat'
      );
    }

    return currentChannel?.title || 'Unnamed Chat';
  };

  const renderParticipants = () => {
    const participants = channel?.participants || [];
    const otherParticipants = participants.filter((p) => p.profilePictureURL);
    const firstImage = otherParticipants[0]?.profilePictureURL;

    return (
      <Image
        style={styles.avatar}
        source={{ uri: firstImage || DEFAULT_AVATAR }}
      />
    );
  };

  const firstOtherParticipant = (channel?.participants || []).find(
    (p) => p.id !== currentUserID && p.userID !== currentUserID,
  );

  return (
    <>
      <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
        <View style={styles.avatarContainer}>{renderParticipants()}</View>

        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.chatTitle} numberOfLines={1}>
              {getChatTitle(channel)}
            </Text>

            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => setModalVisible(true)}
            >
              <MaterialCommunityIcons
                name="dots-vertical"
                size={20}
                color={theme.colors[appearance].grey6}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.metaContainer}>
            <MaterialCommunityIcons
              name="account-multiple"
              size={16}
              color={theme.colors[appearance].grey6}
            />
            <Text style={styles.metaText}>
              {channel?.participants?.length || 0}{' '}
              {(channel?.participants?.length || 0) === 1 ? 'member' : 'members'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <ChatParticipantModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        participant={firstOtherParticipant}
      />
    </>
  );
};

export default IMConversationPreviewCard;