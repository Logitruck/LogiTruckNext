import React from 'react';
import { View } from 'react-native';
import { useTheme, useTranslations, StoriesTray } from '../../../dopebase';
import SearchBarAlternate  from '../../../ui/SearchBarAlternate/SearchBarAlternate';
import dynamicStyles from './styles';
import IMConversationListView from '../../IMConversationListView/IMConversationListView';

type FriendItem = {
  id?: string;
  userID?: string;
  firstName?: string;
  lastName?: string;
  profilePictureURL?: string;
  isOnline?: boolean;
  [key: string]: any;
};

type IMChatHomeComponentProps = {
  onRefreshHeader?: (userID?: string) => void;
  friends?: FriendItem[] | null;
  onFriendListEndReached?: () => void;
  onSearchBarPress?: () => void;
  onFriendItemPress?: (item: FriendItem) => void;
  navigation: any;
  onEmptyStatePress?: () => void;
  searchBarplaceholderTitle?: string;
  emptyStateConfig?: Record<string, any>;
  isChatUserItemPress?: boolean;
};

function IMChatHomeComponent({
  onRefreshHeader,
  friends,
  onFriendListEndReached,
  onSearchBarPress,
  onFriendItemPress,
  navigation,
  onEmptyStatePress,
  searchBarplaceholderTitle,
  emptyStateConfig,
  isChatUserItemPress,
}: IMChatHomeComponentProps) {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();

  const styles = dynamicStyles(theme, appearance);

  const defaultEmptyStateConfig = {
    title: localized('No Conversations'),
    description: localized(
      'Add some friends and start chatting with them. Your conversations will show up here.',
    ),
    callToAction: localized('Add friends'),
    onPress: onEmptyStatePress,
  };

  return (
    <View style={styles.container}>
      <View style={styles.chatsChannelContainer}>
        <IMConversationListView
          isChatUserItemPress={isChatUserItemPress}
          navigation={navigation}
          emptyStateConfig={emptyStateConfig ?? defaultEmptyStateConfig}
          onRefreshHeader={onRefreshHeader}
          headerComponent={
            <>
              <View style={styles.searchBarContainer}>
                <SearchBarAlternate
                  onPress={onSearchBarPress}
                  placeholderTitle={
                    searchBarplaceholderTitle ??
                    localized('Search for friends')
                  }
                />
              </View>

              {friends && friends.length > 0 ? (
                <StoriesTray
                  onStoryItemPress={onFriendItemPress}
                  onListEndReached={onFriendListEndReached}
                  storyItemContainerStyle={styles.userImageContainer}
                  data={friends}
                  displayVerifiedBadge={false}
                  displayLastName={false}
                  showOnlineIndicator={true}
                />
              ) : null}
            </>
          }
        />
      </View>
    </View>
  );
}

export default IMChatHomeComponent;