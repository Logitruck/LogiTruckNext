import React, {
  useCallback,
  useMemo,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  ListRenderItem,
} from 'react-native';
import dynamicStyles from './styles';
import {
  useActionSheet,
  useTheme,
  useTranslations,
  ActivityIndicator,
  Alert,
} from '../../../dopebase';
import IMConversationIconView from '../../IMConversationView/IMConversationIconView/IMConversationIconView';
import { useCurrentUser } from '../../../onboarding/hooks/useAuth';
import { useChatChannels } from '../../api';
import type {
  ChatChannel,
  ChatParticipant,
} from '../../api/firebase/firebaseChatClient';

type GroupMember = ChatParticipant & {
  id?: string;
  firstName?: string;
  lastName?: string;
};

type IMViewGroupMembersScreenProps = {
  navigation: any;
  route: {
    params?: {
      channel?: ChatChannel | null;
    };
  };
};

const IMViewGroupMembersScreen = ({
  navigation,
  route,
}: IMViewGroupMembersScreenProps) => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const currentUser = useCurrentUser();
  const styles = dynamicStyles(theme, appearance);

  const [channel, setChannel] = useState<ChatChannel | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedMemberRef = useRef<number | null>(null);

  const { updateGroup, leaveGroup } = useChatChannels();
  const { showActionSheetWithOptions } = useActionSheet();

  const addAdminActionSheet = useMemo(
    () => ({
      options: [
        localized('Make Admin'),
        localized('Remove From Group'),
        localized('Cancel'),
      ],
      cancelButtonIndex: 2,
    }),
    [localized],
  );

  const removeAdminActionSheet = useMemo(
    () => ({
      options: [
        localized('Remove as Admin'),
        localized('Remove From Group'),
        localized('Cancel'),
      ],
      cancelButtonIndex: 2,
    }),
    [localized],
  );

  useEffect(() => {
    navigation.setOptions({
      headerTitle: localized('Members'),
      headerStyle: {
        backgroundColor: theme.colors[appearance].primaryBackground,
      },
      headerBackTitleVisible: false,
      headerTintColor: theme.colors[appearance].primaryText,
    });

    setChannel(route?.params?.channel ?? null);
  }, [appearance, localized, navigation, route?.params?.channel, theme]);

  const onRemoveParticipant = useCallback(async () => {
    const channelID = channel?.channelID || channel?.id;
    const selectedIndex = selectedMemberRef.current;
    const selectedParticipant =
      selectedIndex !== null ? channel?.participants?.[selectedIndex] : null;

    if (!channelID || selectedIndex === null || !selectedParticipant?.id) {
      return;
    }

    setLoading(true);

    const data = {
      admins: (channel?.admins ?? []).filter(
        adminID => adminID !== selectedParticipant.id,
      ),
      participants: (channel?.participants ?? []).filter(
        participant => participant?.id !== selectedParticipant.id,
      ),
    };

    const response = await leaveGroup(
      channelID,
      selectedParticipant.id,
      `${currentUser?.firstName ?? 'Someone'} removed ${
        selectedParticipant?.firstName ?? 'a member'
      } from group.`,
    );

    if (response?.success) {
      setChannel({
        ...channel,
        ...data,
      });
    }

    setLoading(false);
  }, [channel, currentUser?.firstName, leaveGroup]);

  const onMakeAdmin = useCallback(async () => {
    const channelID = channel?.channelID || channel?.id;
    const selectedIndex = selectedMemberRef.current;
    const selectedParticipant =
      selectedIndex !== null ? channel?.participants?.[selectedIndex] : null;

    if (!channelID || selectedIndex === null || !selectedParticipant?.id) {
      return;
    }

    setLoading(true);

    const data = {
      admins: [...(channel?.admins ?? []), selectedParticipant.id],
      content: `${currentUser?.firstName ?? 'Someone'} added ${
        selectedParticipant?.firstName ?? 'a member'
      } as a group admin.`,
    };

    const response = await updateGroup(channelID, currentUser?.id, data);

    if (response?.success) {
      setChannel({
        ...channel,
        ...data,
      });
    }

    setLoading(false);
  }, [channel, currentUser?.firstName, currentUser?.id, updateGroup]);

  const onRemoveAdmin = useCallback(async () => {
    const channelID = channel?.channelID || channel?.id;
    const selectedIndex = selectedMemberRef.current;
    const selectedParticipant =
      selectedIndex !== null ? channel?.participants?.[selectedIndex] : null;

    if (!channelID || selectedIndex === null || !selectedParticipant?.id) {
      return;
    }

    setLoading(true);

    const data = {
      admins: (channel?.admins ?? []).filter(
        adminID => adminID !== selectedParticipant.id,
      ),
      content: `${currentUser?.firstName ?? 'Someone'} removed ${
        selectedParticipant?.firstName ?? 'a member'
      } as a group admin.`,
    };

    const response = await updateGroup(channelID, currentUser?.id, data);

    if (response?.success) {
      setChannel({
        ...channel,
        ...data,
      });
    }

    setLoading(false);
  }, [channel, currentUser?.firstName, currentUser?.id, updateGroup]);

  const onMakeAdminActionDone = useCallback(
    (index: number) => {
      const selectedIndex = selectedMemberRef.current;
      const selectedParticipant =
        selectedIndex !== null ? channel?.participants?.[selectedIndex] : null;

      if (index === 0) {
        Alert.alert(
          localized('Add group admin'),
          `${localized('As a group admin, "')}${
            selectedParticipant?.firstName ?? ''
          }${localized(
            '" will be able to manage who can join and customise the conversation',
          )}`,
          [
            {
              text: localized('Cancel'),
            },
            {
              text: localized('Make Admin'),
              onPress: () => onMakeAdmin(),
            },
          ],
        );
      } else if (index === 1) {
        onRemoveParticipant();
      }
    },
    [channel?.participants, localized, onMakeAdmin, onRemoveParticipant],
  );

  const onRemoveAdminActionDone = useCallback(
    (index: number) => {
      const selectedIndex = selectedMemberRef.current;
      const selectedParticipant =
        selectedIndex !== null ? channel?.participants?.[selectedIndex] : null;

      if (index === 0) {
        Alert.alert(
          localized('Remove from being a group admin?'),
          `"${selectedParticipant?.firstName ?? ''}${localized(
            '" will no longer be able to manage who can join and customise this conversation.',
          )}`,
          [
            {
              text: localized('Remove as Admin'),
              onPress: () => onRemoveAdmin(),
              style: 'destructive',
            },
            {
              text: localized('Cancel'),
            },
          ],
        );
      } else if (index === 1) {
        onRemoveParticipant();
      }
    },
    [channel?.participants, localized, onRemoveAdmin, onRemoveParticipant],
  );

  const onPressMember = useCallback(
    (memberIndex: number) => {
      const member = channel?.participants?.[memberIndex];
      const memberID = member?.id;
      const currentUserID = currentUser?.id;

      if (!memberID || !currentUserID) {
        return;
      }

      if (
        !(channel?.admins ?? []).includes(memberID) &&
        (channel?.admins ?? []).includes(currentUserID) &&
        memberID !== currentUserID
      ) {
        selectedMemberRef.current = memberIndex;

        showActionSheetWithOptions(
          {
            options: addAdminActionSheet.options,
            cancelButtonIndex: addAdminActionSheet.cancelButtonIndex,
          },
          onMakeAdminActionDone,
        );
      } else if (
        (channel?.admins ?? []).includes(memberID) &&
        (channel?.admins ?? []).includes(currentUserID) &&
        memberID !== currentUserID
      ) {
        selectedMemberRef.current = memberIndex;

        showActionSheetWithOptions(
          {
            options: removeAdminActionSheet.options,
            cancelButtonIndex: removeAdminActionSheet.cancelButtonIndex,
          },
          onRemoveAdminActionDone,
        );
      }
    },
    [
      addAdminActionSheet,
      channel?.admins,
      channel?.participants,
      currentUser?.id,
      onMakeAdminActionDone,
      onRemoveAdminActionDone,
      removeAdminActionSheet,
      showActionSheetWithOptions,
    ],
  );

  const renderItem: ListRenderItem<GroupMember> = ({ item, index }) => {
    return (
      <TouchableOpacity
        onPress={() => onPressMember(index)}
        style={styles.itemContainer}
      >
        <View style={styles.chatIconContainer}>
          <IMConversationIconView
            style={styles.photo}
            imageStyle={styles.photo}
            participants={[item]}
          />
          <Text style={styles.name}>
            {(item?.firstName ?? '') + ' ' + (item?.lastName ?? '')}
          </Text>
        </View>

        <View style={styles.addFlexContainer}>
          {(channel?.admins ?? []).includes(item?.id ?? '') ? (
            <Text style={styles.adminText}>{localized('admin')}</Text>
          ) : null}
        </View>

        <View style={styles.divider} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {channel?.participants && channel.participants.length > 0 ? (
        <FlatList
          data={channel.participants as GroupMember[]}
          renderItem={renderItem}
          keyExtractor={(item, index) => `${item.id ?? index}`}
          initialNumToRender={5}
          removeClippedSubviews={true}
        />
      ) : null}

      {loading ? <ActivityIndicator /> : null}
    </View>
  );
};

export default IMViewGroupMembersScreen;