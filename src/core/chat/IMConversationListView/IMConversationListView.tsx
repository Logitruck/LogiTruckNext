import React, { memo, useCallback, useEffect } from 'react';
import IMConversationList from '../IMConversationList/IMConversationList';
import { useChatChannels } from '../api';
import { useCurrentUser } from '../../onboarding/hooks/useAuth';
import type { ChatChannel } from '../api/firebase/firebaseChatClient';

type PullToRefreshConfig = {
  refreshing: boolean;
  onRefresh: () => void;
};

type IMConversationListViewProps = {
  navigation: any;
  headerComponent?: React.ReactElement | null;
  emptyStateConfig?: Record<string, any>;
  onRefreshHeader?: (userID?: string) => void;
  isChatUserItemPress?: boolean;
};

const IMConversationListView = ({
  navigation,
  headerComponent,
  emptyStateConfig,
  onRefreshHeader,
  isChatUserItemPress,
}: IMConversationListViewProps) => {
  const currentUser = useCurrentUser();

  const {
    channels,
    refreshing,
    loadingBottom,
    subscribeToChannels,
    loadMoreChannels,
    pullToRefresh,
  } = useChatChannels();

  useEffect(() => {
    if (!currentUser?.id) {
      return;
    }

    const unsubscribe = subscribeToChannels(currentUser.id);

    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const onConversationPress = useCallback(
    (channel: ChatChannel & { title?: string }) => {
      navigation.navigate('PersonalChat', {
        channel: { ...channel, name: channel.title },
        isChatUserItemPress,
      });
    },
    [navigation, isChatUserItemPress],
  );

  const onListEndReached = useCallback(() => {
    loadMoreChannels(currentUser?.id);
  }, [loadMoreChannels, currentUser?.id]);

  const onPullToRefresh = useCallback(() => {
    pullToRefresh(currentUser?.id);
    onRefreshHeader?.(currentUser?.id);
  }, [pullToRefresh, onRefreshHeader, currentUser?.id]);

  const pullToRefreshConfig: PullToRefreshConfig = {
    refreshing: !!refreshing,
    onRefresh: onPullToRefresh,
  };

  return (
    <IMConversationList
      loading={channels == null}
      conversations={channels}
      onConversationPress={onConversationPress}
      emptyStateConfig={emptyStateConfig}
      user={currentUser}
      headerComponent={headerComponent}
      onListEndReached={onListEndReached}
      pullToRefreshConfig={pullToRefreshConfig}
      loadingBottom={loadingBottom}
    />
  );
};

export default memo(IMConversationListView);