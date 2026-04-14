import React, { memo } from 'react';
import {
  View,
  FlatList,
  ActivityIndicator,
  ListRenderItem,
} from 'react-native';
import { useTheme, EmptyStateView } from '../../dopebase';
import IMConversationView from '../IMConversationView/IMConversationView';
import dynamicStyles from './styles';
import type {
  ChatChannel,
  ChatParticipant,
} from '../api/firebase/firebaseChatClient';

type PullToRefreshConfig = {
  refreshing: boolean;
  onRefresh: () => void;
};

type ConversationItem = ChatChannel & {
  title?: string;
};

type IMConversationListProps = {
  onConversationPress: (item: ConversationItem) => void;
  emptyStateConfig?: Record<string, any>;
  conversations?: ConversationItem[] | null;
  loading?: boolean;
  loadingBottom?: boolean;
  user?: ChatParticipant | Record<string, any> | null;
  headerComponent?: React.ReactElement | null;
  onListEndReached?: () => void;
  pullToRefreshConfig: PullToRefreshConfig;
};

const IMConversationList = memo(
  ({
    onConversationPress,
    emptyStateConfig,
    conversations,
    loading = false,
    loadingBottom = false,
    user,
    headerComponent,
    onListEndReached,
    pullToRefreshConfig,
  }: IMConversationListProps) => {
    const { refreshing, onRefresh } = pullToRefreshConfig;

    const { theme, appearance } = useTheme();
    const styles = dynamicStyles(theme, appearance);

    const renderConversationView: ListRenderItem<ConversationItem> = ({
      item,
    }) => (
      <IMConversationView
        onChatItemPress={onConversationPress}
        item={item}
        user={user}
      />
    );

    if (loading) {
      return (
        <View style={styles.container}>
          <ActivityIndicator style={{ marginTop: 15 }} size="small" />
        </View>
      );
    }

    return (
      <FlatList
        style={styles.container}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        data={conversations ?? []}
        renderItem={renderConversationView}
        keyExtractor={(item) => `${item.id}`}
        removeClippedSubviews={false}
        ListHeaderComponent={headerComponent}
        ListEmptyComponent={
          <View style={styles.emptyViewContainer}>
            <EmptyStateView emptyStateConfig={emptyStateConfig} />
          </View>
        }
        ListFooterComponent={
          loadingBottom ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={onListEndReached}
        onEndReachedThreshold={0.3}
      />
    );
  },
);

export default IMConversationList;