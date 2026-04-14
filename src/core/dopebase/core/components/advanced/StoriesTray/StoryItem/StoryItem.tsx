import React, { useRef, memo } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '../../../..';
import dynamicStyles from './styles';

const defaultAvatar =
  'https://www.iosapptemplates.com/wp-content/uploads/2019/06/empty-avatar.jpg';

type StoryUser = {
  id?: string;
  userID?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profilePictureURL?: string;
  isOnline?: boolean;
  isVerified?: boolean;
  [key: string]: any;
};

export type StoryItemProps = {
  item: StoryUser;
  index?: number;
  onPress?: (item: StoryUser, index?: number, ref?: any) => void;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  imageContainerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeOpacity?: number;
  title?: boolean;
  showOnlineIndicator?: boolean;
  displayVerifiedBadge?: boolean;
};

export const StoryItem = memo(
  ({
    item,
    index,
    onPress,
    containerStyle,
    imageStyle,
    imageContainerStyle,
    textStyle,
    activeOpacity = 0.8,
    title = false,
    showOnlineIndicator = false,
    displayVerifiedBadge = false,
  }: StoryItemProps) => {
    const refs = useRef<any>(null);

    const { theme, appearance } = useTheme();
    const styles = dynamicStyles(theme, appearance);

    const lastName = item?.lastName || '';

    return (
      <TouchableOpacity
        ref={refs}
        activeOpacity={activeOpacity}
        onPress={() => onPress?.(item, index, refs)}
        style={[styles.container, containerStyle]}
      >
        <View style={[styles.imageContainer, imageContainerStyle]}>
          <Image
            style={[styles.image, imageStyle]}
            source={{ uri: item?.profilePictureURL || defaultAvatar }}
          />
          {showOnlineIndicator ? (
            <View style={styles.isOnlineIndicator} />
          ) : null}
        </View>

        {title ? (
          <View style={styles.verifiedContainer}>
            <Text
              style={[styles.text, textStyle]}
            >{`${item?.firstName ?? ''} ${lastName}`.trim()}</Text>

            {displayVerifiedBadge &&
            item?.isVerified &&
            item?.username !== 'My Story' &&
            item?.username !== 'Add Story' ? (
              <Image
                style={styles.verifiedIcon}
                source={require('./verified.png')}
              />
            ) : null}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  },
);