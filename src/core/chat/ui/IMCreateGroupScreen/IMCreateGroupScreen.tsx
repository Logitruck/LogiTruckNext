import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { BackHandler, View, Text, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/core';
import { useTheme, useTranslations } from '../../../dopebase';
import IMCreateGroupComponent from '../../ui/IMCreateGroupComponent/IMCreateGroupComponent';
import { useChatChannels } from '../../api';
import { useCurrentUser } from '../../../onboarding/hooks/useAuth';

type ChatSelectableParticipant = {
  id?: string;
  userID?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  profilePictureURL?: string;
  checked?: boolean;
  [key: string]: any;
};

type IMCreateGroupScreenProps = {
  navigation: any;
  route: {
    params?: {
      availableParticipants?: ChatSelectableParticipant[];
    };
  };
};

const IMCreateGroupScreen = ({
  navigation,
  route,
}: IMCreateGroupScreenProps) => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();

  const currentUser = useCurrentUser();
  const { createChannel } = useChatChannels();

  const availableParticipants =
    route?.params?.availableParticipants?.filter(
      participant =>
        participant &&
        (participant.id || participant.userID) !==
          (currentUser?.id || currentUser?.userID),
    ) ?? [];

  const [isLoading, setIsLoading] = useState(false);
  const [isNameDialogVisible, setIsNameDialogVisible] = useState(false);
  const [uiParticipants, setUiParticipants] = useState<
    ChatSelectableParticipant[]
  >(availableParticipants);

  const onBackButtonPressAndroid = useCallback(() => {
    navigation.goBack();
    return true;
  }, [navigation]);

  const onCreate = useCallback(() => {
    const checkedParticipants = uiParticipants.filter(item => item.checked);

    if (checkedParticipants.length < 2) {
      alert(localized('Please select at least 2 participants.'));
      return;
    }

    setIsNameDialogVisible(true);
  }, [localized, uiParticipants]);

  useLayoutEffect(() => {
    const colorSet = theme.colors[appearance];

    navigation.setOptions({
      headerTitle: localized('Select Participants'),
      headerRight:
        uiParticipants.length > 1
          ? () => (
              <TouchableOpacity
                style={{ marginHorizontal: 7 }}
                onPress={onCreate}
              >
                <Text
                  style={{
                    color: colorSet.primaryForeground,
                    fontWeight: 'bold',
                    fontSize: 16,
                  }}
                >
                  {localized('Create')}
                </Text>
              </TouchableOpacity>
            )
          : () => <View />,
      headerStyle: {
        backgroundColor: colorSet.primaryBackground,
      },
      headerTintColor: colorSet.primaryText,
    });
  }, [appearance, localized, navigation, onCreate, theme, uiParticipants]);

  useEffect(() => {
    setUiParticipants(availableParticipants);
  }, [route?.params?.availableParticipants]);

useFocusEffect(
  useCallback(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackButtonPressAndroid,
    )

    return () => {
      subscription.remove()
    }
  }, [onBackButtonPressAndroid]),
)

  const onCheck = useCallback((participant: ChatSelectableParticipant) => {
    setUiParticipants(prev =>
      prev.map(item =>
        (item.id || item.userID) === (participant.id || participant.userID)
          ? { ...item, checked: !item.checked }
          : item,
      ),
    );
  }, []);

  const onCancel = useCallback(() => {
    setIsNameDialogVisible(false);
    setUiParticipants(availableParticipants);
  }, [availableParticipants]);

  const onSubmitName = useCallback(
    async (name: string) => {
      const participants = uiParticipants.filter(item => item.checked);

      if (participants.length < 2) {
        alert(localized('Select at least 2 participants to create a group.'));
        return;
      }

      setIsNameDialogVisible(false);
      setIsLoading(true);

      try {
        const response = await createChannel(
          currentUser,
          participants,
          name,
          true,
        );

        if (response) {
          onCancel();
          navigation.goBack();
        }
      } finally {
        setIsLoading(false);
      }
    },
    [createChannel, currentUser, localized, navigation, onCancel, uiParticipants],
  );

  const onEmptyStatePress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <IMCreateGroupComponent
      onCancel={onCancel}
      isNameDialogVisible={isNameDialogVisible}
      friends={uiParticipants}
      onSubmitName={onSubmitName}
      onCheck={onCheck}
      isLoading={isLoading}
      onEmptyStatePress={onEmptyStatePress}
      onListEndReached={undefined}
    />
  );
};

export default IMCreateGroupScreen;