import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
  ListRenderItem,
} from 'react-native';
import { useTheme, useTranslations } from '../../../core/dopebase';
import { dynamicStyles } from './styles';

export type ChatParticipant = {
  id?: string;
  userID?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  profilePictureURL?: string;
  [key: string]: any;
};

type SelectParticipantModalProps = {
  isVisible: boolean;
  onClose: () => void;
  participants: ChatParticipant[];
  loading?: boolean;
  title?: string;
  placeholder?: string;
  onSelect: (participant: ChatParticipant) => void;
};

const SelectParticipantModal = ({
  isVisible,
  onClose,
  participants,
  loading = false,
  title,
  placeholder,
  onSelect,
}: SelectParticipantModalProps) => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const [searchText, setSearchText] = useState('');
  const [filteredParticipants, setFilteredParticipants] = useState<ChatParticipant[]>([]);

  useEffect(() => {
    if (!participants) {
      setFilteredParticipants([]);
      return;
    }

    if (searchText.trim().length > 0) {
      const lower = searchText.toLowerCase();

      setFilteredParticipants(
        participants.filter((participant) =>
          (participant.fullName ||
            `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim() ||
            '')
            .toLowerCase()
            .includes(lower) ||
          (participant.email || '').toLowerCase().includes(lower),
        ),
      );
    } else {
      setFilteredParticipants(participants);
    }
  }, [participants, searchText]);

  const renderItem: ListRenderItem<ChatParticipant> = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => onSelect(item)}
    >
      <Text style={styles.itemTitle}>
        {item.fullName ||
          `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim() ||
          localized('Unnamed participant')}
      </Text>
      <Text style={styles.itemSubtitle}>{item.email || ''}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isVisible}
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>{localized('Close')}</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            {title || localized('Select Participant')}
          </Text>

          <View style={{ width: 60 }} />
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={placeholder || localized('Search participant...')}
            placeholderTextColor={theme.colors[appearance].primaryText}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        {loading ? (
          <View style={styles.centeredContent}>
            <Text style={styles.loadingText}>
              {localized('Loading participants...')}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredParticipants}
            keyExtractor={(item, index) => `${item.id || item.userID || index}`}
            renderItem={renderItem}
            ListEmptyComponent={
              <View style={styles.centeredContent}>
                <Text style={styles.emptyText}>
                  {localized('No participants found')}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default SelectParticipantModal;