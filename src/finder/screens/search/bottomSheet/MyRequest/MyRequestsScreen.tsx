import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme, useTranslations } from '../../../../../core/dopebase';
import { dynamicStyles } from './MyRequestsScreen.styles';
import useMyRequests from '../../../../hooks/useMyRequests';
import { useCurrentUser } from '../../../../../core/onboarding/hooks/useAuth';

type RequestRoute = {
  id?: string;
  origin?: {
    title?: string;
  };
  destination?: {
    title?: string;
  };
  cargo?: {
    startDate?: string;
    trips?: number;
  };
};

type RequestItem = {
  id: string;
  origin?: {
    title?: string;
  };
  destination?: {
    title?: string;
  };
  cargo?: {
    startDate?: string;
    trips?: number;
  };
  routes?: RequestRoute[];
  totalRoutes?: number;
  totalTrips?: number;
  status?: string;
};

const formatDate = (value?: string) => {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';

  return parsed.toDateString();
};

const getRequestSummary = (
  item: RequestItem,
  localized: (key: string) => string
) => {
  const routes = item.routes ?? [];
  const hasRoutes = routes.length > 0;

  if (!hasRoutes) {
    return {
      title: `${item.origin?.title ?? localized('Unknown origin')} → ${
        item.destination?.title ?? localized('Unknown destination')
      }`,
      startDate: item.cargo?.startDate,
      totalRoutes: 1,
      totalTrips: item.cargo?.trips ?? 0,
    };
  }

  const firstRoute = routes[0];
  const computedTotalTrips = item.totalTrips
    ? item.totalTrips
    : routes.reduce((sum, route) => sum + Number(route?.cargo?.trips || 0), 0);

  return {
    title:
      routes.length === 1
        ? `${firstRoute?.origin?.title ?? localized('Unknown origin')} → ${
            firstRoute?.destination?.title ?? localized('Unknown destination')
          }`
        : `${firstRoute?.origin?.title ?? localized('Unknown origin')} → ${
            firstRoute?.destination?.title ?? localized('Unknown destination')
          } + ${routes.length - 1} ${localized('more routes')}`,
    startDate: firstRoute?.cargo?.startDate,
    totalRoutes: item.totalRoutes ?? routes.length,
    totalTrips: computedTotalTrips,
  };
};

const MyRequestsScreen = () => {
  const { localized } = useTranslations();
  const { theme, appearance } = useTheme();
  const styles = dynamicStyles(theme, appearance);
  const navigation = useNavigation<any>();

  const currentUser = useCurrentUser();
const finderUserID =
  currentUser?.id ||
  currentUser?.userID ||
  null;

const { activeRequests, historyRequests, loading } = useMyRequests(finderUserID);

  const renderRequestCard = ({ item }: { item: RequestItem }) => {
    const summary = getRequestSummary(item, localized);

    return (
      <Pressable
        onPress={() =>
          navigation.navigate('FinderDealsTab', {
            screen: 'RequestDetails',
            params: {
              requestID: item.id,
            },
          })
        }
        style={styles.card}
      >
        <Text style={styles.cardTitle}>{summary.title}</Text>

        <Text style={styles.cardSubtitle}>
          {localized('Start')}: {formatDate(summary.startDate)}
        </Text>

        <Text style={styles.cardSubtitle}>
          {localized('Routes')}: {summary.totalRoutes}
        </Text>

        <Text style={styles.cardSubtitle}>
          {localized('Trips')}: {summary.totalTrips}
        </Text>

        <Text style={styles.cardStatus}>
          {localized('Status')}: {item.status ?? '—'}
        </Text>
      </Pressable>
    );
  };

  const renderSection = (
    title: string,
    data: RequestItem[],
    emptyLabel: string
  ) => (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            color={theme.colors[appearance].primaryForeground}
          />
        </View>
      ) : data.length > 0 ? (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={renderRequestCard}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      )}
    </View>
  );

  return (
    <FlatList
      data={[{ key: 'content' }]}
      keyExtractor={(item) => item.key}
      renderItem={() => (
        <View style={styles.container}>
          {renderSection(
            localized('Active Requests'),
            activeRequests ?? [],
            localized('No active requests')
          )}

          {renderSection(
            localized('Request History'),
            historyRequests ?? [],
            localized('No historical requests')
          )}
        </View>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default MyRequestsScreen;