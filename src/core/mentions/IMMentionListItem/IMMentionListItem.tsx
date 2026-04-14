import React from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../dopebase';
import dynamicStyles from './styles';

export type MentionListItemUser = {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  profilePictureURL?: string;
  [key: string]: any;
};

type IMMentionListItemProps = {
  item: MentionListItemUser;
  onSuggestionTap?: (user: MentionListItemUser) => void;
  editorStyles?: Record<string, any>;
};

export default function IMMentionListItem({
  item: user,
  onSuggestionTap,
}: IMMentionListItemProps) {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const handleSuggestionTap = (selectedUser: MentionListItemUser) => {
    onSuggestionTap?.(selectedUser);
  };

  const fullname =
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() ||
    user.name ||
    'Unknown user';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => handleSuggestionTap(user)}
      style={styles.mentionItemContainer}
    >
      <View style={styles.mentionPhotoContainer}>
        <View style={styles.mentionPhoto}>
          <Image
            source={
              user.profilePictureURL
                ? { uri: user.profilePictureURL }
                : undefined
            }
            style={styles.mentionPhoto}
          />
        </View>
      </View>

      <View style={styles.mentionNameContainer}>
        <Text style={styles.mentionName}>{fullname}</Text>
      </View>
    </TouchableOpacity>
  );
}