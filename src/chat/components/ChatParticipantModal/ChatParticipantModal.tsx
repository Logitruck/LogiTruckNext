import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme, useTranslations } from '../../../core/dopebase';
import { dynamicStyles } from './styles';

type Participant = {
  id?: string;
  userID?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  profilePictureURL?: string;
  [key: string]: any;
};

type ChatParticipantModalProps = {
  visible: boolean;
  onClose: () => void;
  participant?: Participant | null;
  onOpenChat?: (participant: Participant) => void;
};

const DEFAULT_AVATAR =
  'https://www.iosapptemplates.com/wp-content/uploads/2019/06/empty-avatar.jpg';

const ChatParticipantModal = ({
  visible,
  onClose,
  participant,
  onOpenChat,
}: ChatParticipantModalProps) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const fullName =
    participant?.fullName ||
    `${participant?.firstName ?? ''} ${participant?.lastName ?? ''}`.trim() ||
    localized('Unknown user');

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>{localized('Close')}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>{localized('Participant')}</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.content}>
          <Image
            source={{ uri: participant?.profilePictureURL || DEFAULT_AVATAR }}
            style={styles.avatar}
          />

          <Text style={styles.name}>{fullName}</Text>

          {!!participant?.email && (
            <Text style={styles.email}>{participant.email}</Text>
          )}

          {!!participant && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => onOpenChat?.(participant)}
            >
              <Text style={styles.primaryButtonText}>
                {localized('Open chat')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default ChatParticipantModal;