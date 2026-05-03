import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useTheme, useTranslations } from '../../../core/dopebase';
import { dynamicStyles } from './styles';

import StatusTabs from '../../../core/components/StatusTabs';
import useVendorRequestsList from '../../hooks/useVendorRequestsList';
import useDashboardOffersSummary from '../../hooks/useDashboardOffersSummary';

const TABS = [
  { key: 'pending', label: 'New', icon: 'email-outline', color: '#e74c3c' },
  { key: 'offered', label: 'Offered', icon: 'tag-outline', color: '#2980b9' },
  { key: 'accepted', label: 'Accepted', icon: 'check-circle-outline', color: '#27ae60' },
  { key: 'to_sign', label: 'To Sign', icon: 'pen', color: '#8e44ad' },
  { key: 'execution', label: 'Execution', icon: 'eye-check-outline', color: '#f39c12' },
];

const CARD_BACKGROUNDS: Record<string, string> = {
  pending: '#fdecea',
  offered: '#eaf3fc',
  accepted: '#e8f5e9',
  to_sign: '#fff7e6',
  execution: '#f3e5f5',
};

const formatDate = (value?: string) => {
  if (!value) return '—';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';

  return parsed.toDateString();
};

const getRequestSummary = (item: any, localized: (key: string) => string) => {
  const routes = item?.matchedRoutes || item?.routes || [];
  const firstRoute = routes[0];

  const totalRoutes =
    item?.matchedRoutesCount ||
    item?.totalRoutes ||
    routes.length;

  const totalTrips =
    item?.totalTrips ||
    routes.reduce(
      (sum: number, route: any) => sum + Number(route?.cargo?.trips || 0),
      0
    );

  const title =
    totalRoutes === 1
      ? `${firstRoute?.origin?.title ?? localized('Unknown origin')} → ${
          firstRoute?.destination?.title ?? localized('Unknown destination')
        }`
      : `${firstRoute?.origin?.title ?? localized('Unknown origin')} → ${
          firstRoute?.destination?.title ?? localized('Unknown destination')
        } + ${totalRoutes - 1} ${localized('more routes')}`;

  const startDate = firstRoute?.cargo?.startDate;

  return {
    title,
    totalRoutes,
    totalTrips,
    startDate,
  };
};

const HomeDealsScreen = () => {
  const { theme, appearance } = useTheme();
  const { localized } = useTranslations();
  const styles = dynamicStyles(theme, appearance);

  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [activeTab, setActiveTab] = useState('pending');

  const { counts } = useDashboardOffersSummary();
  const { requests, loading } = useVendorRequestsList();

  useEffect(() => {
    const requestedStatus = route?.params?.status;
    if (!requestedStatus) return;

    const statusExists = TABS.find((tab) => tab.key === requestedStatus);
    if (statusExists) {
      setActiveTab(requestedStatus);
    }
  }, [route?.params?.status]);

  const filteredRequests = requests.filter(
    (req: any) => req.vendorStatus === activeTab
  );

  const renderItem = ({ item }: { item: any }) => {
    const backgroundColor =
      CARD_BACKGROUNDS[item.vendorStatus] ||
      theme.colors[appearance].secondaryBackground;

    const summary = getRequestSummary(item, localized);

    return (
      <Pressable
        style={[styles.card, { backgroundColor }]}
        onPress={() =>
          navigation.navigate('RequestDetails', {
            requestID: item.id,
          })
        }
      >
        <Text style={styles.cardTitle}>{summary.title}</Text>

        <Text style={styles.cardSubtitle}>
          {localized('Status')}: {item.vendorStatus ?? '—'}
        </Text>

        <Text style={styles.cardMeta}>
          {localized('Start date')}: {formatDate(summary.startDate)}
        </Text>

        <Text style={styles.cardMeta}>
          {localized('Routes')}: {summary.totalRoutes}
        </Text>

        <Text style={styles.cardMeta}>
          {localized('Trips')}: {summary.totalTrips}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <StatusTabs
        tabs={TABS}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        counters={counts}
      />

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator
            size="large"
            color={theme.colors[appearance].primaryForeground}
          />
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>{localized('No requests')}</Text>
          }
        />
      )}
    </View>
  );
};

export default HomeDealsScreen;