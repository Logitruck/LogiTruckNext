import React from 'react';
import { Alert, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../core/dopebase';
import { navigateToGlobalChat } from '../../../core/navigation/RootNavigation';

type Props = {
  onNotificationsPress?: () => void;
  onMessengerPress?: () => void;
  onAIPress?: () => void;
  showNotificationDot?: boolean;
};

const CarrierHeaderActions = ({
  onNotificationsPress,
  onMessengerPress,
  onAIPress,
  showNotificationDot = true,
}: Props) => {
  const { theme, appearance } = useTheme();
  const colors = theme.colors[appearance];

  const handleNotificationsPress = () => {
    if (onNotificationsPress) {
      onNotificationsPress();
      return;
    }

    Alert.alert('Notifications', 'Notifications module coming soon');
  };

  const handleMessengerPress = () => {
    if (onMessengerPress) {
      onMessengerPress();
      return;
    }

    navigateToGlobalChat({
      screen: 'ChatHome',
    });
  };

  const handleAIPress = () => {
    if (onAIPress) {
      onAIPress();
      return;
    }

    Alert.alert('AI Support', 'AI support is not connected yet.');
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 14,
      }}
    >
      <TouchableOpacity
        onPress={handleNotificationsPress}
        style={{
          paddingHorizontal: 6,
          paddingVertical: 6,
          marginLeft: 10,
        }}
      >
        <View>
          <MaterialCommunityIcons
            name="bell-outline"
            size={20}
            color={colors.primaryText}
          />
          {showNotificationDot ? (
            <View
              style={{
                position: 'absolute',
                top: -2,
                right: -3,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.red,
              }}
            />
          ) : null}
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleMessengerPress}
        style={{
          paddingHorizontal: 6,
          paddingVertical: 6,
          marginLeft: 10,
        }}
      >
        <MaterialCommunityIcons
          name="forum-outline"
          size={20}
          color={colors.primaryText}
        />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleAIPress}
        style={{
          paddingHorizontal: 6,
          paddingVertical: 6,
          marginLeft: 10,
        }}
      >
        <MaterialCommunityIcons
          name="assistant"
          size={20}
          color={colors.primaryText}
        />
      </TouchableOpacity>
    </View>
  );
};

export default CarrierHeaderActions;