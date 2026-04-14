import React, { useCallback } from 'react';
import { FlatList, I18nManager, ListRenderItem } from 'react-native';
import { useTheme } from '../../..';
import { StoryItem } from './StoryItem/StoryItem';
import dynamicStyles from './styles';

type StoryTrayUser = {
  id?: string;
  userID?: string;
  firstName?: string;
  lastName?: string;
  profilePictureURL?: string;
  isOnline?: boolean;
  isVerified?: boolean;
  idx?: number;
  items?: any[];
  [key: string]: any;
};

type StoriesTrayProps = {
  data?: StoryTrayUser[] | null;
  onListEndReached?: () => void;
  onStoryItemPress?: (item: StoryTrayUser, index?: number) => void;
  onUserItemPress?: (
    userItemShouldOpenCamera?: boolean,
    refIndex?: number,
    index?: number,
  ) => void;
  user?: StoryTrayUser | null;
  displayUserItem?: boolean;
  userItemShouldOpenCamera?: boolean;
  storyItemContainerStyle?: any;
  userStoryTitle?: string;
  displayLastName?: boolean;
  showOnlineIndicator?: boolean;
  displayVerifiedBadge?: boolean;
};

export function StoriesTray({
  data,
  onListEndReached,
  onStoryItemPress,
  onUserItemPress,
  user,
  displayUserItem = false,
  userItemShouldOpenCamera = false,
  storyItemContainerStyle,
  userStoryTitle,
  displayLastName = true,
  showOnlineIndicator = false,
  displayVerifiedBadge = false,
}: StoriesTrayProps) {
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);

  const renderItem: ListRenderItem<StoryTrayUser> = ({ item, index }) => {
    const isSeen =
      item?.items &&
      item?.idx !== undefined &&
      item.idx + 1 === item.items.length
        ? styles.seenStyle
        : undefined;

    return (
      <StoryItem
        onPress={onStoryItemPress}
        item={{ ...item, lastName: displayLastName ? item.lastName : ' ' }}
        index={index}
        title={true}
        showOnlineIndicator={showOnlineIndicator && !!item?.isOnline}
        imageContainerStyle={
          storyItemContainerStyle ? storyItemContainerStyle : isSeen
        }
        displayVerifiedBadge={displayVerifiedBadge}
      />
    );
  };

  const onPress = useCallback(
    (_item?: StoryTrayUser, index?: number, refIndex?: number) => {
      onUserItemPress?.(userItemShouldOpenCamera, refIndex, index);
    },
    [onUserItemPress, userItemShouldOpenCamera],
  );

  return (
    <FlatList
      ListHeaderComponent={
        displayUserItem ? (
          <StoryItem
            onPress={onPress}
            title={true}
            displayVerifiedBadge={displayVerifiedBadge}
            index={0}
            item={{ ...user, firstName: userStoryTitle, lastName: '' }}
          />
        ) : null
      }
      style={styles.storiesContainer}
      data={data ?? []}
      inverted={I18nManager.isRTL}
      renderItem={renderItem}
      keyExtractor={(_item, index) => `${index}item`}
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      onEndReached={onListEndReached}
      onEndReachedThreshold={0.3}
    />
  );
}