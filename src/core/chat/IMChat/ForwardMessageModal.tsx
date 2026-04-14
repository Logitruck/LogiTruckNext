import React, { useCallback, useEffect, useState } from 'react';
import Modal from 'react-native-modal';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

import SearchBarAlternate from '../../ui/SearchBarAlternate/SearchBarAlternate';
import { useCurrentUser } from '../../onboarding/hooks/useAuth';
import dynamicStyles from './styles';
import { useTheme, useTranslations, EmptyStateView } from '../../dopebase';
import IMConversationIconView from '../IMConversationView/IMConversationIconView/IMConversationIconView';
import {
  useChatChannelsAndParticipants,
  type AvailableChatParticipant,
  type HydratedChatListItem,
} from '../api/firebase/useChatChannelsAndParticipants';

type ConversationItem = HydratedChatListItem;

type ForwardMessageModalProps = {
  isVisible: boolean;
  onDismiss: () => void;
  onSend?: (item: ConversationItem) => void;
  availableParticipants?: AvailableChatParticipant[];
};

export const ForwardMessageModal = ({
  isVisible,
  onDismiss,
  onSend,
  availableParticipants = [],
}: ForwardMessageModalProps) => {
  const currentUser = useCurrentUser();
  const {
    hydratedListWithChannelsAndParticipants,
  } = useChatChannelsAndParticipants({
    availableParticipants,
  });

  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const [sendIds, setSendIds] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<ConversationItem[]>([]);
  const [isSearch, setIsSearch] = useState(false);

  useEffect(() => {
    setSendIds([]);
  }, [isVisible]);

  const onSendActionButton = useCallback(
    (item: ConversationItem) => {
      setSendIds(prev => [...prev, item.id]);
      onSend?.(item);
    },
    [onSend],
  );

  const renderActions = (
    disabled: boolean,
    onSendButton: () => void,
  ) => {
    return (
      <View style={styles.sendFlexContainer}>
        <TouchableOpacity
          disabled={disabled}
          onPress={onSendButton}
          style={!disabled ? styles.sendButton : styles.disabledSendButton}
        >
          <Text
            style={!disabled ? styles.actionTitle : styles.disabledActionTitle}
          >
            {!disabled ? localized('send') : localized('sent')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const resolveConversationTitle = (item: ConversationItem) => {
    if (item?.title) {
      return item.title;
    }

    if (item?.name) {
      return item.name;
    }

    if (item?.participants?.length) {
      const firstParticipant = item.participants[0];
      return (
        firstParticipant?.fullName ||
        `${firstParticipant?.firstName ?? ''} ${firstParticipant?.lastName ?? ''}`.trim()
      );
    }

    return localized('Conversation');
  };

  const renderConversationView = ({
    item,
  }: {
    item: ConversationItem;
  }) => {
    const title = resolveConversationTitle(item);

    return (
      <View style={styles.conversationViewContainer}>
        <View style={styles.conversationIconContainer}>
          <IMConversationIconView
            participants={
              item?.admins?.length
                ? item.participants
                : item?.participants?.filter(
                    value => value?.id !== currentUser?.id,
                  )
            }
          />
          <Text style={styles.conversationTitle}>{title}</Text>
        </View>

        {renderActions(sendIds.includes(item?.id), () =>
          onSendActionButton(item),
        )}

        <View style={styles.divider} />
      </View>
    );
  };

  const emptyStateConfig = {
    title: localized('No Conversations'),
    description: localized(
      'Your available conversations will appear here.',
    ),
  };

  const onChangeText = (text: string) => {
    if (text.length === 0) {
      setIsSearch(false);
      setSearchResults([]);
      return;
    }

    const loweredText = text.toLowerCase();

    const filteredArr = hydratedListWithChannelsAndParticipants.filter(item => {
      const title = resolveConversationTitle(item).toLowerCase();
      return title.includes(loweredText);
    });

    setSearchResults(filteredArr);
    setIsSearch(true);
  };

  return (
    <Modal
      style={styles.modal}
      isVisible={isVisible}
      onBackdropPress={onDismiss}
      onDismiss={onDismiss}
    >
      <View style={styles.forwardMessageMainContainer}>
        <SearchBarAlternate
          onPress={() => {}}
          placeholderTitle={localized('Search conversations')}
          onChangeText={onChangeText}
          onSearchBarCancel={onDismiss}
        />

        <FlatList
          style={styles.forwardMessageFlatListContainer}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          data={
            isSearch
              ? searchResults
              : hydratedListWithChannelsAndParticipants
          }
          renderItem={renderConversationView}
          keyExtractor={item => `${item.id}`}
          removeClippedSubviews={false}
          ListEmptyComponent={
            <View style={styles.emptyViewContainer}>
              <EmptyStateView emptyStateConfig={emptyStateConfig} />
            </View>
          }
        />
      </View>
    </Modal>
  );
};